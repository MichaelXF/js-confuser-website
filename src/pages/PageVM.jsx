import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  IconButton,
  Menu,
  MenuItem,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { rgbToHex } from "../utils/color-utils";
import Editor from "@monaco-editor/react";
import useSEO from "../hooks/useSEO";
import { JsConfuserVMVersion, LocalStorageKeys } from "../constants";
import VMOptionsDialog from "../components/dialogs/VMOptionsDialog.jsx";
import ConsoleDialog from "../components/dialogs/ConsoleDialog";
import useJSConfuser from "../hooks/useJSConfuser.jsx";
import useJSConfuserVM from "../hooks/useJSConfuserVM.jsx";
import {
  ArrowDownward,
  ArrowUpward,
  BugReport,
  Check,
  Close,
  DataObject,
  Edit,
  KeyboardArrowDown,
  KeyboardArrowRight,
  Lock,
  PlayArrow,
  RedoOutlined,
  SkipNext,
  Stop,
  Visibility,
} from "@mui/icons-material";
import useVMDebugger from "../hooks/useVMDebugger.jsx";
import { useLocalStorage } from "usehooks-ts";
import VMOptionsMenu from "../components/vm/VMOptionsMenu.jsx";
import { useNavigate } from "react-router-dom";
import ErrorDialog from "../components/dialogs/ErrorDialog.jsx";
import ReactECharts from "echarts-for-react";
import {
  createFileSizeChart,
  createObfuscationTimesChart,
} from "../components/dialogs/InsightsDialog.jsx";

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

