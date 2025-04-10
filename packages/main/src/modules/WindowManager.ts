// 导入 AppModule 接口类型，用于定义模块结构
import type { AppModule } from '../AppModule.js';
// 导入 ModuleContext，用于模块上下文管理
import { ModuleContext } from '../ModuleContext.js';
// 导入 Electron 的核心模块，用于窗口管理和 IPC 通信
import {app, BrowserWindow, WebContentsView, ipcMain, WebContents, globalShortcut, nativeImage, net, session} from 'electron';
// 导入 AppInitConfig 类型，用于初始化配置
import type { AppInitConfig } from '../AppInitConfig.js';
// 导入 Node.js 的路径处理模块
import path from 'path';
// 导入文件系统模块，用于文件操作
// 导入 fsid 的 buildUUID，用于生成唯一 ID
import { buildUUID } from 'fsid';
// 导入路径处理函数 dirname 和 join
import { dirname, join } from 'path';
// 导入 URL 到文件路径转换函数
import { fileURLToPath } from 'url';
// 导入托盘工具初始化函数
import { initTrayTool } from './TrayTool.js';
import {logoDataUrl} from "./base64Logo.js";
// 缓存工具
import Store from 'electron-store'
// 日志工具
import logger from 'electron-log'

const store = new Store()
// 手动定义 __dirname 和 __filename，因为 ESM 模块中默认不可用
const __filename = fileURLToPath(import.meta.url); // 当前文件的完整路径
const __dirname = dirname(__filename); // 当前文件所在目录
const isDev = import.meta.env.MODE === 'development'

// 导出主窗口实例，以便外部访问
export let mainWindow: BrowserWindow;

// 定义基本应用文件夹名称
const basicAppFolderName = 'zeek.ai';
// 定义用户配置目录路径，基于 Electron 的 userData 路径
const userConfigDir = path.join(app.getPath('userData'), `${basicAppFolderName}/user-config`);
// 设置默认的窗口尺寸
const getBasicWindowConfig = () => {
  const [width, height] = mainWindow.getContentSize();
  return { x: 130, y: 60, width: width - 130, height: height - 60 }
}

function processInput(input: string) {
  // Regular expression to check if the input is a URL
  const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/.*)?$/i;

  // If it already starts with http:// or https://, return as is
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }
  // Check if input is a URL
  if (urlPattern.test(input)) {
    // If it's a valid URL format but missing protocol, add http://
    return `http://${input}`;
  } else {
    // If it's a common string, create a search URL based on proxy status
    const encodedInput = encodeURIComponent(input);
    return `https://www.baidu.com/s?wd=${encodedInput}`;
  }
}
/**
 * 定义 TabList 接口，表示标签页的结构
 */
interface Tab {
  id: string;           // 标签页的唯一标识符
  view: WebContentsView | WebContents; // 标签页的视图内容（WebContentsView 或 WebContents）
  url: string;          // 标签页的 URL 地址
  title?: string;       // 标签页的标题，默认使用 document.title，可选
  isFixed?: boolean;    // 是否为固定标签页（如首页），可选
  isHome?: boolean;    // 是否为首页
}

// 存储所有标签页的数组
let tabs: Tab[] = [];
// 当前激活的标签页 ID，初始为 null
let activeTabId: string | null = null;

function refreshActiveTab () {
  logger.info('Press F5 - Refreshing active tab');
  if (!activeTabId) {
    logger.info('No active tab to refresh');
    return;
  }

  const activeTab = tabs?.find(tab => tab.id === activeTabId);
  if (activeTab) {
    const webContents = activeTab.isFixed
      ? (activeTab.view as WebContents)
      : (activeTab.view as WebContentsView).webContents;

    // 刷新当前活跃的 WebContents
    webContents.reloadIgnoringCache(); // 忽略缓存刷新
    logger.info(`Refreshed tab ${activeTabId} with URL: ${activeTab.url}`);
  } else {
    logger.error('Active tab not found for ID:', activeTabId);
  }
}

