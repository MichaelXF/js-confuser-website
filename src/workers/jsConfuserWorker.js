/* eslint-disable no-restricted-globals */
const workerScope = self;

const { Buffer } = require("buffer");

global.Buffer = Buffer;
workerScope.Buffer = Buffer;

const { default: traverse } = require("@babel/traverse");

const JsConfuser = require("js-confuser");
const { default: Obfuscator } = require("js-confuser/dist/obfuscator");

function getByteSize(str) {
  return new Blob([str]).size;
}

/**
 * Modules that JSConfuser.ts can import
 */
const modules = {
  "js-confuser": JsConfuser,
  Buffer: Buffer,
  "@babel/types": require("@babel/types"),
};

function evaluateOptions(optionsJS) {
  if (typeof optionsJS === "object" && optionsJS) return optionsJS;

  const createRequire = function () {
    return (id) => {
      if (modules.hasOwnProperty(id)) {
        return modules[id];
      }

      throw new Error(`Module ${id} not found`);
    };
  };

  return eval(`
    (function (require){
        var module = { exports: {} };
        ${optionsJS}
        
        return module
    })
      `)(createRequire())?.exports;
}

export const obfuscateCode = (requestID, code, optionsJS) => {
  const reportProgress = (log) => {
    postMessage({
      event: "progress",
      data: {
        requestID,
        ...log,
      },
    });
  };

  const reportError = (error) => {
    postMessage({
      event: "error",
      data: {
        requestID,
        errorString: error.toString(),
        errorStack: error?.stack?.toString?.() || null,
      },
    });
  };

  // Evaluate the user's JSConfuser.ts config file
  let options = {};
  try {
    options = evaluateOptions(optionsJS);
  } catch (error) {
    reportError(error);

    return;
  }

  // Obfuscate code with progress callback
  JsConfuser.obfuscateWithProfiler(
    code,
    { ...options, verbose: true },
    {
      callback: reportProgress,
      performance,
    }
  )
    .then((resultObject) => {
      console.log("Successfully obfuscated code");

      postMessage({
        event: "success",
        data: {
          requestID,
          code: resultObject.code,
          profileData: {
            ...resultObject.profileData,

            originalSize: getByteSize(code),
            newSize: getByteSize(resultObject.code),
          },
        },
      });
    })
    .catch((error) => {
      reportError(error);
    });
};

// Collects Pre-obfuscation analysis (Preparation transformation)
export const preObfuscationAnalysis = (requestID, code) => {
  const obfuscator = new Obfuscator({
    target: "node",
    compact: true,
  });
  const ast = Obfuscator.parseCode(code);

  obfuscator.obfuscateAST(ast);

  const meaningfulNodesToSymbols = new Map();

  // Find the symbols
  traverse(ast, {
    enter(path) {
      // Only process objects
      if (!(typeof path.node === "object" && path.node)) return;

      // Get all the symbols
      const propertySymbols = Object.getOwnPropertySymbols(path.node);

      // Store the symbols found as strings in this output object
      const symbolMap = {};

      propertySymbols.forEach((symbol) => {
        const value = path.node[symbol];
        symbolMap[String(symbol)] = !!value;
      });

      // Only save if there are symbols found
      if (Object.keys(symbolMap).length > 0) {
        meaningfulNodesToSymbols.set(path.node, symbolMap);
      }
    },
  });

  postMessage({
    event: "success",
    data: {
      requestID,
      nodes: Array.from(meaningfulNodesToSymbols),
    },
  });
};
