import { Box, useTheme } from "@mui/material";
import EditorPanelDefault from "./EditorPanelDefault";
import EditorPanelDownload from "./EditorPanelDownload";

export const EDITOR_PANEL_WIDTH = "270px";

export default function EditorPanel({
  obfuscateCode,
  convertCode,
  options,
  setOptions,
  openOptionsDialog,
  editOptionsFile,
  activeTab,
  evaluateCode,
}) {
  const theme = useTheme();

  const panelMode = activeTab?.profileData ? "download" : "default";

  return (
    <Box
      maxWidth={EDITOR_PANEL_WIDTH}
      width="100%"
      flexShrink={0}
      height="calc(100vh - 40px)"
      borderRight={`1px solid ${theme.palette.divider}`}
      p={2}
      sx={{
        overflowY: "auto",
        scrollbarWidth: "thin",
      }}
    >
      {panelMode === "default" ? (
        <EditorPanelDefault
          obfuscateCode={obfuscateCode}
          convertCode={convertCode}
          options={options}
          setOptions={setOptions}
          openOptionsDialog={openOptionsDialog}
          editOptionsFile={editOptionsFile}
          activeTab={activeTab}
        />
      ) : panelMode === "download" ? (
        <EditorPanelDownload
          evaluateCode={evaluateCode}
          activeTab={activeTab}
        />
      ) : null}
    </Box>
  );
}
