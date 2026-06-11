import { Box, Button, Fade, Typography, useTheme } from "@mui/material";
import { useRef, useState } from "react";
import { rgbToHex } from "../utils/color-utils";
import Editor from "@monaco-editor/react";
import useSEO from "../hooks/useSEO";
import { JsConfuserVMVersion, LocalStorageKeys } from "../constants";
import VMOptionsDialog from "../components/dialogs/VMOptionsDialog.jsx";
import ConsoleDialog from "../components/dialogs/ConsoleDialog";
import useJSConfuser from "../hooks/useJSConfuser.jsx";
import useJSConfuserVM from "../hooks/useJSConfuserVM.jsx";
import {
  BugReport,
  DataObject,
  KeyboardArrowRight,
  Lock,
  SkipNext,
} from "@mui/icons-material";
import useVMDebugger from "../hooks/useVMDebugger.jsx";
import { useLocalStorage } from "usehooks-ts";
import VMOptionsMenu from "../components/vm/VMOptionsMenu.jsx";
import { useNavigate } from "react-router-dom";

const defaultCode = `/**
 * GitHub: https://github.com/MichaelXF/js-confuser-vm
 * NPM: https://www.npmjs.com/package/js-confuser-vm
 *
 * Welcome to JS Confuser VM!
 * This is an experimental JavaScript VM obfuscator that compiles your code into custom bytecode and interprets it with a custom runtime.
 * 
 * You can obfuscate the code with the top right button 'Obfuscate'.
 * 
 * You can customize the obfuscator with the button 'Options'.
 *
 * Version: ${JsConfuserVMVersion}
 *
 * Happy Hacking!
 */

function greet(name) {
  var output = 'Hello ' + name + '!';
  console.log(output);
}

greet('Internet User');`;

