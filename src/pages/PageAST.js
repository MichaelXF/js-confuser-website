import { Box, useTheme } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { rgbToHex } from "../utils/color-utils";
import Editor from "@monaco-editor/react";
import { parse } from "@babel/parser";
import * as t from "@babel/types";
import useSEO from "../hooks/useSEO";
import { Buffer } from "buffer";
import { astConsoleMessage, defaultCode } from "../constants";
import ConsoleDialog from "../components/ConsoleDialog";

window.Buffer = Buffer;
window.t = t;
window.updates = true;

let allowValueRefresh = true;

const { default: traverse, NodePath, Scope } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");

const prototypePatches = [
  {
    target: Scope.prototype,
    methods: ["rename"],
  },
  {
    target: NodePath.prototype,
    methods: [
      "replaceWith",
      "replaceWithMultiple",
      "replaceInline",
      "replaceWithSource",
      "replaceExpressionWithStatements",
      "remove",
      "insertBefore",
      "insertAfter",
      "unshiftContainer",
      "pushContainer",
      "popContainer",
      "shiftContainer",
    ],
  },
];

for (let patch of prototypePatches) {
  patch.originalMethods = patch.methods.map((method) => {
    return patch.target[method];
  });
}

function capturePaths(ast) {
  const paths = new Map();

  for (let patch of prototypePatches) {
    for (let i in patch.methods) {
      const method = patch.methods[i];
      const originalMethod = patch.originalMethods[i];
      patch.target[method] = function (...args) {
        const result = originalMethod.apply(this, args);

        if (window.updates) {
          triggerASTUpdate();
        }

        return result;
      };
    }
  }

  function triggerASTUpdate() {
    window.dispatchEvent(
      new CustomEvent("astUpdate", {
        detail: {
          ast,
        },
      })
    );
  }

  window.update = triggerASTUpdate;

  traverse(ast, {
    enter(path) {
      paths.set(path.node, path);
    },
  });

  return paths;
}

function findNodeAtPosition(node, positionIndex) {
  let bestMatch = null;

  function search(currentNode) {
    if (
      currentNode.loc &&
      positionIndex >= currentNode.loc.start.index &&
      positionIndex <= currentNode.loc.end.index
    ) {
      if (!bestMatch || isMoreSpecific(currentNode, bestMatch)) {
        bestMatch = currentNode;
      }
    }

    for (let key in currentNode) {
      if (currentNode[key] && typeof currentNode[key] === "object") {
        search(currentNode[key]);
      }
    }
  }

  function isMoreSpecific(nodeA, nodeB) {
    const sizeA = nodeA.loc.end.index - nodeA.loc.start.index;
    const sizeB = nodeB.loc.end.index - nodeB.loc.start.index;
    return sizeA <= sizeB;
  }

  search(node);
  return bestMatch;
}

