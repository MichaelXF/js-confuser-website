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
      type: "array",
      parentField: "lock",
      name: "osLock",
      description:
        "Array of operating-systems where the script is allowed to run.",
      modes: ["linux", "windows", "osx", "android", "ios"],
    },
    {
      type: "array",
      parentField: "lock",
      name: "browserLock",
      description: "Array of browsers where the script is allowed to run.",
      modes: ["firefox", "chrome", "iexplorer", "edge", "safari", "opera"],
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
