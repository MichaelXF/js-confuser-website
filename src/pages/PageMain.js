import { useState, useContext, useEffect, useRef } from "react";
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Box,
} from "@chakra-ui/react";
import {
  ArrowForwardIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";
import { FileDrop } from "react-file-drop";
import { Obfuscator, presets } from "js-confuser";

// Import your worker
import worker from "workerize-loader!../worker"; // eslint-disable-line import/no-webpack-loader-syntax

import ModalConfig from "../modals/ModalConfig";
import ModalError from "../modals/ModalError";
import ModalOptions from "../modals/ModalOptions";
import ModalPresets from "../modals/ModalPresets";
import Code, { themeMap } from "../components/Code";

import { useLocalStorage } from "../useLocalStorage";
import { OptionContext, ThemeContext } from "../App";

import Footer from "../components/Footer";
import LoadingOverlay from "../components/LoadingOverlay";
import {
  DEFAULT_BUTTON_STYLE,
  DEFAULT_CODE,
  DEFAULT_OPTIONS,
} from "../Constants";
import WelcomeOverlay from "../components/WelcomeOverlay";
import { useEventListener } from "../useEventListener";
import { parseSync } from "js-confuser/dist/parser";
import { compileJsSync } from "js-confuser/dist/compiler";
import JSON5 from "json5";
import { correctOptions, validateOptions } from "js-confuser/dist/options";
import { Buffer } from "buffer";

window.Buffer = Buffer;

var workerInstance;
function createWorker() {
  if (workerInstance) {
    try {
      workerInstance.terminate();
    } catch (e) {}
  }
  workerInstance = worker(); // Attach an event listener to receive calculations from your worker
}

export default function PageMain() {
  var { theme, setTheme } = useContext(ThemeContext);
  var { options, setOptions } = useContext(OptionContext);
  var [showWelcomeOverlay, setShowWelcomeOverlay] = useLocalStorage(
    "jsconfuser_welcome",
    true
  );
  var [showDeveloperOptions, setShowDeveloperOptions] = useLocalStorage(
    "jsconfuser_developer",
    false
  );

  var [code, setCode] = useState(DEFAULT_CODE);
  var [showFooter, setShowFooter] = useState(false);
  var [originalCode, setOriginalCode] = useState();
  var [obfuscationInfo, setObfuscationInfo] = useState();

  var [indent, setIndent] = useLocalStorage("jsconfuser_indent", 4);

  var [showOptions, setShowOptions] = useState(false);
  var [showConfig, setShowConfig] = useState(false);
  var [showPresets, setShowPresets] = useState(false);
  var [showError, setShowError] = useState(false);
  var [showAST, setShowAST] = useState(false);
  var [error, setError] = useState();

  var [showMenu, setShowMenu] = useState();
  var [showThemes, setShowThemes] = useState(false);
  var alternateIndention = indent === 2 ? 4 : 2;

  var [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  var [loadingInfo, setLoadingInfo] = useState({ progress: "", percent: "" });
  var [outputFileName, setOutputFileName] = useState();

  // Allow user to `esc` key out of Welcome menu
  useEventListener(
    "keydown",
    showWelcomeOverlay
      ? (e) => {
          if (e.keyCode == 27) {
            setShowWelcomeOverlay(false);
          }
        }
      : () => {},
    window
  );

  function obfuscate() {
    if (code === "developer") {
      /**
       * If the user types exactly 'developer' and clicks 'Obfuscate' they can enable the secret developer mode.
       *
       * The secret developer mode comes with:
       * - Parser button
       * - Compile button
       * - Apply transformation button
       * - Obfuscate(with debugger) button
       * - Evaluate code button
       */
      setCode("");
      setShowDeveloperOptions(true);

      alert(
        "WARNING: Developer mode is reserved for advanced users only. You are directly making yourself vulnerable to security exploits by doing this.\n\nIF YOU ARE NOT 100% CERTAIN WHAT YOU'RE ARE DOING, PLEASE DISABLE DEVELOPER MODE IMMEDIATELY. DO THIS BY CLEARING THE COOKIES AND DATA FOR THIS WEBSITE."
      );
      return;
    }

    // Show the loading overlay with 0% percent
    setShowLoadingOverlay(true);
    setLoadingInfo({ progress: "", percent: 0 });

    setTimeout(() => {
      if (!workerInstance) {
        cancel();
      }

      if (typeof workerInstance.obfuscate !== "function") {
        setError({
          errorString: "The workerInstance failed to properly initialize.",
        });
        setShowError(true);

        setShowLoadingOverlay(false);

        return;
      }

      workerInstance.obfuscate(code, options);
    }, 100);
  }

  function cancel() {
    createWorker();
  }

  if (!workerInstance) {
    cancel();
  }

  useEffect(() => {
    // Create an instance of your worker
    var cb = ({ data }) => {
      if (data && data.event) {
        if (data.event === "progress") {
          /**
           * WebWorker emitting progress information
           */
          setLoadingInfo({
            progress: data.data[0] + " - " + data.data[1] + "/" + data.data[2],
            percent: data.data[1] / data.data[2],
          });
        } else if (data.event === "success") {
          /**
           * WebWorker successfully obfuscated code
           */
          setOriginalCode(codeRef.current?.editor?.getValue?.() || code || "");
          setShowLoadingOverlay(false);

          var { obfuscated, info } = data.data;

          setCode(obfuscated);
          setObfuscationInfo(info);
          setShowFooter(true);
        } else if (data.event === "error") {
          /**
           * WebWorker emitting an error
           */
          setShowLoadingOverlay(false);
          setError({
            errorString: data.data.errorString,
            errorStack: data.data.errorStack,
          });
          setShowError(true);
        }
      }
    };
    workerInstance.addEventListener("message", cb);

    return () => {
      workerInstance.removeEventListener("message", cb);
    };
  }, [workerInstance]);

  var toast = useToast();
  var codeRef = useRef();
  window.CodeMirrorRef = codeRef;

  // Creates a success toast
  function successToast(title) {
    toast({
      title: title,
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  }

  // Creates an error toast
  function errorToast(title) {
    toast({
      title: title,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  }

  const setEditorValue = (v) => setCode(v);
  const getEditorValue = () => code;
  const developerObfuscator = async (mode) => {
    // Developer obfuscation automatically sets 'compact' to false for better reading
    options.compact = false;

    try {
      validateOptions(options);
    } catch (e) {
      errorToast(e.toString());
      return;
    }
    var correctedOptions = await correctOptions(options);
    var obfuscator = new Obfuscator(correctedOptions);
    var transform;

    if (mode === "applyTransformation") {
      var names = Object.keys(obfuscator.transforms);

      var transformNameOrIndex = prompt(
        "Apply transformation:\n\n" +
          names.map((name, i) => `${i + 1}. ${name}`).join("\n")
      );

      if (!transformNameOrIndex) {
        return;
      }
      var transformName = isNaN(transformNameOrIndex)
        ? transformNameOrIndex
        : names[parseInt(transformNameOrIndex) - 1];

      transform = obfuscator.transforms[transformName];
      if (!transform) {
        errorToast("Invalid name or number!");
        return;
      }
    }

    try {
      // Parse the users code
      var tree = parseSync(getEditorValue());

      if (mode === "applyTransformation") {
        // Apply the transformation
        await transform.apply(tree);

        // Update the to the generated result
        setEditorValue(compileJsSync(tree, options));

        successToast("Applied " + transformName + "!");
      } else {
        // Apply all transformations
        var output = [];
        var i = 0;

        for (var transformer of obfuscator.array) {
          await transformer.apply(tree);

          output.push(
            "// " +
              transformer.className +
              " (" +
              (i + 1) +
              "/" +
              obfuscator.array.length +
              ")\n" +
              compileJsSync(tree, options)
          );
          i++;
        }

        setEditorValue(output.join("\n\n"));
      }
    } catch (e) {
      errorToast(e.toString());
    }
  };

  return (
    <div>
      {showWelcomeOverlay ? (
        <WelcomeOverlay onClose={() => setShowWelcomeOverlay(false)} />
      ) : null}

      <FileDrop
        frame={document.body}
        onDrop={(files, event) => {
          event.preventDefault();

          if (files.length !== 1) {
            errorToast("Error: Max 1 file at a time");
            return;
          }

          var firstFile = files[0];
          if (
            firstFile.type !== "application/x-javascript" &&
            firstFile.type !== "video/vnd.dlna.mpeg-tts" &&
            firstFile.type !== "text/vnd.qt.linguist" &&
            firstFile.type !== "text/plain" &&
            firstFile.type !== "text/javascript" &&
            firstFile.type !== ""
          ) {
            console.log(firstFile.type);
            errorToast("Error: JavaScript files only");
            return;
          }

          var newName = firstFile.name
            ? firstFile.name.split(".js")[0] + ".obfuscated.js"
            : "";
          setOutputFileName(newName);

          console.log(files);
          var reader = new FileReader();
          reader.onload = (function (reader) {
            return function () {
              var contents = reader.result;
              if (typeof contents !== "string") {
                errorToast("Error: Must be text");
                return;
              }

              setCode(contents);
            };
          })(reader);

          reader.readAsText(firstFile);
          setShowFooter(false);
        }}
      >
        <CopyIcon mb={3} fontSize="3xl" />

        <p>Drop files to upload your code</p>
      </FileDrop>

      <Code
        indent={indent}
        code={code}
        onChange={setCode}
        ref={codeRef}
        showAST={showAST}
      ></Code>

      {showLoadingOverlay ? (
        <LoadingOverlay
          loadingInfo={loadingInfo}
          onCancel={() => {
            setShowLoadingOverlay(false);
            cancel();
          }}
        />
      ) : null}

      <ModalOptions
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        onBack={() => {
          setShowOptions(false);
          setShowPresets(true);
        }}
      />
      <ModalConfig isOpen={showConfig} onClose={() => setShowConfig(false)} />
      <ModalPresets
        isOpen={showPresets}
        onClose={() => setShowPresets(false)}
        onCustomPreset={() => {
          setShowOptions(true);
          setShowPresets(false);
          setOptions((options) => {
            return {
              ...(presets[options.preset] || {}),
              ...options,
              preset: null,
            };
          });
        }}
      />
      <ModalError
        isOpen={showError}
        onClose={() => {
          setShowError(false);
        }}
        error={error}
      />

      {showFooter ? (
        <Footer
          codeRef={codeRef}
          outputFileName={outputFileName}
          onReset={() => {
            setCode(originalCode);
            setShowFooter(false);
            setOutputFileName("");
          }}
          obfuscationInfo={obfuscationInfo}
          getEditorCode={() => {
            return codeRef.current?.editor?.getValue?.();
          }}
        />
      ) : null}

      {showDeveloperOptions ? (
        <Box className="app-dev-floater">
          <Menu>
            <MenuButton
              as={Button}
              variant="link"
              colorScheme="blue"
              rightIcon={<ChevronUpIcon />}
            >
              Developer Options
            </MenuButton>
            <MenuList>
              <MenuItem
                onClick={() => {
                  setShowAST(!showAST);
                }}
              >
                {showAST ? "Hide" : "Show"} AST
              </MenuItem>
              <MenuItem
                onClick={async () => {
                  developerObfuscator("applyTransformation");
                }}
              >
                Apply transformation
              </MenuItem>
              <MenuItem
                onClick={() => {
                  developerObfuscator("debugObfuscation");
                }}
              >
                Obfuscate code
              </MenuItem>
              <MenuItem
                onClick={() => {
                  /**
                   * WARNING: Eval is used!
                   *
                   * This option is only available in the secret developer mode.
                   */
                  var _Console = window.console;

                  var lines = [];
                  var log = (x) => lines.push(x);

                  var console = {
                    log: log,
                    error: log,
                    warn: log,
                    info: log,
                    debug: log,
                  };

                  window.console = console;

                  try {
                    eval(getEditorValue());
                  } catch (e) {
                    lines = ["" + e];
                  }

                  setEditorValue(
                    lines
                      .join("\n")
                      .split("\n")
                      .map((x) => `// ${x}`)
                      .join("\n")
                  );

                  window.console = _Console;
                }}
              >
                Evaluate code
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
      ) : null}

      <Box
        className="app-toolbar"
        onClick={(e) => {
          e.stopPropagation();

          codeRef.current?.editor?.focus?.();
        }}
      >
        <Menu
          placement="bottom-end"
          onOpen={() => {
            setShowThemes(false);
            setShowMenu(true);
          }}
          onClose={() => {
            setShowMenu(false);
            setTimeout(() => {
              setShowThemes((state) => (state === "ANIMATING" ? true : false));
            }, 300);
          }}
          isOpen={showMenu}
        >
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            onClick={(e) => e.stopPropagation()}
            {...DEFAULT_BUTTON_STYLE}
            title="Click to show options"
          >
            {showThemes ? "Themes" : "Options"}
          </MenuButton>
          <MenuList>
            {showThemes ? (
              Object.keys(themeMap).map((themeName) => {
                var isEnabled = theme === themeName;
                return (
                  <MenuItem
                    key={themeName}
                    onClick={() => {
                      setTheme(themeName);
                    }}
                  >
                    {themeName}
                    {isEnabled ? (
                      <CheckIcon color="gray.400" ml="auto" fontSize="sm" />
                    ) : null}
                  </MenuItem>
                );
              })
            ) : (
              <>
                <MenuItem
                  onClick={() => {
                    setIndent(alternateIndention);
                  }}
                >
                  Set indention to {alternateIndention} spaces
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    if (options.preset === null) {
                      setShowOptions(true);
                    } else {
                      setShowPresets(true);
                    }
                  }}
                >
                  Obfuscator Options
                </MenuItem>
                <MenuItem onClick={() => setShowConfig(true)}>
                  Export Config
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setCode(DEFAULT_CODE);
                    setShowFooter(false);
                    setOutputFileName("");
                    setOriginalCode("");

                    successToast("Reset editor.");
                  }}
                >
                  Reset Editor
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setOptions(DEFAULT_OPTIONS);
                    successToast("Factory reset config.");
                  }}
                >
                  Factory Reset Config
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    setTimeout(() => {
                      setShowThemes("ANIMATING");

                      setShowMenu(true);

                      setTimeout(() => {
                        setShowThemes(true);
                      }, 300);
                    }, 300);
                  }}
                >
                  Change theme
                  <ArrowForwardIcon ml="auto" />
                </MenuItem>

                <a
                  href="https://github.com/MichaelXF/js-confuser"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MenuItem>
                    Leave feedback
                    <ExternalLinkIcon ml="auto" />
                  </MenuItem>
                </a>

                <MenuItem
                  onClick={() => {
                    setShowWelcomeOverlay(true);
                  }}
                >
                  Help
                </MenuItem>
              </>
            )}
          </MenuList>
        </Menu>

        <Button
          ml={2}
          colorScheme="blue"
          onClick={(e) => {
            e.stopPropagation();

            if (!code) {
              errorToast("No code to obfuscate.");
              return;
            }

            if (!options || typeof options !== "object") {
              errorToast("Invalid options object.");
              return;
            }

            if (!options.target) {
              options.target = "browser";
            }

            if (!options.preset && !options.hasOwnProperty("compact")) {
              options.compact = true;
            }

            obfuscate();
          }}
          title="Click to obfuscate"
        >
          Obfuscate
        </Button>
      </Box>
    </div>
  );
}
