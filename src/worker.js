const JsConfuser = require("js-confuser");
const { Buffer } = require("buffer");

global.Buffer = Buffer;

function getByteSize(str) {
  return new Blob([str]).size;
}

function evaluateOptions(optionsJS) {
  if (typeof optionsJS === "object" && optionsJS) return optionsJS;

  return eval(`
    var module = { exports: {} };
      ${optionsJS}
      module
      `)?.exports;
}

export const obfuscateCode = (requestID, code, optionsJS) => {
  var options = evaluateOptions(optionsJS);
  var callback = (name, complete, total) => {
    postMessage({
      event: "progress",
      data: {
        requestID,
        name,
        complete,
        total,
      },
    });
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
          requestID,
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
          requestID,
          errorString: error.toString(),
          errorStack: error?.stack?.toString?.() || null,
        },
      });
    });
};

export const evaluateCodeSandbox = function (
  requestID,
  code,
  strictMode,
  allowNetworkRequests
) {
  if (!allowNetworkRequests) {
    /* eslint-disable no-restricted-globals */
    const workerScope = self;

    workerScope.fetch = function () {
      throw new Error("Network requests are disabled in this worker.");
    };

    workerScope.XMLHttpRequest = function () {
      throw new Error("Network requests are disabled in this worker.");
    };

    workerScope.WebSocket = function () {
      throw new Error("WebSocket connections are disabled in this worker.");
    };
  }

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
          requestID,
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
      if (strictMode) {
        eval(code);
      } else {
        new Function(code)();
      }
    } catch (e) {
      Write("error")(String(e?.stack || e));
    }
  })();

  postMessage({
    event: "done",
    data: {
      requestID,
    },
  });
};
