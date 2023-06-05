import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, Button, Divider, Flex, Heading, Text } from "@chakra-ui/react";
import { DEFAULT_BUTTON_STYLE } from "../Constants";

export default function WelcomeOverlay({ onClose }) {
  return (
    <Box
      className="app-overlay"
      display={["block", "block", "block", "flex"]}
      overflowY="auto"
    >
      <Box maxWidth="990px" p={10}>
        <Heading fontSize="4xl" color="white">
          Welcome to JS Confuser!
        </Heading>

        <Text color="gray.400" mt={6}>
          JS-Confuser is an open-source JavaScript obfuscator tool. This website
          provides an easy way to use JS-Confuser.
          <br />
          <br />
          The code obfuscated here is all done locally on your browser. You can
          check the source code for this website{" "}
          <a
            href="https://github.com/MichaelXF/js-confuser-website"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="link" colorScheme="blue">
              here
            </Button>
          </a>
          .
          <br />
          <br />
          You can check out the GitHub and NPM pages here:
          <br />
          <a
            href="https://github.com/MichaelXF/js-confuser"
            target="_blank"
            rel="noreferrer"
          >
            <Button
              variant="link"
              colorScheme="blue"
              rightIcon={<ExternalLinkIcon />}
              mt={2}
            >
              GitHub
            </Button>
          </a>
          <br />
          <a
            href="https://npmjs.com/package/js-confuser"
            target="_blank"
            rel="noreferrer"
          >
            <Button
              variant="link"
              colorScheme="blue"
              rightIcon={<ExternalLinkIcon />}
            >
              NPM
            </Button>
          </a>
        </Text>

        <Divider my={10} />

        <Box>
          <Heading fontSize="2xl" pt={4}>
            What is this?
          </Heading>

          <Text color="gray.400" mt={6}>
            JavaScript Obfuscation helps protect your code from being stolen and
            being reverse engineered. This tool transforms your original
            JavaScript source code into a new representation that's harder to
            understand, copy, re-use and modify without authorization. The
            obfuscated result will have the exact functionality of the original
            code.
          </Text>
        </Box>
      </Box>

      <Box textAlign="center" mt={10} mb={[40, 40, 40, 0]}>
        <Button {...DEFAULT_BUTTON_STYLE} onClick={onClose}>
          Close
        </Button>
      </Box>
    </Box>
  );
}
