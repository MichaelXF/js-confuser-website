import { ComputeProbabilityMap, ObfuscateOptions } from "../index";
import traverse, { getDepth, getBlock, ExitCallback } from "../traverse";
import { AddComment, Node } from "../util/gen";
import { choice, getRandomInteger } from "../util/random";
import { getToStringValue } from "../compiler";
import { ok } from "assert";
import { isValidIdentifier } from "../util/compare";
import Obfuscator from "../obfuscator";

/**
 * Keywords disallowed for variable names in ES5 and under.
 */
export const reservedKeywords = new Set([
  "abstract",
  "arguments",
  "await",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "double",
  "else",
  "enum",
  "eval",
  "export",
  "extends",
  "false",
  "final",
  "finally",
  "float",
  "for",
  "function",
  "goto",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "int",
  "interface",
  "let",
  "long",
  "native",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "volatile",
  "while",
  "with",
  "yield",
]);

/**
 * Identifiers that are not actually variables.
 */
export const reservedIdentifiers = new Set([
  "undefined",
  "null",
  "NaN",
  "Infinity",
  "eval",
  "arguments",
]);

export function alphabeticalGenerator(index: number) {
  let name = "";
  while (index > 0) {
    var t = (index - 1) % 26;
    name = String.fromCharCode(65 + t) + name;
    index = ((index - t) / 26) | 0;
  }
  if (!name) {
    name = "_";
  }
  return name;
}

/**
 * Base-call for all transformations.
 * - Transformations can have preparation transformations `.before`
 * - Transformations can have cleanup transformations `.after`
 *
 * - `match()` function returns true/false if possible candidate
 * - `transform()` function modifies the object
 *
 * ```js
 * class Example extends Transform {
 *   constructor(o){
 *     super(o);
 *   }
 *
 *   match(object, parents){
 *     return object.type == "...";
 *   }
 *
 *   transform(object, parents){
 *     // onEnter
 *
 *     return ()=>{
 *       // onExit
 *     }
 *   }
 *
 *   apply(tree){
 *     // onStart
 *
 *     super.apply(tree);
 *
 *     // onEnd
 *   }
 * }
 * ```
 */
export default class Transform {
  /**
   * The obfuscator.
   */
  obfuscator: Obfuscator;

  /**
   * The user's options.
   */
  options: ObfuscateOptions;

  /**
   * Only required for top-level transformations.
   */
  priority: number;

  /**
   * Transforms to run before, such as `Variable Analysis`.
   */
  before: Transform[];

  /**
   * Transforms to run after.
   */
  after: Transform[];

  /**
   * Transformations to run at the same time (can cause conflicts so use sparingly)
   */
  concurrent: Transform[];

  constructor(obfuscator, priority: number = -1) {
    ok(obfuscator instanceof Obfuscator, "obfuscator should be an Obfuscator");

    this.obfuscator = obfuscator;
    this.options = this.obfuscator.options;

    this.priority = priority;

    this.before = [];
    this.after = [];

    this.concurrent = [];
  }

  /**
   * A special method for fast-tracking a node through all the remaining transformations.
   *
   * For instance, while `eval` runs at order 8, it needs nodes that are completed when it converts to strings.
   * @param node
   */
  dynamicallyObfuscate(node: Node) {
    if (this.obfuscator.state == "transform") {
      var index = this.obfuscator.array.indexOf(this);
      ok(index != -1, "index != -1");

      this.obfuscator.array.slice(0, index - 1).forEach((t) => {
        t.apply(node);
      });
    } else {
      this.obfuscator.array.forEach((t) => {
        if (t != this) {
          t.apply(node);
        }
      });
    }
  }

  /**
   * The transformation name.
   */
  get className() {
    return (this as any).__proto__.constructor.name;
  }

  /**
   * Run an AST through the transformation (including `pre` and `post` transforms)
   * @param tree
   */
  apply(tree: Node) {
    if (tree.type == "Program" && this.options.verbose) {
      console.log("#", this.priority, this.className);
    }

    /**
     * Run through pre-transformations
     */
    this.before.forEach((x) => x.apply(tree));

    traverse(tree, (object, parents) => {
      var fns = [];
      fns.push(this.input(object, parents));

      // Fix 1. Increase performance with multiple transforms on one iteration.
      this.concurrent.forEach((x) => fns.push(x.input(object, parents)));

      return () => fns.forEach((x) => x && x());
    });

    /**
     * Cleanup transformations
     */
    this.after.forEach((x) => x.apply(tree));
  }

  /**
   * The `match` function filters for possible candidates.
   *
   * - If `true`, the node is sent to the `transform()` method
   * - else it's discarded.
   *
   * @param object
   * @param parents
   * @param block
   */
  match(object: Node, parents: Node[]): boolean {
    throw new Error("not implemented");
  }

