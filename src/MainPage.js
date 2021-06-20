import Code, { themeMap } from "./components/Code";
import "./App.scss";
import { Alert, Button, Dropdown, Icon, Loader } from "rsuite";
import { useMemo, useState, useContext } from "react";
import ModalOptions from "./modals/ModalOptions";
import ModalConfig from "./modals/ModalConfig";
import { useLocalStorage } from "./useLocalStorage";

// Import your worker
import worker from "workerize-loader!./worker"; // eslint-disable-line import/no-webpack-loader-syntax
import { OptionContext, ThemeContext } from "./App";
import download from "./download";
import Presets from "./presets";

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

export default function MainPage() {
  var { theme, setTheme } = useContext(ThemeContext);
  var { options, setOptions } = useContext(OptionContext);

  var [code, setCode] = useState(defaultCode);
  var [showFooter, setShowFooter] = useState(false);

  var [indent, setIndent] = useLocalStorage("jsconfuser_indent", 4);

  var [showOptions, setShowOptions] = useState(false);
  var [showConfig, setShowConfig] = useState(false);
  var alternateIndention = indent == 2 ? 4 : 2;

  var [loading, setLoading] = useState(false);

  // Create an instance of your worker
  const workerInstance = worker(); // Attach an event listener to receive calculations from your worker
  workerInstance.addEventListener("message", ({ data }) => {
    if (data.event === "success") {
      setLoading(false);
      setCode(data.data);
      setShowFooter(true);
    } else if (data.event === "error") {
      setLoading(false);
      setCode("[Error]\n\n" + data.data.toString());
    }
  });

  function obfuscate() {
    setLoading(true);
    setTimeout(() => {
      workerInstance.obfuscate(code, options);
    }, 100);
  }

  return (
    <div>
      <Code
        indent={indent}
        className='app-codeview'
        code={code}
        onChange={setCode}
      ></Code>

      {loading ? (
        <div className='app-loading-container'>
          <Loader content='Obfuscating code...' vertical />

          <Button onClick={() => setLoading(false)} className='mt-5'>
            Cancel
          </Button>
        </div>
      ) : null}

      <ModalOptions show={showOptions} onHide={() => setShowOptions(false)} />
      <ModalConfig show={showConfig} onHide={() => setShowConfig(false)} />

      {showFooter ? (
        <div className='app-footer-toolbar'>
          <Button
            appearance='primary'
            size='lg'
            className='mx-1'
            onClick={() => {
              download("obfuscated.js", code);
            }}
          >
            <Icon icon='arrow-circle-down' /> Download
          </Button>
          <Button
            size='lg'
            className='mx-1'
            onClick={() => {
              setCode("");
              setShowFooter(false);
            }}
          >
            Reset Editor
          </Button>
        </div>
      ) : null}

      <div className='app-toolbar'>
        <Dropdown
          appearance='default'
          size='lg'
          title='Options'
          placement='bottomEnd'
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
          <Dropdown.Item onSelect={() => setCode("")}>
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
          className='mx-1'
          size='lg'
          appearance='primary'
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
