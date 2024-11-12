import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  MenuButton,
  IconButton,
  MenuList,
  MenuItem,
  Menu,
} from "@chakra-ui/react";
import { OptionContext } from "../App";
import { useContext, useEffect, useState } from "react";
import JSON5 from "json5";
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/theme/oceanic-next.css";
import { toTitleCase } from "../util";
import { HamburgerIcon } from "@chakra-ui/icons";
import { presets } from "js-confuser";

function formatJSON(object) {
  return JSON5.stringify(object, null, 2);
}

export default function ModalConfig({ isOpen, onClose }) {
  var { options, setOptions } = useContext(OptionContext);
  var [value, setValue] = useState("");
  var [isValidJSON, setIsValidJSON] = useState(true);
  var [changesMade, setChangesMade] = useState(false);
  var [originalOptions, setOriginalOptions] = useState({});

  useEffect(() => {
    if (isOpen) {
      var orderedKeys = Object.keys(options).sort();
      var display = Object.create(null);

      orderedKeys.forEach((key) => {
        if (key === "compact" || options[key]) {
          display[key] = options[key];
        }
      });
      delete display.globalVariables;

      // Delete lock if empty
      if (
        typeof display.lock === "object" &&
        display.lock &&
        Object.keys(display.lock).filter((x) => !!display.lock[x]).length === 0
      ) {
        delete display.lock;
      }

      var newValue = formatJSON(display);
      setValue(newValue + " ");

      // This timeout is done to ensure the CodeMirror is properly aligned with the modal body
      setTimeout(() => {
        setValue(newValue);
      }, 100);

      setOriginalOptions(display);
      setIsValidJSON(true);
      setChangesMade(false);
    }
  }, [!!isOpen]);

  function onChange(value) {
    var newValue = value;

    setValue(newValue);
    setChangesMade(true);

    var success = true;
    try {
      var parsed = JSON5.parse(newValue);

      setChangesMade(
        JSON.stringify(parsed) !== JSON.stringify(originalOptions)
      );
    } catch (e) {
      success = false;
    }

    setIsValidJSON(success);
  }

  function saveChanges() {
    try {
      setOptions(JSON5.parse(value));
    } catch (e) {}

    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />

      <ModalContent>
        <ModalHeader>Config</ModalHeader>
        <ModalCloseButton />

        <ModalBody position="relative">
          <Menu placement="bottom">
            <MenuButton
              as={IconButton}
              variant="ghost"
              icon={<HamburgerIcon />}
              position="absolute"
              right="0.75rem"
              top="0.75rem"
              zIndex="10"
              size="sm"
              fontSize="xl"
              color="chakra-body-text"
            ></MenuButton>
            <MenuList zIndex="10">
              <MenuItem
                onClick={() => {
                  try {
                    onChange(formatJSON(JSON5.parse(value)));
                  } catch (e) {}
                }}
              >
                Format
              </MenuItem>
              {["high", "medium", "low"].map((presetName) => {
                var displayName = toTitleCase(presetName + " Preset");

                return (
                  <MenuItem
                    onClick={() => {
                      onChange(formatJSON(presets[presetName]));
                    }}
                    key={presetName}
                  >
                    Import from {displayName}
                  </MenuItem>
                );
              })}
            </MenuList>
          </Menu>

          <CodeMirror
            options={{
              lineNumbers: false,
              theme: "oceanic-next",
              mode: { name: "javascript", jsonld: true },
              json: "ld",
              tabSize: 2,
              lineWrapping: true,
              dragDrop: false,
            }}
            value={value}
            onBeforeChange={(editor, data, value) => {
              onChange(value);
            }}
            className="json-codemirror transparent-codemirror"
          />
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose} variant="ghost">
            {changesMade ? "Cancel" : "Close"}
          </Button>
          {changesMade ? (
            <Button
              colorScheme="blue"
              onClick={saveChanges}
              isDisabled={!isValidJSON}
              ml={3}
            >
              {isValidJSON ? "Save Changes" : "Invalid JSON"}
            </Button>
          ) : null}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
