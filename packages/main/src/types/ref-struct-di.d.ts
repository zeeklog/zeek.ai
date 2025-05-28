declare module 'ref-struct-di' {
  import * as ref from 'ref-napi';

  interface StructType {
    new (): any;
    ref: ref.RefType<any>;
  }

  function StructType(fields: { [key: string]: string }): StructType;

  export = StructType;
} 