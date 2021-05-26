import { Node } from "./util/gen";
import { validateChain } from "./util/identifiers";

/**
 * Returns all the scopes given parents array.
 * - `[object, ...parents]` is recommended.
 *
 * @param parents
 */
export function getBlocks(parents: any[]): any[] {
  return parents.filter((x) => isBlock(x));
}

/**
 * A block refers to any object that has a **`.body`** property where code is nested.
 *
 * Types: `BlockStatement`, `Program`
 *
 * @param object
 * @param parents
 */
export function getBlock(object: any, parents: any[]) {
  if (!Array.isArray(parents)) {
    throw new Error("parents must be an array");
  }
  return getBlocks([object, ...parents])[0];
}

/**
 * Must have a **`.body`** property and be an array.
 *
 * - "BlockStatement"
 * - "Program"
 *
 * @param object
 */
export function isBlock(object: any) {
  return object && !!object.body && Array.isArray(object.body);
}

/**
 * Returns a numerical representation of the depth.
 * - Depth is how many blocks nested.
 * - Program = 1 depth
 * -    First Fn = 2 depth
 * -        Nested Fn = 3 depth
 * -    Second Fn = 2 depth
 * -        etc...
 * @param object
 * @param parents
 */
export function getDepth(object: any, parents: any[]) {
  if (!Array.isArray(parents)) {
    throw new Error("parents should be an array");
  }
  var scopes = getBlocks([object, ...parents].filter((x) => x));

  return scopes.length;
}

export function traverseBottomUp(
  tree: any,
  callback: (object: any, parents: any[], scope: any) => void
) {
  function recursive(object, parents) {
    if (typeof object === "object" && object) {
      var newParents = [object, ...parents];
      if (Array.isArray(object)) {
        var copy = [...object];
        copy.forEach((x) => {
          x && recursive(x, newParents);
        });
      } else {
        Object.keys(object).forEach((key) => {
          var nested = object[key];
          nested && recursive(nested, newParents);
        });
      }
      callback(object, parents, getBlock(object, parents));
    }
  }

  recursive(tree, []);
}

export type EnterCallback = (
  object: Node,
  parents: Node[]
) => ExitCallback | "EXIT" | void;
export type ExitCallback = () => void;

export function walk(
  object: Node | Node[],
  parents: Node[],
  onEnter: EnterCallback,
  seen = new Set<Node>()
): "EXIT" | void {
  if (typeof object === "object" && object) {
    if (seen.has(object as any)) {
      console.log(object);
      throw new Error("Already seen: " + (object as any).type);
    }
    seen.add(object as any);

    var newParents: Node[] = [object as Node, ...parents];

    if (!Array.isArray(object)) {
      validateChain(object, parents);
    }

    // 1. Call `onEnter` function and remember any onExit callback returned
    var onExit = onEnter(object as Node, parents);

    // 2. Traverse children
    if (Array.isArray(object)) {
      var copy = [...object];
      for (var element of copy) {
        if (walk(element, newParents, onEnter) === "EXIT") {
          return "EXIT";
        }
      }
      copy.forEach((x) => {});
    } else {
      var keys = Object.keys(object);
      for (var key of keys) {
        if (!key.startsWith("$")) {
          if (walk(object[key], newParents, onEnter) === "EXIT") {
            return "EXIT";
          }
        }
      }
    }

    if (onExit === "EXIT") {
      return "EXIT";
    }

    // 3. Done with children, call `onExit` callback
    if (onExit) {
      onExit();
    }
  }
}

/**
 * The bare-bones walker.
 *
 * - Recursively traverse an AST object.
 * - Calls the `onEnter` function with:
 * - - `object` - The current node
 * - - `parents` - Array of ancestors `[closest, ..., root]`
 * - The `onEnter` callback can return an `onExit` callback for that node.
 *
 * - *Note*: Does not validate the property names.
 *
 * @param tree
 * @param onEnter
 */
export default function traverse(tree, onEnter: EnterCallback) {
  walk(tree, [], onEnter);
}
