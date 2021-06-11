import Code, { themeMap } from "./components/Code";
import "./App.scss";
import { Alert, Button, Dropdown, Icon, Loader, Panel } from "rsuite";
import { createContext, useMemo, useState } from "react";
import ModalOptions from "./modals/ModalOptions";
import useCookie from "./useCookie";
import JsConfuser, { debugTransformations } from "js-confuser";
import Presets from "./presets";
import ModalConfig from "./modals/ModalConfig";

const acorn = require("acorn");

const defaultCode = `/**
* GitHub: https://github.com/MichaelXF/js-confuser
* NPM: https://www.npmjs.com/package/js-confuser
*
* Welcome to Js Confuser
* 
* You can obfuscate the code with the top right button 'Obfuscate'.
* 
* You can customize the obfuscator with the button 'Options'.
* (Set the target to 'node' for NodeJS apps)
*
* Happy Hacking!
*/

function greet(name){
    var output = "Hello " + name + "!";
    console.log(output);
}

greet("Internet User");`;

export const ThemeContext = createContext({ theme: "", setTheme: () => {} });
export const OptionContext = createContext({
  options: {},
  setOptions: () => {},
});

export const groups = {
  "Build Settings": [
    {
      type: "probability",
      name: "target",
      modes: ["browser", "node"],
      description: "The context where the program will run.",
    },
    {
      type: "boolean",
      name: "es5",
      displayName: "ES5",
      description: "ES5 Support",
    },
  ],
  Identifiers: [
    {
      type: "probability",
      name: "identifierGenerator",
      modes: ["hexadecimal", "randomized", "zeroWidth", "mangled", "number"],
      description: "Controls how replaced variable names will look like.",
    },
    {
      type: "boolean",
      name: "renameVariables",
      description:
        "Renames variables with meaningless randomly generated names.",
    },
    {
      type: "boolean",
      name: "renameGlobals",
      description:
        "Renames top-level variables, keep this off for web-related scripts.",
    },
    {
      type: "probability",
      name: "nameRecycling",
      description: "Attempts to reuse released names.",
    },
    {
      type: "probability",
      name: "movedDeclarations",
      description: "Moves variable declarations to the top of the context.",
    },
  ],
  Strings: [
    {
      type: "probability",
      name: "stringCompression",
      description:
        "String Compression uses LZW's compression algorithm to reduce file size.",
    },
    {
      type: "probability",
      name: "stringConcealing",
      description:
        "String Concealing hides strings by encryption. The strings are then deciphered at runtime.",
    },
    {
      type: "probability",
      name: "stringEncoding",
      description:
        "String Encoding transforms a string into an encoded representation.",
    },
    {
      type: "probability",
      name: "stringSplitting",
      description:
        "String Splitting splits your strings into multiple expressions.",
    },
  ],
  Data: [
    {
      type: "probability",
      name: "calculator",
      description:
        "Creates a calculator function to handle arithmetic and logical expressions.",
    },
    {
      type: "probability",
      name: "objectExtraction",
      description: "Extracts object properties into separate variables.",
    },
    {
      type: "probability",
      name: "globalConcealing",
      description: "Changes global variables to `window['prop']`",
    },
    {
      type: "probability",
      name: "shuffle",
      modes: ["hash", "true", "false"],
      description:
        "Shuffles the elements in arrays. The array is then 'unshuffled' at runtime.",
    },
    {
      type: "probability",
      name: "duplicateLiteralsRemoval",
      description: "Removes stuff. Works good with Shuffle.",
    },
  ],
  "Control-Flow": [
    {
      type: "probability",
      name: "controlFlowFlattening",
      description:
        "Control Flow Flattening (CFF) conceals the control-flow of the program.",
    },
    {
      type: "probability",
      name: "dispatcher",
      description:
        "Dispatcher masks functions calls and payloads by creating a proxy function.",
    },
    {
      type: "probability",
      name: "opaquePredicates",
      description: "Adds opaque predicates which makes static analysis harder.",
    },
    {
      type: "probability",
      name: "deadCode",
      description: "Randomly injects dead code throughout the program.",
    },
  ],
  Functions: [
    {
      type: "probability",
      name: "eval",
      description:
        "Wraps function's code into eval() statements. From MDN: Executing JavaScript from a string is an enormous security risk. It is far too easy for a bad actor to run arbitrary code when you use eval(). Never use eval()!",
    },
    {
      type: "probability",
      name: "rgf",
      description:
        "Uses the 'new Function' syntax to construct functions from strings. This is just as dangerous as eval.",
    },
    {
      type: "probability",
      name: "stack",
      description: "Local variables are consolidated into a rotating array.",
    },
    ,
    {
      type: "probability",
      name: "flatten",
      description: "Brings independent declarations to the highest scope. ",
    },
  ],
  Lock: [
    {
      type: "regex[]",
      name: "domainLock",
      parentField: "lock",
      description:
        "Ensures the script can only execute on the specified domain. Set the Counter Measures option to control what happens if violated.",
    },
    {
      type: "date",
      parentField: "lock",
      name: "startDate",
      description: "The minimum date the program is able to run.",
    },
    {
      type: "date",
      parentField: "lock",
      name: "endDate",
      description: "The maximum date the program is able to run.",
    },
    {
      type: "probability",
      parentField: "lock",
      name: "integrity",
      description:
        "Integrity uses checksum techniques to validate the code is unchanged.",
    },
    {
      type: "probability",
      parentField: "lock",
      name: "antiDebug",
      description:
        "Adds debugger statements throughout the code. Additionally adds a background function for DevTools detection. ",
    },
    {
      type: "string",
      parentField: "lock",
      name: "countermeasures",
      description:
        "A custom callback function to invoke when a lock is triggered.",
    },
  ],
  Output: [
    {
      type: "boolean",
      name: "compact",
      description: "Trims whitespace and empty lines from the final output",
    },
    {
      type: "boolean",
      name: "minify",
      description: "Removes redundant code for a smaller bundle size",
    },
  ],
};

