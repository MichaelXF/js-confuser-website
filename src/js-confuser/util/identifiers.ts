import { ok } from "assert";
import traverse, { walk } from "../traverse";
import { Location, Node } from "./gen";
import { getContext, isContext, isFunction } from "./insert";

/**
 * Ensures the chain (object and parents) are connected.
 * @param object
 * @param parents
 */
export function validateChain(object: Node, parents: Node[]) {
  if (!Array.isArray(parents)) {
    throw new Error("parents need to be an array");
  }

  if (!object) {
    throw new Error("object must be a node (not null)");
  }

  if (parents.length > 0) {
    if (object == parents[0]) {
      throw new Error("parent overlap");
    }
    if (!Object.values(parents[0]).includes(object)) {
      console.log("parents=", parents);
      console.log("object=", object);

      throw new Error("parents[0] is not connected to object");
    }
  }
}

export function isWithinClass(object: Node, parents: Node[]) {
  return (
    isWithin(object, parents, "ClassDeclaration") ||
    isWithin(object, parents, "ClassExpression")
  );
}

export function isWithinMethodDefinition(object: Node, parents: Node[]) {
  return isWithin(object, parents, "MethodDefinition");
}

export function isWithin(object: Node, parents: Node[], type: string): boolean {
  return [object, ...parents].some((x) => x.type == type);
}

/**
 * Returns detailed information about the given Identifier node.
 * @param object
 * @param parents
 */
