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
      name: "pack",
      displayName: "Pack",
      description: `Packs the output code into a single \`Function()\` call. Designed to escape strict mode constraints.`,

      exampleCode: `
// Strict mode JavaScript blocks eval() access to local variables
var myVar = "Initial Value";
eval(__JS_CONFUSER_VAR__(myVar) + ' = "Modified Value"');

console.log(myVar); // "Modified Value"
      `,
      docContent: `
      #### Bypass Strict Mode

      The \`Pack\` option is designed to bypass strict mode constraints. This is achieved by wrapping the output code in a \`Function()\` call. This allows the code to be executed in a different context, where strict mode is not enforced.
      
      
      Several features from the \`medium\` and \`high\` presets rely on non-strict mode execution. \`Pack\` is recommended to be used with these presets.
      
      ##### Features

      - With Statement (Control Flow Flattening)
      - Eval scope access (Tamper Protection)
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
      docContent: `
      #### Access the renamed variable

The \`__JS_CONFUSER_VAR__\` function provides a method to access variable mappings. This is especially useful for \`eval()\` scenarios where you want preserve the mapping.

---js
// Input
var message = "Hello world!";
eval(\`console.log(\${ __JS_CONFUSER_VAR__(message)  })\`);

console.log("message was renamed to", __JS_CONFUSER_VAR__(message));

// Output
var nSgZyJf = "Hello world!";
eval(\`console.log(${"nSgZyJf"})\`) // "Hello world!"
console["log"]("message was renamed to", "nSgZyJf") // message was renamed to nSgZyJf
---

Even if \`Rename Variables\` is disabled, the function \`__JS_CONFUSER_VAR__\` will still be removed. (The original name will be returned as a string)


#### Never rename a variable

The \`__NO_JS_CONFUSER_RENAME__\` prefix disables renaming a certain variable. This can be useful for debugging the obfuscator.

---js
// Input
var __NO_JS_CONFUSER_RENAME__message1 = "My first message"
var message2 = "My other message"

console.log(__NO_JS_CONFUSER_RENAME__message1)
console.log(message2)

// Output
var __NO_JS_CONFUSER_RENAME__message1 = "My first message";
var jRLf713 = "My other message";

console.log(__NO_JS_CONFUSER_RENAME__message1),
console.log(jRLf713)
---
      `,
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
      type: "boolean",
      name: "renameLabels",
      description:
        "Renames labeled control-flow statements, and removes unnecessary labels. **Enabled by default.**",
      customImplementation: {
        parameters: [
          {
            parameter: "labelName",
            type: "string",
            description: "The label name proposed to be changed.",
          },
        ],
        description:
          "Control which label names are changed. Returns a `boolean`.",
      },
      exampleCode: `
      A: for(var i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          continue A;
        }
        
        B: {
          console.log(i);
          break B;
        }
      }
      `,
    },
    {
      type: "probability",
      name: "movedDeclarations",
      description: "Moves variable declarations to the top of the context.",
      exampleCode: `
      function getAreaOfCircle(radius) {
        var pi = Math.PI;
        var radiusSquared = Math.pow(radius, 2);
        var area = pi * radiusSquared;

        return area;
      }

      console.log(getAreaOfCircle(3)); // 28.274333882308138
  `,
    },
  ],
  Strings: [
    {
      type: "probability",
      name: "stringCompression",
      description:
        "String Compression uses zlib compression algorithm to compress strings.",

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
      exampleCode: `
      var result = 9 + 3 * 2;
      console.log(result);
      `,
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
  console.log("Correct type"); // "Correct type"
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

      exampleCode: `
      var myBool1 = true;
      var myBool2 = true

      console.log(myBool1 === myBool2); // true
      `,
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

      docContent: `
Your code will be wrapped in a large, complicated switch statement. The makes the behavior of your program very hard to understand and is resistent to deobfuscators. This comes with a large performance reduction.

#### Flattening Control Structures

Control Flow Flattening is able to flatten the following statements:

1. \`If Statement\`
2. \`Function Declaration\`

#### Goto style of code

Control Flow Flattening converts your code into a 'goto style of code.'
Example:

---{header: "Goto style of Code"}
// Input
console.log("Start of code");

if(true){
  console.log("This code runs");
}

console.log("End of code");

// Output
chunk_0:
console.log("Start of code");
var TEST = true;
if( TEST ) goto chunk_1;
else goto chunk_2;

chunk_1:
console.log("This code runs");
goto chunk_2;

chunk_2:
console.log("End of code");
---

JavaScript does not support the \`goto\` keyword. This is where the while-loop and switch statement come in.

---{header: "While-Loop and Switch Statement"}
var state = 0;
while (state != 3) {
  switch (state) {
    case 0: // 'chunk_0'
      console.log("Start of code");
      var TEST = true;
      if (TEST) {
        state = 1; // 'goto chunk_1'
        break;
      }
      state = 2; // 'goto chunk_2'
      break;
    case 1: // 'chunk_1'
      console.log("This code runs");
      state = 2; // 'goto chunk_2'
      break;
    case 2:
      console.log("End of code");
      state = 3; // 'end of program'
      break;
  }
}
---

This code replicates functionality of the \`goto\` statement in JavaScript by using a while-loop paired with a switch-statement.

The 'state' variable determines which chunk will execute. Each chunk is placed as a Switch-case with a number assigned to it.

This is just the simple version of things. JS-Confuser uses a variety of techniques to further obfuscate the switch statement:
      `,

      endDocContent: `
#### Performance reduction

Control Flow Flattening reduces the performance of your program. You should adjust the option \`controlFlowFlattening\` to be a percentage that is appropriate for your app.

#### Other notes

Control Flow Flattening only applies to:

- Blocks of 3 statements or more`,
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
      exampleCode: `
      if(true) {
        console.log("This code runs");
      } else {
        console.log("This code does not run");
      }
      `,
    },
    {
      type: "probability",
      name: "deadCode",
      description: "Randomly injects dead code.",
      exampleCode: `
      if(true) {
        console.log("This code runs");
      } else {
        console.log("This code does not run");
      }
      `,
    },
    {
      type: "probability",
      name: "astScrambler",
      description: "Semantically changes the AST to bypass automated tools.",
      exampleCode: `
      console.log("My First Message");
      console.log("My Second Message");
      console.log("My Third Message");
      `,
    },
  ],
  Functions: [
    {
      type: "probability",
      name: "variableMasking",
      description: "Local variables are consolidated into a rotating array.",
      exampleCode: `
      function add3(x, y, z){
        return x + y + z;
      }
      `,
    },
    {
      type: "probability",
      name: "flatten",
      description: "Brings independent declarations to the highest scope.",
      exampleCode: `
      (function(){
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
      description: `RGF (Runtime-Generated-Functions) creates executable code from strings.
        - **This can break your code.**
        - **Due to the security concerns of arbitrary code execution, you must enable this yourself.**
        - The arbitrary code is also obfuscated.`,
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
      docContent: `
      #### Independent Functions

      RGF will only transform functions that are independent of their scope. A function referencing a variable outside of its scope disqualifies it from being transformed.

      
      If you enable [Flatten](./flatten), you can isolate functions from their original scope so then RGF can then apply on them. This is the recommended way to use RGF.
      `,

      endDocContent: `##### Other notes
      
      RGF only applies to:

      - Function Declarations or Expressions
      - Cannot be async / generator function
      - Cannot rely on outside-scoped variables
      - Cannot use \`this\`, \`arguments\`, or \`eval\`
      `,
      seeAlso: [
        {
          label: "Flatten",
          to: "./flatten",
        },
        {
          label: "String Concealing",
          to: "./stringConcealing",
        },
      ],
    },
  ],
  Lock: [
    {
      type: "regex[]",
      name: "domainLock",
      parentField: "lock",
      description:
        "Ensures the script can only execute on the specified domain. Set the Counter Measures option to control what happens if violated.",
      exampleConfig: {
        lock: {
          domainLock: ["https://example.com", "https://example.org"],
        },
      },
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
      type: "boolean",
      parentField: "lock",
      name: "tamperProtection",
      description: `Tamper Protection safeguards the runtime behavior from being altered by JavaScript pitfalls.

**⚠️ Tamper Protection requires eval and ran in a non-strict mode environment!**

- **This can break your code.**
- **Due to the security concerns of arbitrary code execution, you must enable this yourself.**
`,
      exampleCode: `
      fetch('https://jsonplaceholder.typicode.com/users')
        .then(response => response.json())
        .then(data => {
          console.log(data); // Array of users with names, usernames, and emails
        });
      `,
      customImplementation: {
        parameters: [
          {
            parameter: "fnName",
            type: "string",
            description:
              "The function name proposed receive native check protection.",
          },
        ],
        description: "Control which function are changed. Returns a `boolean`.",
      },
      exampleConfig: {
        globalConcealing: true,
      },
      docContent: `
#### Improves Global Concealing

Tamper Protection with \`Global Concealing\` can detect at runtime if certain global functions have been monkey-patched. The following code exemplifies this:

##### Native function check

---js
var _fetch = fetch;
fetch = (...args)=>{
  console.log("Fetch request intercepted!", ...args)
  return _fetch(...args)
}
---

This monkey-patch can be detected by inspecting the \`fetch.toString()\` value:

---js
// Untampered
fetch.toString() // "function fetch() { [native code] }"


// Tampered
fetch.toString()  // "(...args)=>{\\n  console.log("Fetch request intercepted!", ...args)\\n  return _fetch(...args)\\n}"
---

Certain global functions are checked before each invocation to ensure that (1) the arguments cannot be intercepted and (2) their behavior cannot be altered.

##### Stealthy global

A direct \`eval\` invocation can access the local scope, only if it has not been redefined.

---js
let root = {};
eval("root=this"); // Window {window: ...}
---

This method securely obtains the real global object for both the browser and NodeJS. Properties on the global object can still be changed however.

---

#### Disallows Strict Mode

Tamper Protection requires the script to run in non-strict mode. Detection of the script in Strict Mode will be considered tampering. You can control the tampering response using the \`lock.countermeasures\` option.
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
      exampleCode: `
      function protectedFunction(){
        console.log("This code is protected");
      }
        
      protectedFunction(); // "This code is protected"
      `,
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
      docContent: `
      #### How is this possible?

JavaScript has a sneaky method to view the source code any function. Calling \`Function.toString()\` on any function reveals the raw source code.


Integrity uses a hashing algorithm on the obfuscated code during the obfuscation-phase. The obfuscator then places checksum functions throughout the output code to verify it's unchanged at runtime.


An additional RegEx is utilized to remove spaces, newlines, braces, and commas. This ensures the hash isn't too sensitive.

#### Tamper Detection

If tampering is detected, the \`lock.countermeasures\` function will be invoked. If you don't provide a \`lock.countermeasures\` function, the default behavior is to crash the program.


[Learn more about the countermeasures function](Countermeasures.md)
      `,
      endDocContent: `
      #### Potential Issues

If you decide to use Integrity, consider the following:

1. Any build-tools must not modify the locked code. The code can't be changed after JS-Confuser is applied.
2. \`Function.toString()\` functionality may not be enabled in your environment (bytenode)
      `,
    },
    {
      type: "probability",
      parentField: "lock",
      name: "antiDebug",
      description: "Adds debugger statements throughout the code.",
    },
    {
      type: "string",
      parentField: "lock",
      name: "countermeasures",
      description:
        "A custom callback function to invoke when a lock is triggered.",
      exampleCode: `
      function onTamperDetected(){
        throw new Error("The code has been tampered with!");
      }
      `,
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
      exampleCode: `
      var ten = 10;
      var negativeSixteen = -16;
      var float = 0.01;

      console.log(ten, negativeSixteen, float);
      `,
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
      exampleCode: `
      var { fullName } = { fullName: "John Doe" };

      console.log(fullName); // "John Doe"
      `,
      docContent: `
      #### Minify Techniques

      - Dead code elimination
      - Variable grouping
      - Constant folding
      - Shorten literals: 
      - - \`true\` to \`!0\`
      - - \`false\` to \`!1\`
      - - \`Infinity\` to \`1/0\`
      - - \`undefined\` to \`void 0\`
      - Remove unused variables and functions
      - Bracket to dot notation
      - Remove redundant braces
      - If statement to ternary operator
      - Expression consolidation
      `,
    },
  ],
};