export default function PageAST() {
  useSEO(
    "AST Explorer | JS-Confuser",
    "Explore the AST of your JavaScript code."
  );

  var [showConsoleDialog, setShowConsoleDialog] = useState(false);

  const evaluateCode = () => {
    // Purposely making my code IMPOSSIBLE for AI to understand
    // Nope, this is just using a unique key which triggers ->
    // Re-render -> Console Dialog Re-render -> Console Re-evaluates code
    setShowConsoleDialog({});
  };
  const ref = useRef({
    input: { editor: null, monaco: null },
    output: { editor: null, monaco: null },
  });
  const astRef = useRef(null);

  const theme = useTheme();

  // Access the body background color
  const bodyBackgroundColor = theme.palette.background.default;

  const handleEditorDidMount = (key) => (editor, monaco) => {
    ref.current[key] = { editor, monaco };

    window.ref = ref;

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

    if (key === "input") {
      console.clear();
      console.log(astConsoleMessage);

      window.editor = editor;
      window.monaco = monaco;

      editor.onDidChangeCursorPosition((event) => {
        const position = event.position;

        updateASTPosition(position);
      });
    }

    if (ref.current.input.editor && ref.current.output.editor) {
      ref.current.input.editor.setValue(
        window.localStorage.getItem("astCode") || defaultCode
      );
    }
  };

  function highlightNode(node) {
    const { editor, monaco } = ref.current.input;
    if (!editor || !monaco) return;

    if (!node || !node.loc) return;

    let decorationsCollection = ref.current.input.decorationsCollection;
    if (!decorationsCollection) {
      decorationsCollection = editor.createDecorationsCollection();

      ref.current.input.decorationsCollection = decorationsCollection;
    }

    const startPos = editor.getModel().getPositionAt(node.loc.start.index);
    const endPos = editor.getModel().getPositionAt(node.loc.end.index);

    // Clear existing markers
    removeHighlights();

    // Add a new marker for the current node
    monaco.editor.setModelMarkers(editor.getModel(), "highlight", [
      {
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column + 1,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column + 1,
        message: "Selected node",
        severity: monaco.MarkerSeverity.Hint,
        className: "ast-highlight",
        inlineClassName: "ast-highlight",
      },
    ]);

    // Apply a decoration for visual highlighting using decorationsCollection
    const newDecorations = [
      {
        range: new monaco.Range(
          startPos.lineNumber,
          startPos.column,
          endPos.lineNumber,
          endPos.column
        ),
        options: {
          inlineClassName: "ast-highlight", // Use inlineClassName for styling
        },
      },
    ];

    // Replace old decorations with the new ones
    decorationsCollection.set(newDecorations);
  }

  function removeHighlights() {
    let { editor, monaco, decorationsCollection } = ref.current.input;

    monaco.editor.setModelMarkers(editor.getModel(), "highlight", []);
    if (decorationsCollection) {
      decorationsCollection.set([]);
    }
  }

  function removeGhostTextWidget() {
    let { editor, ghostTextWidget } = ref.current.input;
    if (ghostTextWidget) {
      editor.removeContentWidget(ghostTextWidget);
    }
  }

  function createGhostTextWidget(node) {
    let { editor, monaco } = ref.current.input;
    removeGhostTextWidget();

    if (!node || !node.loc) return;

    // Get the starting position of the node
    const startPos = editor.getModel().getPositionAt(node.loc.start.index);

    // Find the end of the line where the node starts
    const lineContent = editor.getModel().getLineContent(startPos.lineNumber);
    const endOfLineColumn = lineContent.length + 1;

    // Create a new position at the end of the line
    const endOfLinePosition = new monaco.Position(
      startPos.lineNumber,
      endOfLineColumn
    );

    // Retrieve font information from editor options
    const fontInfo = editor.getOption(monaco.editor.EditorOption.fontInfo);

    var newGhostTextWidget = {
      getId: () => "my.ghost.text.widget",
      getDomNode: () => {
        const domNode = document.createElement("span"); // Use a span for inline text
        domNode.style.opacity = "0.5";
        domNode.style.color = "gray";
        domNode.style.pointerEvents = "none";
        domNode.style.fontFamily = fontInfo.fontFamily; // Match editor font
        domNode.style.fontSize = `${fontInfo.fontSize}px`; // Match editor font size
        domNode.style.lineHeight = `${fontInfo.lineHeight}px`; // Match editor line height
        domNode.innerText = `${node.type}`;
        domNode.style.whiteSpace = "nowrap";
        domNode.style.transform = "translateX(10px)"; // Offset from the cursor
        return domNode;
      },
      getPosition: () => ({
        position: endOfLinePosition,
        preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
      }),
    };

    editor.addContentWidget(newGhostTextWidget);
    ref.current.input.ghostTextWidget = newGhostTextWidget;
  }

  function updateASTPosition(position) {
    if (position === undefined) {
      position = ref.current.input.editor.getPosition();
    }

    var positionIndex = ref.current.input.editor
      .getModel()
      .getOffsetAt(position);

    const ast = astRef.current;
    if (ast) {
      let node = findNodeAtPosition(ast, positionIndex);

      if (!node) {
        node = ast;
      }

      if (node) {
        const paths = capturePaths(ast);
        const path = paths.get(node);
        const scope = path?.scope;

        window.node = node;
        window.path = path;
        window.scope = scope;
        window.program = paths.get(ast.program) || ast.program;
        window.file = paths.get(ast) || ast;
        window.ast = ast;

        function customReplacer() {
          const seen = new WeakSet();

          return function (key, value) {
            if (typeof value === "object" && value !== null) {
              if (seen.has(value)) {
                // If a circular reference is detected, return a placeholder
                if (value.loc) {
                  return `Circular reference at Line ${value.loc.start.line}, Column ${value.loc.start.column}`;
                }
                return "circular";
              }
              seen.add(value);
            }
            return value;
          };
        }

        const output = JSON.stringify(node, customReplacer(), 2);

        ref.current.output.editor.setValue(output);

        highlightNode(node);
        createGhostTextWidget(node);
      }
    }
  }

  function updateAST() {
    astRef.current = null;
    const input = ref.current.input.editor.getValue();

    try {
      // Parse the input code using @babel/parser
      const ast = parse(input, {
        sourceType: "ambiguous",
        plugins: [], // Add necessary plugins if needed
      });

      // Store the AST in the ref
      astRef.current = ast;

      // Get position of the cursor in output window
    } catch (error) {
      // Format the error message to display in the output editor
      const errorMessage = `// Error: ${error.message}`;

      // Update the output editor with the error message
      ref.current.output.editor.setValue(errorMessage);

      removeHighlights();
      removeGhostTextWidget();
    }
  }

  const getSelectedTextOrFullContent = () => {
    const { editor } = ref.current?.input;
    if (!editor) return "";

    const selection = editor.getSelection();

    // Check if there is a selection
    if (selection && !selection.isEmpty()) {
      return editor.getModel().getValueInRange(selection);
    } else {
      // Return the entire content if no selection is present
      return editor.getValue();
    }
  };

  useEffect(() => {
    /**
     *
     * @param {KeyboardEvent} e
     */
    var callback = (e) => {
      if (e.key === "Enter" && e.shiftKey) {
        evaluateCode();
      }
    };
    window.addEventListener("keydown", callback);

    var handle = null;

    var astCallback = (e) => {
      var { ast } = e.detail;
      if (ast) {
        var code = generate(ast).code;
        var { editor } = ref.current.input;
        if (editor) {
          allowValueRefresh = false;
          const currentPosition = editor.getPosition();

          editor.setValue(code);

          // Step 3: Restore the cursor position
          if (currentPosition) {
            editor.setPosition(currentPosition);
          }

          if (handle) {
            clearTimeout(handle);
          }
          handle = setTimeout(() => {
            allowValueRefresh = true;
            handle = null;
          }, 1000);
        }
      }
    };

    window.addEventListener("astUpdate", astCallback);

    return () => {
      window.removeEventListener("keydown", callback);

      window.removeEventListener("astUpdate", astCallback);
    };
  }, []);

  return (
    <Box>
      <ConsoleDialog
        open={showConsoleDialog}
        onClose={() => {
          setShowConsoleDialog(false);
        }}
        getEditorCode={() => {
          return getSelectedTextOrFullContent();
        }}
      />

      <Box display="flex" width="100%" height="100vh">
        <Box width="50%">
          <Editor
            height="100vh"
            defaultLanguage="javascript"
            defaultValue=""
            theme="myCustomTheme"
            options={{
              wordWrap: "on", // Enable word wrap
              minimap: { enabled: false }, // Disable minimap (optional)
            }}
            onMount={handleEditorDidMount("input")} // Use the onMount callback
            onChange={(value) => {
              if (allowValueRefresh) {
                updateAST();
              }
              window.localStorage.setItem("astCode", value);
            }}
          />
        </Box>

        <Box width="50%">
          <Editor
            height="100vh"
            defaultLanguage="json"
            defaultValue=""
            theme="myCustomTheme"
            options={{
              wordWrap: "on", // Enable word wrap
              minimap: { enabled: false }, // Disable minimap (optional)
              readOnly: true,
              tabSize: 2,
            }}
            onMount={handleEditorDidMount("output")} // Use the onMount callback
          />
        </Box>
      </Box>
    </Box>
  );
}
