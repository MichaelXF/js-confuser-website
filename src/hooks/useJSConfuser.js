import { Buffer } from "buffer";
import { useEffect, useRef } from "react";
import Worker from "workerize-loader!../worker"; // eslint-disable-line import/no-webpack-loader-syntax
import { getRandomString } from "../utils/random-utils";

export default function useJSConfuser() {
  var workerRef = useRef();

  function obfuscate(
    code,
    options,
    callbacksIn = {
      onComplete: () => {},
      onError: () => {},
      onProgress: () => {},
    }
  ) {
    var requestID = getRandomString(10);
    var worker = workerRef.current || (workerRef.current = Worker());

    var callback = (message) => {
      const { event, data } = message.data;
      if (data?.requestID !== requestID) return;

      if (event === "success") {
        callbacksIn.onComplete?.(data);
        dispose();
      } else if (event === "error") {
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

    worker.addEventListener("message", callback);

    worker.obfuscateCode(requestID, code, options);
  }

  function cancel() {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }

  return {
    obfuscate,
    cancel,
  };
}
