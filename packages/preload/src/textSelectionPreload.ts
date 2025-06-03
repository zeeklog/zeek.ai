import { contextBridge, ipcRenderer } from 'electron';

// 暴露给渲染进程的API
const textSelectionAPI = {
  // 发送菜单项点击事件
  sendMenuItemClick: (data: { menuId: string; action: string; text: string }) => {
    ipcRenderer.send('menu-item-click', data);
  },
  
  // 发送菜单关闭事件
  sendMenuClose: (menuId: string) => {
    ipcRenderer.send('menu-close', menuId);
  }
};

// 通过contextBridge暴露API
contextBridge.exposeInMainWorld('textSelection', textSelectionAPI);

// 这个文件现在主要用于提供API接口，实际的文本选择监听由主进程完成 