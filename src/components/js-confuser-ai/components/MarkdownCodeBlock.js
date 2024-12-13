import { Box } from "@mui/material";
import { Highlight, themes } from "prism-react-renderer";

export default function MarkdownCodeBlock({ code, language }) {
  return (
    <Box borderRadius="6px" bgcolor="code_viewer_background" p={2}>
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
