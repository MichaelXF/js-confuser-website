import Editor from "@monaco-editor/react";
import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { rgbToHex } from "../utils/color-utils";
import { Add, Close } from "@mui/icons-material";
import { forwardRef, useEffect, useRef } from "react";
import { defaultCode } from "../constants";
import EditorComponentTab from "./EditorComponentTab";
const jsConfuserTypes = `
  declare const JSConfuser: {
    obfuscate(source: string, options?: object): Promise<string>;
    obfuscateAST(ast: object, options?: object): object;
    presets: {
      [key: string]: object;
    };
  };
`;

export const EditorComponent = forwardRef(
  ({ tabs, activeTab, changeTab, newTab, closeTab }, ref) => {
    const theme = useTheme();

    // Access the body background color
    const bodyBackgroundColor = theme.palette.background.default;

    const handleEditorDidMount = (editor, monaco) => {
      ref.current = { editor, monaco };
      window.editor = editor;
      window.monaco = monaco;

      // Define the custom theme here
      monaco.editor.defineTheme("myCustomTheme", {
        base: "vs-dark", // Can be "vs", "vs-dark", or "hc-black"
        inherit: true, // Inherit from the base theme
        rules: [],
        colors: {
          "editor.background": rgbToHex(bodyBackgroundColor), // Custom background color
        },
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        allowSyntheticDefaultImports: true,
        strict: true,
        esModuleInterop: true,
      });

      // Register your JSConfuser types with Monaco
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        jsConfuserTypes,
        "file:///model/jsconfuser.d.ts" // Use a unique URI that matches how you'd refer to this file in your code
      );

      monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

      // Apply the custom theme
      monaco.editor.setTheme("myCustomTheme");

      // Ensure the editor uses Fira Code font
      editor.updateOptions({
        fontFamily: "Fira Code, monospace",
        fontSize: 14,
        minimap: { enabled: false },
      });

      newTab(defaultCode, "Untitled.js");
    };

    return (
      <Box height="calc(100vh - 40px)" width="100%">
        <Box
          sx={{
            height: "30px",
          }}
          borderBottom="1px solid"
          borderColor="divider"
          display="flex"
          width="100%"
          alignItems="center"
        >
          <Box
            sx={{
              height: "30px",
              overflowX: "auto",
              maxWidth: "calc(100vw - 300px)",
              scrollbarWidth: "thin",
            }}
            whiteSpace="nowrap"
            display="inline-block"
          >
            {tabs.map((tab, index) => {
              var selected = activeTab === tab;
              return (
                <EditorComponentTab
                  key={index}
                  isActive={selected}
                  tab={tab}
                  changeTab={changeTab}
                  closeTab={closeTab}
                />
              );
            })}
          </Box>

          <IconButton
            size="small"
            color="inherit"
            sx={{ ml: 2 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              newTab();
            }}
          >
            <Add sx={{ fontSize: "14px" }} />
          </IconButton>
        </Box>

        <Editor
          height="calc(100vh - 70px)"
          defaultLanguage="typescript"
          defaultValue=""
          theme="myCustomTheme"
          options={{
            wordWrap: "on", // Enable word wrap
            minimap: { enabled: false }, // Disable minimap (optional)
          }}
          onMount={handleEditorDidMount} // Use the onMount callback
        />
      </Box>
    );
  }
);
