export const groups = {
  "Build Settings": [
    {
      type: "probability",
      name: "target",
      modes: ["browser", "node"],
      description: "The execution context for your output.",
    },
    {
      type: "boolean",
      name: "es5",
      displayName: "ES5",
      description:
        "Converts output to ES5-compatible code. Does not cover all cases such as Promises or Generator functions.",
    },
  ],
  Identifiers: [
    {
      type: "probability",
      name: "identifierGenerator",
      modes: ["hexadecimal", "randomized", "zeroWidth", "mangled", "number"],
      description: "Determines how variables are renamed.",
      allowMixingModes: true,
    },
    {
      type: "boolean",
      name: "renameVariables",
      description: "Determines if variables should be renamed.",
    },
    {
      type: "boolean",
      name: "renameGlobals",
      description:
        "Renames top-level variables, turn this off for web-related scripts.",
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
        "String Compression uses LZW's compression algorithm to compress strings.",
    },
    {
      type: "probability",
      name: "stringConcealing",
      description:
        "String Concealing involves encoding strings to conceal plain-text values.",
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
      description: "Global Concealing hides global variables being accessed.",
    },
    {
      type: "probability",
      name: "shuffle",
      modes: ["hash", "true", "false"],
      description:
        "Shuffles the initial order of arrays. The order is brought back to the original during runtime.",
      allowMixingModes: true,
    },
    {
      type: "probability",
      name: "duplicateLiteralsRemoval",
      description:
        "Duplicate Literals Removal replaces duplicate literals with a single variable name.",
    },
  ],
  "Control-Flow": [
    {
      type: "probability",
      name: "controlFlowFlattening",
      description:
        "Control-flow Flattening hinders program comprehension by creating convoluted switch statements.\n\n(⚠️ Significantly impacts performance, use sparingly!)",
    },
    {
      type: "probability",
      name: "dispatcher",
      description: "Creates a middleman function to process function calls.",
    },
    {
      type: "probability",
      name: "opaquePredicates",
      description:
        "An Opaque Predicate is a predicate(true/false) that is evaluated at runtime, this can confuse reverse engineers from understanding your code.",
    },
    {
      type: "probability",
      name: "deadCode",
      description: "Randomly injects dead code.",
    },
  ],
  Functions: [
    {
      type: "probability",
      name: "stack",
      description: "Local variables are consolidated into a rotating array.",
    },
    ,
    {
      type: "probability",
      name: "flatten",
      description: "Brings independent declarations to the highest scope.",
    },
    {
      type: "probability",
      name: "rgf",
      description:
        "RGF (Runtime-Generated-Functions) uses the new Function(code...) syntax to construct executable code from strings.",
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
      description: "When the program is first able to be used.",
    },
    {
      type: "date",
      parentField: "lock",
      name: "endDate",
      description: "When the program is no longer able to be used.",
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
      type: "boolean",
      parentField: "lock",
      name: "selfDefending",
      description:
        "Prevents the use of code beautifiers or formatters against your code.",
    },
    {
      type: "probability",
      parentField: "lock",
      name: "integrity",
      description: "Integrity ensures the source code is unchanged.",
    },
    {
      type: "probability",
      parentField: "lock",
      name: "antiDebug",
      description:
        "Adds debugger statements throughout the code. Additionally adds a background function for DevTools detection.",
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
      name: "hexadecimalNumbers",
      description: "Uses the hexadecimal representation for numbers.",
    },
    {
      type: "boolean",
      name: "compact",
      description: "Remove's whitespace from the final output.",
    },
    {
      type: "boolean",
      name: "minify",
      description: "Minifies redundant code.",
    },
  ],
};
