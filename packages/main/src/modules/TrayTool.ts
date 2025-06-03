import {app, Menu, shell, Tray} from 'electron';
import path from 'path';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default interface TrayTool {

}

export function initTrayTool (mainWindow: any, userConfigDir: string) {
  const icon = !app.isPackaged
    ? path.join(__dirname, '../assets', 'logo.png') // 开发模式
    : path.join(process.resourcesPath, 'assets', 'logo.png'); // 生产模式
  console.log(`process.resourcesPath：${process.resourcesPath}`)
  console.log(`加载图标地址：${icon}`)
  let tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => mainWindow.show() },
    {
      label: '清除缓存',
      click: () => {
        if (fs.existsSync(userConfigDir)) {
          fs.rmdirSync(userConfigDir, { recursive: true });
          fs.mkdirSync(userConfigDir, { recursive: true });
          console.log('Cache cleared: localStorage.json deleted');
          mainWindow.webContents.send('cache-cleared');
        } else {
          console.log('No cache file to clear');
          mainWindow.webContents.send('cache-cleared');
        }
      }
    },
    {
      label: '退出登录',
      click: () => {
        if (fs.existsSync(userConfigDir)) {
          fs.rmdirSync(userConfigDir, { recursive: true });
          fs.mkdirSync(userConfigDir, { recursive: true });
          console.log('Cache cleared: localStorage.json deleted');
          mainWindow.webContents.send('cache-cleared');
        } else {
          console.log('No cache file to clear');
          mainWindow.webContents.send('cache-cleared');
        }
      }
    },
    {
      label: '关于极客ai',
      click: () => shell.openExternal('https://zeeklog.com/') // 打开网页
    },
    {
      label: '重启应用',
      click: () => {
        console.log('Restarting application');
        app.relaunch(); // 重启应用
        app.quit(); // 先退出当前实例
      }
    },
    { label: '退出应用', click: () => app.quit() }
  ]);
  tray.setToolTip('zeek.ai');
  tray.setContextMenu(contextMenu);

  // 点击托盘图标时切换窗口显示/隐藏
  tray.on('click', () => {
    if (mainWindow.isVisible()) mainWindow.hide();
    else mainWindow.show();
  });
}
