const JsConfuser = require("js-confuser");

export const obfuscate = (code, options) => {
  var callback = (name, complete, total) => {
    postMessage({ event: "progress", data: [name, complete, total] });
  };

  JsConfuser.debugObfuscation(code, { ...options, verbose: true }, callback)
    .then((obfuscated) => {
      console.log("Successfully obfuscated code");
      postMessage({ event: "success", data: obfuscated.toString() });
    })
    .catch((error) => {
      postMessage({ event: "error", data: error.toString() });
    });
};
