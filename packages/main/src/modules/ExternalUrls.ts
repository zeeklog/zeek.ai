import {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import {shell} from 'electron';
import {URL} from 'node:url';

export class ExternalUrls implements AppModule {

  readonly #externalUrls: Set<string>;

  constructor(externalUrls: Set<string>) {
    this.#externalUrls = externalUrls;
  }

  enable({app}: ModuleContext): Promise<void> | void {
    app.on('web-contents-created', (_, contents) => {
      contents.setWindowOpenHandler(({url}) => {
        console.log(`打开网页：${url}`)
        // const {origin} = new URL(url);

        // 不符合要求的， 不能打开窗口
        // if (this.#externalUrls.has(origin)) {
        //   shell.openExternal(url).catch(console.error);
        // } else if (import.meta.env.DEV) {
        //   console.warn(`Blocked the opening of a disallowed external origin: ${origin}`);
        // }
        //
        // // Prevent creating a new window.
        return {action: 'allow'};
      });
    });
  }
}


export function allowExternalUrls(...args: ConstructorParameters<typeof ExternalUrls>) {
  return new ExternalUrls(...args);
}
