import { Button, Checkbox, Stack, Tooltip, Typography } from "@mui/material";
import { Info, KeyboardArrowRight, Lock } from "@mui/icons-material";
import { ConfirmDialog } from "../dialogs/ConfirmDialog";
import { useRef, useState } from "react";

export default function EditorPanelDefault({
  obfuscateCode,
  convertCode,
  options,
  setOptions,
  openOptionsDialog,
  editOptionsFile,
  editorComponent,
}) {
  const onConfirmRef = useRef();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { activeTab } = editorComponent;

  var isCustomPreset = options.preset === undefined;
  var isOptionsFile = activeTab?.identity === "internal_options";
  var isTypeScript = activeTab?.getLanguageId?.() === "typescript";

  return (
    <>
      <ConfirmDialog
        open={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
        }}
        onConfirm={() => {
          setShowConfirmDialog(false);
          onConfirmRef.current();
        }}
      />

      {!isTypeScript || isOptionsFile ? (
        <Button
          sx={{ fontWeight: "bold", width: "100%", minHeight: "42px" }}
          startIcon={<Lock sx={{ transform: "scale(0.9)" }} />}
          variant="contained"
          onClick={obfuscateCode}
        >
          Obfuscate
        </Button>
      ) : (
        <Button
          sx={{
            fontWeight: "bold",
            width: "100%",
            minHeight: "42px",
            bgcolor: "divider",
            color: "primary.main",
          }}
          startIcon={<KeyboardArrowRight sx={{ transform: "scale(1.1)" }} />}
          color="inherit"
          onClick={() => {
            convertCode();
          }}
        >
          Convert to JS
        </Button>
      )}

      <Typography variant="h6" fontWeight="bold" mb={2} mt={4}>
        Target
      </Typography>
      <Stack spacing={1} direction="row">
        {["browser", "node"].map((target, index) => {
          var isChecked = options?.target === target;

          return (
            <Button
              key={index}
              onClick={() => {
                setOptions((options) => {
                  return {
                    ...options,
                    target,
                  };
                });
              }}
              sx={{
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                fontWeight: "normal",
                textTransform: "none",
                backgroundColor: isChecked ? "primary.alpha" : "transparent",
                border: "1px solid",
                p: 1,
                pr: 2,
                width: "100%",
                textAlign: "center",
                borderColor: isChecked ? "primary.main" : "divider",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                width="100%"
                color="text.primary"
              >
                <Typography fontWeight="bold" flexGrow={1} fontSize="0.875rem">
                  {
                    {
                      browser: "Browser",
                      node: "Node.js",
                    }[target]
                  }
                </Typography>
              </Stack>
            </Button>
          );
        })}
      </Stack>

      <Typography variant="h6" fontWeight="bold" mb={2} mt={4}>
        Options
      </Typography>
      <Stack spacing={2}>
        {[
          {
            name: "Low",
            performance: 20,
          },
          {
            name: "Medium",
            performance: 50,
          },
          {
            name: "High",
            performance: 98,
          },
        ].map((level, index) => {
          var presetName = level.name.toLowerCase();
          var isChecked = options?.preset === presetName;

          return (
            <Button
              key={index}
              onClick={() => {
                onConfirmRef.current = () => {
                  setOptions((options) => ({
                    target: options.target || "browser",
                    preset: presetName,
                  }));
                };

                var userKeys = new Set(Object.keys(options));
                userKeys.delete("target");
                userKeys.delete("preset");

                if (userKeys.size > 0) {
                  setShowConfirmDialog(true);
                } else {
                  onConfirmRef.current();
                }
              }}
              sx={{
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                textAlign: "left",
                fontWeight: "normal",
                textTransform: "none",
                backgroundColor: isChecked ? "primary.alpha" : "transparent",
                border: "1px solid",
                p: 1,
                pr: 2,

                borderColor: isChecked ? "primary.main" : "divider",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                width="100%"
                color="text.primary"
              >
                <Checkbox checked={isChecked} size="small" />
                <Typography fontWeight="bold" flexGrow={1} fontSize="0.875rem">
                  {level.name} Preset
                </Typography>

                <Tooltip title={`${level.performance}% performance reduction`}>
                  <Info sx={{ color: "text.secondary", fontSize: "1rem" }} />
                </Tooltip>
              </Stack>
            </Button>
          );
        })}
      </Stack>
      <Button
        sx={{
          width: "100%",
          mt: 2,
          textTransform: "none",
          bgcolor: isCustomPreset ? "primary.alpha" : "transparent",
          fontWeight: isCustomPreset ? "bold" : "normal",
        }}
        onClick={() => {
          openOptionsDialog();
        }}
        endIcon={<KeyboardArrowRight />}
      >
        {isCustomPreset ? "Edit Custom Preset" : "Create Custom Preset"}
        <span style={{ flexGrow: 1 }} />
      </Button>

      <Button
        sx={{ width: "100%", mt: 1, textTransform: "none" }}
        endIcon={<KeyboardArrowRight />}
        onClick={() => {
          editOptionsFile();
        }}
      >
        Edit JS-Confuser Options
        <span style={{ flexGrow: 1 }} />
      </Button>
    </>
  );
}
