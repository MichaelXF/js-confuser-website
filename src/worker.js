const JsConfuser = require("js-confuser");

export const obfuscate = (code, options) => {
  JsConfuser.obfuscate(code, options)
    .then((obfuscated) => {
      postMessage({ event: "success", data: obfuscated.toString() });
    })
    .catch((error) => {
      postMessage({ event: "error", data: error.toString() });
    });
};
