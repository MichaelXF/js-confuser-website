import Transform, { reservedIdentifiers } from "./transform";
import { ObfuscateOrder } from "../obfuscator";
import {
  Node,
  Location,
  VariableDeclaration,
  Identifier,
  BinaryExpression,
  ExpressionStatement,
  SequenceExpression,
  ForStatement,
  Literal,
  UpdateExpression,
  UnaryExpression,
  ConditionalExpression,
  LogicalExpression,
  BlockStatement,
  ReturnStatement,
  AssignmentExpression,
  VariableDeclarator,
} from "../util/gen";
import {
  deleteDeclaration,
  insertBefore,
  deleteDirect,
  getBlockBody,
  isContext,
  clone,
} from "../util/insert";
import { getIdentifierInfo } from "../util/identifiers";
import { isValidIdentifier, isEquivalent } from "../util/compare";
import { walk, getBlock, isBlock } from "../traverse";
import { ok } from "assert";

class MinifyFlow extends Transform {
  constructor(o) {
    super(o);
  }

  match(object: Node, parents: Node[]) {
    return isBlock(object) || object.type == "SwitchCase";
  }

  transform(object: Node, parents: Node[]) {
    var body =
      object.type == "SwitchCase" ? object.consequent : getBlockBody(object);
    var earlyReturn = body.length;

    body.forEach((stmt, i) => {
      if (
        stmt.type == "ReturnStatement" ||
        stmt.type == "BreakStatement" ||
        stmt.type == "ContinueStatement"
      ) {
        if (earlyReturn > i + 1) {
          earlyReturn = i + 1;
        }
      }
    });

    body.length = earlyReturn;
  }
}

class MinifyBlock extends Transform {
  constructor(o) {
    super(o);
  }

  match(object: Node, parents: Node[]) {
    return isBlock(object);
  }

  transform(object: Node, parents: Node[]) {
    return () => {
      // 1. Check for dead code (early return)
      // 2. Check for re-assigning just-defined variable

      var justDefined = new Set();
      var decs: { [name: string]: Node } = Object.create(null);

      var body = getBlockBody(object);
      var earlyReturn = body.length;

      var remove = [];
      body.forEach((stmt, i) => {
        if (
          stmt.type == "ReturnStatement" ||
          stmt.type == "BreakStatement" ||
          stmt.type == "ContinueStatement"
        ) {
          if (earlyReturn > i + 1) {
            earlyReturn = i + 1;
          }
        }
        if (stmt.type == "VariableDeclaration") {
          stmt.declarations.forEach((x) => {
            if (x.id.type == "Identifier") {
              justDefined.add(x.id.name);
              decs[x.id.name] = x;
            }
          });
        } else if (stmt.type == "ExpressionStatement") {
          if (stmt.expression.type == "AssignmentExpression") {
            var name = stmt.expression.left.name;
            if (stmt.expression.operator == "=" && justDefined.has(name)) {
              var possible = true;
              walk(stmt.expression.right, [], (o, p) => {
                if (
                  o.type == "Identifier" &&
                  !reservedIdentifiers.has(o.name) &&
                  !this.options.globalVariables.has(o.name)
                ) {
                  var info = getIdentifierInfo(o, p);
                  if (
                    info.spec.isDefined ||
                    info.spec.isModified ||
                    info.spec.isReferenced
                  ) {
                    if (justDefined.has(o.name)) {
                      possible = false;
                    }
                  }
                }
              });

              if (possible) {
                decs[name].init = stmt.expression.right;
                remove.unshift(i);
              }
            }
          }
        }
      });

      body.length = earlyReturn;

      remove.forEach((x) => {
        body.splice(x, 1);
      });

      // Now combine ExpressionStatements

      if (body.length > 1) {
        var exprs = [];
        var startIndex = -1;

        var sequences: { index: number; exprs: Node[] }[] = [];

        body.forEach((stmt, i) => {
          if (stmt.type == "ExpressionStatement") {
            exprs.push(stmt.expression);
            if (startIndex == -1) {
              startIndex = i;
            }
          } else {
            if (exprs.length) {
              sequences.push({ exprs: exprs, index: startIndex });
            }
            exprs = [];
            startIndex = -1;
          }
        });

        if (exprs.length) {
          sequences.push({ exprs: exprs, index: startIndex });
        }

        sequences.reverse().forEach((seq) => {
          ok(seq.index != -1);
          body.splice(
            seq.index,
            seq.exprs.length,
            ExpressionStatement(
              seq.exprs.length == 1
                ? seq.exprs[0]
                : SequenceExpression(seq.exprs)
            )
          );
        });
      }

      // Unnecessary return
      if (body.length && body[body.length - 1]) {
        var last = body[body.length - 1];
        var isUndefined = last.argument == null;
        if (last.type == "ReturnStatement" && isUndefined) {
          body.pop();
        }
      }

      // Part 3
      var stmts = getBlockBody(object);
      var lastDec = null;

      var remove = [];

      stmts.forEach((x, i) => {
        if (x.type == "VariableDeclaration") {
          if (!lastDec) {
            lastDec = x;
          } else {
            lastDec.declarations.push(...x.declarations);
            remove.unshift(i);
          }
        } else {
          lastDec = null;
        }
      });

      remove.forEach((x) => {
        stmts.splice(x, 1);
      });
    };
  }
}

