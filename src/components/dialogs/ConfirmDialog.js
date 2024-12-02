import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

export function ConfirmDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Override</DialogTitle>

      <DialogContent>
        <Typography>
          Are you sure you want to override the existing options? <br />
          <br />
          You will lose any custom values or implementations.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={() => {
            onConfirm();
          }}
        >
          Confirm Override
        </Button>

        <Button
          onClick={() => {
            onClose();
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
