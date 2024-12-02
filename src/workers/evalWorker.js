/* eslint-disable no-restricted-globals */
const workerScope = self;

export const evaluateCodeSandbox = function (
  requestID,
  code,
  { strictModeEval, allowNetworkRequests }
) {
  if (!allowNetworkRequests) {
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
      if (strictModeEval) {
        eval(code);
      } else {
        new Function(code)();
      }
    } catch (e) {
      // Each browser has a different way of handling the error object
      const { stack, message } = e || {};
      let output = stack || message || e;

      // Safari does not include the message in the stack trace
      if (typeof stack === "string" && typeof message === "string") {
        if (!stack.includes(message)) {
          output = `${message}\n${stack}`;
        }
      }

      Write("error")(String(output));
    }
  })();

  postMessage({
    event: "done",
    data: {
      requestID,
    },
  });
};
