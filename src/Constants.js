import packageJson from "../package.json";

export const VERSION = packageJson.dependencies["js-confuser"].substring(1);

export const DEFAULT_CODE = `/**
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
* Version: ${VERSION}
* 
* Happy Hacking!
*/

function greet(name){
    var output = "Hello " + name + "!";
    console.log(output);
}

greet("Internet User");`;

export const DEFAULT_OPTIONS = {
  target: "browser",
  preset: "medium",
};

export const DEFAULT_BUTTON_STYLE = {
  backgroundColor: "#374248",
  _hover: {
    backgroundColor: "#495358",
  },
  _active: {
    backgroundColor: "#5a6368",
  },
};