function generateTabs () {
  return tabs.map((t) => ({ id: t.id, url: t.url, title: t.title, isFixed: t.isFixed, isHome: t.isHome }))
}

/**
 * 窗口管理模块，负责创建和管理主窗口及标签页
 * 实现 AppModule 接口，提供窗口管理功能
 */
class WindowManager implements AppModule {
  // Preload 脚本路径，只读
  readonly #preload: { path: string };
  // 渲染器路径（可能是文件路径或 URL），只读
  readonly #renderer: { path: string } | URL;
  // 是否默认打开开发者工具，只读
  readonly #openDevTools: boolean;

  /**
   * 构造函数，初始化窗口管理模块
   * @param initConfig - 应用初始化配置，包含 preload 和 renderer 路径
   * @param openDevTools - 是否默认打开开发者工具，默认为 false
   */
  constructor({ initConfig, openDevTools = false }: { initConfig: AppInitConfig; openDevTools?: boolean }) {
    this.#preload = initConfig.preload;
    this.#renderer = initConfig.renderer;
    this.#openDevTools = openDevTools;

    logger.info('Preload script path:', this.#preload.path);

    // 注册 IPC 事件和标签页事件处理程序
    this.registerIpcHandlers();
    this.registerContentsEvent();
  }

  /**
   * 注册 IPC 事件处理程序，用于主进程与渲染进程通信
   * 处理缓存、窗口控制等功能
   */
  registerIpcHandlers(): void {
    // 获取应用缓存数据
    ipcMain.handle('get-app-cache', async (event, key) => {
      logger.info(`get app cache : ${key}`)
      return store.get(key || 'app.cache')
    });

    // 保存本地存储数据
    ipcMain.on('set-app-cache', (event, data) => {
      if (!data || !data.cacheKey) {
        return {}
      }
      logger.info(`get app cache : ${data.cacheKey}`)
      store.set(data.cacheKey, data.data)
    });

    // 最小化窗口
    ipcMain.on('minimize-window', () => {
      const window = BrowserWindow.getFocusedWindow();
      if (window) {
        window.minimize();
        logger.info('Window minimized');
      }
    });

    // 最大化/还原窗口
    ipcMain.on('maximize-window', () => {
      const window = BrowserWindow.getFocusedWindow();
      if (window) {
        window.isMaximized() ? window.unmaximize() : window.maximize();
        logger.info('Window maximized/unmaximized');
      }
    });

    // 关闭窗口
    ipcMain.on('close-window', () => {
      const window = BrowserWindow.getFocusedWindow();
      if (window) {
        window.close();
        logger.info('Window closed');
      }
    });

    // 重新加载当前 WebContents
    ipcMain.on('request-reload', async (event) => {
      refreshActiveTab()
    });

    // 清除本地缓存
    ipcMain.on('clear-cache', (event) => {
      logger.info('clear-cache')
    });
  }

  /**
   * 注册标签页相关的事件处理程序
   * 处理创建、关闭和切换标签页的逻辑
   */
  registerContentsEvent(): void {
    function loadErrorPage(tab: Tab, event: any, error: any, view: WebContentsView) {
      logger.error(`Failed to load URL for tab ${tab.id}:`, error);
      tab.title = '加载失败';
      // 加载错误页面并传递错误信息
      const pageErrorRenderer = fileURLToPath(import.meta.resolve('@vite-electron-builder/renderer/dist/basic/error/500.html'))
      // @ts-ignore
      logger.info( `${pageErrorRenderer}`)
      const activeTab = tabs.find(item => item.id === tab.id);
      const webContents = activeTab?.isFixed
          ? (activeTab.view as WebContents)
          : (activeTab?.view as WebContentsView).webContents;
      // @ts-ignore
      webContents.loadURL(`${pageErrorRenderer}?error=${encodeURIComponent(!error? 'Unknow Error - 1' : error?.message)}`).then(() => {
        tab.title = '加载失败';
      });
      event.sender.send('updateTabs', generateTabs(), activeTabId);
      logger.info(error)
    }
    // 创建新标签页
    ipcMain.handle('newTab', async (event, url) => {
      const tabId = buildUUID(); // 生成唯一标签页 ID
      const view = new WebContentsView({
        webPreferences: {
          nodeIntegration: true,      // 启用 Node.js 集成
          contextIsolation: true,     // 启用上下文隔离
          sandbox: false,             // 禁用沙盒
          preload: this.#preload.path // 指定 preload 脚本
        }
      });
      view.setBounds(getBasicWindowConfig()); // 设置标签页视图边界

      try {
        if (url.startsWith('tools://') || url.startsWith('workflow://')) {
          // 使用本地应用协议
          // 生产环境使用资源目录， 开发环境使用本地配置
          if (!isDev) {
            if (url.startsWith('tools')) {
              url = fileURLToPath(import.meta.resolve('@vite-electron-builder/renderer/dist/tools/index.html/#/'))
            } else if (url.startsWith('workflow')) {
              url = fileURLToPath(import.meta.resolve('@vite-electron-builder/renderer/dist/workflow/index.html'))
            } else {
              url = fileURLToPath(import.meta.resolve(`@vite-electron-builder/renderer/dist/basic/error/500.html`))
            }
            logger.info(url)
          } else {
            // 暂时不做处理
          }
        } else {
          // 判断当前加载的url域名对应的缓存文件是否存在， 如果存在则注入缓存，如果不存在则跳过缓存注入
          // 缓存文件路径： path.join(userConfigDir, `${域名}.json`);
          // 判断当前加载的 URL 域名对应的缓存文件是否存在，若存在则注入缓存
          url = await processInput(url)
          logger.info(`Open URL: ${url}`)
        }
        const tab: Tab = { id: tabId, view, url, title: view.webContents.getTitle() || '加载中' };
        tabs.push(tab); // 添加新标签页到 tabs 数组

        // 切换到新标签页
        if (activeTabId) {
          const currentTab = tabs.find(t => t.id === activeTabId);
          if (currentTab && !currentTab.isFixed) {
            mainWindow.contentView.removeChildView(currentTab.view as WebContentsView);
          }
        }
        mainWindow.contentView.addChildView(view);
        activeTabId = tabId;

        // 通知渲染进程更新标签页列表
        const tabsReply = generateTabs();
        event.sender.send('updateTabs', tabsReply, activeTabId);

        try {
          // 默认为加载文件， 如果是URL则家在URL
          logger.info(`load url: ${tab.url}`)
          if (url.startsWith('http') || url.startsWith('https')) {
            view.webContents.loadURL(tab.url).then(() => {
              tab.title = view.webContents.getTitle() || '加载中';
              logger.info(`Tab ${tabId} loaded, title: ${tab.title}`);
              event.sender.send('updateTabs', generateTabs(), activeTabId);
            })
              .catch(e => {
                // throw new Error(e)
                loadErrorPage(tab, event, e, view)
              })
          } else {
            const loadFile = fileURLToPath(import.meta.resolve('@vite-electron-builder/renderer/dist/tools/index.html'))
            logger.info(`Load File: ${loadFile}`)
            view.webContents.loadFile(loadFile).then(() => {
              tab.title = view.webContents.getTitle() || '加载中';
              logger.info(`Tab ${tabId} loaded, title: ${tab.title}`);
              event.sender.send('updateTabs', generateTabs(), activeTabId);
            })
              .catch(e => {
                logger.info(`load tools error`, e)
                // throw new Error(e)
                loadErrorPage(tab, event, e, view)
              })
          }
        } catch (error) {
          loadErrorPage(tab, event, error, view)
        }

        if (this.#openDevTools) {
          view.webContents.openDevTools(); // 打开开发者工具（调试用）
        }

        // 监听页面加载完成事件
        view.webContents.on('did-finish-load', () => {
          tab.title = view.webContents.getTitle() || '加载中';
          logger.info(`Tab ${tabId} loaded, title: ${tab.title}`);
          mainWindow.webContents.send('updateTabs', generateTabs(), activeTabId);
        });

        // 监听页面标题更新事件
        view.webContents.on('page-title-updated', (e, title) => {
          tab.title = title || '加载中';
          logger.info(`Tab ${tabId} title updated: ${tab.title}`);
          mainWindow.webContents.send('updateTabs', generateTabs(), activeTabId);
        });
        // === 新增：拦截新窗口请求，将其重定向为新标签页 ===
        view.webContents.setWindowOpenHandler((details) => {
          const { url } = details;
          logger.info(`Intercepted new window request for URL: ${url}`);

          // 调用已有的 newTab 逻辑创建一个新标签页
            const newTabId = buildUUID();
            const newView = new WebContentsView({
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                sandbox: false,
                preload: this.#preload.path,
              },
            });
            newView.setBounds(getBasicWindowConfig());

            const newTab: Tab = { id: newTabId, view: newView, url, title: '加载中' };
            tabs.push(newTab);

            mainWindow.contentView.addChildView(newView);
            activeTabId = newTabId;

            newView.webContents.loadURL(url).then(() => {
              newTab.title = newView.webContents.getTitle() || '加载中';
              mainWindow.webContents.send(
                'updateTabs',
                generateTabs(),
                activeTabId
              );
            }).catch(e => {
              logger.info(e)
            });

          // 触发临时 IPC 事件来创建新标签页
          mainWindow.webContents.send('updateTabs', generateTabs(), activeTabId);
          // 阻止默认的新窗口行为
          return { action: 'deny' };
        });
        // === 新增结束 ===

        logger.info(`Added new tab: ${JSON.stringify(tabs)}`);
        return { tabId, tabs: tabsReply };
      } catch (error) {
        logger.error(`Failed to create new tab ${tabId}:`, error);
        return { tabId, tabs: [] };
      }
    });

    // 关闭标签页
    ipcMain.on('closeTab', (event, tabId) => {
      logger.info('Closing tab:', tabId);
      const index = tabs.findIndex(tab => tab.id === tabId);
      if (index !== -1 && !tabs[index].isFixed) {
        try {
          const closedTab = tabs[index];
          mainWindow.contentView.removeChildView(closedTab.view as WebContentsView);
          // @ts-ignore
          (closedTab.view as WebContentsView).webContents.destroy();
          tabs.splice(index, 1);

          // 如果关闭的是当前激活标签页，切换到第一个标签页
          if (activeTabId === tabId && tabs.length > 0) {
            activeTabId = tabs[0].id;
            if (!tabs[0].isFixed) {
              mainWindow.contentView.addChildView(tabs[0].view as WebContentsView);
            }
          } else if (tabs.length === 0) {
            activeTabId = null;
          }

          const tabsReply = generateTabs();
          event.sender.send('updateTabs', tabsReply, activeTabId);
        } catch (error) {
          logger.error(`Failed to close tab ${tabId}:`, error);
        }
      } else {
        console.warn(`Cannot close tab ${tabId}: not found or fixed`);
      }
    });

    // 切换标签页
    ipcMain.on('switchTab', (event, tabId) => {
      logger.info('Received switchTab with tabId:', tabId);
      if (typeof tabId === 'undefined' || tabId === null) {
        logger.error('switchTab: tabId is undefined or null');
        event.sender.send('switchTabError', 'Invalid tabId');
        return;
      }

      const tab = tabs.find(tab => tab.id === tabId);
      if (!tab) {
        logger.error('switchTab: TabList not found for tabId:', tabId);
        event.sender.send('switchTabError', 'TabList not found');
        return;
      }

      if (activeTabId !== tabId) {
        try {
          if (activeTabId) {
            const currentTab = tabs.find(t => t.id === activeTabId);
            if (currentTab && !currentTab.isFixed) {
              mainWindow.contentView.removeChildView(currentTab.view as WebContentsView);
            }
          }
          if (!tab.isFixed) {
            mainWindow.contentView.addChildView(tab.view as WebContentsView);
          }
          activeTabId = tabId;
          logger.info('Switched to tab:', tabId);
        } catch (error) {
          logger.error(`Failed to switch to tab ${tabId}:`, error);
        }
      }
    });

    // 获取当前标签页列表
    ipcMain.handle('getTabs', async () => {
      logger.info('getTabs exec', );
      return generateTabs();
    });
  }

