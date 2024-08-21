import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./theme";
import AppRouter from "./AppRouter";
import { SnackbarContextProvider } from "./hooks/useSnackbar";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <SnackbarContextProvider>
        <AppRouter />
      </SnackbarContextProvider>
    </ThemeProvider>
  );
}

export default App;