export default function App() {
  var [theme, setTheme] = useCookie("jsconfuser_theme", "Material");
  var [code, setCode] = useState(defaultCode);
  var [indent, setIndent] = useCookie("jsconfuser_indent", 4);
  var [options, setOptions] = useCookie("jsconfuser_options", {
    ...Presets.medium,
  });
  var [debug, setDebug] = useCookie("jsconfuser_debugger", false);
  var [frames, setFrames] = useState([]);

  var themeValue = useMemo(() => {
    return {
      theme,
      setTheme,
    };
  }, [theme]);
  var optionsValue = useMemo(() => {
    return {
      options,
      setOptions,
    };
  }, [options]);

  var [show, setShow] = useState(false);
  var [showConfig, setShowConfig] = useState(false);
  var alternate = indent == 2 ? 4 : 2;

  return (
    <ThemeContext.Provider value={themeValue}>
      <OptionContext.Provider value={optionsValue}>
        <Code
          indent={indent}
          className='app-codeview'
          code={code}
          onChange={setCode}
        ></Code>
        <ModalOptions show={show} onHide={() => setShow(false)} />
        <ModalConfig show={showConfig} onHide={() => setShowConfig(false)} />

        <div className='app-toolbar'>
          {debug ? (
            <Dropdown
              appearance='link'
              size='lg'
              title='Debugger'
              placement='bottomEnd'
            >
              {frames.map((x, i) => {
                return (
                  <Dropdown.Item onSelect={() => setCode(x.code)}>
                    {i + 1}/{frames.length} {x.name}
                    {x.error ? " (error)" : ""}
                  </Dropdown.Item>
                );
              })}
              <Dropdown.Item
                onSelect={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(
                      acorn.parse(code, {
                        ecmaVersion: "latest",
                        sourceType: "module",
                      })
                    )
                  );
                  Alert.success("Copied AST to clipboard.");
                }}
              >
                Export AST
              </Dropdown.Item>
              <Dropdown.Item onSelect={() => setDebug(false)}>
                Disable Debug Mode
              </Dropdown.Item>
            </Dropdown>
          ) : null}

          <Dropdown
            appearance='default'
            size='lg'
            title='Options'
            placement='bottomEnd'
          >
            <Dropdown.Item
              onSelect={() => {
                setIndent(alternate);
              }}
            >
              Set indention to {alternate} spaces
            </Dropdown.Item>
            <Dropdown.Item
              onSelect={() => {
                setShow(true);
                Alert.closeAll();
              }}
            >
              Obfuscator Options
            </Dropdown.Item>
            <Dropdown.Item onSelect={() => setShowConfig(true)}>
              Export Config
            </Dropdown.Item>
            <Dropdown.Item onSelect={() => setCode("")}>
              Clear Editor
            </Dropdown.Item>
            <Dropdown.Menu title='Theme' pullLeft>
              {Object.keys(themeMap).map((x) => {
                return (
                  <Dropdown.Item
                    onSelect={() => {
                      setTheme(x);
                    }}
                  >
                    {theme == x ? <Icon icon='check'></Icon> : null}
                    {x}
                  </Dropdown.Item>
                );
              })}
            </Dropdown.Menu>

            <Dropdown.Item onSelect={(x) => setDebug(!debug)}>
              {!debug ? "Enable" : "Disable"} Debug Mode
            </Dropdown.Item>
            <Dropdown.Item
              onSelect={(x) =>
                alert(
                  "JsConfuser is a JavaScript obfuscator. Paste your code in and click 'Obfuscate' to make your code unreadable."
                )
              }
            >
              Help
            </Dropdown.Item>
          </Dropdown>

          <Button
            className='mx-1'
            size='lg'
            appearance='primary'
            onClick={() => {
              if (!code) {
                Alert.error("No code to obfuscate.");
                return;
              }
              if (code.length > 1000) {
                Alert.warning("This may take some time");
              }

              if (!options.target) {
                options.target = "browser";
              }

              if (!options.hasOwnProperty("compact")) {
                options.compact = false;
              }

              var lines = code.split("\n").length;
              var startedAt = Date.now();

              if (debug) {
                debugTransformations(code, options)
                  .then(async (frames) => {
                    setFrames(frames);
                    var hitError = false;

                    for (var i = 0; i < frames.length; i++) {
                      var frame = frames[i];
                      frame.index = i;

                      try {
                        acorn.parse(frame.code, {
                          ecmaVersion: "latest",
                          sourceType: "module",
                        });
                      } catch (e) {
                        frame.error = true;
                        if (!hitError) {
                          hitError = frame;
                        }
                      }

                      setCode(
                        "// " +
                          (i + 1) +
                          "/" +
                          frames.length +
                          " frames captured"
                      );
                    }

                    if (hitError) {
                      setCode(
                        "// An error occurred at transform " +
                          hitError.name +
                          " (" +
                          frame.index +
                          ")"
                      );
                      Alert.error("Syntax error detected.");
                    }
                  })
                  .catch((err) => {
                    console.error(err);
                    Alert.error(err);
                  });
              } else {
                JsConfuser(code, {
                  ...options,
                  verbose: true,
                })
                  .then((output) => {
                    Alert.closeAll();
                    Alert.success(
                      "Obfuscated " +
                        lines +
                        " lines of code in " +
                        (Date.now() - startedAt) +
                        " ms",
                      8000
                    );

                    var error = false;
                    try {
                      acorn.parse(output, {
                        ecmaVersion: "latest",
                        sourceType: "module",
                      });
                    } catch (e) {
                      error = true;
                      try {
                        acorn.parse(output, {
                          ecmaVersion: "latest",
                          sourceType: "script",
                        });
                        error = false;
                      } catch (e) {}
                    }
                    setCode(output);

                    if (error) {
                      Alert.error(
                        "An error occurred during the code generation"
                      );
                    }
                  })
                  .catch((err) => {
                    console.error(err);
                    Alert.error(err.toString());
                  });
              }
            }}
          >
            Obfuscate
          </Button>
        </div>
      </OptionContext.Provider>
    </ThemeContext.Provider>
  );
}