  /**
   * 启用窗口管理模块，初始化应用
   * @param context - 模块上下文，包含 Electron 的 app 实例
   */
  async enable({ app }: ModuleContext): Promise<void> {
    try {
      await app.whenReady().then(() => {
        logger.info('call: app.whenReady()');

        // 注册 F12 快捷键，用于切换开发者工具
        globalShortcut.register('F12', () => {
          logger.info('Press F12');
          const focusedWindow = BrowserWindow.getFocusedWindow();
          if (focusedWindow) {
            if (focusedWindow.webContents.isDevToolsOpened()) {
              focusedWindow.webContents.closeDevTools();
              logger.info('Developer tools closed');
            } else {
              focusedWindow.webContents.openDevTools({
                mode: 'detach',
                title: `${import.meta.env.VITE_SYSTEM_NAME}开发者工具`
              });
              logger.info('Developer tools opened');
            }
          }
        });

        // 注册 Ctrl+Shift+I 快捷键，用于切换开发者工具
        globalShortcut.register('Ctrl+Shift+I', () => {
          logger.info('Press F12 > Ctrl+Shift+I');
          // 根据当前激活的 tabId 查找对应的 TabList 对象
          if (activeTabId) {
            const activeTab = tabs.find(tab => tab.id === activeTabId);
            if (activeTab) {
              const webContents = activeTab.isFixed
                ? (activeTab.view as WebContents)
                : (activeTab.view as WebContentsView).webContents;
              if (webContents ) {
                if (webContents.isDevToolsOpened()) {
                  webContents.closeDevTools(); // 如果开发者工具已打开，则关闭
                  logger.info(`Developer tools closed for tab ${activeTabId}`);
                } else {
                  webContents.openDevTools({
                    mode: 'detach',
                    title: `${import.meta.env.VITE_SYSTEM_NAME}开发者工具`
                  }); // 如果开发者工具未打开，则开启
                  logger.info(`Developer tools opened for tab ${activeTabId}`);
                }
              }
            } else {
              console.warn(`No tab found for activeTabId: ${activeTabId}`);
            }
          } else {
            console.warn('No active tab selected, falling back to main window');
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              if (focusedWindow.webContents.isDevToolsOpened()) {
                focusedWindow.webContents.closeDevTools();
                logger.info('Developer tools closed for main window');
              } else {
                focusedWindow.webContents.openDevTools({
                  mode: 'detach',
                  title: `${import.meta.env.VITE_SYSTEM_NAME}开发者工具`
                });
                logger.info('Developer tools opened for main window');
              }
            }
          }
        });

        // 注册 F5 快捷键，用于刷新当前活跃的 WebContents
        globalShortcut.register('F5', () => {
          refreshActiveTab()
        });
      }).catch(e => {
        logger.info(e)
      });

      await this.restoreOrCreateWindow(true);
      app.on('second-instance', () => this.restoreOrCreateWindow(true));
      app.on('activate', () => this.restoreOrCreateWindow(true));

      // 在应用退出时注销所有快捷键
      app.on('will-quit', () => {
        globalShortcut.unregisterAll();
      });
    } catch (error) {
      logger.error('Failed to enable WindowManager:', error);
    }
  }

  /**
   * 创建主窗口并初始化固定标签页
   * @returns 返回创建的 BrowserWindow 实例
   * @throws 如果窗口创建失败，抛出异常
   */
  async createWindow(): Promise<BrowserWindow> {
    try {
      const icon = nativeImage.createFromDataURL(logoDataUrl)
      mainWindow = new BrowserWindow({
        width: 1280,              // 窗口宽度
        height: 850,             // 窗口高度
        frame: false,             // 无边框窗口
        icon: icon,           // 窗口图标
        autoHideMenuBar: true,    // 自动隐藏菜单栏
        webPreferences: {
          nodeIntegration: true,   // 启用 Node.js 集成
          contextIsolation: true,  // 启用上下文隔离
          sandbox: false,          // 禁用沙盒
          webSecurity: false, // 禁用 CORS 和其他 Web 安全限制
          webviewTag: false,       // 禁用 webview 标签
          preload: this.#preload.path // 指定 preload 脚本
        },
      });

      mainWindow.setBackgroundColor('#ffffff'); // 设置窗口背景颜色

      const tabId = buildUUID(); // 生成唯一 ID
      const defaultUrl = this.#renderer instanceof URL ? this.#renderer.href : this.#renderer.path;
      const defaultTab: Tab = { id: tabId, view: mainWindow.webContents, url: defaultUrl, title: '首页', isFixed: true, isHome: true };
      tabs.push(defaultTab); // 添加固定标签页（首页）
      activeTabId = tabId;   // 设置为当前激活标签页

      // 根据 renderer 类型加载 URL 或文件
      if (this.#renderer instanceof URL) {
        await mainWindow.loadURL(this.#renderer.href);
      } else {
        await mainWindow.loadFile(this.#renderer.path);
      }

      if (this.#openDevTools) {
        mainWindow.webContents.openDevTools(); // 打开开发者工具（调试用）
      }

      // 监听窗口大小变化，调整非固定标签页的边界
      mainWindow.on('resize', () => {
        const [width, height] = mainWindow.getContentSize();
        tabs.forEach(tab => {
          if (!tab.isFixed) {
            (tab.view as WebContentsView).setBounds(getBasicWindowConfig());
          }
        });
      });

      // 监听页面加载完成事件，更新标题
      mainWindow.webContents.on('did-finish-load', () => {
        defaultTab.title = mainWindow.webContents.getTitle() || '加载中';
        logger.info('Main window WebContents loaded with preload:', this.#preload.path, 'Title:', defaultTab.title);
        mainWindow.webContents.send('updateTabs', generateTabs(), activeTabId);
      });

      // 监听页面标题更新事件，同步标题
      mainWindow.webContents.on('page-title-updated', (e, title) => {
        defaultTab.title = title || '加载中';
        logger.info(`Main tab title updated: ${defaultTab.title}`);
        mainWindow.webContents.send('updateTabs', generateTabs(), activeTabId);
      });

      // 初始化托盘工具
      initTrayTool(mainWindow, userConfigDir);

      return mainWindow;
    } catch (error) {
      logger.error('Failed to create window:', error);
      throw error;
    }
  }

  /**
   * 恢复或创建窗口
   * @param show - 是否显示窗口，默认为 false
   * @returns 返回 BrowserWindow 实例
   */
  async restoreOrCreateWindow(show = false): Promise<BrowserWindow> {
    let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
    if (!window) window = await this.createWindow();
    if (!show) return window;

    if (window.isMinimized()) window.restore(); // 恢复最小化的窗口
    window?.show();                             // 显示窗口
    if (this.#openDevTools) window?.webContents.openDevTools(); // 打开开发者工具
    window.focus();                             // 聚焦窗口
    return window;
  }
}

/**
 * 创建 WindowManager 模块实例的工厂函数
 * @param args - WindowManager 构造函数的参数
 * @returns 返回新的 WindowManager 实例
 */
export function createWindowManagerModule(...args: ConstructorParameters<typeof WindowManager>): WindowManager {
  return new WindowManager(...args);
}
