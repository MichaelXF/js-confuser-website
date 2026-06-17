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
import presets from "js-confuser/dist/presets";
import { getOptionSchemasWithDefaultValues } from "../../utils/option-utils";

export default function OptionsDialog({ open, onClose, options, setOptions }) {
  var [proposedOptions, setProposedOptions] = useState(null);

  // Avoid using useEffect() to avoid delayed state rendering
  // First render would have stale data, initializing OptionComponents to behave incorrectly
  const openRef = useRef(false);

  // I tried everything to avoid this, but it seems like the only way
  if (open && !openRef.current) {
    let value = { ...options };
    if (typeof value.preset === "string") {
      // Merge preset options
      value = { ...presets[value.preset], ...value };
    }

    const defaultOptionSchemas = getOptionSchemasWithDefaultValues();

    for (const optionSchema of defaultOptionSchemas) {
      if (typeof value[optionSchema.name] === "undefined") {
        value[optionSchema.name] = optionSchema.defaultValue;
      }
    }

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
    delete value.preset; // This is now a 'custom' preset
    delete value.error; // Delete any error messages
    setOptions(value);
    setProposedOptions(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>Options</DialogTitle>

      <DialogContent>
        {Object.keys(groups).map((groupName, index) => {
          // A group represents an array of option entries
          var group = groups[groupName];

          return (
            <Box key={index} mb={4}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {groupName}
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Stack spacing={0}>
                {group.map((option, index) => {
                  let opts = proposedOptions;
                  let value = opts?.[option.name];

                  if (option.parentField) {
                    value = opts?.[option.parentField]?.[option.name];
                  }

                  var setValue = (newValue) => {
                    // Strategically update options JSON
                    setProposedOptions((currentOptions) => {
                      var newOptions = { ...currentOptions };

                      // If parentField is defined, it means this option is a child (Only 'lock')
                      if (option.parentField) {
                        // Ensure nested object is created
                        newOptions[option.parentField] = {
                          ...(newOptions[option.parentField] || {}),
                        };
                        newOptions[option.parentField][option.name] = newValue;

                        // False values are removed
                        if (newValue === false) {
                          delete newOptions[option.parentField][option.name];
                        }

                        if (
                          Object.keys(newOptions[option.parentField]).length ===
                          0
                        ) {
                          delete newOptions[option.parentField];
                        }
                      } else {
                        newOptions[option.name] = newValue;

                        // False values are removed
                        if (newValue === false) {
                          delete newOptions[option.name];
                        }
                      }

                      return newOptions;
                    });
                  };

                  return (
                    <Box key={index}>
                      <OptionComponent
                        option={option}
                        valueObject={value}
                        setValueObject={setValue}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Box>
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
