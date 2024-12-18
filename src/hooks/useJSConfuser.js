import { useEffect, useRef } from "react";
import Worker from "workerize-loader!../workers/jsConfuserWorker.js"; // eslint-disable-line import/no-webpack-loader-syntax
import { getRandomString } from "../utils/random-utils";

export default function useJSConfuser({ onError } = {}) {
  var workerRef = useRef();
  var isObfuscatingRef = useRef(false);

  function createWrapper(methodName) {
    return (...args) => {
      return new Promise((resolve, reject) => {
        var requestID = getRandomString(10);
        var worker = workerRef.current || (workerRef.current = Worker());

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

        // Sometimes the worker doesn't load in development?
        if (typeof worker[methodName] !== "function") {
          // Timeout required as multiple state updates can cause issues
          setTimeout(() => {
            onError?.({
              errorString: "Worker function not available.",
            });
          });
          return;
        }

        worker.addEventListener("message", callback);

        isObfuscatingRef.current = true;
        worker[methodName](requestID, ...args);
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
    var worker = workerRef.current || (workerRef.current = Worker());

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

    // Sometimes the worker doesn't load in development?
    if (typeof worker.obfuscateCode !== "function") {
      // Timeout required as multiple state updates can cause issues
      setTimeout(() => {
        callbacksIn.onError?.({
          errorString: "Worker function not available.",
        });
      });
      return;
    }

    worker.addEventListener("message", callback);

    isObfuscatingRef.current = true;
    worker.obfuscateCode(requestID, code, options, advancedOptions);
  }

  function cancel() {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
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