/**
 * Basic transformations to reduce code size.
 *
 * Examples:
 * - `if(a) { b() }` **->** `a && b()`
 * - `if(a){b()}else{c()}` **->** `a?b():c()`
 * - `x['y']` **->** `x.y`
 */
export default class Minify extends Transform {
  variables: Map<Node, Location[]>;

  constructor(o) {
    super(o, ObfuscateOrder.Minify);

    this.variables = new Map();

    /**
     * Minify runs at every Node, making Expression-based minification.
     * MinifyBlock runs only on Blocks, making Statement-based minification.
     */
    this.after.push(new MinifyBlock(o));
    this.after.push(new MinifyFlow(o));
  }

  match(object: Node, parents: Node[]) {
    return object.hasOwnProperty("type");
  }

  transform(object: Node, parents: Node[]) {
    /**
     * ES6 and higher only
     * - `function(){}` -> `()=>{}`
     * - `function abc(){}` -> `var abc = ()=>{}`
     */
    if (
      !this.options.es5 &&
      (object.type == "FunctionExpression" ||
        object.type == "FunctionDeclaration")
    ) {
      return () => {
        var canTransform = true;
        walk(object.body, [], ($object, $parents) => {
          if ($object.type == "ThisExpression") {
            canTransform = false;
          } else if ($object.type == "Identifier") {
            if ($object.name == "arguments") {
              canTransform = false;
            }
            if ($object.name == "this") {
              this.error(new Error("Use ThisExpression instead"));
            }
          }
        });

        if (canTransform) {
          if (object.type == "FunctionExpression") {
            object.type = "ArrowFunctionExpression";
          } else {
            var arrow = { ...clone(object), type: "ArrowFunctionExpression" };
            this.replace(
              object,
              VariableDeclaration(VariableDeclarator(object.id.name, arrow))
            );

            var x = this.transform(arrow, []);
            x();
          }
        }
      };
    }

    /**
     * ()=>{ expr } -> ()=>expr
     */
    if (
      object.type == "ArrowFunctionExpression" &&
      object.body.type == "BlockStatement"
    ) {
      return () => {
        var body = getBlockBody(object.body);
        var stmt1 = body[0];

        if (body.length == 1 && stmt1.type == "ReturnStatement") {
          // x=>{a: 1} // Invalid syntax
          if (stmt1.argument.type != "ObjectExpression") {
            object.body = stmt1.argument;
          }
        } else {
          // ()=>{exprStmt;exprStmt;} -> ()=>(expr, expr, expr, undefined)
          var exprs = body.filter((x) => x.type == "ExpressionStatement");
          if (exprs.length == body.length) {
            var array: Node[] = [];
            function flatten(expr) {
              if (expr.type == "SequenceExpression") {
                expr.expressions.forEach(flatten);
              } else if (expr.type == "ExpressionStatement") {
                flatten(expr.expression);
              } else {
                array.push(expr);
              }
            }

            body.forEach(flatten);

            object.body = SequenceExpression([
              ...clone(array),
              UnaryExpression("void", Literal(0)),
            ]);
          }
        }
      };
    }

    // (a()) -> a()
    if (object.type == "SequenceExpression") {
      return () => {
        if (object.expressions.length == 1) {
          this.replace(object, clone(object.expressions[0]));
        }
      };
    }

    // a += -1 -> a -= 1
    if (object.type == "AssignmentExpression") {
      return () => {
        if (
          object.operator == "+=" &&
          object.right.type == "UnaryExpression" &&
          object.right.operator == "-"
        ) {
          object.operator = "-=";
          object.right = object.right.argument;
        }
      };
    }

    if (
      object.type == "ForStatement" ||
      object.type == "ForInStatement" ||
      object.type == "ForOfStatement" ||
      object.type == "WhileStatement"
    ) {
      if (object.body.type == "BlockStatement") {
        return () => {
          if (object.body.body.length === 1) {
            object.body = clone(object.body.body[0]);
          }
        };
      }
    }

    // Last switch case does not need break
    if (object.type == "SwitchStatement") {
      var last = object.cases[object.cases.length - 1];
      if (last) {
        var lastStatement = last.consequent[last.consequent.length - 1];
        if (
          lastStatement.type == "BreakStatement" &&
          lastStatement.label == null
        ) {
          last.consequent.pop();
        }
      } else {
        if (object.cases.length == 0) {
          if (
            parents[0].type == "LabeledStatement" &&
            Array.isArray(parents[1])
          ) {
            return () => {
              parents[1].splice(parents[1].indexOf(parents[0]), 1);
            };
          } else if (Array.isArray(parents[0])) {
            return () => {
              parents[0].splice(parents[0].indexOf(object), 1);
            };
          }
        }
      }
    }

    // if ( x ) { y() } -> x && y()
    // Todo Make this shit readable
    if (object.type == "IfStatement") {
      if (object.consequent.type != "BlockStatement") {
        this.replace(
          object.consequent,
          BlockStatement([clone(object.consequent)])
        );
      }
      if (object.alternate && object.alternate.type != "BlockStatement") {
        this.replace(
          object.alternate,
          BlockStatement([clone(object.alternate)])
        );
      }
      var body = getBlockBody(object.consequent);

      // Check for hard-coded if statements
      if (object.test.type == "Literal") {
        if (object.test.value || object.test.regex) {
          // Why would anyone test just a regex literal
          object.alternate = null;
        } else {
          object.consequent = BlockStatement([]);
        }
      }

      return () => {
        // if ( a ) { } else {b()} -> if ( !a ) b();
        if (body.length == 0 && object.alternate) {
          object.test = UnaryExpression("!", clone(object.test));
          if (
            object.alternate.type == "BlockStatement" &&
            object.alternate.body.length == 1
          ) {
            object.alternate = clone(object.alternate.body[0]);
          }
          object.consequent = object.alternate;
          object.alternate = null;
        }

        if (
          object.consequent.body.length == 1 &&
          object.alternate &&
          object.alternate.body.length == 1
        ) {
          var stmt1 = clone(object.consequent.body[0]);
          var stmt2 = clone(object.alternate.body[0]);

          // if (a) {return b;} else {return c;} -> return a ? b : c;
          if (
            stmt1.type == "ReturnStatement" ||
            stmt2.type == "ReturnStatement"
          ) {
            this.replace(
              object,
              ReturnStatement(
                ConditionalExpression(
                  clone(object.test),
                  stmt1.argument,
                  stmt2.argument
                )
              )
            );
          }

          // if (a) {b = 0} else {b = 1} -> b = a ? 0 : 1;
          if (
            stmt1.type == "ExpressionStatement" &&
            stmt2.type == "ExpressionStatement"
          ) {
            var e1 = stmt1.expression;
            var e2 = stmt2.expression;

            if (
              e1.type == "AssignmentExpression" &&
              e2.type == "AssignmentExpression"
            ) {
              if (
                e1.operator == e2.operator &&
                isEquivalent(e1.left, e2.left)
              ) {
                this.replace(
                  object,
                  ExpressionStatement(
                    AssignmentExpression(
                      e1.operator,
                      e1.left,
                      ConditionalExpression(
                        clone(object.test),
                        e1.right,
                        e2.right
                      )
                    )
                  )
                );
              }
            }
          }
        }
      };
    }

    // x["abc"] -> x.abc
    if (object.type == "MemberExpression") {
      var { object: obj, property } = object;

      if (property.type == "Literal" && isValidIdentifier(property.value)) {
        object.computed = false;
        object.property.type = "Identifier";
        object.property.name = clone(object.property.value);

        obj.name &&
          this.log(
            obj.name +
              "['" +
              object.property.name +
              "'] -> " +
              obj.name +
              "." +
              object.property.name
          );
      }
    }

    if (object.type == "CallExpression") {
      if (object.callee.type == "MemberExpression") {
        var key = object.callee.computed
          ? object.callee.property.value
          : object.callee.property.name;
        if (key == "toString" && object.arguments.length == 0) {
          this.replace(
            object,
            BinaryExpression("+", clone(object.callee.object), Literal(""))
          );
        }
      }
    }

    // { "x": 1 } -> {x: 1}
    if (object.type == "Property") {
      if (
        object.key.type == "SequenceExpression" &&
        object.key.expressions.length == 1
      ) {
        object.key = object.key.expressions[0];
        object.computed = true;
      }

      if (object.key.type == "Literal" && isValidIdentifier(object.key.value)) {
        object.key.type = "Identifier";
        object.key.name = object.key.value;
        object.computed = false;
      } else if (
        object.key.type == "Identifier" &&
        !isValidIdentifier(object.key.name)
      ) {
        object.key = Literal(object.key.name);
      }
    }

    if (object.type == "VariableDeclarator") {
      // undefined is not necessary
      if (object.init && object.init.type == "Identifier") {
        if (object.init.name == "undefined") {
          object.init = null;
        }
      }

      // check for redundant patterns
      if (
        object.id.type == "ArrayPattern" &&
        object.init.type == "ArrayExpression"
      ) {
        if (
          object.id.elements.length == 1 &&
          object.init.elements.length == 1
        ) {
          object.id = object.id.elements[0];
          object.init = object.init.elements[0];
        }
      }
    }

    if (object.type == "Literal") {
      return () => {
        switch (typeof object.value) {
          case "boolean":
            // this.replace(object, UnaryExpression("!", Literal(object.value ? 0 : 1)));
            break;
        }
      };
    }
    if (object.type == "Identifier") {
      return () => {
        if (object.name == "undefined") {
          this.replace(object, UnaryExpression("void", Literal(0)));
        } else if (object.name == "Infinity") {
          this.replace(object, BinaryExpression("/", Literal(1), Literal(0)));
        }
      };
    }

    if (object.type == "UnaryExpression" && object.operator == "!") {
      if (object.argument.type == "Literal" && !object.argument.regex) {
        this.replace(object, Literal(!object.argument.value));
      }
    }

    if (object.type == "ConditionalExpression") {
      if (object.test.type == "Literal" && !object.test.regex) {
        this.replace(
          object,
          object.test.value ? object.consequent : object.alternate
        );
      }
    }
  }
}
