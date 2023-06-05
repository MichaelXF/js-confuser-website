import {
  Button,
  Checkbox,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { useContext } from "react";
import { OptionContext } from "../App";
import { presets } from "js-confuser";

export default function ModalPresets({ isOpen, onClose, onCustomPreset }) {
  var { options, setOptions } = useContext(OptionContext);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />

      <ModalContent>
        <ModalHeader>Obfuscator Options</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <Text color="gray.400" mb={4}>
            JS-Confuser comes with three presets built into the obfuscator. The
            easiest way to configure JS-Confuser is by using presets.
          </Text>

          {[
            ["Low", 30],
            ["Medium", 52],
            ["High", 98],
          ].map(([displayName, performanceReduction], i) => {
            const presetName = displayName.toLowerCase();

            /**
             * @param {Event} e
             */
            function onClick(e) {
              e.preventDefault();
              e.stopPropagation();

              setOptions((currentOptions) => {
                return {
                  target: currentOptions.target,
                  preset: presetName,
                };
              });
            }

            return (
              <Button
                key={i}
                width="100%"
                flexDirection="column"
                alignItems="left"
                textAlign="left"
                minHeight="80px"
                mb={4}
                onClick={onClick}
              >
                <Checkbox
                  mb={4}
                  isChecked={options.preset === presetName}
                  onClick={onClick}
                >
                  <Text fontWeight="bold">{displayName}</Text>
                </Checkbox>

                <Text
                  fontWeight="normal"
                  wordBreak="break-word"
                  fontSize="sm"
                  maxWidth="100%"
                  whiteSpace="pre-wrap"
                  color="gray.400"
                >
                  {performanceReduction}% performance reduction
                </Text>
              </Button>
            );
          })}

          <Flex align="center" width="100%">
            <Text color="gray.400">Target:</Text>
            <Flex ml="auto" align="center">
              <Checkbox
                isChecked={options.target === "node"}
                onChange={(e) => {
                  if (e.target.checked) {
                    setOptions((currentOptions) => {
                      return { ...currentOptions, target: "node" };
                    });
                  }
                }}
              >
                Node
              </Checkbox>
              <Checkbox
                ml={4}
                isChecked={options.target === "browser"}
                onChange={(e) => {
                  if (e.target.checked) {
                    setOptions((currentOptions) => {
                      return { ...currentOptions, target: "browser" };
                    });
                  }
                }}
              >
                Browser
              </Checkbox>
            </Flex>
          </Flex>

          <Text mt={6} mb={2} color="gray.400">
            Or you can make your own preset{" "}
            <Button variant="link" colorScheme="blue" onClick={onCustomPreset}>
              here
            </Button>
            . (Advanced users only!)
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
