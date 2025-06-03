/**
 * ModuleContext 类型定义了模块所需的上下文信息。
 * 包含 Electron 应用实例，供模块使用。
 */
export type ModuleContext = {
  // @ts-ignore
  readonly app: Electron.App; // 只读的 Electron 应用实例
}
