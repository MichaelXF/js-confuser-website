import { Box, useTheme } from "@mui/material";
import EditorPanelDefault from "./EditorPanelDefault";
import EditorPanelDownload from "./EditorPanelDownload";

export const EDITOR_PANEL_WIDTH = "270px";

export default function EditorPanel({
  convertCode,
  options,
  setOptions,
  openOptionsDialog,
  evaluateCode,
  editorComponent,
}) {
  const theme = useTheme();

  const { activeTab } = editorComponent;

  const panelMode = activeTab?.profileData ? "download" : "default";

  return (
    <Box
      maxWidth={EDITOR_PANEL_WIDTH}
      width="100%"
      flexShrink={0}
      height="calc(100vh - 40px)"
      borderRight={`1px solid ${theme.palette.divider}`}
      sx={{
        overflowY: "auto",
        scrollbarWidth: "thin",
      }}
      p={2}
    >
      {panelMode === "default" ? (
        <EditorPanelDefault
          convertCode={convertCode}
          options={options}
          setOptions={setOptions}
          openOptionsDialog={openOptionsDialog}
          editorComponent={editorComponent}
        />
      ) : panelMode === "download" ? (
        <EditorPanelDownload
          evaluateCode={evaluateCode}
          editorComponent={editorComponent}
        />
      ) : null}
    </Box>
  );
}