export default function PageVM() {
  useSEO(
    "VM Obfuscator | JS-Confuser",
    "Obfuscate your JavaScript code with JS-Confuser VM.",
  );

  let navigate = useNavigate();

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
  var [logs, setLogs] = useState([]);

  var [liveObfuscation, setLiveObfuscation] = useLocalStorage(
    "jsconfuservm_live_obfuscation",
    false,
  );
  var liveObfuscationRef = useRef();
  liveObfuscationRef.current = liveObfuscation;

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
    let match = lineContent.match(/(\d+):(\d+)-(\d+):(\d+)\s*$/); // For JS-Confuser-VM's "bytecode comment"
    if (!match) {
      // Disassembled code format: find location as last whitespace-separated token after "//"
      // e.g., "  r1 = console                                        // 1:0-1:7"
      match = lineContent.match(/\/\/.*\s(\d+):(\d+)-(\d+):(\d+)\s*$/);
    }

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

  const locationsRef = useRef([]);

  const vmDebugger = useVMDebugger({
    onEvent: (event) => {
      if (event.isDebugger ?? true) {
        setDebugState(event);
      }
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

        let pc = event.data.pc;

        let lineNumber = 0;
        let targetLineText;

        let remainingPc = pc;
        for (const line of lines) {
          if (line.startsWith("// [")) {
            const instr = line.split("[")[1].split("]")[0].split(",").length;
            remainingPc -= instr;
            if (remainingPc < 0) {
              targetLineText = line;
              break;
            }
          }
          lineNumber++;
        }

        locationsRef.current = [
          ...locationsRef.current,
          {
            pc: pc,
            text: targetLineText,
          },
        ];

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
    concealConstants: {
      description: "Conceals strings and integers in the constant pool.",
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
    controlFlowFlattening: {
      description:
        "Flattens the control flow of your program into a convoluted state machine.",
    },
    dispatcher: {
      description: "Creates a middleman block to process jumps.",
    },
    stringConcealing: {
      description: "Encodes strings to conceal plain-text values.",
    },
    timingChecks: {
      description:
        "Detects the use of debuggers by checking for >1second pauses. May break code with slow sync tasks.",
    },
    // minify: {
    //   description:
    //     "Minifies the final code with Google Closure Compiler. Renames the VM class properties.",
    // },
  };

  const defaultOptions = Object.keys(optionsSchema).reduce((opts, key) => {
    // By default, everything is off
    opts[key] = false;
    return opts;
  }, {});

  const [options, setOptions] = useLocalStorage(
    LocalStorageKeys.JsConfuserVMOptions,
    defaultOptions,
  );
  var optionsRef = useRef();
  optionsRef.current = options;

  var [showButtonNav, setShowButtonNav] = useState(true);

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
      fontFamily: "Fira Mono, monospace",
      fontSize: 14,
      minimap: { enabled: false },
      fontLigatures: false,
      fontVariations: true,
      tabSize: 2,
    });

    if (ref.current.input.editor && ref.current.output.editor) {
      ref.current.input.editor.setValue(defaultCode);
    }

    if (key === "output") {
      editor.onDidChangeCursorPosition((e) => {
        if (stateRef.current) return;

        highlightLineFromOutput(e.position.lineNumber);
      });

      editor.onDidFocusEditorText(() => {
        setShowButtonNav(false);
      });

      editor.onDidBlurEditorText(() => {
        setShowButtonNav(true);
      });
    }

    if (key === "input") {
      // Live Obfuscation Mode
      editor.onDidChangeModelContent(async (event) => {
        if (!liveObfuscationRef.current) return;
        let outputEditor = ref.current.output.editor;

        // Get the updated code
        const newCode = editor.getValue();

        try {
          let { code } = await obfuscate(newCode);

          var disassembleResult = await vmDebugger.disassemble(code);

          var bytecodeCommentCode = code.split("\nvar CONSTANTS =")[0];

          outputEditor.setValue(
            bytecodeCommentCode + "\n\n" + disassembleResult.code,
          );
        } catch (err) {
          console.log(err);
          outputEditor.setValue(
            ("" + (err?.stack || err?.errorStack || err?.message || err))
              .split("\n")
              .map((line) => "// " + line)
              .join("\n"),
          );
        }
      });
    }
  };

  const obfuscate = (sourceCode) => {
    return new Promise((resolve, reject) => {
      JsConfuserVM.obfuscate(
        sourceCode,
        {
          target: "browser",
          ...optionsRef.current,
          minify: false, // The Google Closure Compiler isn't available for browsers :(
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
        // Use API for Google Closure API

        const minifiedCode = await minify(code);
        code =
          "// Minified by https://jscompressor.treblereel.dev/\n" +
          minifiedCode;
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

  // Since Google Closure Compiler isn't available in the browser, we use treblereel's API
  // API was not used as the Google Closure Compiler version is outdated
  const minify = async (originalCode) => {
    var body = {
      payload: originalCode,
      compilationLevel: "ADVANCED",
      warningLevel: "QUIET",
      outputFileName: "default.js",
      formatting: {
        prettyPrint: false,
        printInputDelimiter: false,
      },
      language: {
        languageIn: "ECMASCRIPT_NEXT",
        languageOut: "ECMASCRIPT_NEXT",
      },
      externalScripts: {
        urls: [],
      },
    };

    var response = await fetch("https://jscompressor.treblereel.dev/compile", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });

    var json = await response.json();

    return json.compiledCode;
  };

  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [showConsoleDialog, setShowConsoleDialog] = useState(false);

  const toggleDebugger = () => {
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
  };

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

      <Fade in={showButtonNav} unmountOnExit={true}>
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

              <VMOptionsMenu
                sx={{
                  fontWeight: "bold",
                  width: "160px",
                  minHeight: "42px",
                  bgcolor: "divider",
                  color: "primary.main",
                  flexShrink: 0,
                }}
                options={[
                  {
                    label: "Obfuscator Options",
                    onClick: () => setShowOptionsDialog(true),
                  },
                  {
                    icon: (
                      <KeyboardArrowRight sx={{ transform: "scale(1.1)" }} />
                    ),

                    label: "Evaluate Code",
                    onClick: () => setShowConsoleDialog(true),
                  },
                  {
                    icon: <DataObject sx={{ transform: "scale(1.1)" }} />,
                    label: "Disassemble Program",
                    onClick: async () => {
                      const { editor: outputEditor } = ref.current.output;
                      if (!outputEditor) return;

                      const code = outputEditor.getValue();
                      if (!code.trim()) return;

                      var disassembleResult =
                        await vmDebugger.disassemble(code);

                      var bytecodeCommentCode =
                        code.split("\nvar CONSTANTS =")[0];

                      outputEditor.setValue(
                        bytecodeCommentCode + "\n\n" + disassembleResult.code,
                      );
                    },
                  },
                  {
                    icon: <BugReport />,
                    label: "Debug Program",
                    onClick: () => {
                      toggleDebugger();
                    },
                  },
                  {
                    label: "Go to JS-Confuser Editor",
                    onClick: () => {
                      const { editor: outputEditor } = ref.current.output;
                      if (!outputEditor) return;

                      const code = outputEditor.getValue();
                      navigate("/editor?code=" + encodeURIComponent(code));
                    },
                  },
                  {
                    label: !liveObfuscation
                      ? "Enable Live Obfuscation"
                      : "Disable Live Obfuscation",
                    onClick: () => {
                      setLiveObfuscation(!liveObfuscation);
                    },
                  },
                ]}
              />
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
              <Button
                sx={{
                  fontWeight: "bold",
                  width: "160px",
                  minHeight: "42px",
                  bgcolor: "divider",
                  color: "primary.main",
                  flexShrink: 0,
                }}
                startIcon={<BugReport />}
                color="inherit"
                onClick={() => toggleDebugger()}
              >
                Stop
              </Button>
            </>
          ) : null}
        </Box>
      </Fade>

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
            {Object.entries(debugState?.data?.regs || {}).map(
              ([key, regItem], i) => {
                return (
                  <Typography
                    key={i}
                    fontFamily="inherit"
                    fontSize="medium"
                    color="text.secondary"
                  >
                    regs[{key}]:{" "}
                    <strong style={{ color: "white" }}>{"" + regItem}</strong>
                  </Typography>
                );
              },
            )}
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
