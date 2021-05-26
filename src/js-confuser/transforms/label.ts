import Transform from "./transform";
import { Identifier, LabeledStatement } from "../util/gen";
import { getBlock, walk } from "../traverse";
import { isLoop } from "./preparation/preparation";
import { clone } from "../util/insert";

/**
 * Ensures every break; statement has a label to point to.
 *
 * This is because Control Flow Flattening adds For Loops which label-less break statements point to the nearest,
 * when they actually need to point to the original statement.
 *
 */
export default class Label extends Transform {
  constructor(o) {
    super(o);
  }

  match(object, parents) {
    return isLoop(object);
  }

  transform(object, parents) {
    return () => {
      var currentLabel =
        parents[0].type == "LabeledStatement" && parents[0].label.name;

      var label = currentLabel || this.getPlaceholder();

      walk(object, parents, (o, p) => {
        var loop = p.find((x) => isLoop(x));
        if (object == loop) {
          if (o.type == "BreakStatement") {
            if (!o.label) {
              o.label = Identifier(label);
            }
          }
        }
      });

      // Append label statement as this loop has none
      if (!currentLabel) {
        this.replace(object, LabeledStatement(label, clone(object)));
      }
    };
  }
}
