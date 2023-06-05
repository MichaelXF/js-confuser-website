import { Box, Button, Progress, Spinner, Text } from "@chakra-ui/react";

export default function LoadingOverlay({ loadingInfo, onCancel }) {
  var { progress, percent } = loadingInfo;

  return (
    <Box className="app-overlay">
      <Spinner />

      <Text mt={2} fontSize="sm">
        {"Obfuscating code..." + (progress ? " (" + progress + ")" : "")}
      </Text>

      <Box mt={10} textAlign="center">
        <Text mb={1} fontSize="sm" color="gray.400">
          {Math.floor(percent * 100)}%
        </Text>
        <Progress
          width="100vw"
          maxWidth="450px"
          borderRadius={6}
          value={Math.floor(percent * 100)}
          size="xs"
          style={{ "--chakra-transition-property-common": "width" }}
        />
      </Box>

      <Button
        onClick={() => {
          onCancel();
        }}
        mt={5}
        colorScheme="blue"
        size="sm"
      >
        Cancel
      </Button>
    </Box>
  );
}
