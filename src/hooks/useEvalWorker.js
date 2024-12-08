import { useEffect, useRef, useState } from "react";
// Inline the worker code - Avoid spamming the network with requests
import worker from "workerize-loader?inline!../workers/evalWorker"; // eslint-disable-line import/no-webpack-loader-syntax
import { getRandomString } from "../utils/random-utils";

export default function useEvalWorker(consoleRef) {
  var [running, setRunning] = useState();
  var workerRef = useRef();

  var runningRef = useRef();
  runningRef.current = running;

  function evaluateCode(code, evalOptions) {
    // If previous worker still exists, terminate it

    cancel();

    if (consoleRef.current) {
      consoleRef.current.innerText = "";
    }

    setRunning(true);

    const requestID = getRandomString(10);

    // Warn the user if they're on target='node' but they're running this in a browser
    // if (options && options.target !== "browser") {
    //   if (ref.current) {
    //     ref.current.innerText +=
    //       "WARNING: The obfuscated code used target='node' which may not run correctly here.\n";
    //   }
    // }

    // Create a new worker
    const myWorker = worker();
    workerRef.current = myWorker;

    // Receive console messages through this event handler
    const cb = (message) => {
      const { event, data } = message.data;
      if (data?.requestID !== requestID) return;

      if (event === "clear") {
        consoleRef.current.innerText = "";
      } else if (event === "write") {
        if (consoleRef.current) {
          consoleRef.current.innerText +=
            data.messages.map(String).join(" ") + "\n";
        }
      } else if (event === "done") {
        setRunning(false);
      }
    };
    myWorker.addEventListener("message", cb);

    // Delay purely for UX purposes
    setTimeout(() => {
      // Sometimes the worker doesn't load in development?
      if (typeof myWorker.evaluateCodeSandbox !== "function") {
        cb({
          data: {
            event: "write",
            data: {
              requestID,
              messages: ["Worker function not available."],
            },
          },
        });
        return;
      }

      // Execute the code
      myWorker.evaluateCodeSandbox(requestID, code, evalOptions);
    }, 200);
  }

  function evaluateOptions(code, evalOptions) {
    return new Promise((resolve, reject) => {
      // Create a new worker
      const myWorker = worker();

      const requestID = getRandomString(10);

      // Receive console messages through this event handler
      const cb = (message) => {
        const { event, data } = message.data;
        if (data?.requestID !== requestID) return;

        if (event === "error") {
          dispose();
          reject(data.error);
        } else if (event === "success") {
          dispose();
          resolve(data.options);
        }
      };
      myWorker.addEventListener("message", cb);

      function dispose() {
        myWorker.removeEventListener("message", cb);
      }

      myWorker.evaluateOptions(requestID, code, evalOptions);
    });
  }

  function cancel() {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }

  // Stop the worker when the component unmounts
  useEffect(() => {
    return () => {
      cancel();
    };
  }, []);

  return {
    evaluateCode,
    evaluateOptions,
    cancel,
    running,
  };
}
