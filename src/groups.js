export const groups = {
  "Build Settings": [
    {
      type: "probability",
      name: "target",
      modes: ["browser", "node"],
      description: "The execution context for your output.",
      exampleConfig: {
        target: "node",
      },
    },
    {
      type: "boolean",
      name: "es5",
      displayName: "ES5",
      description:
        "Converts output to ES5-compatible code. Does not cover all cases such as Promises or Generator functions.",

      exampleCode: `var { a, b } = { a: 1, b: 2 };

console.log(...[a, b]);
      `,
    },
  ],
  Identifiers: [
    {
      type: "probability",
      name: "identifierGenerator",
      modes: ["hexadecimal", "randomized", "zeroWidth", "mangled", "number"],
      description: "Determines how variables are renamed.",
      allowMixingModes: true,
      customImplementation: {
        parameters: [],
        description:
          "Customize the new variables name of the program. Returns a `string`.",
        exampleConfig: `module.exports = {
  target: "node",

  // Custom variable names
  identifierGenerator: function () {
    return "$" + Math.random().toString(36).substring(7);
  },
  renameVariables: true,
};`,
      },
      startDocContent: `
      ##### Modes

      | Mode | Description | Example |
      | \`"hexadecimal"\` | Random hex strings | \_0xa8db5 |
      | \`"randomized"\` | Random characters | w$Tsu4G |
      | \`"zeroWidth"\` | Invisible characters | U+200D |
      | \`"mangled"\` | Alphabet sequence | a, b, c |
      | \`"number"\` | Numbered sequence | var_1, var_2 |
      | \`<function>\` | Write a custom name generator | See Below |
      `,
      endDocContent: `
      ##### See also

      - [Rename Variables](./renameVariables)
      `,
    },
    {
      type: "boolean",
      name: "renameVariables",
      description: "Determines if variables should be renamed.",
      exampleCode: `var twoSum = function (nums, target) {
  var hash = {};
  var len = nums.length;
  for (var i = 0; i < len; i++) {
    if (nums[i] in hash) return [hash[nums[i]], i];
    hash[target - nums[i]] = i;
  }
  return [-1, -1];
};

var test = function () {
  var inputNums = [2, 7, 11, 15];
  var inputTarget = 9;
  var expectedResult = [0, 1];

  var actualResult = twoSum(inputNums, inputTarget);
  ok(actualResult[0] === expectedResult[0]);
  ok(actualResult[1] === expectedResult[1]);
};

test();`,
      customImplementation: {
        parameters: [
          {
            parameter: "varName",
            type: "string",
            description: "The variable name proposed to be changed.",
          },
        ],
        description:
          "Control which variable names are changed. Returns a `boolean`.",

        exampleConfig: `module.exports = {
  target: "node",

  // Disable renaming a certain variable
  renameVariables: (varName) => varName != "jQuery",
};`,
      },
    },
    {
      type: "boolean",
      name: "renameGlobals",
      description:
        "Renames top-level variables, turn this off for web-related scripts. **Enabled by default.**",
      customImplementation: {
        parameters: [
          {
            parameter: "varName",
            type: "string",
            description: "The global name proposed to be changed.",
          },
        ],
        description:
          "Control which global names are changed. Returns a `boolean`.",
      },
    },
    {
      type: "probability",
      name: "movedDeclarations",
      description: "Moves variable declarations to the top of the context.",
      exampleCode: `function getAreaOfCircle(radius) {
  var pi = Math.PI;
  var radiusSquared = Math.pow(radius, 2);
  var area = pi * radiusSquared;

  return area;
}`,
    },
  ],
  Strings: [
    {
      type: "probability",
      name: "stringCompression",
      description:
        "String Compression uses LZW's compression algorithm to compress strings.",

      exampleCode: `var str = "Hello, World!";
console.log(str);

var str2 = "Hello, World!";
console.log(str2);
      `,
      customImplementation: {
        parameters: [
          {
            parameter: "strValue",
            type: "string",
            description: "The string proposed to be compressed.",
          },
        ],
        description: "Control which strings are changed. Returns a `boolean`.",
      },
    },
    {
      type: "probability",
      name: "stringConcealing",
      description:
        "String Concealing involves encoding strings to conceal plain-text values.",

      exampleCode: `var str = "Hello, World!";
console.log(str);
      `,
      customImplementation: {
        exampleConfig: `
module.exports = {
  target: "node",

  // Custom String Concealing
  // Always encrypt API endpoints
  stringConcealing: (str) => {
    if (str.includes("https://api-example.com/")) {
      return true;
    }

    // 60% for other strings
    return Math.random() < 0.6;
  },
};`,
        parameters: [
          {
            parameter: "strValue",
            type: "string",
            description: "The string proposed to be encrypted.",
          },
        ],
        description: "Control which strings are changed. Returns a `boolean`.",
      },
    },
    {
      type: "probability",
      name: "stringEncoding",
      description:
        "String Encoding transforms a string into an encoded representation.",
      exampleCode: `var str = "Hello, World!";
console.log(str);`,

      customImplementation: {
        parameters: [
          {
            parameter: "strValue",
            type: "string",
            description: "The string proposed to be encoded.",
          },
        ],
        description: "Control which strings are changed. Returns a `boolean`.",
      },
    },
    {
      type: "probability",
      name: "stringSplitting",
      description:
        "String Splitting splits your strings into multiple expressions.",
      exampleCode: `var str = "Hello, World!";
console.log(str);`,
      customImplementation: {
        parameters: [
          {
            parameter: "strValue",
            type: "string",
            description: "The string proposed to be split.",
          },
        ],
        description: "Control which strings are changed. Returns a `boolean`.",
      },
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
      exampleCode: `var utils = {
  isString: x=>typeof x === "string",
  isBoolean: x=>typeof x === "boolean"
}
if ( utils.isString("Hello") ) {
  // ...
}`,
      exampleConfig: { renameVariables: false },
      customImplementation: {
        parameters: [
          {
            parameter: "objectName",
            type: "string",
            description: "The object proposed to be changed.",
          },
        ],
        description: "Control which objects are changed. Returns a `boolean`.",
      },
    },
    {
      type: "probability",
      name: "globalConcealing",
      description: "Global Concealing hides global variables being accessed.",
      exampleCode: `console.log("Hello World");`,
      customImplementation: {
        parameters: [
          {
            parameter: "name",
            type: "string",
            description: "The global variable proposed to be concealed.",
          },
        ],
        description: "Control which globals are changed. Returns a `boolean`.",
      },
    },
    {
      type: "probability",
      name: "shuffle",
      modes: ["hash", true, false],
      description:
        "Shuffles the initial order of arrays. The order is brought back to the original during runtime.",
      allowMixingModes: true,
      exampleCode: `console.log([1,2,3,4,5,6,7,8,9,10]);`,
    },
    {
      type: "probability",
      name: "duplicateLiteralsRemoval",
      description:
        "Duplicate Literals Removal replaces duplicate literals with a single variable name.",

      exampleCode: `var myBool1 = true;
var myBool2 = true;`,
    },
  ],
  "Control-Flow": [
    {
      type: "probability",
      name: "controlFlowFlattening",
      description:
        "Control-flow Flattening hinders program comprehension by creating convoluted switch statements.\n\n**⚠️ Significantly impacts performance, use sparingly!**",
      exampleCode: `function countTo(num){
  for ( var i = 1; i <= num; i++ ) {
    console.log(i);
  }
}

var number = 10;
countTo(number); // 1,2,3,4,5,6,7,8,9,10
`,
    },
    {
      type: "probability",
      name: "dispatcher",
      description: "Creates a middleman function to process function calls.",
      exampleCode: `function print(x){
  console.log(x);
}

print("Hello World"); // "Hello World"`,
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
      exampleCode: `function add3(x, y, z){
  return x + y + z;
}`,
    },
    {
      type: "probability",
      name: "flatten",
      description: "Brings independent declarations to the highest scope.",
      exampleCode: `(function(){
  var stringToPrint = "Hello World";
  var timesPrinted = 0;

  function printString(){
    timesPrinted++;
    console.log(stringToPrint);
  }

  printString(); // "Hello World"
})();
`,
    },
    {
      type: "probability",
      name: "rgf",
      description: `RGF (Runtime-Generated-Functions) uses the [new Function(code...)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function) syntax to construct executable code from strings.
        - **This can break your code.**
        - **Due to the security concerns of arbitrary code execution, you must enable this yourself.**
        - The arbitrary code is also obfuscated.
        <br>`,
      exampleCode: `function printToConsole(message) {
  console.log(message);
}

printToConsole("Hello World"); // "Hello World"`,
      customImplementation: {
        parameters: [
          {
            parameter: "fnName",
            type: "string",
            description: "The function name proposed to be changed.",
          },
        ],
        description: "Control which function are changed. Returns a `boolean`.",
      },
      startDocContent: `
      ##### Notes
      
      - RGF will only apply to functions that do not rely on any outside-scoped variables. Enable [Flatten](./flatten) along with RGF to apply to these functions.

      - **With Flatten**

      - - RGF is recommended to be used with [Flatten](./flatten). 
      - - Enable \`flatten\` to isolate functions from their original scope so then RGF can then apply on them.

      - **With String Concealing**

      - - RGF is recommended to be used with [String Concealing](./stringConcealing).
      - - Enable \`stringConcealing\` to encrypt the \`new Function(code)\` code string.
      `,

      endDocContent: `##### Other notes
      
      RGF only applies to:

      - Function Declarations or Expressions
      - Cannot be async / generator function
      - Cannot rely on outside-scoped variables
      - Cannot use \`this\`, \`arguments\`, or \`eval\`
      
      ##### See also

      - [Flatten](./flatten)
      - [String Concealing](./stringConcealing)
      `,
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
      exampleConfig: {
        lock: {
          startDate: "2024-01-01",
        },
      },
      optionValues: "Date/string",
    },
    {
      type: "date",
      parentField: "lock",
      name: "endDate",
      description: "When the program is no longer able to be used.",
      exampleConfig: {
        lock: {
          endDate: "2024-12-31",
        },
      },
      optionValues: "Date/string",
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
      name: "tamperProtection",
      description: `Tamper Protection safeguards the runtime behavior from being altered by JavaScript pitfalls.

**⚠️ Tamper Protection requires eval and ran in a non-strict mode environment!**

- **This can break your code.**
- **Due to the security concerns of arbitrary code execution, you must enable this yourself.**
`,
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
      exampleConfig: {
        lock: {
          countermeasures: "onTamperDetected",
        },
      },
    },
  ],
  Output: [
    {
      type: "boolean",
      name: "hexadecimalNumbers",
      description: "Uses the hexadecimal representation for numbers.",
      exampleCode: `var ten = 10;
var negativeSixteen = -16;
var float = 0.01;`,
      exampleConfig: {
        renameVariables: false,
      },
    },
    {
      type: "boolean",
      name: "compact",
      description: "Remove's whitespace from the final output.",
      exampleCode: `/**
 * Computes the nth Fibonacci number iteratively
 * @param {number} num
 * @returns {number} The nth Fibonacci number
 */
function fibonacci(num) {
  var a = 0,
    b = 1,
    c = num;
  while (num-- > 1) {
    c = a + b;
    a = b;
    b = c;
  }
  return c;
}

// Print the first 25 Fibonacci numbers
for (var i = 1; i <= 25; i++) {
  console.log(i, fibonacci(i));
}
      `,
      exampleConfig: {
        compact: true,
        renameVariables: false,
        indent: undefined,
      },
    },
    {
      type: "boolean",
      name: "minify",
      description: "Minifies redundant code.",
      exampleCode: `var { name } = { name: "John Doe" };`,
      exampleConfig: {
        renameVariables: false,
      },
    },
  ],
};
