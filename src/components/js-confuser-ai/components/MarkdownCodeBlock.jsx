import { Box, Button, Typography } from "@mui/material";
import { Highlight, themes } from "prism-react-renderer";
import { useState } from "react";

export default function MarkdownCodeBlock({ code, language, header }) {
  const [copied, setCopied] = useState(false);

  return (
    <Box
      borderRadius="6px"
      bgcolor="code_viewer_background"
      p={2}
      pt={1}
      position="relative"
    >
      <Box
        sx={{
          position: "sticky",
          top: "0px",
          display: "flex",
          alignItems: "center",
          bgcolor: "code_viewer_background",
        }}
      >
        <Typography fontSize="0.875rem" color="text.secondary_darker">
          {header ||
            {
              javascript: "JavaScript",
              typescript: "TypeScript",
              json: "JSON",
              html: "HTML",
              css: "CSS",
              shell: "Shell",
              bash: "Bash",
              markdown: "Markdown",
              text: "Text",
              plaintext: "Plain Text",
              code: "Code",
            }[language?.toLowerCase()] ||
            "Code"}
        </Typography>
        <Button
          size="small"
          color="inherit"
          sx={{
            ml: "auto",
            flexShrink: 0,
            fontWeight: "normal",
            textTransform: "none",
            fontSize: "0.875rem",
            color: copied ? "primary.main" : "text.secondary_darker",
          }}
          onClick={() => {
            if ("navigator" in window && "clipboard" in window.navigator) {
              window.navigator.clipboard.writeText(code);
            }
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 1500);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </Box>

      <Highlight theme={themes.vsDark} code={code} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <Box
            component="pre"
            fontSize="0.875rem"
            lineHeight="1.4rem"
            p={0}
            m={0}
            overflow="auto"
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </Box>
        )}
      </Highlight>
    </Box>
  );
}
