import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import OptionComponent from "../OptionComponent";
import { useRef, useState } from "react";
import VMDocsDialog from "./VMDocsDialog.jsx";

export default function VMOptionsDialog({
  open,
  onClose,
  options,
  optionsSchema,
  setOptions,
  obfuscate,
}) {
  var [proposedOptions, setProposedOptions] = useState(null);

  // Avoid using useEffect() to avoid delayed state rendering
  // First render would have stale data, initializing OptionComponents to behave incorrectly
  const openRef = useRef(false);

  // I tried everything to avoid this, but it seems like the only way
  if (open && !openRef.current) {
    let value = { ...options };

    proposedOptions = value;
    openRef.current = value;

    setProposedOptions(value);
  } else if (!open) {
    openRef.current = false;
  }

  // In development, React rerenders twice
  // This is a workaround to ensure the correct state is set
  if (open && proposedOptions === null) {
    proposedOptions = openRef.current;
  }

  const saveChanges = () => {
    var value = { ...proposedOptions };
    setOptions(value);
    setProposedOptions(null);
    onClose();
  };

  // Set all options to the given value
  const setAll = (toggleState) => {
    setProposedOptions((currentState) => {
      var allKeys = [
        ...Object.keys(optionsSchema),
        ...Object.keys(currentState),
      ];
      var newState = { ...currentState };

      allKeys.forEach((key) => {
        newState[key] = toggleState;
      });

      return newState;
    });
  };

  const [showDocsDialog, setShowDocsDialog] = useState(false);
  const [docsDialogOption, setDocsDialogOption] = useState(null);

  return (
    <>
      <VMDocsDialog
        open={showDocsDialog}
        onClose={() => {
          setShowDocsDialog(false);
        }}
        optionsSchema={optionsSchema}
        selectedOption={docsDialogOption}
        obfuscate={obfuscate}
      />

      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>Options</DialogTitle>

        <DialogContent>
          {Object.keys(optionsSchema).map((optionName) => {
            const schema = optionsSchema[optionName];

            return (
              <OptionComponent
                key={optionName}
                option={{
                  name: optionName,
                  type: "boolean",
                  description: schema?.description || "No description",
                  onDocsClick: () => {
                    setDocsDialogOption(optionName);
                    setShowDocsDialog(true);
                  },
                }}
                valueObject={proposedOptions?.[optionName]}
                setValueObject={(newValue) => {
                  setProposedOptions((prev) => ({
                    ...prev,
                    [optionName]: newValue,
                  }));
                }}
              />
            );
          })}

          <Box pt={2} display="flex" alignItems="center" gap={1}>
            <Button
              onClick={() => {
                setAll(true);
              }}
            >
              Enable All
            </Button>
            <Button
              onClick={() => {
                setAll(false);
              }}
            >
              Disable All
            </Button>
            <Button
              onClick={() => {
                window.navigator.clipboard.writeText(
                  JSON.stringify(proposedOptions),
                );
              }}
            >
              Copy Options
            </Button>
            <Button
              onClick={async () => {
                var text = await window.navigator.clipboard.readText();
                try {
                  var object = JSON.parse(text);
                  if (typeof object === "object" && object !== null) {
                    setProposedOptions(object);
                  }
                } catch (err) {
                  alert("Paste failed.");
                }
              }}
            >
              Paste Options
            </Button>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button onClick={saveChanges}>Save Changes</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
