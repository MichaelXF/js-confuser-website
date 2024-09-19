import { useRef, useState } from "react";
import worker from "workerize-loader?inline!../workers/evalWorker"; // eslint-disable-line import/no-webpack-loader-syntax
import { getRandomString } from "../utils/random-utils";

export default function useWorkerEval(consoleRef) {
  var [running, setRunning] = useState();
  var workerRef = useRef();

  function evaluateCode(code, strictMode, allowNetworkRequests) {
    // If previous worker still exists, terminate it
    cancel();

    if (consoleRef.current) {
      consoleRef.current.innerText = "";
    }

    setRunning(true);

    var requestID = getRandomString(10);

    // Warn the user if they're on target='node' but they're running this in a browser
    // if (options && options.target !== "browser") {
    //   if (ref.current) {
    //     ref.current.innerText +=
    //       "WARNING: The obfuscated code used target='node' which may not run correctly here.\n";
    //   }
    // }

    // Create a new worker
    var myWorker = worker();
    workerRef.current = myWorker;

    // Receive console messages through this event handler
    var cb = (message) => {
      var { event, data } = message.data;
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
      // Execute the code
      myWorker.evaluateCodeSandbox(
        requestID,
        code,
        strictMode,
        allowNetworkRequests
      );
    }, 200);
  }

  function cancel() {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }

  return {
    evaluateCode,
    cancel,
    running,
  };
}
