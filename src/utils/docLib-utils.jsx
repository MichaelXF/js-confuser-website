import jsConfuserOptionsTS from "js-confuser/dist/index.d.ts?raw";

const jsConfuserTypes = `
declare module 'js-confuser' {
  export class Template {}
  
  ${jsConfuserOptionsTS}
}

interface Module {
  exports: import('js-confuser').ObfuscateOptions;
}

// Simulate Node.js-like 'module' behavior
declare var module: Module;

// Simulate Node.js-like 'require' behavior
type Require = (id: string) => any;

declare var require: Require;
`;

export function getJSConfuserTypes() {
  return jsConfuserTypes;
}
