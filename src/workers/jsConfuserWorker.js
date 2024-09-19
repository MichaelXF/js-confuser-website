/* eslint-disable no-restricted-globals */
const workerScope = self;

const { Buffer } = require("buffer");

global.Buffer = Buffer;
workerScope.Buffer = Buffer;

const JsConfuser = require("js-confuser");

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
  var callback = (log) => {
    postMessage({
      event: "progress",
      data: {
        requestID,
        ...log,
      },
    });
  };

  var options = {};

  try {
    options = evaluateOptions(optionsJS);
  } catch (err) {
    postMessage({
      event: "error",
      data: {
        requestID,
        errorString: err.toString(),
        errorStack: err?.stack?.toString?.() || null,
      },
    });

    return;
  }

  JsConfuser.obfuscateWithProfiler(
    code,
    { ...options, verbose: true },
    {
      callback,
      performance,
    }
  )
    .then((resultObject) => {
      console.log("Successfully obfuscated code");

      postMessage({
        event: "success",
        data: {
          requestID,
          code: resultObject.code,
          profileData: {
            ...resultObject.profileData,

            originalSize: getByteSize(code),
            newSize: getByteSize(resultObject.code),
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
