import { Box, Button, Flex } from "@chakra-ui/react";
import { ArrowRightIcon, DownloadIcon } from "@chakra-ui/icons";
import { DEFAULT_BUTTON_STYLE } from "../Constants";
import { useContext, useEffect, useId, useRef, useState } from "react";
import ModalEval from "../modals/ModalEval";

// Import your worker
import worker from "workerize-loader!../worker"; // eslint-disable-line import/no-webpack-loader-syntax
import { OptionContext } from "../App";
import ObfuscationInfo from "./ObfuscationInfo";
import downloadFile from "../downloadFile";

/**
 * The Footer component shows after a successful obfuscation and provides a download button and obfuscation info
 * @param {*} param0
 * @returns
 */
export default function Footer({
  onReset,
  codeRef,
  outputFileName,
  obfuscationInfo,
  getEditorCode,
}) {
  var { options } = useContext(OptionContext);
  outputFileName = outputFileName || "obfuscated.js";

  var [showEval, setShowEval] = useState();
  var [isEvalLoading, setIsEvalLoading] = useState();
  var [isEvalRunning, setIsEvalRunning] = useState();
  var ref = useRef();

  var workerRef = useRef();

  function evaluateCode() {
    // If previous worker still exists, terminate it
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    if (ref.current) {
      ref.current.innerText = "";
    }

    setShowEval(true);
    setIsEvalLoading(true);
    setIsEvalRunning(true);

    setTimeout(() => {
      var code = getEditorCode();

      setIsEvalLoading(false);

      // Warn the user if they're on target='node' but they're running this in a browser
      if (options && options.target !== "browser") {
        if (ref.current) {
          ref.current.innerText +=
            "WARNING: The obfuscated code used target='node' which may not run correctly here.\n";
        }
      }

      // Create a new worker
      var myWorker = worker();
      workerRef.current = myWorker;

      // Receive console messages through this event handler
      var cb = ({ data }) => {
        if (data && data.event) {
          if (data.event === "clear") {
            ref.current.innerText = "";
          } else if (data.event === "write") {
            if (ref.current) {
              ref.current.innerText +=
                data.data.messages.map(String).join(" ") + "\n";
            }
          } else if (data.event === "done") {
            setIsEvalRunning(false);
          }
        }
      };
      myWorker.addEventListener("message", cb);

      // Execute the code
      myWorker.evaluateCodeSandbox(code);
    }, 300);
  }

  return (
    <Box>
      <ModalEval
        ref={ref}
        isOpen={showEval}
        onClose={() => {
          setShowEval(false);

          // Ensure the worker gets properly terminated
          if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
          }
        }}
        isLoading={isEvalLoading}
        isRunning={isEvalRunning}
        onEvaluateAgain={() => {
          evaluateCode();
        }}
      />

      <Flex
        position="fixed"
        bottom="0px"
        left="0px"
        right="0px"
        width="100%"
        minHeight="80px"
        p={4}
        className="app-footer-toolbar"
        align="center"
        justify="center"
      >
        <Button
          colorScheme="blue"
          mr={2}
          onClick={() => {
            downloadFile(outputFileName, codeRef.current.editor.getValue());
          }}
          leftIcon={<DownloadIcon />}
          title={"Download " + outputFileName}
        >
          Download
        </Button>
        <Button
          mr={1}
          onClick={() => {
            onReset();
          }}
          {...DEFAULT_BUTTON_STYLE}
          title="Reset Editor"
        >
          Reset Editor
        </Button>

        <ObfuscationInfo obfuscationInfo={obfuscationInfo} />

        <Button
          variant="link"
          colorScheme="blue"
          leftIcon={<ArrowRightIcon fontSize="sm" />}
          title={"Evaluate"}
          ml={3}
          onClick={() => {
            evaluateCode();
          }}
        >
          Evaluate
        </Button>
      </Flex>
    </Box>
  );
}
