import { useState, useId } from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Checkbox,
  Input,
  Box,
  Collapse,
  Flex,
  Text,
  InputGroup,
  InputRightElement,
  Tag,
  TagLabel,
  TagCloseButton,
} from "@chakra-ui/react";
import { QuestionIcon, ChevronDownIcon } from "@chakra-ui/icons";

import "./Option.scss";
import { isValidRegex, toTitleCase } from "../util";
import { presets } from "js-confuser";

export default function Option({
  name,
  displayName,
  type = "probability",
  modes,
  initialValue = false,
  onChange,
  description,
  allowMixingModes = false,
  parentField = null,
}) {
  const percentInputId = useId();

  // Display a nice tooltip explaining this feature and which presets have this feature enabled
  var displayDescription = description;

  if (name !== "target") {
    displayDescription +=
      "\n\nEnabled in:\n" +
      ["high", "medium", "low"]
        .map((presetName) => {
          var value = parentField
            ? typeof presets[presetName][parentField] === "object" &&
              presets[presetName][parentField][name]
            : presets[presetName][name];

          var enabledText = value ? "Yes" : "No";

          var output = `${toTitleCase(presetName)} Preset: ` + enabledText;

          if (typeof value === "number" && value > 0) {
            output += ` (${Math.floor(presets[presetName][name] * 100)}%)`;
          }

          return output;
        })
        .join("\n");
  }

  if (modes && Array.isArray(modes)) {
    displayDescription +=
      "\n\nAvailable modes: " +
      modes
        .map((item) =>
          !isNaN(item) || item === "true" || item === "false" // Wrap item in quotes if is a string-like
            ? item
            : `"${item}"`
        )
        .join(", ");
  }

  // The question icon also is a link to the documentation
  displayDescription += "\n\n(Link) Click to see official documentation";

  var titleComponent = (
    <Flex align="center">
      <Text>{displayName}</Text>

      <Box ml={2} title={displayDescription} transform="translateY(-1px)">
        <a
          href={"https://github.com/MichaelXF/js-confuser/#" + name}
          target="_blank"
          rel="noreferrer"
        >
          <QuestionIcon
            color="gray.500"
            fontSize="sm"
            transition="color 0.3s ease"
            _hover={{ color: "blue.400" }}
          />
        </a>
      </Box>
    </Flex>
  );

  var [value, setValue] = useState(initialValue);
  var [percentEditor, setPercentEditor] = useState(
    typeof initialValue === "number"
  );

  var [adding, setAdding] = useState(
    type === "regex[]" ? "/^domain.com$/g" : ""
  );

  function updateValue(newValue) {
    // Calls to this function should never be 'undefined'
    if (newValue === undefined) {
      throw new Error("undefined from " + type + " '" + name + "'");
    }

    // Only update if different
    if (newValue !== value) {
      setValue(newValue);
      onChange(newValue);
    }
  }

  if (type === "probability") {
    if (!modes) {
      // The percent editor allows the option to be 0%-100%
      if (percentEditor) {
        return (
          <Box>
            <Flex align="center">
              <Checkbox
                onChange={() => {
                  updateValue(false);
                  setPercentEditor(false);
                }}
                isIndeterminate={true}
              >
                {titleComponent}
              </Checkbox>
              <InputGroup ml={4} size="sm" maxWidth="100px">
                <Input
                  step={2}
                  min={0}
                  max={100}
                  defaultValue={value * 100}
                  onChange={(e) => {
                    updateValue(parseFloat(e.target.value) / 100);
                  }}
                  id={percentInputId}
                />
                <InputRightElement>%</InputRightElement>
              </InputGroup>
            </Flex>
          </Box>
        );
      }

      // On checkbox mode its true/false (100% or 0%)
      return (
        <Box>
          <Flex align="center">
            <Checkbox
              onChange={(e) => updateValue(e.target.checked)}
              isChecked={value}
            >
              {" "}
              {titleComponent}
            </Checkbox>
            <Button
              onClick={() => {
                updateValue(1);
                setPercentEditor(true);

                // Auto-focus the percentage input box
                requestAnimationFrame(() => {
                  document.getElementById(percentInputId)?.focus?.();
                });
              }}
              ml={3}
              size="sm"
              variant="ghost"
              fontWeight="normal"
              title="Use percentage instead"
            >
              %
            </Button>
          </Flex>
        </Box>
      );
    }

    // Some features allow mixing modes (identifierGenerator, shuffle)
    // Each mode has it's own input box to allow user to set individual percentages
    if (percentEditor) {
      return (
        <Box className="option">
          <Box>{titleComponent}</Box>

          <Box mt={2} mb={4}>
            {modes.map((mode, i) => {
              return (
                <Flex key={i} mb={2}>
                  <InputGroup mr={4} size="sm" maxWidth="80px">
                    <Input
                      step={2}
                      min={0}
                      max={100}
                      value={String(value[mode] || 0)}
                      onInput={(e) => {
                        updateValue({
                          ...value,
                          [mode]: e.target.value,
                        });
                      }}
                    />
                    <InputRightElement>%</InputRightElement>
                  </InputGroup>
                  <Text>{toTitleCase(mode)}</Text>
                </Flex>
              );
            })}

            <Button
              variant="link"
              colorScheme="blue"
              onClick={() => {
                setPercentEditor(false);
              }}
            >
              Back to single mode
            </Button>

            <Button
              variant="link"
              colorScheme="blue"
              ml={4}
              onClick={() => {
                var total = 0;
                Object.keys(value).forEach((key) => {
                  total += parseFloat(value[key]);
                });

                var newValue = Object.create(null);
                Object.keys(value).forEach((key) => {
                  newValue[key] = Math.floor(
                    (parseFloat(value[key]) / total) * 100
                  );
                });

                updateValue(newValue);
              }}
            >
              Normalize values
            </Button>
          </Box>
        </Box>
      );
    }

    // Ensure percentages display as 0%-100%
    var multiplier = 100;
    if (value && typeof value === "object") {
      var total = Object.keys(value).reduce((a, b) => value[b] + a, 0);
      if (total > 1) {
        multiplier = 1;
      }
    }

    // Display a dropdown allowing user to pick a single mode
    return (
      <Box className="option">
        <Box>{titleComponent}</Box>

        <Flex mt={2} mb={6} align="center">
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              {toTitleCase(
                value && typeof value === "object"
                  ? Object.keys(value)
                      .filter((key) => parseFloat(value[key]))
                      .map(
                        (x) =>
                          toTitleCase(x) +
                          ": " +
                          Math.floor(value[x] * multiplier) +
                          "%"
                      )
                      .join(", ")
                  : value + ""
              ) || "Choose one"}
            </MenuButton>
            <MenuList>
              {modes.map((x, i) => {
                return (
                  <MenuItem
                    onClick={() => {
                      updateValue(x);
                    }}
                    key={i}
                  >
                    {toTitleCase(x)}
                  </MenuItem>
                );
              })}
            </MenuList>
          </Menu>

          {allowMixingModes ? (
            <Button
              onClick={() => {
                // Which mixing modes is enabled, the option value is adjusted to use percentages from 0%-100%
                setPercentEditor(true);
                if (!value || typeof value !== "object") {
                  var newMap = Object.create(null);

                  // The 'modes' are all strings
                  var hasFalse = modes.includes("false");

                  // If no value, make all modes equal percentage
                  modes.forEach((mode, i) => {
                    if (hasFalse) {
                      newMap[mode] = mode === "false" ? 100 : 0;
                    } else {
                      newMap[mode] = i == 0 ? 100 : 0;
                    }
                  });

                  // If a value is already selected, set that mode to 100% where the rest are 0%
                  if (typeof value === "string") {
                    modes.forEach((mode) => (newMap[mode] = 0));
                    newMap[value] = 100;
                  }

                  updateValue(newMap);
                } else {
                  // Make sure values are 0%-100%
                  var total = Object.keys(value).reduce(
                    (a, b) => value[b] + a,
                    0
                  );
                  if (total <= 1) {
                    Object.keys(value).forEach(
                      (key) => (value[key] = Math.floor(value[key] * 100))
                    );
                  }
                }
              }}
              ml={3}
              size="sm"
              variant="ghost"
              fontWeight="normal"
              title="Use percentage instead"
            >
              %
            </Button>
          ) : null}
        </Flex>
      </Box>
    );
  }

  // Some options are dates (lock.startDate, lock.endDate)
  // This input validates the date as either a parsable string or timestamp number
  if (type === "date") {
    return (
      <Box className="option">
        <Box>{titleComponent}</Box>

        <Input
          mt={2}
          mb={6}
          value={adding}
          onInput={(e) => setAdding(e.target.value)}
          onBlur={(e) => {
            if (e.target.value) {
              var asInt = parseInt(e.target.value);
              if (typeof asInt === "number" && !Number.isNaN(asInt)) {
                updateValue(asInt);
              } else {
                var asDate = new Date(e.target.value);
                if (isFinite(asDate)) {
                  updateValue(asDate);
                } else {
                  setAdding("[Invalid Date]");
                  updateValue(false);
                }
              }
            } else {
              updateValue(false);
            }
          }}
        ></Input>
      </Box>
    );
  }

  // Simple checkbox for boolean options
  if (type === "boolean") {
    return (
      <Box>
        <Checkbox
          onChange={(e) => updateValue(e.target.checked)}
          defaultChecked={initialValue}
        >
          {titleComponent}
        </Checkbox>
      </Box>
    );
  }

  // Simple input box for number options (not used)
  if (type === "number") {
    return (
      <Box className="option">
        {titleComponent}
        <Input mt={2} onChange={updateValue} />
      </Box>
    );
  }

  // This is for the domainLock feature
  if (type === "regex[]") {
    // Ensure the regex is valid
    var isRegexValid = typeof adding === "string" && isValidRegex(adding);

    return (
      <Box className="option">
        {titleComponent}

        <Box mt={2} mb={6}>
          <Flex align="center">
            <Input
              placeholder="/^domain.com$/g"
              defaultValue={adding}
              onInput={(e) => setAdding(e.target.value)}
            ></Input>
            <Button
              appearance="primary"
              flexShrink={0}
              ml={2}
              onClick={() => {
                if (!value) {
                  value = [];
                }
                value.push(adding);
                updateValue([...value]);
              }}
              isDisabled={!isRegexValid}
            >
              {isRegexValid ? "Add Regex" : "Invalid Regex"}
            </Button>
          </Flex>

          <Box mt={2}>
            <Flex>
              {(value || []).map((regexString, i) => {
                return (
                  <Tag key={i} mr={2}>
                    <TagLabel>{regexString}</TagLabel>
                    <TagCloseButton
                      onClick={() => {
                        // Delete from array
                        value.splice(i, 1);

                        if (value.length) {
                          updateValue([...value]);
                        } else {
                          // If no regex's are added, set option as 'false'
                          updateValue(false);
                        }
                      }}
                    />
                  </Tag>
                );
              })}
            </Flex>
          </Box>
        </Box>
      </Box>
    );
  }

  // Input box where any value is accepted
  // This is for the lock.countermeasures option
  if (type === "string") {
    return (
      <Box className="option">
        {titleComponent}

        <Input
          mt={2}
          mb={6}
          placeholder="onLockTriggered"
          defaultValue={initialValue || ""}
          onInput={(e) => {
            var newValue = e.target.value;

            if (newValue.length === 0) {
              updateValue(false);
            } else {
              updateValue(newValue);
            }
          }}
        ></Input>
      </Box>
    );
  }

  // Dropdown where multiple items can be selected at a time
  // This is for the lock.osLock and lock.browserLock feature
  if (type === "array") {
    // Make sure value is array
    var valueAsArray = Array.isArray(value) ? value : [];

    return (
      <Box className="option">
        {titleComponent}

        <Box mt={2} mb={6}>
          <Menu closeOnSelect={false}>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              {valueAsArray.length} value
              {valueAsArray.length !== 1 ? "s" : ""} selected
            </MenuButton>
            <MenuList>
              {modes.map((modeName) => {
                var enabled = valueAsArray.includes(modeName);

                /**
                 * @param {Event} e
                 */
                function onClick(e) {
                  e.preventDefault();
                  e.stopPropagation();

                  if (enabled) {
                    // Remove from the list

                    var newValue = valueAsArray.filter(
                      (element) => element !== modeName
                    );

                    if (newValue.length) {
                      updateValue(newValue);
                    } else {
                      // If no values are selected, set option as 'false'
                      updateValue(false);
                    }
                  } else {
                    // Add to the list
                    updateValue([...valueAsArray, modeName]);
                  }
                }

                return (
                  <MenuItem onClick={onClick} key={modeName}>
                    <Checkbox isChecked={enabled} onClick={onClick}>
                      {toTitleCase(modeName)}
                    </Checkbox>
                  </MenuItem>
                );
              })}
            </MenuList>
          </Menu>
        </Box>
      </Box>
    );
  }

  return null;
}
