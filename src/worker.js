const JsConfuser = require("js-confuser");
const { Buffer } = require("buffer");

global.Buffer = Buffer;

function getByteSize(str) {
  return new Blob([str]).size;
}

export const obfuscate = (code, options) => {
  var callback = (name, complete, total) => {
    postMessage({ event: "progress", data: [name, complete, total] });
  };

  JsConfuser.debugObfuscation(
    code,
    { ...options, verbose: true },
    callback,
    performance
  )
    .then((resultObject) => {
      console.log("Successfully obfuscated code");

      postMessage({
        event: "success",
        data: {
          obfuscated: resultObject.obfuscated,
          info: {
            obfuscationTime: resultObject.obfuscationTime,
            transformationTimes: resultObject.transformationTimes,
            originalSize: getByteSize(code),
            newSize: getByteSize(resultObject.obfuscated),
            totalTransforms: resultObject.totalTransforms,
            totalPossibleTransforms: resultObject.totalPossibleTransforms,
            parseTime: resultObject.parseTime,
            compileTime: resultObject.compileTime,
          },
        },
      });
    })
    .catch((error) => {
      console.error(error);

      postMessage({
        event: "error",
        data: {
          errorString: error.toString(),
          errorStack: error?.stack?.toString?.() || null,
        },
      });
    });
};

export const evaluateCodeSandbox = function (code) {
  var RealConsoleLog = console.log;

  function StringFn(item) {
    if (item && typeof item === "object") {
      return JSON.stringify(item);
    }

    return String(item);
  }

  var Write = (writeType) => {
    return (...messages) => {
      RealConsoleLog(...messages);

      postMessage({
        event: "write",
        data: {
          type: writeType,
          messages: messages.map(StringFn),
        },
      });
    };
  };

  (() => {
    // Override default console
    var console = {
      log: Write("console.log"),
      error: Write("console.error"),
      warn: Write("console.warn"),
      debug: Write("console.debug"),
      info: Write("console.info"),
    };

    // Redefine the 'global' variables
    var window = Function("return this")();
    window.console = console;
    window.window = window;

    var global = window;
    global.global = global;

    this.console = console;

    try {
      eval(code);
    } catch (e) {
      Write("error")(String(e?.stack || e));
    }
  })();

  postMessage({ event: "done" });
};
