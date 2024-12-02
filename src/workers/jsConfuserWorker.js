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

export const obfuscateCode = (requestID, code, optionsJS, editorOptions) => {
  const { captureInsights, capturePerformanceInsights } = editorOptions;

  let originalExecutionTime;
  if (captureInsights && capturePerformanceInsights) {
    editorOptions.performanceIterations = parseInt(
      editorOptions.performanceIterations
    );

    originalExecutionTime = getExecutionTime(code, editorOptions);
  }

  const reportProgress = (log, entry, ast) => {
    if (captureInsights) {
      // Calculate the size of the code
      var code = Obfuscator.generateCode(ast);
      entry.fileSize = getByteSize(code);

      // Calculate the execution time (if enabled)
      if (capturePerformanceInsights && log.index !== log.totalTransforms - 1) {
        entry.executionTime = getExecutionTime(code, editorOptions);
      }

      // Count the number of nodes
      var nodeCounts = {
        functions: 0,
        blocks: 0,
        controlFlow: 0,
      };

      traverse(ast, {
        Function(_path) {
          nodeCounts.functions++;
        },
        Block(_path) {
          nodeCounts.blocks++;
        },
        "IfStatement|For|While|SwitchStatement"(_path) {
          nodeCounts.controlFlow++;
        },
      });

      entry.nodeCounts = nodeCounts;
    }

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

      const insightFields = {};

      // Calculate the execution time (if enabled)
      if (captureInsights && capturePerformanceInsights) {
        // Attach the original execution time
        insightFields.originalExecutionTime = originalExecutionTime;

        const lastEntry = Object.values(resultObject.profileData.transforms).at(
          -1
        );

        // Attach the new execution time (And on last transform entry, usually Pack)
        insightFields.newExecutionTime = lastEntry.executionTime =
          getExecutionTime(resultObject.code, editorOptions);
      }

      postMessage({
        event: "success",
        data: {
          requestID,
          code: resultObject.code,
          profileData: {
            ...resultObject.profileData,
            captureInsights,
            capturePerformanceInsights: capturePerformanceInsights,
            ...insightFields,
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

function getExecutionTime(code, editorOptions) {
  const iterations = editorOptions.performanceIterations;
  let times = [];

  try {
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      if (editorOptions.strictModeEval) {
        eval(code);
      } else {
        new Function(code)();
      }
      const executionTime = performance.now() - start;
      times.push(executionTime);
    }
  } catch (_error) {
    // Script failed to execute
    return null;
  }

  // Average times
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;

  return avg;
}

/**
 * Start of Advanced Tools
 * Most features regular users won't use
 */

let walkthroughAst = null;
export const applyTransformations = (
  requestID,
  code,
  optionsJS,
  transformationNames
) => {
  if (typeof code === "string") {
    walkthroughAst = Obfuscator.parseCode(code);
  }

  // Evaluate the user's JSConfuser.ts config file
  let options = {};
  try {
    options = evaluateOptions(optionsJS);
  } catch (error) {
    return;
  }

  const obfuscator = new Obfuscator(options);
  let output = "";

  if (transformationNames.length) {
    obfuscator.plugins = obfuscator.plugins.filter(({ pluginInstance }) =>
      transformationNames.includes(pluginInstance.name)
    );

    walkthroughAst = obfuscator.obfuscateAST(walkthroughAst);

    output = obfuscator.generateCode(walkthroughAst);
  }

  postMessage({
    event: "success",
    data: {
      requestID,
      code: output,
      transformationNames: obfuscator.plugins.map(
        ({ pluginInstance }) => pluginInstance.name
      ),
    },
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
