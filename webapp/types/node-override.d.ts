// Override conflicting Node.js type definitions
declare module 'image-q/node_modules/@types/node/globals' {
  // Force the correct type for require
  declare var require: NodeRequire;
  
  // Force the correct type for the Module's require property
  interface Module {
    require: NodeRequire;
  }

  // Add missing types
  interface EventEmitter {}
  type Buffer = any;
  type BufferEncoding = string;
} 