import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";

export default function ModalError({ isOpen, onClose, error = "" }) {
  var [showMore, setShowMore] = useState(false);

  var hasErrorStack = typeof error?.errorStack === "string";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Error</ModalHeader>
        <ModalBody>
          <Text color="gray.400">
            An error occurred while obfuscating your code:
          </Text>

          <Box mt={2} bg="gray.800" fontSize="sm" p={4} borderRadius={8}>
            <pre style={{ wordWrap: "break-word", whiteSpace: "normal" }}>
              {showMore && hasErrorStack
                ? error?.errorStack
                : error?.errorString}
            </pre>
          </Box>

          {hasErrorStack ? (
            <Text
              variant="link"
              color="blue.400"
              onClick={() => setShowMore(!showMore)}
              mt={2}
              cursor="pointer"
              textAlign="right"
            >
              {!showMore ? (
                <>
                  Show More <ChevronDownIcon />
                </>
              ) : (
                <>
                  Show Less <ChevronUpIcon />
                </>
              )}
            </Text>
          ) : null}

          <Text mt={10} color="gray.400">
            If you believe this an error within the obfuscator, please create an
            issue on the GitHub:{" "}
            <a
              href="https://github.com/MichaelXF/js-confuser/issues"
              target="_blank"
              rel="noreferrer"
            >
              <Text as="span" display="inline-block" color="blue.400">
                https://github.com/MichaelXF/js-confuser/issues
                <ExternalLinkIcon fontSize="sm" ml={1} mb="2px" />
              </Text>
            </a>
            <br />
            <br />
            More details may be available in the DevTools Console
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
