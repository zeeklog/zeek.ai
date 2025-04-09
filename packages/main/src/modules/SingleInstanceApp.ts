import {AppModule} from '../AppModule.js';
import * as Electron from 'electron';

/**
 * SingleInstanceApp 类确保 Electron 应用只能有一个实例运行。
 * 如果尝试启动第二个实例，应用将退出。
 */
class SingleInstanceApp implements AppModule {
  /**
   * 启用单实例控制。
   * @param {Object} param - 包含 Electron 应用实例的对象。
   * @param {Electron.App} param.app - Electron 应用实例。
   */
  enable({app}: {app: Electron.App}): void {
    const isSingleInstance = app.requestSingleInstanceLock();
    if (!isSingleInstance) {
      app.quit(); // 如果不是单实例，退出应用
      process.exit(0);
    }
  }
}


export function disallowMultipleAppInstance(...args: ConstructorParameters<typeof SingleInstanceApp>) {
  return new SingleInstanceApp(...args);
}
