import { forwardRef, useContext } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/mode/javascript/javascript.js";

import "codemirror/theme/material.css";
import "codemirror/theme/material-darker.css";
import "codemirror/theme/material-palenight.css";
import "codemirror/theme/material-ocean.css";
import "codemirror/theme/idea.css";

import { ThemeContext } from "../App";

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
  ({ indent = 4, code = "", readOnly = false, className, onChange }, ref) => {
    var { theme } = useContext(ThemeContext);

    return (
      <CodeMirror
        options={{
          lineNumbers: true,
          theme: themeMap[theme] || "default",
          mode: "javascript",
          tabSize: indent,
          lineWrapping: true,
          dragDrop: false,
        }}
        value={code}
        onBeforeChange={(editor, data, value) => {
          onChange(value);
        }}
        className={className}
        ref={ref}
      />
    );
  }
);

export default Code;
