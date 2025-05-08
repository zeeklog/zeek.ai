declare module 'ffi-napi' {
  import * as ref from 'ref-napi';

  interface Library {
    [key: string]: Function;
  }

  interface LibraryConstructor {
    new (name: string, funcs: { [key: string]: [string, any[]] }): Library;
  }

  const Library: LibraryConstructor;
  export = Library;
} 