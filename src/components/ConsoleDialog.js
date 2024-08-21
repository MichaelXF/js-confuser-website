import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import useWorkerEval from "../hooks/useWorkerEval";

export default function ConsoleDialog({
  open,
  onClose,
  getEditorCode,
  getEditorOptions,
}) {
  var consoleRef = useRef();
  var workerEval = useWorkerEval(consoleRef);
  var running = !!workerEval.running;

  const startEval = () => {
    if (consoleRef.current) {
      consoleRef.current.innerText = "";
    }

    workerEval.evaluateCode(
      getEditorCode(),
      getEditorOptions().strictModeEval,
      getEditorOptions().allowNetworkRequests
    );
  };

  useEffect(() => {
    if (open) {
      startEval();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Console</DialogTitle>
      <DialogContent>
        <Box
          ref={consoleRef}
          bgcolor="black"
          typography="code"
          color="white"
          p={2}
          borderRadius={"8px"}
        ></Box>
      </DialogContent>
      <DialogActions>
        <Button disabled={running} onClick={startEval}>
          {running ? "Running..." : "Run Again"}
        </Button>

        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
