import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { groups } from "../../groups";
import OptionComponent from "../OptionComponent";
import { useRef, useState } from "react";
import presets from "js-confuser/src/presets";
import { getOptionSchemasWithDefaultValues } from "../../utils/option-utils";
import { camelCaseToTitleCase, toTitleCase } from "../../utils/format-utils";

export default function VMOptionsDialog({
  open,
  onClose,
  options,
  optionsSchema,
  setOptions,
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

  return (
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
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={saveChanges}>Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
}
