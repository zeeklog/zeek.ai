import { app, BrowserWindow, screen, ipcMain, globalShortcut, clipboard, dialog } from 'electron';
import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { buildUUID } from 'fsid';
import { spawn } from 'child_process';
import * as ffi from 'ffi-napi';
import * as ref from 'ref-napi';
import StructType from 'ref-struct-di';

// 初始化 ref-struct
const Struct = StructType(ref);

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * TextSelectionMenu 类实现文本选择菜单功能
 * 当用户通过鼠标拖动选中文本时，在文本下方显示翻译、提问、复制、AI搜索四个菜单
 * Windows 使用 UI Automation API，macOS 使用 AppleScript
 */
class TextSelectionMenu implements AppModule {
  // 存储所有创建的菜单窗口
  private menuWindows: Map<string, BrowserWindow> = new Map();
  // 上次选中的文本
  private lastSelectedText: string = '';
  // 菜单是否可见
  private isMenuVisible: boolean = false;
  // 是否正在监听文本选择
  private isListening: boolean = false;
  // 文本选择监听进程
  private selectionWatcher: NodeJS.Timeout | null = null;
  // 防抖定时器
  private debounceTimer: NodeJS.Timeout | null = null;
  // 轮询间隔（毫秒）
  private readonly POLL_INTERVAL = 250;
  // 防抖延迟（毫秒）
  private readonly DEBOUNCE_DELAY = 300;
  // 是否暂停轮询
  private isPollingPaused: boolean = false;
  // Windows UI Automation 客户端
  private uiautomation: any = null;
  private IUIAutomation: any = null;

  // 菜单项配置
  private menuItems = [
    { label: '翻译', id: 'translate' },
    { label: '提问', id: 'ask' },
    { label: '复制', id: 'copy' },
    { label: 'AI搜索', id: 'search' },
  ];

  /**
   * 启用文本选择菜单功能
   * @param context 模块上下文
   */
  enable({ app }: ModuleContext): void {
    // 注册IPC处理器，处理渲染进程发送的文本选择事件
    this.registerIpcHandlers();

    // 监听应用退出事件，清理所有菜单窗口
    app.on('before-quit', () => {
      this.cleanupAllMenus();
      this.stopTextSelectionMonitor();
    });

    // 提示辅助功能权限（确保在 app 准备好后调用）
    if (app.isReady()) {
      this.promptAccessibilityPermissions();
    } else {
      app.on('ready', () => {
        this.promptAccessibilityPermissions();
      });
    }

    // 启动文本选择监控
    if (app.isReady()) {
      this.startTextSelectionMonitor();
    } else {
      app.on('ready', () => {
        this.startTextSelectionMonitor();
      });
    }
  }

  /**
   * 提示用户授予辅助功能权限
   */
  private promptAccessibilityPermissions(): void {
    const message = process.platform === 'win32'
      ? 'This application requires UI Automation permissions to detect selected text. Please ensure Accessibility is enabled in Control Panel > Ease of Access.'
      : 'This application requires Accessibility permissions to detect selected text. Please ensure it is enabled in System Settings > Privacy & Security > Accessibility.';
    dialog.showMessageBox({
      type: 'info',
      title: 'Accessibility Permission Required',
      message,
      buttons: process.platform === 'win32' ? ['Open Ease of Access', 'OK'] : ['Open System Settings', 'OK'],
    }).then((result) => {
      if (result.response === 0) {
        if (process.platform === 'win32') {
          spawn('control', ['access']);
        } else {
          spawn('open', ['x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility']);
        }
      }
    });
  }

  /**
   * 启动文本选择监控
   */
  private startTextSelectionMonitor(): void {
    if (process.platform === 'win32') {
      // Windows 使用 UI Automation
      this.startWindowsSelectionWatcher();
    } else if (process.platform === 'darwin') {
      // macOS 使用 AppleScript
      this.startMacOSSelectionWatcher();
    } else {
      // 其他平台使用备用方案
      this.startFallbackSelectionWatcher();
    }

    this.isListening = true;
  }

