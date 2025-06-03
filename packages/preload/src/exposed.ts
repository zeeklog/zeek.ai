import * as exports from './index.js';
import {contextBridge} from 'electron';

// const isExport = (key: string): key is keyof typeof exports => Object.hasOwn(exports, key);

// for (const exportsKey in exports) {
//   if (isExport(exportsKey)) {
//     // 对暴露的apiKey进行加密
//     // contextBridge.exposeInMainWorld(btoa(exportsKey), exports[exportsKey]);
//   }
// }
contextBridge.exposeInMainWorld('mia', exports);


// Re-export for tests
export * from './index.js';
