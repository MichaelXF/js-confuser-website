import { Parser } from "acorn";
import acornTypeScript from "acorn-typescript";
import escodegen from "escodegen";
import prettier from "prettier/standalone";
import * as parserBabel from "prettier/parser-babel";
import * as parserTypeScript from "prettier/parser-typescript";
import * as prettierPluginEstree from "prettier/plugins/estree";

self.onmessage = function (e) {
  const { type, requestID, code, language } = e.data;

  if (type === "formatCode") {
    formatCode(requestID, code, language);
  } else if (type === "convertTSCodeToJSCode") {
    convertTSCodeToJSCode(requestID, code);
  }
};

async function formatCode(requestID, code, language = "javascript") {
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
        plugins: [parserTypeScript, prettierPluginEstree],
        singleQuote: true,
      });
    } else if (language === "json") {
      formattedCode = await prettier.format(code, { parser: "json" });
    } else {
      throw new Error(`Unsupported language: ${language}`);
    }
  } catch (err) {
    self.postMessage({
      event: "error",
      data: { requestID: requestID, error: err },
    });
    return;
  }

  self.postMessage({
    event: "success",
    data: { requestID: requestID, code: formattedCode },
  });
}

function convertTSCodeToJSCode(requestID, code) {
  const parser = Parser.extend(acornTypeScript());

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

    self.postMessage({
      event: "success",
      data: { requestID: requestID, code: jsCode },
    });
  } catch (error) {
    self.postMessage({
      event: "error",
      data: { requestID: requestID, error: error },
    });
  }
}
