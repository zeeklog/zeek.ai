import { app, BrowserWindow, Menu, MenuItem, clipboard } from 'electron';
import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';

export function createGlobalContextMenuModule(): AppModule {
  return {
    async enable(context: ModuleContext) {
      // 创建全局上下文菜单
      const contextMenu = new Menu();
      
      contextMenu.append(new MenuItem({
        label: '翻译',
        click: async () => {
          const selectedText = await getSelectedText();
          if (selectedText) {
            // TODO: 实现翻译功能
            console.log('翻译文本:', selectedText);
          }
        }
      }));

      contextMenu.append(new MenuItem({
        label: '提问',
        click: async () => {
          const selectedText = await getSelectedText();
          if (selectedText) {
            // TODO: 实现提问功能
            console.log('提问文本:', selectedText);
          }
        }
      }));

      contextMenu.append(new MenuItem({ type: 'separator' }));

      contextMenu.append(new MenuItem({
        label: '复制',
        click: async () => {
          const selectedText = await getSelectedText();
          if (selectedText) {
            clipboard.writeText(selectedText);
          }
        }
      }));

      contextMenu.append(new MenuItem({
        label: 'AI搜索',
        click: async () => {
          const selectedText = await getSelectedText();
          if (selectedText) {
            // TODO: 实现AI搜索功能
            console.log('AI搜索文本:', selectedText);
          }
        }
      }));

      // 监听全局鼠标事件
      app.on('browser-window-created', (_, window) => {
        window.webContents.on('context-menu', (_, params) => {
          if (params.selectionText) {
            contextMenu.popup({ window });
          }
        });
      });
    }
  };
}

// 获取选中的文本
async function getSelectedText(): Promise<string | null> {
  const windows = BrowserWindow.getAllWindows();
  for (const window of windows) {
    if (!window.isDestroyed() && window.webContents) {
      const selectedText = await window.webContents.executeJavaScript(
        'window.getSelection().toString()'
      );
      if (selectedText) {
        return selectedText;
      }
    }
  }
  return null;
} 