import { compileJsSync } from "../compiler";
import { ComputeProbabilityMap } from "../index";
import { ObfuscateOrder } from "../obfuscator";
import {
  CallExpression,
  ExpressionStatement,
  Identifier,
  Literal,
  Node,
} from "../util/gen";
import { isFunction } from "../util/insert";
import Transform from "./transform";

export default class Eval extends Transform {
  constructor(o) {
    super(o, ObfuscateOrder.Eval);
  }

  match(object, parents) {
    return isFunction(object) && object.type != "ArrowFunctionExpression";
  }

  transform(object, parents) {
    if (
      !ComputeProbabilityMap(
        this.options.eval,
        (x) => x,
        object.id && object.id.name
      )
    ) {
      return;
    }

    object.$eval = () => {
      var code = compileJsSync(object, this.options);

      if (object.type == "FunctionExpression") {
        code = "(" + code + ")";
      }

      var literal = Literal(code);

      this.dynamicallyObfuscate(literal);

      var expr: Node = CallExpression(Identifier("eval"), [literal]);
      if (object.type == "FunctionDeclaration") {
        expr = ExpressionStatement(expr);
      }

      this.replace(object, expr);
    };
  }
}
