import { Box, Button, Typography } from "@mui/material";
import { CodeViewer } from "./CodeViewer";
import { useState } from "react";

export default function CodeViewerTabbed({
  value,
  defaultValue,
  setValue,
  readOnly,
  header,
  language,
}) {
  var [copied, setCopied] = useState(false);

  return (
    <Box
      border="1px solid"
      borderColor="divider"
      overflow="hidden"
      flex={"1 1 58%"}
      borderRadius={2}
      mb={4}
    >
      <Box
        height="36px"
        p={2}
        px={2}
        sx={{ bgcolor: "divider" }}
        textAlign="center"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Typography color="text.secondary">{header}</Typography>

        <Box ml="auto">
          <Button
            variant="inherit"
            sx={{
              color: copied ? "primary.main" : "text.secondary",
              fontSize: "0.875rem",
              height: "100%",
              textTransform: "none",
              minWidth: "101px",
            }}
            onClick={() => {
              setCopied(true);

              window.navigator.clipboard.writeText(value);

              setTimeout(() => {
                setCopied(false);
              }, 2000);
            }}
          >
            {copied ? "Copied" : "Copy Code"}
          </Button>
        </Box>
      </Box>
      <CodeViewer
        readOnly={readOnly}
        value={value}
        defaultValue={defaultValue}
        height="auto"
        onChange={(value) => {
          setValue?.(value);
        }}
        language={language}
      />
    </Box>
  );
}
