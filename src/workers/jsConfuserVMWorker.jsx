// Import with proper Vite syntax
import JsConfuserVM from "js-confuser-vm/dist/index.js";

import { Buffer } from "buffer";
self.Buffer = Buffer;

function getByteSize(str) {
  return new Blob([str]).size;
}

// Export functions for Vite worker compatibility
function obfuscateCode(requestID, code, options, editorOptions = {}) {
  const reportError = (error) => {
    postMessage({
      event: "error",
      data: {
        requestID,
        errorString: error.toString(),
        errorStack: error?.stack?.toString?.() || null,
      },
    });
  };

  // (progress callback not implemented yet)
  const reportProgress = () => {};

  // Obfuscate code with
  JsConfuserVM.obfuscate(
    code,
    { ...options, verbose: true },
    { callback: reportProgress, performance },
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
      reportError(error);
    });
}

// Handle incoming messages
self.onmessage = function (event) {
  const { method, requestID, args } = event.data;

  try {
    switch (method) {
      case "obfuscateCode":
        obfuscateCode(requestID, ...args);
        break;
      default:
        postMessage({
          event: "error",
          data: { requestID, errorString: `Unknown method: ${method}` },
        });
    }
  } catch (error) {
    console.log("Error in worker message handler:", error);
    postMessage({
      event: "error",
      data: {
        requestID,
        errorString: error.toString(),
        errorStack: error?.stack?.toString?.() || null,
      },
    });
  }
};
