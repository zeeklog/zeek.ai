// 导入应用初始化配置类型，用于定义应用启动参数
import type { AppInitConfig } from './AppInitConfig.js';
// 导入模块运行器工厂函数，用于管理模块初始化
import { createModuleRunner } from './ModuleRunner.js';
// 导入单实例应用模块，防止多个应用实例同时运行
import { disallowMultipleAppInstance } from './modules/SingleInstanceApp.js';
// 导入窗口管理模块工厂函数，用于创建和管理窗口
import { createWindowManagerModule } from './modules/WindowManager.js';
// 导入最后一个窗口关闭时终止应用的模块
import { terminateAppOnLastWindowClose } from './modules/ApplicationTerminatorOnLastWindowClose.js';
// 导入硬件加速控制模块，用于启用或禁用硬件加速
import { hardwareAccelerationMode } from './modules/HardwareAccelerationModule.js';
// 导入自动更新模块，用于检查和应用更新
import { autoUpdater } from './modules/AutoUpdater.js';
// 导入内部来源白名单模块，用于限制允许的内部 URL
import { allowInternalOrigins } from './modules/BlockNotAllowdOrigins.js';
// 导入外部 URL 白名单模块，用于限制允许的外部 URL
import { allowExternalUrls } from './modules/ExternalUrls.js';
// 导入全局上下文菜单模块
import { createGlobalContextMenuModule } from './modules/GlobalContextMenu.js';
// 导入文本选择菜单模块
import { createTextSelectionMenu } from './modules/TextSelectionMenu.js';

/**
 * 初始化 Electron 应用的异步函数
 * 配置并启动所有必要的模块，包括窗口管理、单实例控制、自动更新等
 * @param initConfig - 应用的初始化配置，包含 preload 和 renderer 等信息
 * @returns {Promise<void>} 无返回值，异步完成应用初始化
 */
export async function initApp(initConfig: AppInitConfig): Promise<void> {
  // 创建模块运行器实例，用于按顺序初始化各个模块
  // @ts-ignore 用于忽略 TypeScript 检查（可能与模块类型推导有关）
  const moduleRunner = createModuleRunner()
    // 初始化窗口管理模块，负责主窗口和标签页管理
    .init(createWindowManagerModule({
      initConfig,                     // 传递应用初始化配置
      openDevTools: import.meta.env.DEV // 开发环境下默认打开开发者工具
    }))
    // 初始化单实例应用模块，防止应用多开
    .init(disallowMultipleAppInstance())
    // 初始化窗口关闭终止模块，在最后一个窗口关闭时退出应用
    .init(terminateAppOnLastWindowClose())
    // 初始化硬件加速模块，禁用硬件加速以提高兼容性
    .init(hardwareAccelerationMode({ enable: false }))
    // 初始化自动更新模块，检查并应用应用更新
    .init(autoUpdater())

    // 可选：初始化 Chrome DevTools 扩展（已注释，需根据需求启用）
    // .init(chromeDevToolsExtension({ extension: 'VUEJS3_DEVTOOLS' }))

    // 安全性模块：限制允许的内部来源
    .init(allowInternalOrigins(
      new Set(
        initConfig.renderer instanceof URL
          ? [initConfig.renderer.origin] // 如果 renderer 是 URL，允许其 origin
          : []                           // 否则为空
      )
    ))
    // 安全性模块：限制允许的外部 URL 白名单
    .init(allowExternalUrls(
      new Set(
        initConfig.renderer instanceof URL
          ? [
            'https://vite.dev',
            'https://developer.mozilla.org',
            'https://solidjs.com',
            'https://qwik.dev',
            'https://lit.dev',
            'https://react.dev',
            'https://preactjs.com',
            'https://www.typescriptlang.org',
            'https://vuejs.org'
          ]
          : []
      )
    ))
    // 添加全局上下文菜单模块
    .init(createGlobalContextMenuModule())
    // 添加文本选择菜单模块
    .init(createTextSelectionMenu());

  // 执行模块运行器，完成所有模块的初始化
  await moduleRunner;
}