function DisassembledDialog({ open, onClose, pc, code }) {
  var ref = useRef({});
  var [rerender, setRerender] = useState();

  const sourceHighlightDecorations = useRef([]);

  const handleEditorDidMount = (key) => (editor, monaco) => {
    ref.current[key] = { editor, monaco };

    setRerender({});
  };

  function convertPCToLineNumber(pc) {
    if (typeof pc !== "number" || !code) return null;

    const lines = code.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/\[(\d+),(\d+)\]\s*$/);
      if (!match) continue;

      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);
      if (pc >= start && pc <= end) return i + 1;
    }

    return null;
  }

  function highlightLine(lineNumber, scrollIntoView) {
    const { editor, monaco } = ref.current.code;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    if (typeof lineNumber === "number") {
      const lineContent = model.getLineContent(lineNumber);
      const startLine = lineNumber;
      const startCol = 1; // Monaco columns are 1-indexed
      const endLine = lineNumber;
      const endCol = lineContent.length; // Monaco columns are 1-indexed

      editor.revealPositionInCenter(
        {
          lineNumber: startLine,
          column: startCol,
        },
        monaco.editor.ScrollType.Immediate,
      );

      sourceHighlightDecorations.current = editor.deltaDecorations(
        sourceHighlightDecorations.current,
        [
          {
            range: new monaco.Range(startLine, startCol, endLine, endCol),
            options: {
              isWholeLine: true,
              className: "source-location-highlight",
              linesDecorationsClassName: "source-location-glyph",
            },
          },
        ],
      );
    } else {
      if (sourceHighlightDecorations.current.length > 0) {
        sourceHighlightDecorations.current = editor.deltaDecorations(
          sourceHighlightDecorations.current,
          [],
        );
      }
    }
  }

  useEffect(() => {
    if (!open) return;
    if (!ref.current.code?.editor) return;

    highlightLine(convertPCToLineNumber(pc));
  }, [open, pc, ref.current.code?.editor]);

  // TODO: Don't read 'code' because obfuscationResult is when user clicks Obfuscate button
  // but I also want to support users dropping in obfuscated code into right-side and it should call
  // disassemble() for you
  return (
    <Dialog
      open={!!open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus={true}
    >
      <DialogTitle>Disassembled</DialogTitle>
      <DialogContent>
        <Editor
          defaultLanguage="javascript"
          defaultValue={code}
          theme="myCustomTheme"
          height="400px"
          options={{
            wordWrap: "on",
            minimap: { enabled: false },
          }}
          onMount={handleEditorDidMount("code")}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function InsightsDialog({ open, onClose, profileData }) {
  const theme = useTheme();

  const [tab, setTab] = useState(0);

  const chartOptions = {
    0: createObfuscationTimesChart,
    1: createFileSizeChart,
  }[tab]?.(profileData, theme);

  return (
    <Dialog
      open={!!open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus={true}
    >
      <DialogTitle component="div">
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
            <Tab label="Obfuscation Times" />
            <Tab label="File Size" />
          </Tabs>
        </Box>
      </DialogTitle>
      <DialogContent>
        {chartOptions ? (
          <ReactECharts
            option={chartOptions}
            style={{ height: "440px", width: "100%" }}
          />
        ) : null}

        <Typography fontFamily="monospace" component="pre">
          {JSON.stringify(profileData, null, 2)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function RegisterTypeMenu({ onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        aria-label="dropdown"
        aria-controls={open ? "demo-positioned-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={handleClick}
        size="small"
        sx={{ width: "24px", height: "24px" }}
      >
        <KeyboardArrowDown sx={{ fontSize: "1rem" }} />
      </IconButton>

      <Menu
        id="demo-positioned-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {[
          "string",
          "number",
          "boolean",
          "object",
          "function",
          "undefined",
          "null",
        ].map((optionType, i) => (
          <MenuItem
            onClick={() => {
              handleClose();
              onChange(optionType);
            }}
            key={i}
          >
            {optionType}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function RegisterRow({ regItem, regKey, vmDebugger }) {
  var [editing, setEditing] = useState(false);
  var inputRef = useRef();

  var absRegKey = regItem.regKey || regKey;

  const setValue = (newValue, newType) => {
    switch (newType || regItem.type) {
      case "boolean":
        newValue =
          newValue?.toLowerCase().trim() === "true" || newValue === "1";
        break;
      case "number":
        newValue = parseFloat(newValue);
        break;
      case "object":
      case "array":
        try {
          newValue = JSON.parse(newValue);
        } catch (err) {
          newValue = {};
        }
        break;
      case "undefined":
      case "null":
        if (newValue === "null") newValue = null;
        else if (newValue === "undefined") newValue = undefined;
        // Force change when user selects from dropdown
        else if (newType === "null") newValue = null;
        else if (newType === "undefined") newValue = undefined;

        break;

      case "function":
        newValue = eval(newValue);
        break;
    }

    vmDebugger.action("setRegister", absRegKey, newValue);
    setEditing(false);
  };

  return (
    <TableRow
      sx={{
        "&:last-child td, &:last-child th": { border: 0 },
        "& .hover-button": {
          opacity: 0,
          transition: "opacity 0.3s ease",
        },
        "&:hover .hover-button": {
          opacity: 1,
        },
      }}
    >
      <TableCell>regs[{regKey}]</TableCell>
      <TableCell sx={{ whiteSpace: "nowrap" }}>
        <Box alignItems="center" display="flex">
          {"" + regItem.type}

          <Box ml={1} className={editing ? "" : "hover-button"}>
            <RegisterTypeMenu
              onChange={(newType) => {
                setValue("" + regItem.value, newType);
              }}
            />
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Box alignItems="center" display="flex">
          {editing ? (
            <TextField
              variant="standard"
              defaultValue={"" + regItem.value}
              inputRef={inputRef}
              InputProps={{
                sx: {
                  fontSize: "0.9rem",
                  padding: 0,
                },
              }}
            />
          ) : (
            "" + regItem.value
          )}

          <Box
            ml={1}
            className={editing ? "" : "hover-button"}
            display="inline-flex"
            gap={"4px"}
          >
            {editing ? (
              <>
                <IconButton
                  aria-label="confirm"
                  size="small"
                  sx={{ width: "24px", height: "24px" }}
                  onClick={() => {
                    // Smartly convert user input into a JS value
                    let newValue = inputRef.current.value;

                    setValue(newValue);
                  }}
                >
                  <Check sx={{ fontSize: "0.9rem" }} />
                </IconButton>
                <IconButton
                  aria-label="cancel"
                  size="small"
                  sx={{ width: "24px", height: "24px" }}
                  onClick={() => {
                    setEditing(false);
                  }}
                >
                  <Close sx={{ fontSize: "0.9rem" }} />
                </IconButton>
              </>
            ) : (
              <IconButton
                aria-label="edit"
                size="small"
                sx={{ width: "24px", height: "24px" }}
                onClick={() => {
                  setEditing(true);

                  setTimeout(() => {
                    inputRef.current?.focus?.();
                  }, 100);
                }}
              >
                <Edit sx={{ fontSize: "0.9rem" }} />
              </IconButton>
            )}
          </Box>
        </Box>
      </TableCell>
    </TableRow>
  );
}

export default function PageVM() {
  useSEO(
    "VM Obfuscator | JS-Confuser",
    "Obfuscate your JavaScript code with JS-Confuser VM.",
  );

  let navigate = useNavigate();

  const JsConfuser = useJSConfuser({
    onError: (message) => {
      setError({
        errorString: message,
      });
      setShowErrorDialog(true);
    },
  });

  const JsConfuserVM = useJSConfuserVM({
    onError: (message) => {
      setError({
        errorString: message,
      });
      setShowErrorDialog(true);
    },
  });

  var [debugState, setDebugState] = useState();
  var [logs, setLogs] = useState([]);

  // { index, fp } - the frame pointer is re-verified against the stack after every
  // step, as the same index can refer to a different frame once the stack moves
  var [activeFrame, setActiveFrame] = useState(null);

  var activeFrameIndex = null;
  if (activeFrame) {
    var candidate = debugState?.data?.stack?.[activeFrame.index];
    if (candidate && candidate.fp === activeFrame.fp) {
      activeFrameIndex = activeFrame.index;
    }
  }

  var activeFrameRegisters;
  if (activeFrameIndex !== null) {
    var frame = debugState.data.stack[activeFrameIndex];
    var end = frame?.fp + frame?.size || 0;

    var frameRegisters = {};
    for (var i = frame.base; i < end; i++) {
      frameRegisters[i - frame.base] = {
        ...debugState?.data?.registers[i],
        regKey: i,
      };
    }

    activeFrameRegisters = frameRegisters;
  }

  var [liveObfuscation, setLiveObfuscation] = useLocalStorage(
    "jsconfuservm_live_obfuscation",
    false,
  );
  var liveObfuscationRef = useRef();
  liveObfuscationRef.current = liveObfuscation;

  var stateRef = useRef();
  stateRef.current = debugState;

  function highlightLineFromOutput(lineNumber, scrollIntoView) {
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

      inputEditor.revealPositionInCenter(
        {
          lineNumber: startLine,
          column: startCol,
        },
        monaco.editor.ScrollType.Immediate,
      );

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

      if (scrollIntoView) {
        editor.revealLineInCenterIfOutsideViewport(
          outputLine,
          monaco.editor.ScrollType.Immediate,
        );
      }

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
      } else if (
        typeof event.data?.pc === "number" ||
        event?.event === "ready"
      ) {
        const { editor, monaco } = ref.current.output;
        if (!editor || !monaco) return;

        const model = editor.getModel();
        if (!model) return;

        // To convert PC into line number we must step through the line contents and count operands
        const outputText = model.getValue();
        const lines = outputText.split("var CONSTANTS")[0].split("\n");

        let pc = event?.event === "ready" ? 0 : event.data.pc;

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

        highlightLineFromOutput(targetLine, true);
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
    randomizeOpcodes: {
      description: "Randomizes the opcode numbers.",
      inputCode: `console.log("Hello World!");`,
      outputBytecode: true,
    },
    shuffleOpcodes: {
      description: "Shuffles the order of opcode handlers in the VM runtime.",
      inputCode: `console.log("Hello World!");`,
      outputFormatter: (code) => {
        return (
          code
            .split("/* @SWITCH */")[1]
            .trim()
            .split("\n")
            .slice(0, 10)
            .join("\n") + "\n//...\n}"
        );
      },
    },
    encodeBytecode: {
      description: "Encodes the bytecode array.",
      inputCode: `console.log("Hello World!");`,
      outputFormatter: (code) => {
        // Returns the line var BYTECODE = ...
        return code.match(/^.*\bvar BYTECODE\s*=.*$/m)?.[0];
      },
    },
    concealConstants: {
      description: "Conceals strings and integers in the constant pool.",
      inputCode: `console.log("Hello World!");`,
      outputFormatter: (code) => {
        // Returns the line var CONSTANTS = []
        return code.match(/^.*\bvar CONSTANTS\s*=.*$/m)?.[0];
      },
    },
    controlFlowFlattening: {
      description:
        "Flattens the control flow of your program into a convoluted state machine.",
      inputCode: `var message;
if (true) {
  message = "Hello World";
}`,
      outputDisassembled: true,
    },
    dispatcher: {
      description: "Creates a middleman block to process jumps.",
      inputCode: `
if (true) {
  console.log("Hello World!");
}
`,
      outputDisassembled: true,
    },
    stringConcealing: {
      description: "Encodes strings to conceal plain-text values.",
      inputCode: `console.log("Hello World!");`,
      outputDisassembled: true,
    },
    macroOpcodes: {
      description:
        "Combines multiple opcodes commonly used from your bytecode.",
      inputCode: `
console.log("Hello World!");
console.log("Hello World!");
      `,
      outputFormatter: (code, isBefore) => {
        if (isBefore) {
          return code.match(
            /^ *case OP\.LOAD_GLOBAL:\s*\n( *)\{[\s\S]*?\n\1\}/m,
          )?.[0];
        }

        return code.match(
          /^ *case\s+[^\n:]*:\s*\n( *)\{\s*\n *\/\/[^\n]*\(macro\)[\s\S]*?\n\1\}/m,
        )?.[0];
      },
    },
    specializedOpcodes: {
      description:
        "Creates specialized opcodes for commonly used opcode+operand pairs.",
      inputCode: `console.log("Hello World!");`,
      outputFormatter: (code, isBefore) => {
        if (isBefore) {
          return code.match(
            /^ *case OP\.LOAD_THIS:\s*\n( *)\{[\s\S]*?\n\1\}/m,
          )?.[0];
        }

        return code.match(
          /^ *case\s+[^\n:]*:\s*\n( *)\{\s*\n *\/\/[^\n]*\(specialized\)[\s\S]*?\n\1\}/m,
        )?.[0];
      },
    },
    aliasedOpcodes: {
      description:
        "Creates duplicate opcodes, including variants with shuffled operand order.",
      inputCode: `console.log("Hello World!");`,
      outputFormatter: (code, isBefore) => {
        if (isBefore) {
          return code.match(
            /^ *case OP\.LOAD_GLOBAL:\s*\n( *)\{[\s\S]*?\n\1\}/m,
          )?.[0];
        }

        return code.match(
          /^ *case\s+[^\n:]*:\s*\n( *)\{\s*\n *\/\/\s*ALIAS_[^\n]*\(order:[^\n]*\)[\s\S]*?\n\1\}/m,
        )?.[0];
      },
    },
    antiInstrumentation: {
      description:
        "Adds fake opcode effects to hinder opcode analysis and instrumentation.",
      inputCode: `console.log(10 + 15 * 2);`,
      outputFormatter: (code, isBefore) => {
        if (isBefore) {
          return code.match(/^ *case OP\.MUL:\s*\n( *)\{[\s\S]*?\n\1\}/m)?.[0];
        }

        return code.match(
          /^ *case\s+[^\n:]*:\s*\n( *)\{\s*\n *\/\/\s*ANTI_[A-Z]+_[^\n]*[\s\S]*?\n\1\}/m,
        )?.[0];
      },
    },
    selfModifying: {
      description:
        "Function bodies are replaced upon runtime entry to the real bytecode.",
      inputCode: `console.log("Hello World!");`,
      outputBytecode: true,
    },
    timingChecks: {
      description:
        "Detects the use of debuggers by checking for >1second pauses. May break code with slow sync tasks.",
      inputCode: `console.log("Hello World!");`,
      outputFormatter: (code) => {
        return [
          code.match(/^.*\bvar TIMING_CHECKS\s*=.*$/m)?.[0],
          code.match(/^( *)if \(TIMING_CHECKS\)\s*\{[\s\S]*?\n\1\}/m)?.[0],
        ]
          .filter(Boolean)
          .join("\n// ...\n");
      },
    },
    classObfuscation: {
      description:
        "Obfuscates the VM runtime classes by shuffling the order of declarations and methods.",
      inputCode: `console.log("Hello World!");`,
      outputFormatter: (code, isBefore) => {
        return [
          code.match(/^function Upvalue\s*\([\s\S]*?\n\}/m)?.[0],
          code.match(/^function Closure\s*\([\s\S]*?\n\}/m)?.[0],
        ]
          .filter(Boolean)
          .join("\n// ...\n");
      },
    },
    handlerTable: {
      description:
        "Converts the switch-case dispatch into a handler table for performance reasons.",
      inputCode: `console.log("Hello World!");`,
      outputFormatter: (code, isBefore) => {
        if (isBefore) {
          const match = code.match(
            /^( *)switch\s*\(op\)\s*\{[\s\S]*?case OP\.LOAD_GLOBAL:\s*\n( *)\{[\s\S]*?\n\2\}/m,
          );
          if (!match) return;

          return match[0] + "\n" + match[1] + "  // ...\n" + match[1] + "}";
        }

        return code.match(
          /^VMPrototype\[OP\.LOAD_CONST\][\s\S]*?^VMPrototype\[OP\.LOAD_GLOBAL\][\s\S]*?\n\};/m,
        )?.[0];
      },
    },
    // minify: {
    //   description:
    //     "Minifies the final code with Google Closure Compiler. Renames the VM class properties.",
    // },
    // verbose: {
    //   description: "Prints obfuscator info useful for debugging purposes.",
    // },
    // profile: {
    //   description: "Captures a more detailed `profileData` object (slower)",
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

  const obfuscate = (sourceCode, overrideOptions) => {
    if (!overrideOptions) {
      overrideOptions = {
        target: "browser",
        ...optionsRef.current,
        minify: false, // The Google Closure Compiler isn't available for browsers :(
        profile: true, // capture more detailed 'profileData' object
        disassemble: true, // "worker only" option for getting disassembled output added
      };
    }

    return new Promise((resolve, reject) => {
      JsConfuserVM.obfuscate(sourceCode, overrideOptions, {
        onComplete: (data) => {
          resolve(data);
        },
        onError: (data) => {
          // Show error dialog
          reject(data);
        },
      });
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

      if (options.minify) {
        // Use API for Google Closure API

        const minifiedCode = await minify(code);
        result.code =
          "// Minified by https://jscompressor.treblereel.dev/\n" +
          minifiedCode;
      }

      setObfuscationResult(result);

      outputEditor.setValue(result.code);
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

  const step = (runMode) => {
    vmDebugger.next(runMode).catch((error) => {
      console.error("VM Debugger error", error);
    });
  };

  const isDone = debugState?.event === "done";
  const canStepOut = (debugState?.data?.stack?.length ?? 0) > 1;

  const debuggerControls = [
    {
      runMode: "instruction",
      label: "Step Instruction",
      icon: <SkipNext />,
      color: "success.main",
    },
    {
      runMode: "stepOverJump",
      label: "Step Over",
      shortcut: "F10",
      icon: <RedoOutlined />,
      color: "warning.main",
    },
    {
      runMode: "stepInJump",
      label: "Step In",
      shortcut: "F11",
      icon: <ArrowDownward />,
      color: "warning.main",
    },
    {
      runMode: "stepOut",
      label: "Step Out",
      shortcut: "Shift+F11",
      icon: <ArrowUpward />,
      color: "warning.main",
      disabled: !canStepOut,
    },
    // {
    //   runMode: "jump",
    //   label: "Step Jump",
    //   icon: <FastForward />,
    //   color: "info.main",
    // },
    {
      runMode: "all",
      label: "Resume",
      shortcut: "F8",
      icon: <PlayArrow />,
      color: "primary.main",
    },
  ];

  var [showErrorDialog, setShowErrorDialog] = useState();
  var [error, setError] = useState({ errorString: "", errorStack: "" });

  var [showInsightsDialog, setShowInsightsDialog] = useState(false);

  var [showDisassembledDialog, setShowDisassembledDialog] = useState(false);
  var [disassembledDialogPC, setDisassembledDialogPC] = useState(null);
  var [obfuscationResult, setObfuscationResult] = useState();

  useEffect(() => {
    const onKeyDown = (event) => {
      const state = stateRef.current;
      if (!state) return;

      var runMode;
      if (event.key === "F10") {
        runMode = "stepOverJump";
      } else if (event.key === "F11") {
        runMode = event.shiftKey ? "stepOut" : "stepInJump";
      } else if (event.key === "F8") {
        runMode = "all";
      } else return;

      event.preventDefault();

      if (state.event === "done") return;
      if (runMode === "stepOut" && !((state.data?.stack?.length ?? 0) > 1))
        return;

      step(runMode);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleDebugger = () => {
    if (debugState) {
      setDebugState(null);
    } else {
      var enabledOptions = Object.keys(options).filter(
        (optName) => options[optName],
      );
      if (enabledOptions.length) {
        // TODO: Figure out better warning for this
        // alert(
        //   "Warning: You have option(s) enabled (" +
        //     enabledOptions.join(", ") +
        //     ") which will most likely break the debugger. Disable all options for the best results.",
        // );
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

      <ErrorDialog
        error={error}
        open={showErrorDialog}
        onClose={() => {
          setShowErrorDialog(false);
        }}
      />

      <InsightsDialog
        open={showInsightsDialog}
        onClose={() => {
          setShowInsightsDialog(false);
        }}
        profileData={obfuscationResult?.profileData}
      />

      <DisassembledDialog
        open={showDisassembledDialog}
        pc={disassembledDialogPC}
        onClose={() => {
          setShowDisassembledDialog(false);
        }}
        code={obfuscationResult?.disassembled}
      />

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
        obfuscate={obfuscate}
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
                    label: "View Obfuscator Insights",
                    onClick: () => setShowInsightsDialog(true),
                    disabled: !obfuscationResult?.profileData,
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
            <Box
              display="flex"
              alignItems="center"
              gap={0.5}
              px={0.5}
              py={0.5}
              sx={{
                bgcolor: "divider",
                borderRadius: 1,
                flexShrink: 0,
              }}
            >
              {debuggerControls.map(
                ({ runMode, label, shortcut, icon, color, disabled }) => (
                  <Tooltip
                    key={runMode}
                    title={shortcut ? `${label} (${shortcut})` : label}
                  >
                    <span>
                      <IconButton
                        aria-label={label}
                        sx={{ color, width: "36px", height: "36px" }}
                        onClick={() => step(runMode)}
                        disabled={isDone || !!disabled}
                      >
                        {icon}
                      </IconButton>
                    </span>
                  </Tooltip>
                ),
              )}

              <Box
                width="1px"
                height="24px"
                mx={0.5}
                sx={{ bgcolor: "text.disabled", opacity: 0.4 }}
              />

              <Tooltip title="Stop Debugging">
                <IconButton
                  aria-label="Stop Debugging"
                  sx={{ color: "error.main", width: "36px", height: "36px" }}
                  onClick={() => toggleDebugger()}
                >
                  <Stop />
                </IconButton>
              </Tooltip>
            </Box>
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
          }}
          fontFamily="monospace"
        >
          <Box display="flex" gap={1}>
            <Box
              flex={1}
              minWidth={0}
              maxHeight="300px"
              sx={{ overflowY: "auto" }}
            >
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Register</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell width="100%">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(
                      activeFrameRegisters || debugState?.data?.registers || {},
                    ).map(([key, regItem], i) => {
                      return (
                        <RegisterRow
                          key={key}
                          regItem={regItem}
                          regKey={key}
                          vmDebugger={vmDebugger}
                        />
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <Box
              flex={1}
              minWidth={0}
              maxHeight="300px"
              sx={{ overflowY: "auto" }}
            >
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Frame</TableCell>
                      <TableCell>PC</TableCell>
                      <TableCell>Return PC</TableCell>
                      <TableCell>Return Register</TableCell>
                      <TableCell>Frame Size</TableCell>
                      <TableCell>Handler Count</TableCell>
                      <TableCell align="right" sx={{ minWidth: "140px" }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {debugState.data.stack?.map((frame, i) => {
                      var isActiveFrame = activeFrameIndex === i;

                      var start = frame?.base;
                      var end = frame?.fp + frame?.size || 0;

                      return (
                        <TableRow
                          key={i}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                            bgcolor: isActiveFrame
                              ? "hsla(210, 100%, 60%, 0.08)"
                              : "transparent",
                          }}
                        >
                          <TableCell>
                            <strong>#{i}</strong> {frame.isNew ? "new " : ""}
                            {frame.name}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              {frame.pc ?? ""}

                              <IconButton
                                size="small"
                                ml={1}
                                onClick={() => {
                                  setShowDisassembledDialog(true);
                                  setDisassembledDialogPC(frame.pc);
                                }}
                              >
                                <Visibility sx={{ fontSize: "0.9rem" }} />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell>{frame.returnPc ?? ""}</TableCell>
                          <TableCell>
                            {frame.returnReg ? (
                              <>regs[{frame.returnReg ?? ""}]</>
                            ) : (
                              ""
                            )}
                          </TableCell>
                          <TableCell>
                            {end - start} registers ({start} - {end - 1})
                          </TableCell>
                          <TableCell>{frame.handlerCount ?? ""}</TableCell>
                          <TableCell align="right">
                            <Button
                              onClick={() => {
                                if (isActiveFrame) {
                                  setActiveFrame(null);
                                } else {
                                  setActiveFrame({ index: i, fp: frame.fp });
                                }
                              }}
                            >
                              {isActiveFrame ? "Stop Viewing" : "View"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>

          <Box px={2} py={1}>
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
              {debugState?.data?.frame && (
                <Typography
                  variant="caption"
                  fontFamily="inherit"
                  fontSize="medium"
                  color="text.secondary"
                >
                  Frame:{" "}
                  <strong style={{ color: "white" }}>
                    {debugState.data.frame.name}(
                    {debugState.data.frame.params.length + " params"})
                  </strong>{" "}
                  this=
                  <strong style={{ color: "white" }}>
                    {debugState.data.frame.thisValue?.value}
                  </strong>
                </Typography>
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
