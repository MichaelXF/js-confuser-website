import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./theme";
import AppRouter from "./AppRouter";
import { SnackbarContextProvider } from "./hooks/useSnackbar";
import { createContext, useMemo, useState } from "react";
import ChatPopover from "./components/js-confuser-ai/components/ChatPopover";

export const AIContext = createContext({ ai: false, setAI: () => {} });

function App() {
  const [ai, setAi] = useState(false);
  const aiValue = useMemo(() => ({ show: ai, setAI: setAi }), [ai]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <SnackbarContextProvider>
        <AIContext.Provider value={aiValue}>
          {ai ? (
            <ChatPopover
              immediateMessage={typeof ai === "string" ? ai : null}
              onClose={() => setAi(false)}
            />
          ) : null}

          <AppRouter />
        </AIContext.Provider>
      </SnackbarContextProvider>
    </ThemeProvider>
  );
}

export default App;
