import { compileAndSerialize } from "./compiler.js";
async function obfuscate(source, options = {}) {
  const result = compileAndSerialize(source, options);
  return result;
}
export const JsConfuserVM = {
  obfuscate
};
export default JsConfuserVM;