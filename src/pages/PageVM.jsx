import { Box, Button, Typography, useTheme } from "@mui/material";
import { useRef, useState } from "react";
import { rgbToHex } from "../utils/color-utils";
import Editor from "@monaco-editor/react";
import useSEO from "../hooks/useSEO";
import { defaultCode, LocalStorageKeys } from "../constants";
import VMOptionsDialog from "../components/dialogs/VMOptionsDialog.jsx";
import ConsoleDialog from "../components/dialogs/ConsoleDialog";
import useJSConfuser from "../hooks/useJSConfuser.jsx";
import useJSConfuserVM from "../hooks/useJSConfuserVM.jsx";
import {
  BugReport,
  KeyboardArrowRight,
  Lock,
  SkipNext,
} from "@mui/icons-material";
import useVMDebugger from "../hooks/useVMDebugger.jsx";
import { useLocalStorage } from "usehooks-ts";

export default function PageVM() {
  useSEO(
    "VM Obfuscator | JS-Confuser",
    "Obfuscate your JavaScript code with JS-Confuser VM.",
  );

  const JsConfuser = useJSConfuser({
    onError: (message) => {
      alert(message);
    },
  });

  const JsConfuserVM = useJSConfuserVM({
    onError: (message) => {
      alert(message);
    },
  });

  var [debugState, setDebugState] = useState();
  var [logs, setLogs] = useState();

  var stateRef = useRef();
  stateRef.current = debugState;

  function highlightLineFromOutput(lineNumber) {
    const { editor, monaco } = ref.current.output;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    const lineContent = model.getLineContent(lineNumber);
    // Match new bytecode comment source location: "LINE:COL-LINE:COL" at end of line
    // e.g., "// [14],        POP                                     22:0-22:23"
    const match = lineContent.match(/(\d+):(\d+)-(\d+):(\d+)\s*$/);

    const inputEditor = ref.current.input.editor;
    if (!inputEditor) return;

    if (match) {
      const startLine = parseInt(match[1], 10);
      const startCol = parseInt(match[2], 10) + 1; // Monaco columns are 1-indexed
      const endLine = parseInt(match[3], 10);
      const endCol = parseInt(match[4], 10) + 1; // Monaco columns are 1-indexed

      inputEditor.revealPositionInCenter({
        lineNumber: startLine,
        column: startCol,
      });

      sourceHighlightDecorations.current = inputEditor.deltaDecorations(
        sourceHighlightDecorations.current,
        [
          {
            range: new monaco.Range(startLine, startCol, endLine, endCol),
            options: {
              isWholeLine: false,
              className: "source-location-highlight",
              linesDecorationsClassName: "source-location-glyph",
            },
          },
        ],
      );
    } else {
      if (sourceHighlightDecorations.current.length > 0) {
        sourceHighlightDecorations.current = inputEditor.deltaDecorations(
          sourceHighlightDecorations.current,
          [],
        );
      }
    }

    if (lineContent.includes("// ")) {
      const outputLine = lineNumber;
      const outputEndCol = model.getLineMaxColumn(outputLine);
      outputActiveDecorations.current = editor.deltaDecorations(
        outputActiveDecorations.current,
        [
          {
            range: new monaco.Range(outputLine, 1, outputLine, outputEndCol),
            options: {
              isWholeLine: true,
              className: "source-location-highlight",
              linesDecorationsClassName: "source-location-glyph",
            },
          },
        ],
      );
    } else {
      if (outputActiveDecorations.current.length > 0) {
        outputActiveDecorations.current = editor.deltaDecorations(
          outputActiveDecorations.current,
          [],
        );
      }
    }
  }

  const vmDebugger = useVMDebugger({
    onEvent: (event) => {
      setDebugState(event);

      console.log("VM Debugger Event:", event);

      if (event.event === "done") {
        // remove the highlight
        highlightLineFromOutput(-1);
      } else if (typeof event.data?.pc === "number") {
        const { editor, monaco } = ref.current.output;
        if (!editor || !monaco) return;

        const model = editor.getModel();
        if (!model) return;

        // To convert PC into line number we must step through the line contents and count operands
        const outputText = model.getValue();
        const lines = outputText.split("var CONSTANTS")[0].split("\n");
        let remainingPc = event.data.pc;
        let lineNumber = 0;
        for (const line of lines) {
          if (line.startsWith("// [")) {
            const instr = line.split("[")[1].split("]")[0].split(",").length;
            remainingPc -= instr;
            if (remainingPc < 0) {
              break;
            }
          }
          lineNumber++;
        }

        // Monaco editor starts at line 1
        const targetLine = lineNumber + 1;

        highlightLineFromOutput(targetLine);
      }

      if (event.event === "log") {
        setLogs((logs) => {
          return [...(logs || []), event.data];
        });
      }
    },
  });

  const ref = useRef({
    input: { editor: null, monaco: null },
    output: { editor: null, monaco: null },
  });

  const sourceHighlightDecorations = useRef([]);
  const outputActiveDecorations = useRef([]);

  const [loading, setLoading] = useState(false);

  const optionsSchema = {
    // target: {
    //   description: "Currently has no effect.",
    // },
    randomizeOpcodes: {
      description: "Randomizes the opcode numbers.",
    },
    shuffleOpcodes: {
      description: "Shuffles the order of opcode handlers in the VM runtime.",
    },
    encodeBytecode: {
      description: "Encodes the bytecode array.",
    },
    macroOpcodes: {
      description:
        "Combines multiple opcodes commonly used from your bytecode.",
    },
    specializedOpcodes: {
      description:
        "Creates specialized opcodes for commonly used opcode+operand pairs.",
    },
    selfModifying: {
      description:
        "Function bodies are replaced upon runtime entry to the real bytecode.",
    },
    timingChecks: {
      description:
        "Detects the use of debuggers by checking for >1second pauses. May break code with slow sync tasks.",
    },
  };

  const defaultOptions = Object.keys(optionsSchema).reduce((opts, key) => {
    opts[key] = true;
    return opts;
  }, {});

  const [options, setOptions] = useLocalStorage(
    LocalStorageKeys.JsConfuserVMOptions,
    defaultOptions,
  );

  const theme = useTheme();
  const bodyBackgroundColor = theme.palette.background.default;

  const handleEditorDidMount = (key) => (editor, monaco) => {
    ref.current[key] = { editor, monaco };

    monaco.editor.defineTheme("myCustomTheme", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": rgbToHex(bodyBackgroundColor),
      },
    });

    monaco.editor.setTheme("myCustomTheme");

    editor.updateOptions({
      fontFamily: "Fira Code, monospace",
      fontSize: 14,
      minimap: { enabled: false },
    });

    if (ref.current.input.editor && ref.current.output.editor) {
      ref.current.input.editor.setValue(defaultCode);
    }

    if (key === "output") {
      editor.onDidChangeCursorPosition((e) => {
        if (stateRef.current) return;

        highlightLineFromOutput(e.position.lineNumber);
      });
    }
  };

  const obfuscate = (sourceCode) => {
    return new Promise((resolve, reject) => {
      JsConfuserVM.obfuscate(
        sourceCode,
        {
          target: "browser",
          ...options,
          minify: false, // Never use Closure Compiler
        },
        {
          onComplete: (data) => {
            resolve(data);
          },
          onError: (data) => {
            // Show error dialog
            reject(data);
          },
        },
      );
    });
  };

  const handleObfuscateClick = async () => {
    const { editor: inputEditor } = ref.current.input;
    const { editor: outputEditor } = ref.current.output;
    if (!inputEditor || !outputEditor) return;

    const sourceCode = inputEditor.getValue();
    setLoading(true);

    try {
      let result = await obfuscate(sourceCode);
      console.log(result);
      let { code } = result;

      if (options.minify) {
        const minifyResult = await minify(code);
        code =
          "// Minified with JS-Confuser\n// (Recommended choice: Google Closure Compile)\n" +
          minifyResult.code;
      }

      console.log(code);

      outputEditor.setValue(code);
    } catch (error) {
      outputEditor.setValue(
        `// Error: ${error?.stack || error?.errorStack || error}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Since Google Closure Compiler isn't available in the browser, we can use js-confuser's minify which provides some help
  const minify = async (originalCode) => {
    const advancedOptions = {};
    return new Promise((resolve, reject) => {
      JsConfuser.obfuscate(
        originalCode,
        {
          target: "browser",
          minify: true,
          renameVariables: true,
          identifierGenerator: "mangled",
        },
        {
          onComplete: (data) => {
            resolve(data);
          },
          onError: (data) => {
            // Show error dialog
            reject(data);
          },
          onProgress: (data) => {},
        },
        advancedOptions,
      );
    });
  };

  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [showConsoleDialog, setShowConsoleDialog] = useState(false);

  const handleStartDebugger = async () => {
    const { editor: outputEditor } = ref.current.output;
    if (!outputEditor) return;

    const code = outputEditor.getValue();
    if (!code.trim()) return;

    setDebugState(null);
    setLogs([]);
    await vmDebugger.loadProgram(code);
  };

  const getSelectedTextOrFullContent = () => {
    const editor = ref.current.output.editor;
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

  return (
    <Box>
      <style>{`
        .source-location-highlight {
          background: rgba(255, 200, 0, 0.12) !important;
        }
        .source-location-glyph {
          background: rgba(255, 200, 0, 0.75);
          width: 2px !important;
          margin-left: 5px;
        }
      `}</style>
      <ConsoleDialog
        open={showConsoleDialog}
        getEditorOptions={() => {
          return {
            target: "browser", // Hides possible warnings
          };
        }}
        onClose={() => {
          setShowConsoleDialog(false);
          requestAnimationFrame(() => {
            const { editor } = ref.current.input;
            if (editor) {
              editor.focus();
            }
          });
        }}
        getEditorCode={getSelectedTextOrFullContent}
      />

      <VMOptionsDialog
        open={showOptionsDialog}
        onClose={() => {
          setShowOptionsDialog(false);
        }}
        options={options}
        optionsSchema={optionsSchema}
        setOptions={setOptions}
      />

      <Box
        sx={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 1300,
        }}
        display="flex"
        alignItems="center"
        gap={2}
      >
        {debugState ? null : (
          <>
            <Button
              sx={{
                fontWeight: "bold",
                width: "160px",
                minHeight: "42px",
                flexShrink: 0,
              }}
              startIcon={<Lock sx={{ transform: "scale(0.9)" }} />}
              variant="contained"
              onClick={handleObfuscateClick}
              disabled={loading}
            >
              Obfuscate
            </Button>

            <Button
              sx={{
                fontWeight: "bold",
                width: "160px",
                minHeight: "42px",
                bgcolor: "divider",
                color: "primary.main",
                flexShrink: 0,
              }}
              color="inherit"
              onClick={() => setShowOptionsDialog(true)}
            >
              Options
            </Button>

            <Button
              sx={{
                fontWeight: "bold",
                width: "160px",
                minHeight: "42px",
                bgcolor: "divider",
                color: "primary.main",
                flexShrink: 0,
              }}
              startIcon={
                <KeyboardArrowRight sx={{ transform: "scale(1.1)" }} />
              }
              color="inherit"
              onClick={() => setShowConsoleDialog(true)}
            >
              Evaluate Code
            </Button>
          </>
        )}

        {/* Debugger controls - only show once a program is loaded (state !== undefined) */}
        {debugState ? (
          <>
            <Button
              sx={{
                fontWeight: "bold",
                width: "160px",
                minHeight: "42px",
                bgcolor: "divider",
                color: "success.main",
                flexShrink: 0,
              }}
              startIcon={<SkipNext />}
              color="inherit"
              onClick={() => vmDebugger.next("instruction")}
              disabled={debugState?.event === "done"}
            >
              Step
            </Button>
            <Button
              sx={{
                fontWeight: "bold",
                width: "160px",
                minHeight: "42px",
                bgcolor: "divider",
                color: "warning.main",
                flexShrink: 0,
              }}
              startIcon={<SkipNext />}
              color="inherit"
              onClick={() => vmDebugger.next("jump")}
              disabled={debugState?.event === "done"}
            >
              Step Jump
            </Button>
          </>
        ) : null}

        <Button
          sx={{
            fontWeight: "bold",
            width: "160px",
            minHeight: "42px",
            bgcolor: "divider",
            color: "info.main",
            flexShrink: 0,
          }}
          startIcon={<BugReport />}
          color="inherit"
          onClick={() => {
            if (debugState) {
              setDebugState(null);
            } else {
              var enabledOptions = Object.keys(options).filter(
                (optName) => options[optName],
              );
              if (enabledOptions.length) {
                alert(
                  "Warning: You have option(s) enabled (" +
                    enabledOptions.join(", ") +
                    ") which will most likely break the debugger. Disable all options for the best results.",
                );
              }
              handleStartDebugger();
            }
          }}
        >
          {debugState ? "Stop" : "Debugger"}
        </Button>
      </Box>

      {/* Debugger state panel */}
      {debugState && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1300,
            bgcolor: "background.paper",
            borderTop: "1px solid",
            borderColor: "divider",
            px: 3,
            py: 1,
          }}
          fontFamily="monospace"
        >
          <Box display="flex" alignItems="center" gap={4}>
            <Typography
              variant="caption"
              fontFamily="inherit"
              fontSize="medium"
              color="text.secondary"
            >
              Event:{" "}
              <strong style={{ color: "white" }}>
                {debugState?.event ?? "—"}
              </strong>
            </Typography>
            {debugState?.data?.pc != null && (
              <Typography
                variant="caption"
                fontFamily="inherit"
                fontSize="medium"
                color="text.secondary"
              >
                PC:{" "}
                <strong style={{ color: "white" }}>
                  {debugState?.data?.pc}
                </strong>
              </Typography>
            )}
            {debugState?.data?.op != null && (
              <Typography
                variant="caption"
                fontFamily="inherit"
                fontSize="medium"
                color="text.secondary"
              >
                OP:{" "}
                <strong style={{ color: "white" }}>
                  {debugState?.data?.opName || ""} {debugState?.data?.op}
                </strong>
              </Typography>
            )}
          </Box>
          <Box>
            {(debugState?.data?.stack || []).map((stackItem, i) => {
              return (
                <Typography
                  key={i}
                  fontFamily="inherit"
                  fontSize="medium"
                  color="text.secondary"
                >
                  stack[{i}]:{" "}
                  <strong style={{ color: "white" }}>{"" + stackItem}</strong>
                </Typography>
              );
            })}
          </Box>
          <Box>
            {(debugState?.data?.locals || []).map((localsItem, i) => {
              return (
                <Typography
                  key={i}
                  fontFamily="inherit"
                  fontSize="medium"
                  color="text.secondary"
                >
                  locals[{i}]:{" "}
                  <strong style={{ color: "white" }}>{"" + localsItem}</strong>
                </Typography>
              );
            })}
          </Box>
          <Box>
            <Typography
              fontFamily="inherit"
              fontSize="medium"
              color="text.secondary"
            >
              Logs:
            </Typography>
            {logs.map((log, i) => {
              return (
                <Typography key={i} fontFamily="monospace" fontSize="medium">
                  {(log || []).join(" ")}
                </Typography>
              );
            })}
          </Box>
        </Box>
      )}

      <Box display="flex" width="100%" height="100vh">
        <Box width="50%">
          <Editor
            height="100vh"
            defaultLanguage="javascript"
            defaultValue=""
            theme="myCustomTheme"
            options={{
              wordWrap: "on",
              minimap: { enabled: false },
            }}
            onMount={handleEditorDidMount("input")}
          />
        </Box>

        <Box width="50%" borderLeft="1px solid" borderColor="divider">
          <Editor
            height="100vh"
            defaultLanguage="javascript"
            defaultValue=""
            theme="myCustomTheme"
            options={{
              wordWrap: "on",
              minimap: { enabled: false },
            }}
            onMount={handleEditorDidMount("output")}
          />
        </Box>
      </Box>
    </Box>
  );
}
