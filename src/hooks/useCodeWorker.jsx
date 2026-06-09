import CodeWorker from "../workers/codeWorker?worker";
import { getRandomString } from "../utils/random-utils";

var workerInstance;
function createWorker() {
  if (workerInstance) {
    return workerInstance;
  }

  var newWorker = new CodeWorker();
  workerInstance = newWorker;
  return newWorker;
}

export default function useCodeWorker() {
  const convertTSCodeToJSCode = (code) => {
    const worker = createWorker();
    const requestID = getRandomString(10);

    return new Promise((resolve, reject) => {
      var callback = (message) => {
        const { event, data } = message.data;
        if (data?.requestID !== requestID) return;

        if (event === "success") {
          resolve(data.code);
          dispose();
        } else if (event === "error") {
          reject(data.error);
          dispose();
        }
      };

      var dispose = () => {
        if (callback) {
          worker.removeEventListener("message", callback);
          callback = null;
        }
      };

      worker.addEventListener("message", callback);

      worker.postMessage({
        type: "convertTSCodeToJSCode",
        requestID,
        code,
      });
    });
  };

  const formatCode = (code, language) => {
    const worker = createWorker();
    const requestID = getRandomString(10);

    return new Promise((resolve, reject) => {
      var callback = (message) => {
        const { event, data } = message.data;
        if (data?.requestID !== requestID) return;

        if (event === "success") {
          resolve(data.code);
          dispose();
        } else if (event === "error") {
          reject(data.error);
          dispose();
        }
      };

      var dispose = () => {
        if (callback) {
          worker.removeEventListener("message", callback);
          callback = null;
        }
      };

      worker.addEventListener("message", callback);

      worker.postMessage({
        type: "formatCode",
        requestID,
        code,
        language,
      });
    });
  };

  return {
    convertTSCodeToJSCode,
    formatCode,
  };
}

export function formatCodePrettier(code, language) {
  const worker = createWorker();
  const requestID = getRandomString(10);

  return new Promise((resolve, reject) => {
    var callback = (message) => {
      const { event, data } = message.data;
      if (data?.requestID !== requestID) return;

      if (event === "success") {
        resolve(data.code);
        dispose();
      } else if (event === "error") {
        reject(data.error);
        dispose();
      }
    };

    var dispose = () => {
      if (callback) {
        worker.removeEventListener("message", callback);
        callback = null;
      }
    };

    worker.addEventListener("message", callback);

    worker.postMessage({
      type: "formatCode",
      requestID,
      code,
      language,
    });
  });
}
