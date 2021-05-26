import { ObfuscateOrder } from "../obfuscator";
import { walk } from "../traverse";
import { Identifier } from "../util/gen";
import { clone } from "../util/insert";
import { isLoop } from "./preparation/preparation";
import Transform from "./transform";

export default class RenameLabels extends Transform {
  gen: any;

  constructor(o) {
    super(o, ObfuscateOrder.RenameLabels);

    this.gen = this.getGenerator();
  }

  match(object, parents) {
    return object.type == "LabeledStatement";
  }

  transform(object, parents) {
    return () => {
      var newName = null;

      walk(object, parents, (o, p) => {
        if (o.type == "BreakStatement" || o.type == "ContinueStatement") {
          var labelStatement = p.find((x) => isLoop(x));

          if (o.label && o.label.name == object.label.name) {
            if (object.body == labelStatement) {
              // In same loop

              o.label = null;
            } else {
              if (!newName) {
                newName = this.gen.generate();
              }
              o.label = Identifier(newName);
            }
          }
        }
      });

      if (newName) {
        object.label = Identifier(newName);
      } else {
        this.replace(object, clone(object.body));
      }
    };
  }
}
