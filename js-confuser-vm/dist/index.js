import { compileAndSerialize } from "./compiler.js";
import { DEFAULT_OPTIONS } from "./options.js";
async function obfuscate(source, options = DEFAULT_OPTIONS) {
  const result = compileAndSerialize(source, options);
  return result;
}
export const JsConfuserVM = {
  obfuscate
};
export default JsConfuserVM;