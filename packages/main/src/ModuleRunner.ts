import {AppModule} from './AppModule.js';
import {ModuleContext} from './ModuleContext.js';
// @ts-ignore
import {app} from 'electron';

/**
 * ModuleRunner 类用于管理和初始化应用模块。
 * 它确保模块在应用启动时能够正确初始化，并提供上下文信息。
 */
class ModuleRunner implements PromiseLike<void> {
  #promise: Promise<void>;

  constructor() {
    this.#promise = Promise.resolve(); // 初始化 promise
  }

  then<TResult1 = void, TResult2 = never>(onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined): PromiseLike<TResult1 | TResult2> {
        return this.#promise.then(onfulfilled, onrejected);
    }

  /**
   * 添加模块并执行其 enable 方法。
   * @param {AppModule} module - 要初始化的模块。
   * @returns {ModuleRunner} - 返回当前的 ModuleRunner 实例。
   */
  init(module: AppModule) {
    const p = module.enable(this.#createModuleContext());

    if (p instanceof Promise) {
      this.#promise = this.#promise.then(() => p); // 链接 promise
    }

    return this;
  }

  /**
   * 创建模块上下文，提供 Electron 应用实例。
   * @returns {ModuleContext} - 模块上下文对象。
   */
  #createModuleContext(): ModuleContext {
    return {
      app,
    };
  }
}

export function createModuleRunner() {
  return new ModuleRunner();
}
