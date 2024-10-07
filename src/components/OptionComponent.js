import { ArrowDropDown, Info } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Link as MaterialLink,
} from "@mui/material";
import {
  camelCaseToTitleCase,
  formatPercentage,
  textEllipsis,
  toTitleCase,
} from "../utils/format-utils";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Markdown from "./Markdown";

export default function OptionComponent({ option, value, setValue }) {
  let titleCase = camelCaseToTitleCase(option.name);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const [showPercentEditor, setShowPercentEditor] = useState(
    typeof value === "number" && value !== 0 && value !== 1
  );

  let info = (
    <Tooltip
      title={
        <Markdown
          value={option.description}
          sx={{
            fontSize: "1rem",
            lineHeight: "1.6",
          }}
        />
      }
      componentsProps={{
        tooltip: {
          sx: {
            maxWidth: 450, // Increase max width
          },
        },
      }}
    >
      <Button
        sx={{
          width: "34px",
          height: "34px",
          p: 0,
          minWidth: 0,
          typography: "body1",
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        component={Link}
        to={"/docs/options/" + option.name}
        target="_blank"
      >
        <Info sx={{ fontSize: "inherit" }} />
      </Button>
    </Tooltip>
  );

  let percentButton = (
    <Tooltip title="Use percentage instead">
      <Button
        sx={{
          width: "34px",
          height: "34px",
          p: 0,
          minWidth: 0,
        }}
        onClick={() => {
          setShowPercentEditor(true);
          if (option.allowMixingModes) {
            normalizeValues(true);
          }
        }}
      >
        %
      </Button>
    </Tooltip>
  );

  function objectToTitleCase(obj) {
    return Object.keys(obj)
      .map(
        (key) =>
          `${toTitleCase(key)}: ${toTitleCase(
            typeof obj[key] === "number" ? formatPercentage(obj[key]) : obj[key]
          )}`
      )
      .join(", ");
  }

  function normalizeValues(forDisplayPurposes) {
    let newValue = value;

    // "randomized" -> {randomized: 1}
    if (typeof newValue !== "object" && newValue) {
      newValue = {
        [newValue]: 1,
      };
    }

    // {randomized: 1} -> "randomized"
    if (
      !forDisplayPurposes &&
      typeof newValue === "object" &&
      Object.keys(newValue).length === 1
    ) {
      newValue = Object.keys(newValue)[0];
    } else {
      newValue = { ...newValue };

      let sum = 0;
      for (let key in newValue) {
        sum += parseFloat(newValue[key]);
      }

      for (let key in newValue) {
        newValue[key] = newValue[key] / sum;
        if (forDisplayPurposes) {
          newValue[key] = Math.floor(newValue[key] * 100);
        }

        if (Number.isNaN(newValue[key])) {
          delete newValue[key];
        }
      }

      if (Object.keys(newValue).length === 0) {
        newValue = option.defaultValue;
      }
    }

    setValue(newValue);
  }

  if (option.modes) {
    // Use the modes array to render a dropdown menu allowing user to pick one mode
    return (
      <Box mb={2}>
        <Stack direction="row" alignItems="center" spacing={1} mb="3px">
          <Typography>{titleCase}</Typography>
          {info}
        </Stack>

        {showPercentEditor ? (
          <>
            {option.modes.map((modeName, index) => {
              return (
                <Stack key={modeName}>
                  <TextField
                    size="small"
                    label={toTitleCase(modeName)}
                    value={value[modeName] || 0}
                    onInput={(e) => {
                      var newValue = { ...value, [modeName]: e.target.value };

                      value = newValue;
                      setValue(newValue);
                    }}
                    sx={{
                      maxWidth: "150px",
                      my: 1,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">%</InputAdornment>
                      ),
                    }}
                  ></TextField>
                </Stack>
              );
            })}

            <Typography mt="2px">
              <MaterialLink
                href="#"
                sx={{ mr: 2 }}
                onClick={(e) => {
                  e.preventDefault();
                  normalizeValues();
                  setShowPercentEditor(false);
                }}
              >
                Back to Single Mode
              </MaterialLink>
              <MaterialLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  normalizeValues(true);
                }}
              >
                Normalize Values
              </MaterialLink>
            </Typography>
          </>
        ) : (
          <Stack mt={"3px"} direction="row" alignItems="center" spacing={1}>
            <Button
              sx={{
                textTransform: "none",
                bgcolor: "divider",
              }}
              endIcon={<ArrowDropDown />}
              onClick={handleClick}
            >
              {textEllipsis(
                typeof value === "object" && value
                  ? objectToTitleCase(value)
                  : value
                    ? toTitleCase(value)
                    : "False"
              )}
            </Button>
            {option.allowMixingModes && percentButton}
          </Stack>
        )}
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "basic-button",
          }}
        >
          {option.modes.map((modeName, index) => {
            return (
              <MenuItem
                key={index}
                onClick={() => {
                  setValue(modeName);
                  handleClose();
                }}
              >
                {toTitleCase(modeName)}
              </MenuItem>
            );
          })}
        </Menu>
      </Box>
    );
  }

  if (option.type === "string") {
    return (
      <Box my={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <TextField label={titleCase} size="small" />

          {info}
        </Stack>
      </Box>
    );
  }

  if (option.type === "boolean" || option.type === "probability") {
    return (
      <Box>
        <Stack alignItems="center" direction="row">
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                indeterminate={showPercentEditor}
                onChange={(e) => {
                  setValue(e.target.checked);
                  setShowPercentEditor(false);
                }}
              />
            }
            sx={{
              mr: 2,
            }}
            label={<>{titleCase}</>}
          />

          {showPercentEditor ? (
            <TextField
              variant="outlined"
              size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                sx: {
                  width: "120px",
                  fontSize: "0.875rem",
                  overflow: "hidden",
                  height: "32px",
                  mr: 1,
                },
                inputProps: {
                  style: {
                    height: "32px",
                  },
                },
              }}
              autoFocus={true}
              defaultValue={String(
                typeof value === "undefined" || value === null
                  ? 0
                  : value === true
                    ? 100
                    : value === false
                      ? 0
                      : typeof value === "number"
                        ? value * 100
                        : value
              )}
              onBlur={(e) => {
                if (e.target.value === "") {
                  setShowPercentEditor(false);
                } else {
                  setValue(parseInt(e.target.value) / 100);
                }
              }}
            />
          ) : option.type !== "boolean" ? (
            <Box mr={1}>{percentButton}</Box>
          ) : null}

          {info}
        </Stack>
      </Box>
    );
  }
}