  /**
   * Modifies the given node.
   *
   * - Return a function to be ran when the node is exited.
   * - The node is safe to modify in most cases.
   *
   * @param object - Current node
   * @param parents - Array of ancestors `[Closest, ..., Root]`
   * @param block
   */
  transform(object: Node, parents: Node[]): ExitCallback | void {
    throw new Error("not implemented");
  }

  /**
   * Calls `.match` with the given parameters, and then `.transform` if satisfied.
   * @private
   */
  input(object: Node, parents: Node[]): ExitCallback | void {
    if (this.match(object, parents)) {
      return this.transform(object, parents);
    }
  }

  /**
   * Returns a random string.
   */
  getPlaceholder() {
    const genRanHex = (size) =>
      [...Array(size)]
        .map(() => Math.floor(Math.random() * 10).toString(10))
        .join("");
    return "_" + genRanHex(10);
  }

  getGenerator(offset = 0) {
    var count = offset;
    return {
      generate: () => {
        count++;
        return this.generateIdentifier(-1, count);
      },
    };
  }

  /**
   * Generates a valid variable name.
   * @param length Default length is 6 to 10 characters.
   * @returns **`string`**
   */
  generateIdentifier(length: number = -1, count = -1): string {
    if (length == -1) {
      length = getRandomInteger(6, 8);
    }
    if (count == -1) {
      this.obfuscator.varCount++;
      count = this.obfuscator.varCount;
    }

    var identifier = ComputeProbabilityMap(
      this.options.identifierGenerator,
      (mode = "randomized") => {
        switch (mode) {
          case "randomized":
            var characters =
              "_$ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(
                ""
              );
            var numbers = "0123456789".split("");

            var combined = [...characters, ...numbers];

            var result = "";
            for (var i = 0; i < length; i++) {
              result += choice(i == 0 ? characters : combined);
            }
            return result;

          case "hexadecimal":
            const genRanHex = (size) =>
              [...Array(size)]
                .map(() => Math.floor(Math.random() * 16).toString(16))
                .join("");

            return "_0x" + genRanHex(length).toUpperCase();

          case "mangled":
            while (1) {
              var result = alphabeticalGenerator(count);
              count++;

              if (
                reservedKeywords.has(result) ||
                reservedIdentifiers.has(result)
              ) {
              } else {
                return result;
              }
            }

            throw new Error("impossible but TypeScript insists");

          case "number":
            return "var_" + count;

          case "zeroWidth":
            var keyWords = [
              "if",
              "in",
              "for",
              "let",
              "new",
              "try",
              "var",
              "case",
              "else",
              "null",
              "break",
              "catch",
              "class",
              "const",
              "super",
              "throw",
              "while",
              "yield",
              "delete",
              "export",
              "import",
              "public",
              "return",
              "switch",
              "default",
              "finally",
              "private",
              "continue",
              "debugger",
              "function",
              "arguments",
              "protected",
              "instanceof",
              "function",
              "await",
              "async",
            ];

            var safe = "\u200C".repeat(count + 1);

            var base = choice(keyWords) + safe;
            return base;
        }

        throw new Error("Invalid 'identifierGenerator' mode: " + mode);
      }
    );

    if (!identifier) {
      throw new Error("identifier null");
    }
    return identifier;
  }

  getToStringValue(
    tree: Node,
    syntax: (code: string) => string = (x) => x
  ): string {
    ok(typeof syntax === "function");
    return getToStringValue(tree, syntax, this.options);
  }

  /**
   * Smartly appends a comment to a Node.
   * - Includes the transformation's name.
   * @param node
   * @param text
   * @param i
   */
  addComment(node: Node, text: string) {
    if (this.options.debugComments) {
      return AddComment(node, `[${this.className}] ${text}`);
    }
    return node;
  }

  replace(node1: Node, node2: Node) {
    for (var key in node1) {
      delete node1[key];
    }

    this.objectAssign(node1, node2);
  }

  /**
   * Smartly merges two Nodes.
   * - Null checking
   * - Preserves comments
   * @param node1
   * @param node2
   */
  objectAssign(node1: Node, node2: Node): Node {
    ok(node1);
    ok(node2);

    var comments1 = node1.leadingComments || [];
    var comments2 = node2.leadingComments || [];
    var comments = [...comments1, ...comments2];

    node2.leadingComments = comments;

    node1._transform = node2._transform = this.className;

    return Object.assign(node1, node2);
  }

  /**
   * Logging utils below
   */

  /**
   * Verbose logging for this transformation.
   * @param messages
   */
  log(...messages: any[]) {
    if (this.options.verbose) {
      console.log("[" + this.className + "]", ...messages);
    }
  }

  /**
   * Verbose logging for warning/importing messages.
   * @param messages
   */
  warn(...messages: any[]) {
    if (this.options.verbose) {
      console.log("[ WARN " + this.className + " ]", ...messages);
    }
  }

  /**
   * Throws an error. Appends the transformation's name to the error's message.
   * @param error
   */
  error(error: Error): never {
    throw new Error(`${this.className} Error: ${error.message}`);
  }
}
