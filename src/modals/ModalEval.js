import { ArrowRightIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { forwardRef } from "react";

const ModalEval = forwardRef(
  ({ isOpen, onClose, isLoading, isRunning, onEvaluateAgain }, ref) => {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />

        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>Evaluate</ModalHeader>
          <ModalBody>
            {isLoading ? (
              <Flex
                width="100%"
                minHeight="90px"
                align="center"
                justify="center"
              >
                <Spinner />
              </Flex>
            ) : (
              <>
                <Text color="gray.400">
                  {isRunning
                    ? "The program is currently running:"
                    : "The program has finished executing:"}
                </Text>

                <Box mt={2} bg="gray.800" fontSize="sm" p={4} borderRadius={8}>
                  <pre
                    style={{ wordWrap: "break-word", whiteSpace: "normal" }}
                    ref={ref}
                  ></pre>
                </Box>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="link"
              colorScheme="blue"
              leftIcon={<ArrowRightIcon fontSize="sm" />}
              size="sm"
              onClick={onEvaluateAgain}
              isDisabled={isRunning}
            >
              {isRunning ? "Running" : "Run Again"}
            </Button>
            <Button ml={4} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
);

export default ModalEval;