  /**
   * 启动 Windows 文本选择监听器（使用 UI Automation）
   */
  private startWindowsSelectionWatcher(): void {
    try {
      // 初始化 UI Automation
      this.uiautomation = ffi.Library('uiautomationcore', {
        'UiaClientsAreConnected': ['bool', []],
        'UiaGetRootElement': ['int', ['pointer']],
        'UiaFind': ['int', ['pointer', 'pointer', 'pointer']],
        'UiaGetPropertyValue': ['int', ['pointer', 'int', 'pointer']],
        'UiaPatternControl': ['int', ['pointer', 'pointer', 'pointer']],
        'UiaRelease': ['void', ['pointer']],
      });

      const CLSID_CUIAutomation = Buffer.from([
        0x94, 0xA2, 0xE8, 0xFF, 0xB1, 0x8C, 0xCE, 0x43,
        0xB1, 0x1C, 0xB0, 0x81, 0x2B, 0x2B, 0xFD, 0xD6
      ]);
      const IID_IUIAutomation = Buffer.from([
        0xF6, 0xF2, 0xE7, 0x30, 0xA0, 0xC9, 0xCF, 0x49,
        0xB7, 0x0F, 0xCF, 0xD9, 0xAC, 0xFD, 0xF2, 0xA8
      ]);
      const com = ffi.Library('ole32', {
        'CoCreateInstance': ['int', ['pointer', 'pointer', 'uint', 'pointer', 'pointer']],
      });

      const pAutomation = ref.alloc('pointer');
      const hr = com.CoCreateInstance(CLSID_CUIAutomation, null, 1, IID_IUIAutomation, pAutomation);
      if (hr !== 0) {
        console.error(`Failed to create UI Automation instance: HRESULT ${hr}`);
        return;
      }
      this.IUIAutomation = ref.deref(pAutomation);

      // 定期轮询检查选中文本
      this.selectionWatcher = setInterval(() => {
        if (this.isPollingPaused) return;

        try {
          const selectedText = this.getWindowsSelectedText();
          if (selectedText !== this.lastSelectedText) {
            if (this.debounceTimer) {
              clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(() => {
              if (selectedText) {
                this.lastSelectedText = selectedText;
                const mousePosition = screen.getCursorScreenPoint();
                this.showMenu(selectedText, mousePosition.x, mousePosition.y, 0);
              } else if (this.lastSelectedText) {
                this.lastSelectedText = '';
                if (this.isMenuVisible) {
                  this.cleanupAllMenus();
                }
              }
            }, this.DEBOUNCE_DELAY);
          }
        } catch (error) {
          console.error(`UI Automation Error: ${error.message}`);
          this.isPollingPaused = true;
          setTimeout(() => {
            this.isPollingPaused = false;
          }, 5000);
        }
      }, this.POLL_INTERVAL);
    } catch (error) {
      console.error(`Failed to initialize UI Automation: ${error.message}`);
    }
  }

  /**
   * 获取 Windows 选中文本
   */
  private getWindowsSelectedText(): string {
    if (!this.IUIAutomation) return '';

    const VARIANT = Struct({
      vt: 'short',
      wReserved1: 'short',
      wReserved2: 'short',
      wReserved3: 'short',
      value: 'pointer',
    });
    const UIA_TextPatternId = 10014;
    const UIA_ValuePatternId = 10002;

    // 获取根元素
    const pRootElement = ref.alloc('pointer');
    let hr = this.uiautomation.UiaGetRootElement(this.IUIAutomation, pRootElement);
    if (hr !== 0) return '';
    const rootElement = ref.deref(pRootElement);

    // 获取焦点元素
    const pCondition = ref.alloc('pointer');
    hr = this.uiautomation.UiaFind(this.IUIAutomation, rootElement, pCondition);
    this.uiautomation.UiaRelease(rootElement);
    if (hr !== 0) return '';
    const focusedElement = ref.deref(pCondition);

    // 获取 TextPattern
    const pTextPattern = ref.alloc('pointer');
    hr = this.uiautomation.UiaPatternControl(focusedElement, UIA_TextPatternId, pTextPattern);
    if (hr !== 0) {
      this.uiautomation.UiaRelease(focusedElement);
      return '';
    }
    const textPattern = ref.deref(pTextPattern);

    // 获取选中文本
    const pSelection = ref.alloc('pointer');
    hr = this.uiautomation.UiaGetPropertyValue(textPattern, UIA_TextPatternId, pSelection);
    this.uiautomation.UiaRelease(textPattern);
    this.uiautomation.UiaRelease(focusedElement);
    if (hr !== 0) return '';

    const selection = ref.deref(pSelection);
    const textBuffer = ref.alloc('pointer');
    hr = this.uiautomation.UiaGetPropertyValue(selection, UIA_ValuePatternId, textBuffer);
    this.uiautomation.UiaRelease(selection);
    if (hr !== 0) return '';

    const text = ref.readCString(ref.deref(textBuffer), 0);
    return text || '';
  }

  /**
   * 启动 macOS 文本选择监听器（使用 AppleScript）
   */
  private startMacOSSelectionWatcher(): void {
    // AppleScript 获取当前焦点应用的选中文本
    const script = `
      tell application "System Events"
        set frontApp to name of first application process whose frontmost is true
        tell process frontApp
          try
            set selectedText to value of attribute "AXSelectedText" of focused UI element
            if selectedText is missing value then
              return ""
            end if
            return selectedText
          on error
            return ""
          end try
        end tell
      end tell
    `;

    // 定期轮询检查选中文本
    this.selectionWatcher = setInterval(() => {
      if (this.isPollingPaused) return;

      const process = spawn('osascript', ['-e', script], { stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          console.error(`AppleScript Error (code ${code}): ${errorOutput}`);
          this.isPollingPaused = true;
          setTimeout(() => {
            this.isPollingPaused = false;
          }, 5000);
          return;
        }

        const text = output.trim();
        if (text !== this.lastSelectedText) {
          if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
          }
          this.debounceTimer = setTimeout(() => {
            if (text) {
              this.lastSelectedText = text;
              const mousePosition = screen.getCursorScreenPoint();
              this.showMenu(text, mousePosition.x, mousePosition.y, 0);
            } else if (this.lastSelectedText) {
              this.lastSelectedText = '';
              if (this.isMenuVisible) {
                this.cleanupAllMenus();
              }
            }
          }, this.DEBOUNCE_DELAY);
        }
      });

      process.unref();
    }, this.POLL_INTERVAL);
  }

  /**
   * 启动备用文本选择监听器
   */
  private startFallbackSelectionWatcher(): void {
    globalShortcut.register('Alt+Shift+S', () => {
      const mousePosition = screen.getCursorScreenPoint();
      this.simulateTextSelection(mousePosition.x, mousePosition.y);
    });
  }

  /**
   * 停止文本选择监控
   */
  private stopTextSelectionMonitor(): void {
    if (this.selectionWatcher) {
      clearInterval(this.selectionWatcher);
      this.selectionWatcher = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.uiautomation && this.IUIAutomation) {
      this.uiautomation.UiaRelease(this.IUIAutomation);
    }
    globalShortcut.unregisterAll();
    this.isListening = false;
  }

  /**
   * 模拟文本选择事件
   * @param x 鼠标X坐标
   * @param y 鼠标Y坐标
   */
  private simulateTextSelection(x: number, y: number): void {
    this.showEmptyMenu(x, y);
  }

  /**
   * 显示空菜单
   * @param x 鼠标X坐标
   * @param y 鼠标Y坐标
   */
  private showEmptyMenu(x: number, y: number): void {
    if (this.isMenuVisible) {
      this.cleanupAllMenus();
    }

    const menuId = buildUUID();
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    const menuWindow = new BrowserWindow({
      width: 300,
      height: 40,
      x: Math.min(x, screenWidth - 300),
      y: Math.min(y + 20, screenHeight - 40),
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: join(__dirname, '../../preload/dist/textSelectionPreload.mjs'),
      },
    });

    this.menuWindows.set(menuId, menuWindow);
    menuWindow.loadFile(join(__dirname, '../../public/textSelectionMenu.html'));

    menuWindow.on('closed', () => {
      this.menuWindows.delete(menuId);
      this.isMenuVisible = false;
    });

    this.isMenuVisible = true;
  }

  /**
   * 注册IPC处理器
   */
  private registerIpcHandlers(): void {
    ipcMain.on('menu-item-click', (_, data) => {
      const { menuId, action, text } = data;
      this.handleMenuAction(menuId, action, text);
    });

    ipcMain.on('menu-drag', (_, data) => {
      const { menuId, x, y } = data;
      this.updateMenuPosition(menuId, x, y);
    });

    ipcMain.on('menu-close', (_, menuId) => {
      this.hideMenu(menuId);
    });
  }

  /**
   * 显示文本选择菜单
   * @param text 选中的文本
   * @param x 鼠标X坐标
   * @param y 鼠标Y坐标
   * @param windowId 触发事件的窗口ID
   */
  private showMenu(text: string, x: number, y: number, windowId: number): void {
    if (this.isMenuVisible) {
      this.cleanupAllMenus();
    }

    const menuId = buildUUID();
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    const menuWindow = new BrowserWindow({
      width: 300,
      height: 40,
      x: Math.min(x, screenWidth - 300),
      y: Math.min(y + 20, screenHeight - 40),
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: join(__dirname, '../../preload/dist/textSelectionPreload.mjs'),
      },
    });

    this.menuWindows.set(menuId, menuWindow);
    menuWindow.loadFile(join(__dirname, '../../public/textSelectionMenu.html'));
    menuWindow.webContents.on('did-finish-load', () => {
      menuWindow.webContents.send('set-selected-text', { menuId, text });
    });

    menuWindow.on('closed', () => {
      this.menuWindows.delete(menuId);
      this.isMenuVisible = false;
    });

    this.isMenuVisible = true;
  }

  /**
   * 更新菜单位置
   * @param menuId 菜单ID
   * @param x 新X坐标
   * @param y 新Y坐标
   */
  private updateMenuPosition(menuId: string, x: number, y: number): void {
    const menuWindow = this.menuWindows.get(menuId);
    if (menuWindow) {
      menuWindow.setPosition(x, y);
    }
  }

  /**
   * 隐藏指定菜单
   * @param menuId 菜单ID
   */
  private hideMenu(menuId: string): void {
    const menuWindow = this.menuWindows.get(menuId);
    if (menuWindow) {
      menuWindow.close();
      this.menuWindows.delete(menuId);
      this.isMenuVisible = false;
    }
  }

  /**
   * 清理所有菜单
   */
  private cleanupAllMenus(): void {
    for (const [menuId, menuWindow] of this.menuWindows.entries()) {
      menuWindow.close();
      this.menuWindows.delete(menuId);
    }
    this.isMenuVisible = false;
  }

  /**
   * 处理菜单动作
   * @param menuId 菜单ID
   * @param action 动作类型
   * @param text 选中的文本
   */
  private handleMenuAction(menuId: string, action: string, text: string): void {
    switch (action) {
      case 'translate':
        this.sendActionToMainWindow('translate', text);
        break;
      case 'ask':
        this.sendActionToMainWindow('ask', text);
        break;
      case 'copy':
        clipboard.writeText(text);
        break;
      case 'search':
        this.sendActionToMainWindow('search', text);
        break;
    }

    this.hideMenu(menuId);
  }

  /**
   * 发送动作到主窗口
   * @param action 动作类型
   * @param text 文本内容
   */
  private sendActionToMainWindow(action: string, text: string): void {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      mainWindow.webContents.send('text-selection-action', { action, text });
    }
  }
}

/**
 * 创建文本选择菜单模块
 * @returns TextSelectionMenu实例
 */
export function createTextSelectionMenu(): TextSelectionMenu {
  return new TextSelectionMenu();
}
