import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useEffect, useRef } from "react";
import useEvalWorker from "../../hooks/useEvalWorker";

export default function ConsoleDialog({
  open,
  onClose: onCloseIn,
  getEditorCode,
  getEditorOptions = () => ({}),
}) {
  var consoleRef = useRef();
  var workerEval = useEvalWorker(consoleRef);
  var running = !!workerEval.running;

  var onClose = () => {
    workerEval.cancel();
    onCloseIn?.();
  };

  const startEval = () => {
    if (consoleRef.current) {
      consoleRef.current.innerText = "";
    }

    workerEval.evaluateCode(getEditorCode(), getEditorOptions());
  };

  useEffect(() => {
    if (open) {
      startEval();
    }
  }, [open]);

  return (
    <Dialog
      open={!!open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus={true}
    >
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
