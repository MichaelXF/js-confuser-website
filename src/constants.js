import packageJson from "../package.json";

export const LocalStorageKeys = {
  JsConfuserOptionsJS: "JSConfuser_Options",
  JsConfuserEditorOptions: "JSConfuser_EditorOptions",
  JsConfuserASTCode: "JSConfuser_ASTCode",
  JsConfuserMarkdownCode: "JSConfuser_MarkdownCode",
};

export const JsConfuserVersion =
  packageJson.dependencies["js-confuser"].substring(1);

export const landingPageCode = `// Verify the user's license key
async function checkUserLicense(){
  const licenseKey = "YOUR_LICENSE_KEY";

  // Send a request to the license server
  const response = await fetch({
    url: "https://api.example.com/check-license",
    method: "POST",
    body: JSON.stringify({ licenseKey })
  });
  const data = await response.json();

  // User does not have a valid license :(
  if (!data.licenseStatus) {
    alert("You do not have a valid license.");
    process.exit(1);
  }
}`;

export const defaultCode = `/**
 * GitHub: https://github.com/MichaelXF/js-confuser
 * NPM: https://www.npmjs.com/package/js-confuser
 *
 * Welcome to Js Confuser!
 * 
 * You can obfuscate the code with the top left button 'Obfuscate'.
 * 
 * You can customize the obfuscator from the side-panel.
 * (See all options under 'Create Custom Preset')
 *
 * Version: ${JsConfuserVersion}
 *
 * Happy Hacking!
 */

function greet(name) {
  var output = 'Hello ' + name + '!';
  console.log(output);
}

greet('Internet User');`;

export const optionsJSHeader = `// This file is evaluated as JavaScript. You can use JavaScript here.
// Learn more: https://js-confuser.com/docs/getting-started/playground#jsconfuser-ts
\n`;

export const defaultOptionsJS =
  optionsJSHeader +
  `module.exports = {
  preset: "medium",
  target: "browser",
};`;

// AST Explorer
export const astConsoleMessage = `Welcome to the AST Explorer!

This tool allows you to explore the Abstract Syntax Tree (AST) of your JavaScript code.

- You can access the current NodePath with \`path\`

- The root NodePaths \`program\` and \`file\` are exposed for convenience

- Babel Types are available at \`t\`

- You can access the editor with \`editor\` and \`monaco\`

- Most updates are monkey-patched to be reflected in the editor

- You can manually call \`update\` to reprint the AST

- Disable automatic updates with \`updates = false\`
`;

export const presetInfo = {
  high: {
    name: "High",
    performanceReduction: 98,
  },
  medium: {
    name: "Medium",
    performanceReduction: 52,
  },
  low: {
    name: "Low",
    performanceReduction: 30,
  },
};
