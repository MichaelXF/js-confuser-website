import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Typography,
} from "@mui/material";

export default function LoadingBackdrop({
  open,
  handleClose,
  onCancel,
  loadingInfo,
}) {
  return (
    <Backdrop
      sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={open}
      onClick={handleClose}
    >
      <LinearProgress
        sx={{
          flexGrow: 1,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
        variant="determinate"
        value={(loadingInfo?.percent ?? 0) * 100}
        color="primary"
        key={open}
      />

      <Box
        sx={{
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <CircularProgress />

        <Typography mt={4} color="primary" fontWeight="bold">
          {loadingInfo?.progress}
        </Typography>

        <Button
          variant="contained"
          color="inherit"
          onClick={onCancel}
          sx={{ fontWeight: "bold", mt: 2 }}
        >
          Cancel
        </Button>
      </Box>
    </Backdrop>
  );
}
