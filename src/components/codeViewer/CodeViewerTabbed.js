import { Box, Button, Typography } from "@mui/material";
import { CodeViewer } from "./CodeViewer";
import { useRef, useState } from "react";
import ConsoleDialog from "../dialogs/ConsoleDialog";
import { KeyboardArrowRight } from "@mui/icons-material";

export default function CodeViewerTabbed({
  value,
  defaultValue,
  setValue,
  readOnly,
  header,
  language,
  onMount,
  mb = 4,
  allowEvaluate = false,
}) {
  var [copied, setCopied] = useState(false);
  const [showConsoleDialog, setShowConsoleDialog] = useState(false);
  const editorRef = useRef();
  function realOnMount(editor, monaco) {
    editorRef.current = editor;
    onMount?.(editor, monaco);
  }

  return (
    <Box
      border="1px solid"
      borderColor="divider"
      flex={"1 1 58%"}
      borderRadius={2}
      mb={mb}
    >
      <ConsoleDialog
        getEditorCode={() => editorRef.current?.getValue()}
        open={showConsoleDialog}
        onClose={() => setShowConsoleDialog(false)}
        getEditorOptions={() => ({})}
      />
      <Box
        height="36px"
        p={2}
        px={2}
        sx={{
          bgcolor: "divider",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
        textAlign="center"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Typography color="text.secondary">{header}</Typography>

        <Box ml="auto">
          {allowEvaluate && (
            <Button
              variant="inherit"
              sx={{
                color: "text.secondary",
                fontSize: "0.875rem",
                height: "100%",
                textTransform: "none",
              }}
              onClick={(e) => {
                setShowConsoleDialog(true);
              }}
              startIcon={
                <KeyboardArrowRight sx={{ transform: "translate(0, 1px)" }} />
              }
            >
              Evaluate
            </Button>
          )}
          <Button
            variant="inherit"
            sx={{
              color: copied ? "primary.main" : "text.secondary",
              fontSize: "0.875rem",
              height: "100%",
              textTransform: "none",
              minWidth: "101px",
            }}
            onClick={() => {
              setCopied(true);

              window.navigator.clipboard.writeText(value);

              setTimeout(() => {
                setCopied(false);
              }, 2000);
            }}
          >
            {copied ? "Copied" : "Copy Code"}
          </Button>
        </Box>
      </Box>
      <CodeViewer
        backgroundColor="transparent"
        readOnly={readOnly}
        value={value}
        defaultValue={defaultValue}
        height="auto"
        onChange={(value) => {
          setValue?.(value);
        }}
        language={language}
        onMount={realOnMount}
      />
    </Box>
  );
}
