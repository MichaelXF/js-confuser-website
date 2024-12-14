import { Box, debounce, useTheme } from "@mui/material";
import { useState } from "react";
import { rgbToHex } from "../utils/color-utils";
import Editor from "@monaco-editor/react";
import useSEO from "../hooks/useSEO";
import { LocalStorageKeys } from "../constants";
// import Markdown from "../components/Markdown";
import Markdown from "../components/js-confuser-ai/components/Markdown";

const DEFAULT_MARKDOWN_CODE = `# Markdown Live Preview

This is a live markdown editor. You can write markdown on the left and see the preview on the right.

## Features

### Text Formatting

**Bold Text**, *Italic Text*, and \`Code\` are supported.

[Links are also supported](https://www.google.com).

### Lists

- List
- Another List Item
- - Nested List Item
- - - Even More Nested List Item

### Dividers

---

### Tables

| Header | Another Header |
| --- | --- |
| First Row | N1 |
| Second Row | N2 |
| Third Row | N3 |

### Code Block

---{language: "javascript", header: "Live.js", live: true, options: true}
module.exports = {
  target: "browser",
  renameVariables: true,
  compact: false,
  minify: true
}
===END OPTIONS===
var myVar = "Hello World";
console.log(myVar);
---

### Alerts

> [!INFO]
> This is an info alert.
> You can put any markdown here.

> [!SUCCESS]
> This is a success alert.
> The user has successfully completed the task.

> [!WARNING]
> This is a warning alert.
> The user should be careful.

> [!ERROR]
> This is an error alert.
> Something went wrong.
`;

export default function PageMarkdown() {
  useSEO("Markdown Live Preview | JS-Confuser", "A live markdown editor.");

  const theme = useTheme();

  // Access the body background color
  const bodyBackgroundColor = theme.palette.background.default;
  const handleEditorDidMount = (editor, monaco) => {
    // Define the custom theme here
    monaco.editor.defineTheme("myCustomTheme", {
      base: "vs-dark", // Can be "vs", "vs-dark", or "hc-black"
      inherit: true, // Inherit from the base theme
      rules: [],
      colors: {
        "editor.background": rgbToHex(bodyBackgroundColor), // Custom background color
      },
    });

    // Apply the custom theme
    monaco.editor.setTheme("myCustomTheme");

    // Ensure the editor uses Fira Code font
    editor.updateOptions({
      fontFamily: "Fira Code, monospace",
      fontSize: 14,
      minimap: { enabled: false },
    });
  };

  var [value, setValue] = useState(
    window.localStorage.getItem(LocalStorageKeys.JSConfuser_MarkdownCode) ||
      DEFAULT_MARKDOWN_CODE
  );

  let saveCode = debounce((value) => {
    window.localStorage.setItem(
      LocalStorageKeys.JSConfuser_MarkdownCode,
      value
    );
  }, 5000);

  return (
    <Box>
      <Box display="flex" width="100%" height="100vh">
        <Box width="50%">
          <Editor
            height="100vh"
            defaultLanguage="markdown"
            value={value}
            theme="myCustomTheme"
            options={{
              wordWrap: "on", // Enable word wrap
              minimap: { enabled: false }, // Disable minimap (optional)
            }}
            onMount={handleEditorDidMount} // Use the onMount callback
            onChange={(value) => {
              setValue(value);

              saveCode(value);
            }}
          />
        </Box>

        <Box
          width="50%"
          p={2}
          maxHeight="100vh"
          sx={{
            overflowY: "auto",
          }}
        >
          <Box pb={10}>
            <Markdown value={value} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
