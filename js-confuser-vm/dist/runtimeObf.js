import { generate } from "@babel/generator";
import { parse } from "@babel/parser";
import traverseImport from "@babel/traverse";
import { ok } from "assert";
import { shuffle } from "./random.js";
import { minify } from "./minify.js";
const traverse = traverseImport.default || traverseImport;
export async function obfuscateRuntime(runtime, options) {
  let ast;
  try {
    ast = parse(runtime, {
      sourceType: "unambiguous"
    });
  } catch (error) {
    throw new Error("VM-Runtime final parsing failed", {
      cause: error
    });
  }

  // shuffle order of opcode handlers

  if (options.shuffleOpcodes) {
    let switchStatement = null;
    traverse(ast, {
      SwitchStatement(path) {
        if (path.node.leadingComments?.some(comment => comment.value.includes("@SWITCH"))) {
          switchStatement = path.node;
          path.stop();
        }
      }
    });
    ok(switchStatement, "Could not find opcode handlers switch statement");

    // simply shuffle the order of the cases

    switchStatement.cases = shuffle(switchStatement.cases);
  }
  let generated;
  try {
    generated = generate(ast).code;
  } catch (error) {
    throw new Error("VM-Runtime final generation failed", {
      cause: error
    });
  }
  if (options.minify) {
    try {
      generated = await minify(generated);
    } catch (error) {
      throw new Error("VM-Runtime final minification failed", {
        cause: error
      });
    }
  }
  return generated;
}