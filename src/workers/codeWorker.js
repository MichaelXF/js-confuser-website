import * as acorn from "acorn";
import acornTypeScript from "acorn-typescript";
const escodegen = require("escodegen");
const prettier = require("prettier/standalone");
const parserBabel = require("prettier/parser-babel");
const parserTypeScript = require("prettier/parser-typescript");
const prettierPluginEstree = require("prettier/plugins/estree");

export async function formatCode(requestID, code, language = "javascript") {
  let formattedCode;
  try {
    if (language === "javascript") {
      formattedCode = await prettier.format(code, {
        parser: "babel",
        plugins: [parserBabel, prettierPluginEstree],
        singleQuote: true,
      });
    } else if (language === "typescript") {
      formattedCode = await prettier.format(code, {
        parser: "typescript",
        plugins: [parserTypeScript, prettierPluginEstree], // Use TypeScript parser
        singleQuote: true,
      });
    } else if (language === "json") {
      formattedCode = await prettier.format(code, {
        parser: "json",
      });
    } else {
      throw new Error(`Unsupported language: ${language}`);
    }
  } catch (err) {
    postMessage({
      event: "error",
      data: {
        requestID: requestID,
        error: err,
      },
    });
    return;
  }

  postMessage({
    event: "success",
    data: {
      requestID: requestID,
      code: formattedCode,
    },
  });
}

export function convertTSCodeToJSCode(requestID, code) {
  const parser = acorn.Parser.extend(acornTypeScript());

  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      ecmaVersion: 2020, // You can adjust this to the version you need
    });

    // Function to remove TypeScript-specific syntax
    function removeTypeScriptSyntax(node) {
      if (!node || typeof node !== "object") return node;

      switch (node.type) {
        case "TSTypeAnnotation":
        case "TSTypeAliasDeclaration":
        case "TSInterfaceDeclaration":
        case "TSAsExpression":
        case "TSTypeParameterInstantiation":
        case "TSTypeParameterDeclaration":
        case "TSDeclareFunction":
          return null; // Remove TypeScript-specific nodes
        default:
          // Recursively process child nodes
          for (const key in node) {
            if (Array.isArray(node[key])) {
              node[key] = node[key].map(removeTypeScriptSyntax).filter(Boolean);
            } else if (typeof node[key] === "object" && node[key] !== null) {
              node[key] = removeTypeScriptSyntax(node[key]);
            }
          }
          return node;
      }
    }

    // Transform the AST to remove TypeScript syntax
    const transformedAst = removeTypeScriptSyntax(ast);

    const jsCode = escodegen.generate(transformedAst);

    postMessage({
      event: "success",
      data: {
        requestID: requestID,
        code: jsCode,
      },
    });
  } catch (error) {
    postMessage({
      event: "error",
      data: {
        requestID: requestID,
        error: error,
      },
    });
  }
}
