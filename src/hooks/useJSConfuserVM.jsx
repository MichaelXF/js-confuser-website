import { useEffect, useRef } from "react";
import JSConfuserVMWorker from "../workers/jsConfuserVMWorker?worker";
import { getRandomString } from "../utils/random-utils";

export default function useJSConfuserVM({ onError } = {}) {
  /**
   * @type {React.Ref<Worker|null>}
   */
  var workerRef = useRef(null);
  var isObfuscatingRef = useRef(false);

  function createWrapper(methodName) {
    return (...args) => {
      return new Promise((resolve, reject) => {
        var requestID = getRandomString(10);

        // Create worker instance if needed
        if (!workerRef.current) {
          workerRef.current = new JSConfuserVMWorker();
        }

        var worker = workerRef.current;

        var callback = (message) => {
          const { event, data } = message.data;
          if (data?.requestID !== requestID) return;

          isObfuscatingRef.current = false;
          dispose();

          if (event === "success") {
            resolve(data);
          } else if (event === "error") {
            reject(data);
          }
        };

        var dispose = () => {
          if (callback) {
            worker.removeEventListener("message", callback);
            callback = null;
          }
        };

        // Check if worker methods are available
        const isWorkerReady = () => {
          return worker && typeof worker.postMessage === "function";
        };

        if (!isWorkerReady()) {
          setTimeout(() => {
            onError?.({
              errorString: "Worker not available or not ready.",
            });
          });
          return;
        }

        worker.addEventListener("message", callback);

        isObfuscatingRef.current = true;

        // Post message to worker with method name and args
        worker.postMessage({
          method: methodName,
          requestID,
          args,
        });
      });
    };
  }

  function obfuscate(
    code,
    options,
    callbacksIn = {
      onComplete: (data) => {},
      onError: (error) => {},
      onProgress: (data) => {},
    },
    advancedOptions = {},
  ) {
    var requestID = getRandomString(10);

    // create new worker
    if (!workerRef.current) {
      cancel();
      workerRef.current = new JSConfuserVMWorker();
    }

    var worker = workerRef.current;

    var callback = (message) => {
      const { event, data } = message.data;
      if (data?.requestID !== requestID) return;

      if (event === "success") {
        isObfuscatingRef.current = false;
        callbacksIn.onComplete?.(data);
        dispose();
      } else if (event === "error") {
        isObfuscatingRef.current = false;
        callbacksIn.onError?.(data);
        dispose();
      } else if (event === "progress") {
        callbacksIn.onProgress?.(data);
      }
    };

    var dispose = () => {
      if (callback) {
        worker.removeEventListener("message", callback);
        callback = null;
      }
    };

    // Check if worker is ready
    if (!worker || typeof worker.postMessage !== "function") {
      setTimeout(() => {
        callbacksIn.onError?.({
          errorString: "Worker not available.",
        });
      });
      return;
    }

    worker.addEventListener("message", callback);
    isObfuscatingRef.current = true;

    // Post message to worker with correct parameter order
    worker.postMessage({
      method: "obfuscateCode",
      requestID,
      args: [code, options, advancedOptions],
    });
  }

  function cancel() {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    isObfuscatingRef.current = false;
  }

  // Stop the worker when the component unmounts
  useEffect(() => {
    return () => {
      cancel();
    };
  }, []);

  return {
    obfuscate,
    cancel,
  };
}