export function getIdentifierInfo(object: Node, parents: Node[]) {
  if (object.type != "Identifier") {
    console.log(object);
    throw new Error("object is not an Identifier, its a type=" + object.type);
  }

  var parent = parents[0] || ({} as Node);

  var isAccessor =
    parent.type == "MemberExpression" &&
    parent.object != object &&
    parent.property === object &&
    !parent.computed;

  var propIndex = parents.findIndex((x) => x.type == "Property");
  var isPropertyKey =
    propIndex != -1 &&
    parents[propIndex].key == (parents[propIndex - 1] || object) &&
    !parents[propIndex].computed;

  var varIndex = parents.findIndex((x) => x.type == "VariableDeclarator");

  var isVariableDeclaration =
    varIndex != -1 && parents[varIndex].id == (parents[varIndex - 1] || object);

  var forIndex = parents.findIndex((x) => x.type == "ForStatement");
  var isForInitializer =
    forIndex != -1 &&
    parents[forIndex].init == (parents[forIndex - 1] || object);

  var functionIndex = parents.findIndex((x) => isFunction(x));

  var isFunctionDeclaration =
    functionIndex != -1 &&
    parents[functionIndex].type == "FunctionDeclaration" &&
    parents[functionIndex].id == object;
  var isFunctionParameter =
    functionIndex != -1 &&
    parents[functionIndex].params == parents[functionIndex - 1];
  var isClauseParameter = false;

  // Special case for Catch clauses
  var clauseIndex = parents.findIndex((x) => x.type == "CatchClause");
  if (clauseIndex != -1) {
    if (parents[clauseIndex].param == (parents[clauseIndex - 1] || object)) {
      isClauseParameter = true;
    }
  }

  var isImportSpecifier =
    (parent.type == "ImportDefaultSpecifier" ||
      parent.type == "ImportSpecifier") &&
    parent.local == object;

  var isFunctionCall = parent.callee == object; // NewExpression and CallExpression

  var isAssignmentLeft =
    parent.type == "AssignmentExpression" && parent.left == object;
  var isAssignmentValue =
    parent.type == "AssignmentExpression" && parent.right == object;

  var isUpdateExpression = parent.type == "UpdateExpression";

  var isClassDeclaration =
    parent.type == "ClassDeclaration" && parent.id == object;
  var isMethodDefinition =
    parent.type == "MethodDefinition" && parent.key == object;

  var isMetaProperty = parent.type == "MetaProperty";

  var isLabel = parent.type == "LabeledStatement" && parent.label == object;

  // Fix 1
  if (parent.type == "BreakStatement" || parent.type == "ContinueStatement") {
    if (parent.label == object) {
      isLabel = true;
    }
  }

  return {
    /**
     * MemberExpression: `parent.identifier`
     */
    isAccessor,
    /**
     * Property: `{identifier: ...}`
     */
    isPropertyKey,
    /**
     * `var identifier = ...`
     */
    isVariableDeclaration,
    /**
     * `function identifier(){...}`
     */
    isFunctionDeclaration,
    /**
     * `function a(identifier){...}`
     */
    isFunctionParameter,

    /**
     * ```js
     * try ... catch ( identifier ) {
     *  ...
     * }
     * ```
     */
    isClauseParameter,

    /**
     * CallExpression: `identifier()`
     */
    isFunctionCall,
    /**
     * AssignmentExpression: `identifier = ...`
     */
    isAssignmentLeft,
    /**
     * AssignmentExpression (right): `x = identifier`
     */
    isAssignmentValue,
    /**
     * UpdateExpression: `identifier++`
     */
    isUpdateExpression,
    /**
     * ClassDeclaration `class identifier {...}`
     */
    isClassDeclaration,
    /**
     * Method Definition inside a class body
     * ```js
     * class Rectangle {
     *     identifier(){...}
     *
     *     get identifier(){...}
     * }
     * ```
     */
    isMethodDefinition,

    /**
     * `new.target` or `yield.input`
     */
    isMetaProperty,

    /**
     * LabelStatement: `identifier: for ( var i...)`
     */
    isLabel,

    /**
     * ```js
     * for (var i=0; ...) {
     *  ...
     * }
     * ```
     */
    isForInitializer,

    /**
     * ```js
     * import identifier from "...";
     * import {key as identifier} from "...";
     * ```
     */
    isImportSpecifier,

    spec: {
      /**
       * - `export function identifier()...`
       * - `export var identifier = ...`
       */
      isExported:
        (isVariableDeclaration &&
          parents[3].type == "ExportNamedDeclaration") ||
        (isFunctionDeclaration &&
          parents[1] &&
          parents[1].type == "ExportNamedDeclaration"),

      /**
       * Is the Identifier defined, i.e a variable declaration, function declaration, parameter, or class definition
       */
      isDefined:
        isVariableDeclaration ||
        isFunctionDeclaration ||
        isFunctionParameter ||
        isClauseParameter ||
        isMethodDefinition ||
        isImportSpecifier,

      /**
       * Is the Identifier modified, either by an `AssignmentExpression` or `UpdateExpression`
       */
      isModified: isAssignmentLeft || isUpdateExpression,

      /**
       * Is the Identifier referenced as a variable.
       *
       * - true: `if ( identifier ) {...}`
       * - false `if ( obj.identifier ) {...}`
       * - false `identifier: for ( var ...)`
       * - false `break identifier;`
       */
      isReferenced:
        !isAccessor &&
        !isPropertyKey &&
        !isMetaProperty &&
        !isLabel &&
        !object.name.startsWith("0") &&
        !object.name.startsWith("'"),
    },
  };
}

export function getDefiningIdentifier(object: Node, parents: Node[]): Location {
  ok(object.type == "Identifier", "must be identifier");
  ok(typeof object.name === "string");
  ok(
    parents[parents.length - 1].type == "Program",
    "root node must be type Program"
  );

  var seen = new Set<Node>();
  var i = 0;
  for (var parent of parents) {
    var l;
    var bestScore = Infinity;
    walk(parent, parents.slice(i + 1), (o, p) => {
      // if (seen.has(o)) {
      //   return "EXIT";
      // }

      if (o.type == "Identifier" && o.name === object.name && o !== object) {
        var info = getIdentifierInfo(o, p);
        if (info.spec.isDefined) {
          var contexts = p.filter((x) => isContext(x));
          var definingContext = info.isFunctionDeclaration
            ? getContext(p[0], p.slice(1))
            : getContext(o, p);

          if (parents.includes(definingContext)) {
            var index = contexts.indexOf(definingContext);

            if (index < bestScore) {
              l = [o, p];
              bestScore = index;
            }
          }
        }
      }
    });

    if (l) {
      // console.log(l[0].name, "->", l[0], bestScore);

      return l;
    }

    seen.add(parent);
    i++;
  }
}
