#### Playground

The JS-Confuser Playground is a rich code editor for obfuscating your JavaScript code.
<br>
[Try It Out](/editor)

##### How to use

- Paste your code into the editor
- Configure the options to your liking
- Click the **Obfuscate** button
- Click the **Download File** button

---

##### 100% Local

JS-Confuser.com runs entirely in your browser, completely offline. This means your input code and actions are never sent to any remote server. You can find the source code for this website [here](https://github.com/MichaelXF/js-confuser-website).

##### Recent Files

JS-Confuser.com saves recently opened files in your browser's FileStorage. These files are also 100% local.

##### Prettier Formatter

JS-Confuser.com comes with Prettier enabled by default. You can disable the auto-formatting feature by navigating to **File** > **Format On Save** > **Uncheck**.

---

##### JSConfuser.js

The `JSConfuser.js` can be edited by navigating to **Tools** > **Edit JSConfuser.JS**. The file serves a JSON representation for your obfuscator settings. The file is evaluated and can additionally include custom implementations.

---{header: "JSConfuser.js"}
var counter = 0;

module.exports = {
target: 'browser',
renameVariables: true,

// Custom Identifier Generator implementation
// Returns `var_0`, `var_1`, `var_2`
identifierGenerator: () => `var_${counter++}`,

// Custom String Concealing
// Always encrypt API endpoints
stringConcealing: (str) => {
if (str.includes('https://api-example.com')) {
return true;
}

    // 60% for other strings
    return Math.random() < 0.6;

},

// ...Other settings...
};

---

---

##### See also

- [Rename Variables](../options/renameVariables)
- [String Concealing](..options/stringConcealing)
