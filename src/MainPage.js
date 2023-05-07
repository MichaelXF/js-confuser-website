import Code, { themeMap } from "./components/Code";
import "./App.scss";
import { Alert, Button, Dropdown, Icon, Loader, Progress } from "rsuite";
import { useState, useContext, useEffect } from "react";
import ModalOptions from "./modals/ModalOptions";
import ModalConfig from "./modals/ModalConfig";
import { useLocalStorage } from "./useLocalStorage";

// Import your worker
import worker from "workerize-loader!./worker"; // eslint-disable-line import/no-webpack-loader-syntax
import { OptionContext, ThemeContext } from "./App";
import download from "./download";
import Presets from "./presets";
import { FileDrop } from "react-file-drop";
import packageJson from "../package.json";

const defaultCode = `/**
* GitHub: https://github.com/MichaelXF/js-confuser
* NPM: https://www.npmjs.com/package/js-confuser
*
* Welcome to Js Confuser!
* 
* You can obfuscate the code with the top right button 'Obfuscate'.
* 
* You can customize the obfuscator with the button 'Options'.
* (Set the target to 'node' for NodeJS apps)
* 
* Version: ${packageJson.dependencies["js-confuser"].substring(1)}
* 
* Happy Hacking!
*/

function greet(name){
    var output = "Hello " + name + "!";
    console.log(output);
}

greet("Internet User");`;

var workerInstance;
function createWorker() {
  if (workerInstance) {
    try {
      workerInstance.terminate();
    } catch (e) {}
  }
  workerInstance = worker(); // Attach an event listener to receive calculations from your worker
}

export default function MainPage() {
  var { theme, setTheme } = useContext(ThemeContext);
  var { options, setOptions } = useContext(OptionContext);

  var [code, setCode] = useState(defaultCode);
  var [showFooter, setShowFooter] = useState(false);
  var [originalCode, setOriginalCode] = useState();

  var [indent, setIndent] = useLocalStorage("jsconfuser_indent", 4);

  var [showOptions, setShowOptions] = useState(false);
  var [showConfig, setShowConfig] = useState(false);
  var alternateIndention = indent == 2 ? 4 : 2;

  var [loading, setLoading] = useState(false);
  var [progress, setProgress] = useState(false);
  var [percent, setPercent] = useState(false);
  var [outputFileName, setOutputFileName] = useState();

  function obfuscate() {
    setLoading(true);
    setProgress("");
    setPercent(0);
    setTimeout(() => {
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
          setProgress(data.data[0] + " - " + data.data[1] + "/" + data.data[2]);
          setPercent(data.data[1] / data.data[2]);
        } else if (data.event === "success") {
          /**
           * WebWorker successfully obfuscated code
           */
          setOriginalCode(code || "");
          setLoading(false);
          setCode(data.data + "");
          setShowFooter(true);
        } else if (data.event === "error") {
          /**
           * WebWorker emitting an error
           */
          setLoading(false);
          setCode(
            "// An error occurred during obfuscation\n\n" + data.data.toString()
          );
        }
      }
    };
    workerInstance.addEventListener("message", cb);

    return () => {
      workerInstance.removeEventListener("message", cb);
    };
  }, [workerInstance]);

  return (
    <div>
      <FileDrop
        frame={document.body}
        onDrop={(files, event) => {
          event.preventDefault();

          if (files.length !== 1) {
            Alert.error("Error: Max 1 file at a time");
            return;
          }

          var firstFile = files[0];
          if (
            firstFile.type !== "application/x-javascript" &&
            firstFile.type !== "video/vnd.dlna.mpeg-tts" &&
            firstFile.type !== "text/plain" &&
            firstFile.type !== "text/javascript" &&
            firstFile.type !== ""
          ) {
            console.log(firstFile.type);
            Alert.error("Error: JavaScript files only");
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
                Alert.error("Error: Must be text");
                return;
              }

              setCode(contents);
            };
          })(reader);

          reader.readAsText(firstFile);
        }}
      >
        <Icon icon="file-code-o" size="3x" className="mb-2" />

        <p>Drop files to upload your code</p>
      </FileDrop>

      <Code
        indent={indent}
        className="app-codeview"
        code={code}
        onChange={setCode}
      ></Code>

      {loading ? (
        <div className="app-loading-container">
          <Loader
            content={
              "Obfuscating code..." + (progress ? " (" + progress + ")" : "")
            }
            vertical
          />

          <Button
            onClick={() => {
              setLoading(false);
              cancel();
            }}
            className="mt-5"
          >
            Cancel
          </Button>

          <div className="app-loading-progress-bar text-sm">
            <Progress.Line
              percent={Math.floor(percent * 100)}
              strokeWidth={"4px"}
            />
          </div>
        </div>
      ) : null}

      <ModalOptions show={showOptions} onHide={() => setShowOptions(false)} />
      <ModalConfig show={showConfig} onHide={() => setShowConfig(false)} />

      {showFooter ? (
        <div className="app-footer-toolbar">
          <Button
            appearance="primary"
            size="lg"
            className="mx-1"
            onClick={() => {
              download(outputFileName || "obfuscated.js", code);
            }}
          >
            <Icon icon="arrow-circle-down" /> Download
          </Button>
          <Button
            size="lg"
            className="mx-1"
            onClick={() => {
              setCode(originalCode);
              setShowFooter(false);
              setOutputFileName("");
            }}
          >
            Reset Editor
          </Button>
        </div>
      ) : null}

      <div className="app-toolbar">
        <Dropdown
          appearance="default"
          size="lg"
          title="Options"
          placement="bottomEnd"
        >
          <Dropdown.Item
            onSelect={() => {
              setIndent(alternateIndention);
            }}
          >
            Set indention to {alternateIndention} spaces
          </Dropdown.Item>
          <Dropdown.Item
            onSelect={() => {
              setShowOptions(true);
              Alert.closeAll();
            }}
          >
            Obfuscator Options
          </Dropdown.Item>
          <Dropdown.Item onSelect={() => setShowConfig(true)}>
            Export Config
          </Dropdown.Item>
          <Dropdown.Item
            onSelect={() => {
              setCode("");
              setShowFooter(false);
              setOutputFileName("");
            }}
          >
            Clear Editor
          </Dropdown.Item>
          <Dropdown.Item
            onSelect={() => {
              setOptions(Presets.medium);
              Alert.success("Factory reset config.");
            }}
          >
            Factory Reset Config
          </Dropdown.Item>
          <Dropdown.Menu title="Theme" pullLeft>
            {Object.keys(themeMap).map((x) => {
              return (
                <Dropdown.Item
                  onSelect={() => {
                    setTheme(x);
                  }}
                >
                  {theme == x ? <Icon icon="check"></Icon> : null}
                  {x}
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>

          <Dropdown.Item
            onSelect={(x) =>
              alert(
                "JsConfuser is a JavaScript obfuscator. Paste your code in and click 'Obfuscate'."
              )
            }
          >
            Help
          </Dropdown.Item>
        </Dropdown>

        <Button
          className="mx-1"
          size="lg"
          appearance="primary"
          onClick={() => {
            if (!code) {
              Alert.error("No code to obfuscate.");
              return;
            }

            if (!options.target) {
              options.target = "browser";
            }

            if (!options.hasOwnProperty("compact")) {
              options.compact = false;
            }

            obfuscate();
          }}
        >
          Obfuscate
        </Button>
      </div>
    </div>
  );
}
