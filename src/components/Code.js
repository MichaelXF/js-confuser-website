import { forwardRef, useContext, useRef } from "react";
import {
  Controlled as CodeMirror,
  UnControlled as UncontrolledCodeMirror,
} from "react-codemirror2";
import "codemirror/mode/javascript/javascript.js";

import "codemirror/theme/material.css";
import "codemirror/theme/material-darker.css";
import "codemirror/theme/material-palenight.css";
import "codemirror/theme/material-ocean.css";
import "codemirror/theme/idea.css";

import { OptionContext, ThemeContext } from "../App";
import { parseSync } from "js-confuser/dist/parser";
import { getIdentifierInfo } from "js-confuser/dist/util/identifiers";
import { Obfuscator } from "js-confuser";
import { correctOptions } from "js-confuser/dist/options";

import traverse from "js-confuser/dist/traverse";

import JSON5 from "json5";

require("codemirror/lib/codemirror.css");

export const themeMap = {
  Material: "material",
  "Material Darker": "material-darker",
  "Material Palenight": "material-palenight",
  "Material Ocean": "material-ocean",
  "VS Code": "vscode-dark",
  "Light Mode": "idea",
};

const Code = forwardRef(
  (
    { indent = 4, code = "", readOnly = false, className, onChange, showAST },
    ref
  ) => {
    var { theme } = useContext(ThemeContext);
    var astRef = useRef();
    var { options } = useContext(OptionContext);

    const codeMirrorTheme = themeMap[theme] || "default";

    return (
      <>
        <CodeMirror
          options={{
            lineNumbers: true,
            theme: codeMirrorTheme,
            mode: "javascript",
            tabSize: indent,
            lineWrapping: true,
            dragDrop: false,
          }}
          value={code}
          onBeforeChange={(editor, data, value) => {
            onChange(value);

            if (showAST) {
              try {
                var tree = parseSync(value);
                var display = JSON5.stringify(tree, null, 2);
                astRef.current.editor.setValue(display);
              } catch (e) {
                astRef.current.editor.setValue(e.toString());
              }
            }
          }}
          onCursor={async (editor, data) => {
            if (astRef.current) {
              var value = editor.getValue();
              var lineNumber = 0,
                characterIndex = 0;

              console.log(data);

              for (var i = 0; i < value.length; i++) {
                if (lineNumber === data.line && characterIndex === data.ch) {
                  break;
                }

                if (value.charAt(i) === "\n") {
                  lineNumber++;
                  characterIndex = 0;
                } else {
                  characterIndex++;
                }
              }

              var calculatedCursorIndex = i;

              try {
                var tree = parseSync(editor.getValue());
                var nodeLocation;

                traverse(tree, (object, parents) => {
                  if (
                    object.start <= calculatedCursorIndex &&
                    object.end >= calculatedCursorIndex
                  ) {
                    nodeLocation = [object, parents];
                  }
                });

                var node = nodeLocation && nodeLocation[0];

                if (node) {
                  // Add Identifier Info
                  if (node.type === "Identifier") {
                    node.identifierInfo = getIdentifierInfo(
                      nodeLocation[0],
                      nodeLocation[1]
                    );
                  }

                  // Add transformation match Info
                  try {
                    var correctedOptions = await correctOptions(options);
                    var obfuscator = new Obfuscator(correctedOptions);

                    node.transformInfo = {};

                    for (var transform of obfuscator.array) {
                      node.transformInfo[transform.className] = transform.match(
                        nodeLocation[0],
                        nodeLocation[1]
                      );
                    }
                  } catch (e) {}
                }

                var display = JSON5.stringify(
                  node || { calculatedCursorIndex, ...tree },
                  null,
                  2
                );
                astRef.current.editor.setValue(display);
              } catch (e) {
                console.error(e);
                astRef.current.editor.setValue(e.toString());
              }
            }
          }}
          className={
            !showAST
              ? "app-codeview-main"
              : "app-codeview-main app-codeview-main-ast"
          }
          ref={ref}
        />

        {showAST ? (
          <UncontrolledCodeMirror
            options={{
              lineNumbers: false,
              theme: codeMirrorTheme,
              mode: {
                name: "javascript",
                jsonld: true,
              },
              tabSize: indent,
              lineWrapping: true,
              dragDrop: false,
              readOnly: true,
            }}
            onBeforeChange={(editor, data, value) => {
              // onChange(value);
            }}
            value={"Click any node to begin..."}
            className={"json-codemirror app-codeview-ast "}
            ref={astRef}
          />
        ) : null}
      </>
    );
  }
);

export default Code;
