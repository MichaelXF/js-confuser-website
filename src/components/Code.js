import { useContext, useState } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/mode/javascript/javascript.js";

import "codemirror/theme/material.css";
import "codemirror/theme/material-ocean.css";
import "codemirror/theme/darcula.css";
import "codemirror/theme/moxer.css";
import "codemirror/theme/neat.css";

import { ThemeContext } from "../App";

require("codemirror/lib/codemirror.css");

export const themeMap = {
  Material: "material",
  "Material Ocean": "material-ocean",
  Darcula: "darcula",
  Moxer: "moxer",
  "Light Mode": "neat",
};

export default function Code({
  indent = 4,
  code = "",
  readOnly = false,
  className,
  onChange,
}) {
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
    />
  );
}
