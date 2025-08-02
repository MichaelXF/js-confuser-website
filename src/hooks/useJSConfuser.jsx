import { useEffect, useRef } from "react";
import JSConfuserWorker from "../workers/jsConfuserWorker?worker";
import { getRandomString } from "../utils/random-utils";

export default function useJSConfuser({ onError } = {}) {
  var workerRef = useRef();
  var isObfuscatingRef = useRef(false);

  function createWrapper(methodName) {
    return (...args) => {
      return new Promise((resolve, reject) => {
        var requestID = getRandomString(10);

        // Create worker instance if needed
        if (!workerRef.current) {
          workerRef.current = new JSConfuserWorker();
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

  const preObfuscationAnalysis = createWrapper("preObfuscationAnalysis");
  const applyTransformations = createWrapper("applyTransformations");

  const getTransformations = async (optionsJS) => {
    var result = await applyTransformations(null, optionsJS, []);
    return result.transformationNames;
  };

  function obfuscate(
    code,
    options,
    callbacksIn = {
      onComplete: () => {},
      onError: () => {},
      onProgress: () => {},
    },
    advancedOptions = {}
  ) {
    var requestID = getRandomString(10);

    // Cancel pending obfuscation, create new worker
    if (!workerRef.current || isObfuscatingRef.current) {
      cancel();
      workerRef.current = new JSConfuserWorker();
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

    console.log(worker);

    // Post message to worker with correct parameter order
    console.log("Sending message to worker:", {
      method: "obfuscateCode",
      requestID,
      args: [code, options, advancedOptions],
    });
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

  useEffect(() => {
    // On unmount, cancel any obfuscation
    return () => {
      if (isObfuscatingRef.current) {
        cancel();
      }
    };
  }, []);

  return {
    obfuscate,
    preObfuscationAnalysis,
    applyTransformations,
    getTransformations,
    cancel,
  };
}
