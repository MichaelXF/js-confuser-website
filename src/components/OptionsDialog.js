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
import { groups } from "../groups";
import OptionComponent from "./OptionComponent";
import { useEffect, useState } from "react";
import presets from "js-confuser/dist/presets";

export default function OptionsDialog({ open, onClose, options, setOptions }) {
  var [proposedOptions, setProposedOptions] = useState({});

  useEffect(() => {
    if (open) {
      var value = { ...options };
      if (value.preset) {
        value = { ...presets[value.preset], ...value };
      }
      setProposedOptions(value);
    }
  }, [!!open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>Options</DialogTitle>

      <DialogContent>
        {Object.keys(groups).map((groupName, index) => {
          var group = groups[groupName];

          return (
            <Box key={index} mb={4}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {groupName}
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Stack spacing={0}>
                {group.map((option, index) => {
                  var value = proposedOptions?.[option.name];
                  if (option.parentField) {
                    value =
                      proposedOptions?.[option.parentField]?.[option.name];
                  }

                  var setValue = (newValue) => {
                    setProposedOptions((currentOptions) => {
                      var newOptions = { ...currentOptions };

                      if (option.parentField) {
                        newOptions[option.parentField] = {
                          ...(newOptions[option.parentField] || {}),
                        };
                        newOptions[option.parentField][option.name] = newValue;

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
                        value={value}
                        setValue={setValue}
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
        <Button
          onClick={() => {
            var value = { ...proposedOptions };
            delete value.preset;
            setOptions(value);
            onClose();
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
