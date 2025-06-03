import { BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';
import * as ffi from '../lib/node-ffi-napi';
import * as ref from 'ref-napi';
import * as StructType from 'ref-struct-di';
import { AppModule } from '../AppModule.js';
import { ModuleContext } from '../ModuleContext.js';

// 定义Windows API结构体
const POINT = StructType({
  x: 'long',
  y: 'long'
});

// 加载user32.dll
const user32 = new ffi.Library('user32', {
  'GetCursorPos': ['bool', [ref.refType(POINT)]],
  'GetAsyncKeyState': ['short', ['int']]
});

class TextSelectionMenu {
  private selectionWindow: BrowserWindow | null = null;
  private isMenuVisible = false;

  constructor() {
    this.setupIpcHandlers();
  }

  private setupIpcHandlers() {
    ipcMain.on('menu-action', (event, action: string, text: string) => {
      switch (action) {
        case 'translate':
          this.handleTranslate(text);
          break;
        case 'ai-search':
          this.handleAiSearch(text);
          break;
        case 'copy':
          this.handleCopy(text);
          break;
      }
      this.hideMenu();
    });
  }

  private createSelectionWindow() {
    this.selectionWindow = new BrowserWindow({
      width: 200,
      height: 150,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    const __filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(__filename);

    this.selectionWindow.loadFile(path.join(__dirname, 'textSelectionMenu.html'));

    this.selectionWindow.on('blur', () => {
      this.hideMenu();
    });
  }

  private showMenu(x: number, y: number) {
    if (!this.selectionWindow) {
      this.createSelectionWindow();
    }

    if (this.selectionWindow) {
      this.selectionWindow.setPosition(x, y);
      this.selectionWindow.show();
      this.isMenuVisible = true;
    }
  }

  private hideMenu() {
    if (this.selectionWindow) {
      this.selectionWindow.hide();
      this.isMenuVisible = false;
    }
  }

  private startTextSelectionListener() {
    const point = new POINT();

    setInterval(() => {
      if (user32.GetAsyncKeyState(0x01) < 0) {
        if (user32.GetCursorPos(point.ref())) {
          const x = point.x;
          const y = point.y;

          const selectedText = this.getSelectedText();

          if (selectedText && !this.isMenuVisible) {
            this.showMenu(x, y);
          }
        }
      }
    }, 100);
  }

  private getSelectedText(): string {
    // 这里需要实现获取选中文本的逻辑
    // 可以使用剪贴板或其他Windows API
    return '';
  }

  private handleTranslate(text: string) {
    // 实现翻译功能
    console.log('Translate:', text);
  }

  private handleAiSearch(text: string) {
    // 实现AI搜索功能
    console.log('AI Search:', text);
  }

  private handleCopy(text: string) {
    // 实现复制功能
    console.log('Copy:', text);
  }

  public start() {
    this.startTextSelectionListener();
  }
}

export function createTextSelectionMenu(): AppModule {
  const menu = new TextSelectionMenu();

  return {
    enable: async (context: ModuleContext) => {
      menu.start();
    }
  };
}
