import Editor from "@monaco-editor/react";
import { Box, CircularProgress, IconButton, useTheme } from "@mui/material";
import { rgbToHex } from "../../utils/color-utils";
import { Add } from "@mui/icons-material";
import { forwardRef } from "react";
import EditorComponentTab from "./EditorComponentTab";
import { EDITOR_PANEL_WIDTH } from "./EditorPanel";
import { getJSConfuserTypes } from "../../utils/docLib-utils";

export const EditorComponent = forwardRef(({ editorComponent }, ref) => {
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
      target: monaco.languages.typescript.ScriptTarget.ES6,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: true,
    });

    // Register your JSConfuser types with Monaco
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      getJSConfuserTypes(),
      "file:///node_modules/@types/obfuscateOptions/index.d.ts"
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

    editorComponent.onMount();
    // editorComponent.newTab(
    //   <EditorWelcome />,
    //   "Changelog.md",
    //   () => {},
    //   "internal_markdown"
    // );
  };

  const editorTopMargin = 70;
  const customElement = editorComponent.activeTab?.customElement;

  return (
    <Box height="100%" width="100%">
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
            maxWidth: `calc(100vw - ${EDITOR_PANEL_WIDTH} - 50px)`,
            scrollbarWidth: "thin",
          }}
          whiteSpace="nowrap"
          display="inline-block"
        >
          {editorComponent.tabs.map((tab, index) => {
            var selected = editorComponent.activeTab === tab;
            return (
              <EditorComponentTab
                key={index}
                tab={tab}
                isActive={selected}
                editorComponent={editorComponent}
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

            editorComponent.newTab();
          }}
        >
          <Add sx={{ fontSize: "14px" }} />
        </IconButton>
      </Box>

      {customElement ? (
        <Box
          sx={{
            maxHeight: `calc(100vh - ${editorTopMargin}px)`,
            overflowY: "auto",
          }}
        >
          {customElement}
        </Box>
      ) : null}

      <Editor
        height={`100%`}
        defaultLanguage="typescript"
        defaultValue=""
        theme="myCustomTheme"
        options={{
          wordWrap: "on", // Enable word wrap
          minimap: { enabled: false }, // Disable minimap (optional)
        }}
        wrapperProps={{
          className: customElement ? "hidden" : "",
        }}
        onMount={handleEditorDidMount} // Use the onMount callback
        loading={<CircularProgress />}
      />
    </Box>
  );
});
