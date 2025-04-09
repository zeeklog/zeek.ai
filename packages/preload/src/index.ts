// 导入 sha256 哈希函数，用于加密或校验
import { sha256sum } from './nodeCrypto.js';
// 导入版本信息，可能包含应用或 Electron 的版本号
import { versions } from './versions.js';
// 导入 Electron 的 ipcRenderer 和 contextBridge，用于进程间通信和窗口桥接
import { ipcRenderer, contextBridge } from 'electron';

/**
 * 获取应用缓存数据
 * 通过 IPC 从主进程请求本地存储的缓存数据
 * @returns {Promise<string | null>} 返回缓存内容的字符串，若无缓存则返回 null
 */
async function getAppCache(key: string): Promise<string | null> {
  return await ipcRenderer.invoke('get-app-cache', key);
}

/**
 * 获取应用缓存数据
 * 通过 IPC 从主进程请求本地存储的缓存数据
 * @returns {Promise<string | null>} 返回缓存内容的字符串，若无缓存则返回 null
 */
async function getResourcePath(): Promise<string | null> {
  return process.resourcesPath
}

/**
 * 发送 IPC 消息到主进程
 * @param channel - IPC 通信通道名称
 * @param message - 发送的消息内容
 */
function send(channel: string, message: string): void {
  console.log(`Commend: ${channel} exec.`)
  ipcRenderer.send(channel, message);
}

/**
 * 定义 app 对象，封装与主进程交互的功能
 */
const app = {
  getAppCache, // 暴露 getAppCache 方法
  getResourcePath // 获取应用的静态资源地址
};

/**
 * 通过 contextBridge 将功能暴露给渲染进程
 * 在 window.$tabs 上提供标签页管理 API
 */
contextBridge.exposeInMainWorld('$tabs', {
  /**
   * 创建新标签页
   * @param url - 要加载的 URL 地址
   * @returns {Promise<{ tabId: string, tabs: { id: string, url: string, title: string, isFixed?: boolean }[] }>} 返回新标签页的 ID 和更新后的标签页列表
   */
  newTab: (url: string) => ipcRenderer.invoke('newTab', url),

  /**
   * 关闭指定标签页
   * @param tabId - 要关闭的标签页 ID
   */
  closeTab: (tabId: string) => ipcRenderer.send('closeTab', tabId),

  /**
   * 切换到指定标签页
   * @param tabId - 要切换到的标签页 ID
   */
  switchTab: (tabId: string) => ipcRenderer.send('switchTab', tabId),

  activeTab: (tabId: string) => ipcRenderer.send('switchTab', tabId),

  /**
   * 获取当前所有标签页
   * @returns {Promise<{ id: string, url: string, title: string, isFixed?: boolean }[]>} 返回标签页列表
   */
  getTabs: () => ipcRenderer.invoke('getTabs'),

  /**
   * 设置标签页更新事件的监听器
   * @param callback - 当标签页更新时调用的回调函数，接收更新后的标签页列表
   */
  onUpdateTabs: (callback: (tabs: { id: string; url: string; isFixed?: boolean }[]) => void) => {
    ipcRenderer.on('updateTabs', (event, tabs, activeTabId) => callback(tabs, activeTabId));
  },

  /**
   * 设置缓存清除事件的监听器
   * @param callback - 当缓存清除时调用的回调函数
   */
  onClearCache: (callback: (tabs) => void) => {
    ipcRenderer.on('cache-cleared', (tabs) => callback(tabs));
  },

  /**
   * 设置切换标签页错误事件的监听器
   * @param callback - 当切换标签页失败时调用的回调函数，接收错误信息
   */
  onSwitchTabError: (callback: (error: string) => void) => {
    ipcRenderer.on('switchTabError', (event, error) => callback(error));
  }
});

/**
 * 导出模块功能到其他文件
 */
export { sha256sum, versions, send, app };
