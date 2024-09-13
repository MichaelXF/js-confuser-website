import { useTheme } from "@mui/material";
import { rgbToHex } from "../utils/color-utils";
import { Editor } from "@monaco-editor/react";
import { forwardRef, useEffect, useRef } from "react";

export const CodeViewer = forwardRef(
  (
    {
      value,
      defaultValue,
      height,
      onChange,
      readOnly = true,
      maxHeight = -1,
      language = "javascript",
      onMount = () => {},
      backgroundColor,
    },
    externalRef
  ) => {
    const theme = useTheme();

    const containerRef = useRef(null); // Create a ref for the container
    const internalRef = useRef();

    // Use the external ref if provided, otherwise fall back to the internal ref
    const editorRef = externalRef || internalRef;

    // Access the body background color
    const bodyBackgroundColor =
      backgroundColor || theme.palette.background.default;

    const handleEditorDidMount = (editor, monaco) => {
      editorRef.current = editor;
      onMount(editor, monaco);

      // Define the custom theme here
      monaco.editor.defineTheme("myCustomTheme2", {
        base: "vs-dark", // Can be "vs", "vs-dark", or "hc-black"
        inherit: true, // Inherit from the base theme
        rules: [],
        colors: {
          "editor.background": rgbToHex(bodyBackgroundColor), // Custom background color
        },
      });

      monaco.editor.setTheme("myCustomTheme2"); // Set the custom theme

      // Ensure the editor uses Fira Code font
      editor.updateOptions({
        fontFamily: "Fira Code, monospace",
        fontSize: 16,
        lineNumbers: "on",
        minimap: { enabled: false },
        scrollBeyondLastLine: false, // Disable scrolling beyond the last line
        folding: false, // Disable the folding controls
        foldingHighlight: false, // Disable the folding highlight
        readOnly: readOnly, // Make the editor read-only
        links: false,
        wordWrap: "on",
        wrappingStrategy: "advanced",
        overviewRulerLanes: 0,
        scrollbar:
          height === "auto"
            ? {
                vertical: "hidden", // Disable vertical scrollbar
                horizontal: "hidden", // Disable horizontal scrollbar
                alwaysConsumeMouseWheel: false,
                handleMouseWheel: false,
              }
            : undefined,
      });

      if (height === "auto") {
        editor.onDidContentSizeChange(updateHeight);

        updateHeight();
      }
    };

    const updateHeight = () => {
      const container = containerRef.current;
      const editor = editorRef.current;

      if (!container || !editor) {
        return;
      }

      let contentHeight = editor.getContentHeight();
      if (maxHeight > 0 && contentHeight > maxHeight) {
        contentHeight = maxHeight;

        editorRef.current.updateOptions({
          scrollbar: {
            alwaysConsumeMouseWheel: false,
            handleMouseWheel: true,
          },
        });
      } else {
        editorRef.current.updateOptions({
          scrollbar: {
            alwaysConsumeMouseWheel: false,
            handleMouseWheel: false,
          },
        });
      }

      let width = container.offsetWidth;
      container.style.width = `${width}px`;
      container.style.height = `${contentHeight}px`;
      editor.layout({ width, height: contentHeight });
    };

    const estimatedInitialHeight =
      (value || defaultValue || "").split("\n").length * 24 + "px";

    return (
      <div ref={containerRef} style={{ width: "100%", height: height }}>
        <Editor
          language={language}
          value={value}
          defaultValue={defaultValue}
          theme="vs-dark"
          onMount={handleEditorDidMount} // Use the onMount callback
          onChange={onChange}
          options={{}}
          height={height === "auto" ? estimatedInitialHeight : height}
        />
      </div>
    );
  }
);
