import worker from "workerize-loader!../codeWorker"; // eslint-disable-line import/no-webpack-loader-syntax
import { getRandomString } from "../utils/random-utils";

var workerInstance;
function createWorker() {
  if (workerInstance) {
    return workerInstance;
  }
  return (workerInstance = worker()); // Attach an event listener to receive calculations from your worker
}

export default function useCodeWorker() {
  var worker = createWorker();

  const convertTSCodeToJSCode = (code) => {
    const requestID = getRandomString(10);

    return new Promise((resolve, reject) => {
      worker.convertTSCodeToJSCode(requestID, code);

      var callback = (message) => {
        const { event, data } = message.data;
        if (data.requestID !== requestID) return;

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
    });
  };

  const formatCode = (code, language) => {
    const requestID = getRandomString(10);

    return new Promise((resolve, reject) => {
      worker.formatCode(requestID, code, language);

      var callback = (message) => {
        const { event, data } = message.data;
        if (data.requestID !== requestID) return;

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
    });
  };

  return {
    convertTSCodeToJSCode,
    formatCode,
  };
}
