import { useContext, useState, useEffect } from "react";
import {
  Box,
  Button,
  Divider,
  Modal,
  Heading,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalCloseButton,
} from "@chakra-ui/react";
import { OptionContext } from "../App.js";
import { groups } from "../groups";
import Option from "../components/Option.js";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { toTitleCase } from "../util.js";

export default function ModalOptions({ isOpen, onClose, onBack }) {
  var { options, setOptions } = useContext(OptionContext);
  var [oldOptions, setOldOptions] = useState();

  useEffect(() => {
    if (isOpen) {
      setOldOptions({ ...options });
    }
  }, [!!isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />

      <ModalContent>
        <ModalHeader>Options</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box textAlign="center" mb={4}>
            <Button
              onClick={onBack}
              variant="link"
              colorScheme="blue"
              leftIcon={<ArrowBackIcon />}
              size="sm"
            >
              Use preset instead
            </Button>
          </Box>

          {Object.keys(groups).map((name, i) => {
            return (
              <Box key={i} mb={14}>
                <Heading fontSize="xl" mb={2}>
                  {name}
                </Heading>

                <Divider />

                <Box mt={2}>
                  {groups[name].map((option, i) => {
                    let displayName =
                      option.displayName || toTitleCase(option.name + "");

                    let currentValue = option.parentField
                      ? options[option.parentField] &&
                        options[option.parentField][option.name]
                      : options[option.name];

                    return (
                      <Box className="option-container" key={i} mb={2}>
                        <Option
                          {...option}
                          displayName={displayName}
                          initialValue={currentValue}
                          onChange={(value) => {
                            if (option.parentField) {
                              // ensure options.lock exists
                              if (
                                !options[option.parentField] ||
                                typeof options[option.parentField] !== "object"
                              ) {
                                options[option.parentField] = {};
                              }
                              options[option.parentField][option.name] = value;

                              // delete options.lock.startDate if false
                              if (value === false) {
                                delete options[option.parentField][option.name];
                              }

                              // delete options.lock if empty
                              if (
                                Object.keys(options[option.parentField])
                                  .length === 0
                              ) {
                                delete options[option.parentField];
                              }
                            } else {
                              options[option.name] = value;

                              // delete if false
                              if (
                                value === false &&
                                option.name !== "compact"
                              ) {
                                delete options[option.name];
                              }
                            }
                            setOptions({
                              ...options,
                              preset: null,
                            });
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </ModalBody>

        <ModalFooter>
          <Button
            onClick={() => {
              onClose();
              setOptions(oldOptions);
            }}
            variant="ghost"
          >
            Cancel
          </Button>
          <Button colorScheme="blue" ml={3} onClick={onClose}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
