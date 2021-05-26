import { ok } from "assert";
import { ComputeProbabilityMap } from "../../index";
import { ObfuscateOrder } from "../../obfuscator";
import Template from "../../templates/template";
import { walk } from "../../traverse";
import {
  ArrayExpression,
  BinaryExpression,
  CallExpression,
  ExpressionStatement,
  FunctionDeclaration,
  Identifier,
  Literal,
  Location,
  MemberExpression,
  Node,
  ReturnStatement,
  UpdateExpression,
  VariableDeclaration,
  VariableDeclarator,
  WhileStatement,
} from "../../util/gen";
import { getBlockBody, isContext, prepend } from "../../util/insert";
import { getRandomInteger, shuffle } from "../../util/random";
import Transform from "../transform";

/* eslint-disable @typescript-eslint/no-unused-expressions */
function encode_ascii85(a) {
  var b, c, d, e, f, g, h, i, j, k;
  // @ts-ignore
  for (
    // @ts-ignore
    !/[^\x00-\xFF]/.test(a),
      b = "\x00\x00\x00\x00".slice(a.length % 4 || 4),
      a += b,
      c = [],
      d = 0,
      e = a.length;
    e > d;
    d += 4
  )
    (f =
      (a.charCodeAt(d) << 24) +
      (a.charCodeAt(d + 1) << 16) +
      (a.charCodeAt(d + 2) << 8) +
      a.charCodeAt(d + 3)),
      0 !== f
        ? ((k = f % 85),
          (f = (f - k) / 85),
          (j = f % 85),
          (f = (f - j) / 85),
          (i = f % 85),
          (f = (f - i) / 85),
          (h = f % 85),
          (f = (f - h) / 85),
          (g = f % 85),
          c.push(g + 33, h + 33, i + 33, j + 33, k + 33))
        : c.push(122);
  return (
    (function (a, b) {
      for (var c = b; c > 0; c--) a.pop();
    })(c, b.length),
    "<~" + String.fromCharCode.apply(String, c) + "~>"
  );
}

function decode_ascii85(a) {
  var c,
    d,
    e,
    f,
    g,
    h = String,
    l = "length",
    w = 255,
    x = "charCodeAt",
    y = "slice",
    z = "replace";
  for (
    "<~" === a[y](0, 2) && "~>" === a[y](-2),
      a = a[y](2, -2)[z](/s/g, "")[z]("z", "!!!!!"),
      c = "uuuuu"[y](a[l] % 5 || 5),
      a += c,
      e = [],
      f = 0,
      g = a[l];
    g > f;
    f += 5
  )
    (d =
      52200625 * (a[x](f) - 33) +
      614125 * (a[x](f + 1) - 33) +
      7225 * (a[x](f + 2) - 33) +
      85 * (a[x](f + 3) - 33) +
      (a[x](f + 4) - 33)),
      e.push(w & (d >> 24), w & (d >> 16), w & (d >> 8), w & d);
  return (
    (function (a, b) {
      for (var c = b; c > 0; c--) a.pop();
    })(e, c[l]),
    h.fromCharCode.apply(h, e)
  );
}

var Ascii85Template = Template(`
function {name}(a) {
  var c, d, e, f, g, h = String, l = "length", w = 255, x = "charCodeAt", y = "slice", z = "replace";
  for ("<~" === a[y](0, 2) && "~>" === a[y](-2), a = a[y](2, -2)[z](/\s/g, "")[z]("z", "!!!!!"), 
  c = "uuuuu"[y](a[l] % 5 || 5), a += c, e = [], f = 0, g = a[l]; g > f; f += 5) d = 52200625 * (a[x](f) - 33) + 614125 * (a[x](f + 1) - 33) + 7225 * (a[x](f + 2) - 33) + 85 * (a[x](f + 3) - 33) + (a[x](f + 4) - 33), 
  e.push(w & d >> 24, w & d >> 16, w & d >> 8, w & d);
  return function(a, b) {
    for (var c = b; c > 0; c--) a.pop();
  }(e, c[l]), h.fromCharCode.apply(h, e);
}
`);

export function isModuleSource(object: Node, parents: Node[]) {
  if (!parents[0]) {
    return false;
  }

  if (parents[0].type == "ImportDeclaration" && parents[0].source == object) {
    return true;
  }

  if (parents[0].type == "ImportExpression" && parents[0].source == object) {
    return true;
  }

  return false;
}

export default class StringConcealing extends Transform {
  arrayExpression: Node;
  set: Set<string>;
  index: { [str: string]: number };

  getterName = this.getPlaceholder();
  arrayName = this.getPlaceholder();
  decodeFn = this.getPlaceholder();

  decodeNode: Node;

  constructor(o) {
    super(o, ObfuscateOrder.StringConcealing);

    this.set = new Set();
    this.index = Object.create(null);
  }

  match(object, parents) {
    return (
      object.type == "Program" ||
      (object.type == "Literal" && typeof object.value === "string")
    );
  }

  transform(object, parents) {
    if (object.type == "Program") {
      var encoding = true;
      this.arrayExpression = ArrayExpression([]);

      return () => {
        prepend(
          object,
          FunctionDeclaration(
            this.getterName,
            [Identifier("x")],
            [
              ReturnStatement(
                encoding
                  ? CallExpression(Identifier(this.decodeFn), [
                      MemberExpression(
                        Identifier(this.arrayName),
                        Identifier("x"),
                        true
                      ),
                    ])
                  : MemberExpression(
                      Identifier(this.arrayName),
                      Identifier("x"),
                      true
                    )
              ),
            ]
          )
        );

        prepend(
          object,
          VariableDeclaration(
            VariableDeclarator(this.arrayName, this.arrayExpression)
          )
        );

        prepend(
          object,
          (this.decodeNode = Ascii85Template.single({
            name: this.decodeFn,
          }))
        );
      };
    }

    return () => {
      if (parents.find((x) => x == this.decodeNode)) {
        return;
      }

      if (!object.value) {
        return;
      }

      if (isModuleSource(object, parents)) {
        return;
      }

      if (decode_ascii85(encode_ascii85(object.value)) != object.value) {
        this.warn(object.value);
        return;
      }

      // Fix 1. weird undefined error
      if (object.value && object.value.length > 0) {
        var index = -1;
        if (!this.set.has(object.value)) {
          this.arrayExpression.elements.push(
            Literal(encode_ascii85(object.value))
          );
          index = this.arrayExpression.elements.length - 1;
          this.index[object.value] = index;
        } else {
          index = this.index[object.value];
          ok(index);
        }

        ok(index != -1, "index == -1");
        this.replace(
          object,
          CallExpression(Identifier(this.getterName), [Literal(index)])
        );

        // Fix 1. Make parent property key computed
        if (
          parents[0] &&
          parents[0].type == "Property" &&
          parents[0].key == object
        ) {
          parents[0].computed = true;
        }
      }
    };
  }
}
