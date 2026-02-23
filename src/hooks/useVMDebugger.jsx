import { useEffect, useRef } from "react";
import VMDebuggerWorker from "../workers/vmDebuggerWorker?worker";
import { getRandomString } from "../utils/random-utils";

export default function useVMDebugger({ onEvent } = {}) {
  /**
   * @type {React.Ref<Worker|null>}
   */
  var workerRef = useRef(null);

  function ensureWorker() {
    if (!workerRef.current) {
      workerRef.current = new VMDebuggerWorker();

      workerRef.current.addEventListener("message", (message) => {
        onEvent?.(message.data);
      });
    }
    return workerRef.current;
  }

  function call(methodName, ...args) {
    return new Promise((resolve, reject) => {
      var requestID = getRandomString(10);
      var worker = ensureWorker();

      var callback = (message) => {
        const { event, requestID: rid, ...rest } = message.data;
        if (rid !== requestID) return;

        worker.removeEventListener("message", callback);

        if (event === "error") {
          reject(message.data.error);
        } else {
          resolve({ event, ...rest });
        }
      };

      worker.addEventListener("message", callback);

      worker.postMessage({ method: methodName, requestID, args });
    });
  }

  function loadProgram(program) {
    return call("loadProgram", program);
  }

  function next(runMode) {
    return call("next", runMode);
  }

  function cancel() {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      cancel();
    };
  }, []);

  return {
    loadProgram,
    next,
    cancel,
  };
}
