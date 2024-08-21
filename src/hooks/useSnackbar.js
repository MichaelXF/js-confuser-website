import { Alert, Snackbar } from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export const SnackbarContext = createContext();

export function SnackbarContextProvider({ children }) {
  const [snackbar, setSnackbar] = useState({
    message: "",
    severity: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const snackbarProvideValue = useMemo(() => {
    return {
      showSnackbar: (message, severity) => {
        message = "" + message;
        setSnackbar({
          message,
          severity,
        });

        setSnackbarOpen(true);
      },

      closeAll: () => setSnackbarOpen(false),
    };
  }, []);

  return (
    <SnackbarContext.Provider value={snackbarProvideValue}>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={snackbarProvideValue.closeAll}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={snackbarProvideValue.closeAll}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {children}
    </SnackbarContext.Provider>
  );
}

export default function useSnackbar() {
  const { showSnackbar } = useContext(SnackbarContext);

  const showError = (message) => {
    showSnackbar(message, "error");
  };

  const showSuccess = (message) => {
    showSnackbar(message, "success");
  };

  return { showError, showSuccess };
}
