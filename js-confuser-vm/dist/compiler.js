import { parse } from "@babel/parser";
import traverseImport from "@babel/traverse";
import { generate } from "@babel/generator";
import { stripTypeScriptTypes } from "module";
import JSON5 from "json5";
import { ok } from "assert";
import { obfuscateRuntime } from "./runtimeObf.js";
import { resolveLabels } from "./transforms/resolveLabels.js";
import { resolveConstants } from "./transforms/resolveContants.js";
import * as b from "./types.js";
const traverse = traverseImport.default || traverseImport;
const readVMRuntimeFile = () => "import { OP_ORIGINAL as OP } from \"./compiler.ts\";\nconst BYTECODE = [];\nconst MAIN_START_PC = 0;\nconst CONSTANTS = [];\nconst ENCODE_BYTECODE = false;\nconst TIMING_CHECKS = false;\n// The text above is not included in the compiled output - for type intellisense only\n// @START\n\nfunction decodeBytecode(s) {\n  if (!ENCODE_BYTECODE) return s;\n\n  var b =\n    typeof Buffer !== \"undefined\"\n      ? Buffer.from(s, \"base64\")\n      : Uint8Array.from(atob(s), function (c) {\n          return c.charCodeAt(0);\n        });\n  var r = new Int32Array(b.length / 4);\n  for (var i = 0; i < r.length; i++)\n    r[i] =\n      b[i * 4] |\n      (b[i * 4 + 1] << 8) |\n      (b[i * 4 + 2] << 16) |\n      (b[i * 4 + 3] << 24);\n  return r;\n}\n\n// Closure symbol\n// Used to tag shell functions so the VM can fast-path back to the\n// inner Closure instead of going through a sub-VM on internal calls.\nvar CLOSURE_SYM = Symbol(); // Nameless for obfuscation\n\n// Upvalue\n// While the outer frame is alive: reads/writes go to frame.locals[slot].\n// After the outer frame returns (closed): reads/writes hit this.value.\nfunction Upvalue(frame, slot) {\n  this._frame = frame;\n  this._slot = slot;\n  this._closed = false;\n  this._value = undefined;\n}\nUpvalue.prototype._read = function () {\n  return this._closed ? this._value : this._frame.locals[this._slot];\n};\nUpvalue.prototype._write = function (v) {\n  if (this._closed) this._value = v;\n  else this._frame.locals[this._slot] = v;\n};\nUpvalue.prototype._close = function () {\n  this._value = this._frame.locals[this._slot];\n  this._closed = true;\n};\n\n// Closure & Frame\nfunction Closure(fn) {\n  this.fn = fn;\n  this.upvalues = [];\n  this.prototype = {}; // <- default prototype object for \\`new\\`\n}\n\nfunction Frame(closure, returnPc, parent, thisVal ) {\n  this.closure = closure;\n  this.locals = new Array(closure.fn.localCount).fill(undefined);\n  this._pc = closure.fn.startPc; // <- initialize from fn descriptor\n  this._returnPc = returnPc; // pc to resume in parent frame after RETURN\n  this._parent = parent;\n  this.thisVal = thisVal !== undefined ? thisVal : undefined;\n  this._newObj = null; // <- set by NEW so RETURN can see it\n  this._handlerStack = []; // <- exception handlers pushed by TRY_SETUP\n}\n\n// VM\nfunction VM(bytecode, mainStartPc, constants, globals) {\n  this.bytecode = bytecode;\n  this.constants = constants;\n  this.globals = globals;\n  this._stack = [];\n  this._frameStack = [];\n  this._openUpvalues = []; // all currently open Upvalue objects across all frames\n\n  var mainFn = {\n    paramCount: 0,\n    localCount: 0,\n    startPc: mainStartPc, // <- where main begins\n  };\n  this._currentFrame = new Frame(new Closure(mainFn), null, null);\n}\n\nVM.prototype._push = function (v) {\n  this._stack.push(v);\n};\nVM.prototype._pop = function () {\n  return this._stack.pop();\n};\nVM.prototype.peek = function () {\n  return this._stack[this._stack.length - 1];\n};\n\nVM.prototype.captureUpvalue = function (frame, slot) {\n  // Reuse existing open upvalue for this frame+slot if one exists.\n  // This is what makes two closures share the same mutable cell.\n  for (var i = 0; i < this._openUpvalues.length; i++) {\n    var uv = this._openUpvalues[i];\n    if (uv._frame === frame && uv._slot === slot) return uv;\n  }\n  var uv = new Upvalue(frame, slot);\n  this._openUpvalues.push(uv);\n  return uv;\n};\n\nVM.prototype._closeUpvaluesFor = function (frame) {\n  // Called on RETURN - close every upvalue that was pointing into this frame.\n  // After this, closures that captured from the frame read from upvalue.value.\n  this._openUpvalues = this._openUpvalues.filter(function (uv) {\n    if (uv._frame === frame) {\n      uv._close();\n      return false;\n    }\n    return true;\n  });\n};\n\nVM.prototype.run = function () {\n  var now = () => {\n    return performance.now();\n  };\n\n  var t = now();\n\n  while (true) {\n    var frame = this._currentFrame;\n    var bc = this.bytecode;\n    if (frame._pc >= bc.length) break;\n\n    var op, operand;\n    var word = bc[frame._pc++];\n\n    if (ENCODE_BYTECODE) {\n      op = word & 0xff;\n      operand = word >>> 8;\n    } else {\n      op = word[0];\n      operand = word[1];\n    }\n\n    // console.log(frame._pc - 1, op, operand);\n\n    // Debugging protection\n    if (TIMING_CHECKS) {\n      var t2 = now();\n      var isTamper = t2 - t > 1000;\n      t = t2;\n      if (isTamper) {\n        op = OP.POP;\n      }\n    }\n\n    try {\n      /* @SWITCH */\n      switch (op) {\n        case OP.LOAD_CONST:\n          this._push(this.constants[operand]);\n          break;\n\n        case OP.LOAD_LOCAL:\n          this._push(frame.locals[operand]);\n          break;\n\n        case OP.STORE_LOCAL:\n          frame.locals[operand] = this._pop();\n          break;\n\n        case OP.LOAD_GLOBAL:\n          this._push(this.globals[this.constants[operand]]);\n          break;\n\n        case OP.STORE_GLOBAL:\n          this.globals[this.constants[operand]] = this._pop();\n          break;\n\n        case OP.GET_PROP: {\n          // Stack: [..., obj, key] -> [..., obj, obj[key]]\n          // obj is PEEKED (not popped) - CALL_METHOD needs it as receiver\n          var key = this._pop();\n          var obj = this.peek();\n          this._push(obj[key]);\n          break;\n        }\n\n        case OP.ADD: {\n          var b = this._pop();\n          this._push(this._pop() + b);\n          break;\n        }\n        case OP.SUB: {\n          var b = this._pop();\n          this._push(this._pop() - b);\n          break;\n        }\n        case OP.MUL: {\n          var b = this._pop();\n          this._push(this._pop() * b);\n          break;\n        }\n        case OP.DIV: {\n          var b = this._pop();\n          this._push(this._pop() / b);\n          break;\n        }\n        case OP.MOD: {\n          var b = this._pop();\n          this._push(this._pop() % b);\n          break;\n        }\n        case OP.BAND: {\n          var b = this._pop();\n          this._push(this._pop() & b);\n          break;\n        }\n        case OP.BOR: {\n          var b = this._pop();\n          this._push(this._pop() | b);\n          break;\n        }\n        case OP.BXOR: {\n          var b = this._pop();\n          this._push(this._pop() ^ b);\n          break;\n        }\n        case OP.SHL: {\n          var b = this._pop();\n          this._push(this._pop() << b);\n          break;\n        }\n        case OP.SHR: {\n          var b = this._pop();\n          this._push(this._pop() >> b);\n          break;\n        }\n        case OP.USHR: {\n          var b = this._pop();\n          this._push(this._pop() >>> b);\n          break;\n        }\n\n        case OP.LT: {\n          var b = this._pop();\n          this._push(this._pop() < b);\n          break;\n        }\n        case OP.GT: {\n          var b = this._pop();\n          this._push(this._pop() > b);\n          break;\n        }\n        case OP.EQ: {\n          var b = this._pop();\n          this._push(this._pop() === b);\n          break;\n        }\n\n        case OP.LTE: {\n          var b = this._pop();\n          this._push(this._pop() <= b);\n          break;\n        }\n        case OP.GTE: {\n          var b = this._pop();\n          this._push(this._pop() >= b);\n          break;\n        }\n        case OP.NEQ: {\n          var b = this._pop();\n          this._push(this._pop() !== b);\n          break;\n        }\n        case OP.LOOSE_EQ: {\n          var b = this._pop();\n          this._push(this._pop() == b);\n          break;\n        }\n        case OP.LOOSE_NEQ: {\n          var b = this._pop();\n          this._push(this._pop() != b);\n          break;\n        }\n\n        case OP.IN: {\n          var b = this._pop();\n          this._push(this._pop() in b);\n          break;\n        }\n\n        case OP.INSTANCEOF: {\n          var ctor = this._pop();\n          var obj = this._pop();\n          if (typeof ctor === \"function\") {\n            // Native constructor (e.g. Array, Date) - native instanceof is fine\n            this._push(obj instanceof ctor);\n          } else {\n            // VM Closure - ctor.prototype was set by MAKE_CLOSURE / user assignment.\n            // Walk obj's prototype chain looking for identity with ctor.prototype.\n            var proto = ctor.prototype; // the .prototype property on the Closure\n            var target = Object.getPrototypeOf(obj);\n            var result = false;\n            while (target !== null) {\n              if (target === proto) {\n                result = true;\n                break;\n              }\n              target = Object.getPrototypeOf(target);\n            }\n            this._push(result);\n          }\n          break;\n        }\n\n        case OP.UNARY_NEG:\n          this._push(-this._pop());\n          break;\n        case OP.UNARY_POS:\n          this._push(this._pop());\n          break;\n        case OP.UNARY_NOT:\n          this._push(!this._pop());\n          break;\n        case OP.UNARY_BITNOT:\n          this._push(~this._pop());\n          break;\n        case OP.TYPEOF:\n          this._push(typeof this._pop());\n          break;\n        case OP.VOID:\n          this._pop();\n          this._push(undefined);\n          break;\n\n        case OP.TYPEOF_SAFE: {\n          // operand is a const index holding the variable name string.\n          // Mimics JS semantics: typeof undeclaredVar === \"undefined\" (no throw).\n          var name = this._pop(); // LOAD_CONST pushed the name - consume it\n          var val = Object.prototype.hasOwnProperty.call(this.globals, name)\n            ? this.globals[name]\n            : undefined;\n          this._push(typeof val);\n          break;\n        }\n\n        case OP.JUMP:\n          frame._pc = operand;\n          break;\n\n        case OP.JUMP_IF_FALSE:\n          if (!this._pop()) frame._pc = operand;\n          break;\n\n        case OP.JUMP_IF_TRUE_OR_POP:\n          // || semantics: if truthy, we're done - leave value, jump over RHS.\n          // If falsy, discard it and fall through to evaluate RHS.\n          if (this.peek()) {\n            frame._pc = operand;\n          } else {\n            this._pop();\n          }\n          break;\n\n        case OP.JUMP_IF_FALSE_OR_POP:\n          // && semantics: if falsy, we're done - leave value, jump over RHS.\n          // If truthy, discard it and fall through to evaluate RHS.\n          if (!this.peek()) {\n            frame._pc = operand;\n          } else {\n            this._pop();\n          }\n          break;\n\n        case OP.MAKE_CLOSURE: {\n          var fn = this.constants[operand];\n          var closure = new Closure(fn);\n          for (var i = 0; i < fn.upvalueDescriptors.length; i++) {\n            var desc = fn.upvalueDescriptors[i];\n            if (desc.isLocal) {\n              // Capture directly from current frame's local slot\n              closure.upvalues.push(this.captureUpvalue(frame, desc._index));\n            } else {\n              // Relay - take upvalue from the enclosing closure's list\n              closure.upvalues.push(frame.closure.upvalues[desc._index]);\n            }\n          }\n          // Wrap in a native callable shell so host code (array methods,\n          // test assertions, setTimeout, etc.) can invoke VM closures.\n          // CLOSURE_SYM lets VM-internal CALL/NEW bypass the sub-VM entirely.\n          var self = this;\n          var shell = (function (c) {\n            return function () {\n              var args = Array.prototype.slice.call(arguments);\n              var sub = new VM(self.bytecode, 0, self.constants, self.globals);\n              // Sloppy-mode: null/undefined thisArg \u2192 global object\n              var f = new Frame(\n                c,\n                null,\n                null,\n                this == null ? self.globals : this,\n              );\n              for (var i = 0; i < args.length; i++) f.locals[i] = args[i];\n              f.locals[c.fn.paramCount] = args;\n              sub._currentFrame = f;\n              return sub.run();\n            };\n          })(closure);\n          shell[CLOSURE_SYM] = closure;\n          shell.prototype = closure.prototype; // unified prototype for new/instanceof\n          this._push(shell);\n          break;\n        }\n\n        case OP.LOAD_UPVALUE:\n          this._push(frame.closure.upvalues[operand]._read());\n          break;\n\n        case OP.STORE_UPVALUE:\n          frame.closure.upvalues[operand]._write(this._pop());\n          break;\n\n        case OP.BUILD_ARRAY: {\n          // Pop \\`operand\\` values off the stack in reverse, assemble array.\n          var elems = this._stack.splice(this._stack.length - operand);\n          this._push(elems);\n          break;\n        }\n\n        case OP.BUILD_OBJECT: {\n          // Stack has: key0, val0, key1, val1 ... keyN, valN  (pushed left->right)\n          // Pop all pairs and build the object.\n          var pairs = this._stack.splice(this._stack.length - operand * 2);\n          var o = {};\n          for (var i = 0; i < pairs.length; i += 2) {\n            o[pairs[i]] = pairs[i + 1]; // key at even index, val at odd\n          }\n          this._push(o);\n          break;\n        }\n        case OP.SET_PROP: {\n          // Stack: [..., obj, key, val]\n          // Leaves val on stack - assignment is an expression in JS.\n          var val = this._pop();\n          var key = this._pop();\n          var obj = this._pop();\n          // Reflect.set performs [[Set]] without throwing on failure,\n          // correctly simulating sloppy-mode assignment from a strict-mode host\n          // (output.js is an ES module). This also properly invokes inherited\n          // or prototype-chain setter functions.\n          Reflect.set(obj, key, val);\n          this._push(val); // assignment expression evaluates to the assigned value\n          break;\n        }\n        case OP.GET_PROP_COMPUTED: {\n          // Stack: [..., obj, key]  - key is a runtime value (nums[i])\n          // Mirrors GET_PROP but pops the key that was pushed dynamically.\n          var key = this._pop();\n          var obj = this._pop();\n          this._push(obj[key]);\n          break;\n        }\n        case OP.DELETE_PROP: {\n          var key = this._pop();\n          var obj = this._pop();\n          this._push(delete obj[key]);\n          break;\n        }\n\n        case OP.CALL: {\n          var args = this._stack.splice(this._stack.length - operand);\n          var callee = this._pop();\n          if (callee && callee[CLOSURE_SYM]) {\n            // VM closure - run directly in this VM, no sub-VM overhead\n            var c = callee[CLOSURE_SYM];\n            // Sloppy-mode: plain function call \u2192 global object as this\n            var f = new Frame(c, frame._pc, frame, this.globals);\n            for (var i = 0; i < args.length; i++) f.locals[i] = args[i];\n            f.locals[c.fn.paramCount] = args;\n            this._frameStack.push(this._currentFrame);\n            this._currentFrame = f;\n          } else {\n            // Native function\n            this._push(callee.apply(null, args));\n          }\n          break;\n        }\n\n        case OP.CALL_METHOD: {\n          var args = this._stack.splice(this._stack.length - operand);\n          var callee = this._pop();\n          var receiver = this._pop(); // left on stack by GET_PROP\n          if (callee && callee[CLOSURE_SYM]) {\n            // VM closure - run directly in this VM with receiver as this\n            var c = callee[CLOSURE_SYM];\n            var f = new Frame(c, frame._pc, frame, receiver);\n            for (var i = 0; i < args.length; i++) f.locals[i] = args[i];\n            f.locals[c.fn.paramCount] = args;\n            this._frameStack.push(this._currentFrame);\n            this._currentFrame = f;\n          } else {\n            // Native method\n            this._push(callee.apply(receiver, args));\n          }\n          break;\n        }\n\n        case OP.LOAD_THIS:\n          this._push(frame.thisVal);\n          break;\n\n        case OP.NEW: {\n          var args = this._stack.splice(this._stack.length - operand);\n          var callee = this._pop();\n          if (callee && callee[CLOSURE_SYM]) {\n            // VM closure constructor - prototype is unified via shell.prototype = closure.prototype\n            var c = callee[CLOSURE_SYM];\n            var newObj = Object.create(c.prototype || null);\n            var f = new Frame(c, frame._pc, frame, newObj);\n            f._newObj = newObj;\n            for (var i = 0; i < args.length; i++) f.locals[i] = args[i];\n            f.locals[c.fn.paramCount] = args;\n            this._frameStack.push(this._currentFrame);\n            this._currentFrame = f;\n          } else {\n            // Native constructor (e.g. new Error(), new Date()).\n            // Reflect.construct is required - Object.create+apply does NOT set\n            // internal slots ([[NumberData]], [[StringData]], etc.) for built-ins.\n            this._push(Reflect.construct(callee, args));\n          }\n          break;\n        }\n\n        case OP.RETURN: {\n          var retVal = this._pop();\n          this._closeUpvaluesFor(frame); // must happen before frame is abandoned\n          if (this._frameStack.length === 0) return retVal;\n\n          // new-call rule: primitive return -> discard, use the constructed object instead\n          if (frame._newObj !== null) {\n            if (typeof retVal !== \"object\" || retVal === null)\n              retVal = frame._newObj;\n          }\n\n          this._currentFrame = this._frameStack.pop();\n          this._push(retVal);\n          break;\n        }\n\n        case OP.POP:\n          this._pop();\n          break;\n\n        case OP.DUP:\n          this._push(this.peek());\n          break;\n\n        case OP.THROW:\n          throw this._pop();\n\n        case OP.FOR_IN_SETUP: {\n          // Pop the object; build an ordered list of all enumerable own+inherited\n          // string keys by walking the prototype chain manually.\n          // Uses getOwnPropertyNames (includes non-enumerable) + descriptor check,\n          // so we never rely on Object.keys() and we handle inheritance correctly.\n          var obj = this._pop();\n          var keys = [];\n          if (obj !== null && obj !== undefined) {\n            var seen = Object.create(null);\n            var cur = Object(obj); // box primitives\n            while (cur !== null) {\n              var ownNames = Object.getOwnPropertyNames(cur);\n              for (var i = 0; i < ownNames.length; i++) {\n                var k = ownNames[i];\n                if (!(k in seen)) {\n                  seen[k] = true;\n                  var propDesc = Object.getOwnPropertyDescriptor(cur, k);\n                  if (propDesc && propDesc.enumerable) {\n                    keys.push(k);\n                  }\n                }\n              }\n              cur = Object.getPrototypeOf(cur);\n            }\n          }\n          this._push({ _keys: keys, i: 0 });\n          break;\n        }\n\n        case OP.FOR_IN_NEXT: {\n          // operand = jump target for the done case.\n          // Pop the iterator; if exhausted jump to exit, otherwise push next key.\n          var iter = this._pop();\n          if (iter.i >= iter._keys.length) {\n            frame._pc = operand;\n          } else {\n            this._push(iter._keys[iter.i++]);\n          }\n          break;\n        }\n\n        case OP.PATCH: {\n          // Pop destination PC, then write constants[operand] (packed word array)\n          // directly into this.bytecode starting at that PC.\n          var destPc = this._pop();\n          var words = this.constants[operand];\n\n          if (ENCODE_BYTECODE) {\n            words = decodeBytecode(words);\n          }\n\n          for (var i = 0; i < words.length; i++) {\n            this.bytecode[destPc + i] = words[i];\n          }\n          break;\n        }\n\n        case OP.TRY_SETUP: {\n          // Push an exception handler record onto the current frame.\n          // Saves: catch PC (operand), current stack depth, current frame-stack depth.\n          // If an exception is thrown before TRY_END fires, the VM jumps here.\n          frame._handlerStack.push({\n            handlerPc: operand,\n            stackDepth: this._stack.length,\n            frameStackDepth: this._frameStack.length,\n          });\n          break;\n        }\n\n        case OP.TRY_END: {\n          // Normal exit from a try block \u2014 disarm the exception handler.\n          frame._handlerStack.pop();\n          break;\n        }\n\n        case OP.DEFINE_GETTER: {\n          // Stack: [..., obj, key, getterFn]\n          // Pops all three; defines an enumerable, configurable getter on obj.\n          // If a setter was already defined for this key, it is preserved.\n          var getterFn = this._pop();\n          var key = this._pop();\n          var obj = this._pop();\n          var existingDesc = Object.getOwnPropertyDescriptor(obj, key);\n          var getDesc                     = {\n            get: getterFn,\n            configurable: true,\n            enumerable: true,\n          };\n          if (existingDesc && typeof existingDesc.set === \"function\") {\n            getDesc.set = existingDesc.set;\n          }\n          Object.defineProperty(obj, key, getDesc);\n          break;\n        }\n\n        case OP.DEFINE_SETTER: {\n          // Stack: [..., obj, key, setterFn]\n          // Pops all three; defines an enumerable, configurable setter on obj.\n          // If a getter was already defined for this key, it is preserved.\n          var setterFn = this._pop();\n          var key = this._pop();\n          var obj = this._pop();\n          var existingDesc = Object.getOwnPropertyDescriptor(obj, key);\n          var setDesc                     = {\n            set: setterFn,\n            configurable: true,\n            enumerable: true,\n          };\n          if (existingDesc && typeof existingDesc.get === \"function\") {\n            setDesc.get = existingDesc.get;\n          }\n          Object.defineProperty(obj, key, setDesc);\n          break;\n        }\n\n        case OP.DEBUGGER: {\n          debugger;\n          break;\n        }\n\n        default:\n          throw new Error(\n            \"Unknown opcode: \" + op + \" at pc \" + (frame._pc - 1),\n          );\n      }\n    } catch (err) {\n      // Exception handler unwinding (CPython-style frame walk, Lua-style upvalue close).\n      // Walk from the current frame upward until we find a frame that has an open\n      // exception handler (TRY_SETUP without a matching TRY_END).\n      // For every frame we abandon along the way, close its captured upvalues.\n      var handledFrame = null;\n      var searchFrame = this._currentFrame;\n      while (true) {\n        if (searchFrame._handlerStack.length > 0) {\n          handledFrame = searchFrame;\n          break;\n        }\n        // No handler in this frame \u2014 abandon it and walk up.\n        this._closeUpvaluesFor(searchFrame);\n        if (this._frameStack.length === 0) break;\n        searchFrame = this._frameStack.pop();\n        this._currentFrame = searchFrame;\n      }\n\n      if (!handledFrame) throw err; // no handler anywhere \u2014 propagate to host\n\n      var h = handledFrame._handlerStack.pop();\n      // Restore the VM value stack to the depth recorded at TRY_SETUP time,\n      // then push the caught exception so the catch binding can store it.\n      this._stack.length = h.stackDepth;\n      this._push(err);\n      // Discard any call-frames that were pushed inside the try body\n      // (functions called from within the try block that are still live).\n      this._frameStack.length = h.frameStackDepth;\n      // Jump to the catch block.\n      handledFrame._pc = h.handlerPc;\n      this._currentFrame = handledFrame;\n    }\n  }\n};\n\n// Boot\nvar globals      = {}; // global object for globals\n\n// Always pull built-ins from globalThis so eval() scoping can't shadow them\n// with a local `window` variable (e.g. the test harness fake window).\nfor (var k of Object.getOwnPropertyNames(globalThis)) {\n  globals[k] = globalThis[k];\n}\n// If a window object is in scope (browser or test harness), capture it\n// explicitly so VM code can read/write window.TEST_OUTPUT etc.\nif (typeof window !== \"undefined\") {\n  globals[\"window\"] = window;\n}\n\n// Transfer common primitives\nglobals.undefined = undefined;\nglobals.Infinity = Infinity;\nglobals.NaN = NaN;\n\nvar vm = new VM(decodeBytecode(BYTECODE), MAIN_START_PC, CONSTANTS, globals);\nvm.run();\n";
const VM_RUNTIME = readVMRuntimeFile().split("@START")[1];

// Opcodes
export const OP_ORIGINAL = {
  LOAD_CONST: 0,
  LOAD_LOCAL: 1,
  STORE_LOCAL: 2,
  LOAD_GLOBAL: 3,
  STORE_GLOBAL: 4,
  GET_PROP: 5,
  ADD: 6,
  // a + b (both are popped)
  SUB: 7,
  // a - b
  MUL: 8,
  // a * b
  DIV: 9,
  // a / b
  MAKE_CLOSURE: 10,
  CALL: 11,
  CALL_METHOD: 12,
  RETURN: 13,
  POP: 14,
  // discard top of stack
  LT: 15,
  // pop b, pop a -> push (a < b)
  GT: 16,
  // pop b, pop a -> push (a > b)
  EQ: 17,
  // pop b, pop a -> push (a === b)
  JUMP: 18,
  // unconditional - operand = absolute bytecode index
  JUMP_IF_FALSE: 19,
  // pop value; jump if falsy
  LTE: 20,
  // a <= b
  GTE: 21,
  // a >= b
  NEQ: 22,
  // a !== b
  LOAD_UPVALUE: 23,
  // push frame.closure.upvalues[operand].read()
  STORE_UPVALUE: 24,
  // frame.closure.upvalues[operand].write(pop())

  //  Unary
  UNARY_NEG: 25,
  // -x
  UNARY_POS: 26,
  // +x
  UNARY_NOT: 27,
  // !x
  UNARY_BITNOT: 28,
  // ~x
  TYPEOF: 29,
  // typeof x
  VOID: 30,
  // void x  -> always undefined

  TYPEOF_SAFE: 31,
  // operand = name constIdx - typeof guard for undeclared globals
  BUILD_ARRAY: 32,
  // operand = element count - pops N values -> pushes array
  BUILD_OBJECT: 33,
  // operand = pair count   - pops N*2 (key,val) -> pushes object
  SET_PROP: 34,
  // pop val, pop key, peek obj -> obj[key] = val (obj stays on stack)
  GET_PROP_COMPUTED: 35,
  // pop key, peek obj -> push obj[key]  (computed: nums[i])

  MOD: 36,
  // a % b
  BAND: 37,
  // a & b
  BOR: 38,
  // a | b
  BXOR: 39,
  // a ^ b
  SHL: 40,
  // a << b
  SHR: 41,
  // a >> b
  USHR: 42,
  // a >>> b

  JUMP_IF_FALSE_OR_POP: 43,
  // && - if top falsy:  jump (keep), else: pop, eval RHS
  JUMP_IF_TRUE_OR_POP: 44,
  // || - if top truthy: jump (keep), else: pop, eval RHS

  DELETE_PROP: 45,
  IN: 46,
  // a in b
  INSTANCEOF: 47,
  // a instanceof b

  // NEW
  LOAD_THIS: 48,
  // push frame.thisVal
  NEW: 49,
  // operand = argCount - construct a new object
  DUP: 50,
  // duplicate top of stack
  THROW: 51,
  // pop value, throw it
  LOOSE_EQ: 52,
  // a == b  (abstract equality)
  LOOSE_NEQ: 53,
  // a != b  (abstract inequality)

  FOR_IN_SETUP: 54,
  // pop obj -> build enumerable-key iterator -> push {keys,i}
  FOR_IN_NEXT: 55,
  // operand=exit_pc; pop iter; if done->jump; else push next key

  // Self-modifying bytecode
  PATCH: 56,
  // pop destPc; constants[operand]=word[]; write words into bytecode[destPc..]

  // Try-Catch
  TRY_SETUP: 57,
  // operand = catch_pc; push exception handler onto frame._handlerStack
  TRY_END: 58,
  // pop exception handler (normal exit from try body)

  // Getter / Setter (ES5 object literal accessor syntax)
  DEFINE_GETTER: 59,
  // pop fn, pop key, pop obj -> Object.defineProperty(obj, key, {get: fn})
  DEFINE_SETTER: 60,
  // pop fn, pop key, pop obj -> Object.defineProperty(obj, key, {set: fn})

  DEBUGGER: 61 // for dev/testing -- emits a "debugger" statement with a comment of the original source location
};

// Scope
// Each function call gets its own Scope. Locals are resolved to
// numeric slots at compile time -- zero name lookups at runtime.
class Scope {
  constructor(parent = null) {
    this.parent = parent;
    this._locals = new Map(); // name -> slot index
    this._next = 0;
  }
  define(name) {
    if (!this._locals.has(name)) {
      this._locals.set(name, this._next++);
    }
    return this._locals.get(name);
  }

  // Walk up scope chain. If we fall off the top -> global.
  resolve(name) {
    if (this._locals.has(name)) {
      return {
        kind: "local",
        slot: this._locals.get(name)
      };
    }
    if (this.parent) return this.parent.resolve(name);
    return {
      kind: "global"
    };
  }
  get localCount() {
    return this._next;
  }
}

// FnContext
// Compiler-side state for the function currently being compiled.
// Distinct from runtime Frame -- this is compile-time only.
class FnContext {
  constructor(compiler, parentCtx = null) {
    this.compiler = compiler;
    this.parentCtx = parentCtx;
    this.scope = new Scope();
    this.bc = [];
    this.upvalues = []; // { name, isLocal, index }
  }

  // Find or register a captured variable as an upvalue.
  // isLocal=true  -> captured directly from parent's locals[index]
  // isLocal=false -> relayed from parent's own upvalue list[index]
  addUpvalue(name, isLocal, index) {
    const existing = this.upvalues.findIndex(u => u.name === name);
    if (existing !== -1) return existing;
    const idx = this.upvalues.length;
    this.upvalues.push({
      name,
      isLocal,
      index: index
    });
    return idx;
  }
}

// Compiler
export class Compiler {
  emit(bc, instr, node) {
    bc.push(instr);
    if (node) {
      // Bytecode source location tracking
      if (!this._sourceMap.has(instr)) {
        this._sourceMap.set(instr, node);
      }
    }
  }

  // DO NOT USE THIS KEY UNLESS YOU ARE "RESOLVE CONSTANTS"
  // CONSTANTS DURING COMPILATION MUST BE USED BY REFERENCE WITH b.constantOperand("myConstantHere")

  constructor(options) {
    this.options = options;
    this.fnDescriptors = []; // populated in pass 1
    this.bytecode = [];
    this.mainStartPc = 0;
    this._currentCtx = null; // FnContext of the function being compiled, null at top-level
    this._loopStack = []; // per active loop/switch/block/try
    this._pendingLabel = null;
    this._forInCount = 0; // counter for synthetic for-in iterator global names
    this._labelCount = 0; // monotonically increasing counter for unique label names

    this._sourceMap = new Map();
    this.serializer = new Serializer(this);
    this.OP = {};
    // Construct randomized opcode mapping
    if (this.options.randomizeOpcodes) {
      let usedNumbers = new Set();
      for (const key in OP_ORIGINAL) {
        let val;
        do {
          val = Math.floor(Math.random() * 256);
        } while (usedNumbers.has(val));
        usedNumbers.add(val);
        this.OP[key] = val;
      }
    } else {
      this.OP = OP_ORIGINAL;
    }

    // Reverse map for comment generation
    this.OP_NAME = Object.fromEntries(Object.entries(this.OP).map(([k, v]) => [v, k]));
    this.JUMP_OPS = new Set([this.OP.JUMP, this.OP.JUMP_IF_FALSE, this.OP.JUMP_IF_TRUE_OR_POP, this.OP.JUMP_IF_FALSE_OR_POP, this.OP.FOR_IN_NEXT, this.OP.TRY_SETUP // catch_pc operand needs offset adjustment like jump targets
    ]);
  }

  // Generate a globally unique label string with an optional hint for readability.
  _makeLabel(hint = "") {
    const id = this._labelCount++;
    return hint ? `${hint}_${id}` : `L${id}`;
  }

  // Variable resolution
  // Walks up the FnContext chain. Crossing a context boundary means
  // we're capturing from an outer function - register an upvalue.
  _resolve(name, ctx) {
    if (!ctx) return {
      kind: "global"
    };

    // 1. Own locals
    if (ctx.scope._locals.has(name)) {
      return {
        kind: "local",
        slot: ctx.scope._locals.get(name)
      };
    }

    // 2. No parent context -> must be global
    if (!ctx.parentCtx) return {
      kind: "global"
    };

    // 3. Ask parent -- recurse up the chain
    const parentResult = this._resolve(name, ctx.parentCtx);
    if (parentResult.kind === "global") return {
      kind: "global"
    };

    // 4. Parent has it (as local or upvalue) -- register an upvalue here.
    //    isLocal=true means "take it straight from parent's locals[index]"
    //    isLocal=false means "relay parent's upvalue[index]" (multi-level capture)
    const isLocal = parentResult.kind === "local";
    const index = isLocal ? parentResult.slot : parentResult.index;
    const uvIdx = ctx.addUpvalue(name, isLocal, index);
    return {
      kind: "upvalue",
      index: uvIdx
    };
  }

  // Entry point
  compile(source) {
    const ast = parse(source, {
      sourceType: "script"
    });
    return this.compileAST(ast);
  }
  compileAST(ast) {
    // Pass 1 - compile every FunctionDeclaration into a descriptor.
    //           Traverse finds them regardless of nesting depth.
    traverse(ast, {
      FunctionDeclaration: path => {
        // Only handle top-level functions for this MVP.
        // (Parent is Program node)
        if (path.parent.type !== "Program") return;
        this._compileFunctionDecl(path.node);
        path.skip(); // don't recurse into nested functions
      }
    });

    // Pass 2 -- compile top-level statements into BYTECODE.
    this._compileMain(ast.program.body);
    return this.bytecode;
  }

  // Function Declaration

  _compileFunctionDecl(node) {
    // Create a context whose parent is whatever we're currently compiling.
    // This is what lets _resolve cross function boundaries correctly.
    const ctx = new FnContext(this, this._currentCtx);
    const savedCtx = this._currentCtx;
    this._currentCtx = ctx;

    // Isolate the loop stack so that try/loop entries from the outer scope
    // don't cause spurious TRY_END / extra jumps inside this function body.
    const savedLoopStack = this._loopStack;
    this._loopStack = [];

    // Params occupy the first N local slots (args are copied in on CALL)
    for (const param of node.params) {
      let identifier = param.type === "AssignmentPattern" ? param.left : param;
      ok(identifier.type === "Identifier", "Only simple identifiers allowed as parameters");
      ctx.scope.define(identifier.name);
    }

    // Reserve the next slot for the implicit `arguments` object.
    // Slot index will always equal paramCount (params are 0..paramCount-1).
    ctx.scope.define("arguments");

    // Pass 2: emit default-value guards at top of fn body
    // Mirrors what JS engines do: if the caller passed undefined (or
    // nothing), evaluate the default expression and overwrite the slot.
    for (const param of node.params) {
      if (param.type !== "AssignmentPattern") continue;
      const slot = ctx.scope._locals.get(param.left.name);
      const skipLabel = this._makeLabel("param_skip");

      // if (param === undefined) param = <default expr>
      this.emit(ctx.bc, [this.OP.LOAD_LOCAL, slot], param);
      this.emit(ctx.bc, [this.OP.LOAD_CONST, b.constantOperand(undefined)], param);
      this.emit(ctx.bc, [this.OP.EQ], param);
      this.emit(ctx.bc, [this.OP.JUMP_IF_FALSE, {
        type: "label",
        label: skipLabel
      }], param);
      this._compileExpr(param.right, ctx.scope, ctx.bc); // eval default
      this.emit(ctx.bc, [this.OP.STORE_LOCAL, slot], param);
      this.emit(ctx.bc, [null, {
        type: "defineLabel",
        label: skipLabel
      }], param);
    }
    for (const stmt of node.body.body) {
      this._compileStatement(stmt, ctx.scope, ctx.bc);
    }

    // If we fall off the end of the function, implicitly return undefined.
    this.emit(ctx.bc, [this.OP.LOAD_CONST, b.constantOperand(undefined)], node);
    this.emit(ctx.bc, [this.OP.RETURN], node);
    this._currentCtx = savedCtx; // restore before touching fnDescriptors
    this._loopStack = savedLoopStack;
    var fnIdx = this.fnDescriptors.length;
    node._fnIdx = fnIdx; // for error messages

    const desc = {
      name: node.id?.name || "<anonymous>",
      paramCount: node.params.length,
      localCount: ctx.scope.localCount,
      upvalueDescriptors: ctx.upvalues.map(u => ({
        isLocal: u.isLocal,
        _index: u.index
      })),
      bytecode: ctx.bc,
      // Indices assigned after pushing into the pool
      _fnIdx: this.fnDescriptors.length
    };
    this.fnDescriptors.push(desc);
    return desc;
  }

  // Main (top-level)
  _compileMain(body) {
    const bc = this.bytecode;

    // Hoist all FunctionDeclarations: MAKE_CLOSURE -> STORE_GLOBAL
    // (mirrors JS hoisting -- functions are available before other code)
    for (const node of body) {
      if (node.type !== "FunctionDeclaration") continue;
      const desc = this.fnDescriptors.find(d => d._fnIdx === node._fnIdx);
      const nameIdx = b.constantOperand(node.id.name);
      this.emit(bc, [this.OP.MAKE_CLOSURE, b.constantOperand(desc)], node);
      this.emit(bc, [this.OP.STORE_GLOBAL, nameIdx], node);
    }

    // Compile everything else in order
    for (const node of body) {
      if (node.type === "FunctionDeclaration") continue;
      this._compileStatement(node, null, bc); // null scope -> global context
    }
    this.emit(bc, [this.OP.RETURN], null); // end program

    // Append all function bodies. Each function gets a defineLabel at its entry
    // so resolveLabels() can compute the correct startPc after stripping pseudos.
    // TODO: selfModifying will be re-added as a separate pass.
    for (const descriptor of this.fnDescriptors) {
      const entryLabel = this._makeLabel(`fn_${descriptor._fnIdx}`);
      descriptor.startLabel = entryLabel; // resolved to startPc by compileAndSerialize
      this.bytecode.push([null, {
        type: "defineLabel",
        label: entryLabel
      }]);
      this.emit(descriptor.bytecode, [this.OP.RETURN], null); // ensure every function ends with RETURN
      for (const instr of descriptor.bytecode) {
        this.bytecode.push(instr);
      }
    }
    if (this.bytecode.length > 0xffffff) throw new Error(`Program too large: ${this.bytecode.length} instructions, max 16,777,215`);

    // if (this.constants.items.length > 0xffffff)
    //   throw new Error(
    //     `Constant pool too large: ${this.constants.items.length} entries, max 16,777,215`,
    //   );
  }

  // Statements
  _compileStatement(node, scope, bc) {
    switch (node.type) {
      case "EmptyStatement":
        {
          // nothing to emit -- bare semicolon is a no-op
          break;
        }
      case "DebuggerStatement":
        this.emit(bc, [this.OP.DEBUGGER], node);
        break;
      case "BlockStatement":
        {
          for (const stmt of node.body) {
            this._compileStatement(stmt, scope, bc);
          }
          break;
        }
      case "FunctionDeclaration":
        {
          // Nested function -- compile it into a descriptor, then emit
          // MAKE_CLOSURE so it's captured as a live closure at runtime.
          // (_compileFunctionDecl pushes/pops _currentCtx internally)
          const desc = this._compileFunctionDecl(node);
          this.emit(bc, [this.OP.MAKE_CLOSURE, b.constantOperand(desc)], node);
          if (scope) {
            const slot = scope.define(node.id.name);
            this.emit(bc, [this.OP.STORE_LOCAL, slot], node);
          } else {
            this.emit(bc, [this.OP.STORE_GLOBAL, b.constantOperand(node.id.name)], node);
          }
          break;
        }
      case "ThrowStatement":
        {
          this._compileExpr(node.argument, scope, bc);
          this.emit(bc, [this.OP.THROW], node);
          break;
        }
      case "ReturnStatement":
        {
          if (node.argument) {
            this._compileExpr(node.argument, scope, bc);
          } else {
            this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(undefined)], node);
          }
          // Disarm any open try handlers before leaving the function.
          // TRY_END only touches frame._handlerStack, not the value stack,
          // so the return value sitting on top is safe.
          for (let _ri = this._loopStack.length - 1; _ri >= 0; _ri--) {
            if (this._loopStack[_ri].type === "try") {
              this.emit(bc, [this.OP.TRY_END], node);
            }
          }
          this.emit(bc, [this.OP.RETURN], node);
          break;
        }
      case "ExpressionStatement":
        {
          this._compileExpr(node.expression, scope, bc);
          this.emit(bc, [this.OP.POP], node); // discard return value of statement-level expressions
          break;
        }
      case "VariableDeclaration":
        {
          for (const decl of node.declarations) {
            // Push the initialiser (or undefined if absent)
            if (decl.init) {
              this._compileExpr(decl.init, scope, bc);
            } else {
              this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(undefined)], node);
            }
            ok(decl.id.type === "Identifier", "Only simple identifiers can be declared");

            // Store: local slot if inside a function, global name otherwise
            if (scope) {
              const slot = scope.define(decl.id.name);
              this.emit(bc, [this.OP.STORE_LOCAL, slot], node);
            } else {
              this.emit(bc, [this.OP.STORE_GLOBAL, b.constantOperand(decl.id.name)], node);
            }
          }
          break;
        }
      case "IfStatement":
        {
          const elseOrEndLabel = this._makeLabel("if_else");
          // 1. Compile the test expression -> leaves a value on the stack
          this._compileExpr(node.test, scope, bc);
          // 2. Emit JUMP_IF_FALSE to the else branch (or end if no else)
          this.emit(bc, [this.OP.JUMP_IF_FALSE, {
            type: "label",
            label: elseOrEndLabel
          }], node);
          // 3. Compile the consequent block (the "then" branch)
          const consequentBody = node.consequent.type === "BlockStatement" ? node.consequent.body : [node.consequent];
          for (const stmt of consequentBody) {
            this._compileStatement(stmt, scope, bc);
          }
          if (node.alternate) {
            // 4a. Consequent needs to jump OVER the else block when done
            const endLabel = this._makeLabel("if_end");
            this.emit(bc, [this.OP.JUMP, {
              type: "label",
              label: endLabel
            }], node);
            // Mark start of else
            this.emit(bc, [null, {
              type: "defineLabel",
              label: elseOrEndLabel
            }], node);
            // 5. Compile the alternate (else) block
            const altBody = node.alternate.type === "BlockStatement" ? node.alternate.body : [node.alternate]; // handles `else if` -- it's just a nested IfStatement
            for (const stmt of altBody) {
              this._compileStatement(stmt, scope, bc);
            }
            // Mark end (consequent's jump lands here)
            this.emit(bc, [null, {
              type: "defineLabel",
              label: endLabel
            }], node);
          } else {
            // 4b. No else -- label lands right after the then block
            this.emit(bc, [null, {
              type: "defineLabel",
              label: elseOrEndLabel
            }], node);
          }
          break;
        }
      case "WhileStatement":
        {
          const _wLabel = this._pendingLabel;
          this._pendingLabel = null;
          const loopTopLabel = this._makeLabel("while_top");
          const exitLabel = this._makeLabel("while_exit");
          this._loopStack.push({
            type: "loop",
            label: _wLabel,
            breakLabel: exitLabel,
            continueLabel: loopTopLabel // continue re-evaluates the test
          });
          this.emit(bc, [null, {
            type: "defineLabel",
            label: loopTopLabel
          }], node);
          this._compileExpr(node.test, scope, bc);
          this.emit(bc, [this.OP.JUMP_IF_FALSE, {
            type: "label",
            label: exitLabel
          }], node);
          const whileBody = node.body.type === "BlockStatement" ? node.body.body : [node.body];
          for (const stmt of whileBody) {
            this._compileStatement(stmt, scope, bc);
          }
          this.emit(bc, [this.OP.JUMP, {
            type: "label",
            label: loopTopLabel
          }], node);
          this.emit(bc, [null, {
            type: "defineLabel",
            label: exitLabel
          }], node);
          this._loopStack.pop();
          break;
        }
      case "DoWhileStatement":
        {
          const _dwLabel = this._pendingLabel;
          this._pendingLabel = null;
          const loopTopLabel = this._makeLabel("dowhile_top");
          const continueLabel = this._makeLabel("dowhile_cont");
          const exitLabel = this._makeLabel("dowhile_exit");
          this._loopStack.push({
            type: "loop",
            label: _dwLabel,
            breakLabel: exitLabel,
            continueLabel: continueLabel // continue falls to the test
          });
          this.emit(bc, [null, {
            type: "defineLabel",
            label: loopTopLabel
          }], node);
          const doWhileBody = node.body.type === "BlockStatement" ? node.body.body : [node.body];
          for (const stmt of doWhileBody) {
            this._compileStatement(stmt, scope, bc);
          }

          // continue -> skip rest of body, fall through to test
          this.emit(bc, [null, {
            type: "defineLabel",
            label: continueLabel
          }], node);
          this._compileExpr(node.test, scope, bc);
          this.emit(bc, [this.OP.JUMP_IF_FALSE, {
            type: "label",
            label: exitLabel
          }], node);
          this.emit(bc, [this.OP.JUMP, {
            type: "label",
            label: loopTopLabel
          }], node);
          this.emit(bc, [null, {
            type: "defineLabel",
            label: exitLabel
          }], node);
          this._loopStack.pop();
          break;
        }
      case "ForStatement":
        {
          const _fLabel = this._pendingLabel;
          this._pendingLabel = null;
          const loopTopLabel = this._makeLabel("for_top");
          const exitLabel = this._makeLabel("for_exit");
          // continue jumps to the update clause if present, else straight to test
          const updateLabel = node.update ? this._makeLabel("for_update") : loopTopLabel;
          this._loopStack.push({
            type: "loop",
            label: _fLabel,
            breakLabel: exitLabel,
            continueLabel: updateLabel
          });
          if (node.init) {
            if (node.init.type === "VariableDeclaration") {
              this._compileStatement(node.init, scope, bc);
            } else {
              this._compileExpr(node.init, scope, bc);
              this.emit(bc, [this.OP.POP], node);
            }
          }
          this.emit(bc, [null, {
            type: "defineLabel",
            label: loopTopLabel
          }], node);
          if (node.test) {
            this._compileExpr(node.test, scope, bc);
            this.emit(bc, [this.OP.JUMP_IF_FALSE, {
              type: "label",
              label: exitLabel
            }], node);
          }
          const forBody = node.body.type === "BlockStatement" ? node.body.body : [node.body];
          for (const stmt of forBody) {
            this._compileStatement(stmt, scope, bc);
          }

          // continue -> run update (if any) then back to test
          if (node.update) {
            this.emit(bc, [null, {
              type: "defineLabel",
              label: updateLabel
            }], node);
            this._compileExpr(node.update, scope, bc);
            this.emit(bc, [this.OP.POP], node);
          }
          this.emit(bc, [this.OP.JUMP, {
            type: "label",
            label: loopTopLabel
          }], node);
          this.emit(bc, [null, {
            type: "defineLabel",
            label: exitLabel
          }], node);
          this._loopStack.pop();
          break;
        }
      case "BreakStatement":
        {
          // Find the jump target in the loop stack.
          let _bTargetIdx = -1;
          if (node.label) {
            const _bLabelName = node.label.name;
            for (let _bi = this._loopStack.length - 1; _bi >= 0; _bi--) {
              if (this._loopStack[_bi].label === _bLabelName) {
                _bTargetIdx = _bi;
                break;
              }
            }
            if (_bTargetIdx === -1) throw new Error(`Label '${node.label.name}' not found`);
          } else {
            // Find innermost loop/switch/block (skip "try" entries)
            for (let _bi = this._loopStack.length - 1; _bi >= 0; _bi--) {
              if (this._loopStack[_bi].type !== "try") {
                _bTargetIdx = _bi;
                break;
              }
            }
            if (_bTargetIdx === -1) throw new Error("break outside loop");
          }
          // Emit TRY_END for every open try block between here and the target.
          for (let _bi = this._loopStack.length - 1; _bi > _bTargetIdx; _bi--) {
            if (this._loopStack[_bi].type === "try") {
              this.emit(bc, [this.OP.TRY_END], node);
            }
          }
          this.emit(bc, [this.OP.JUMP, {
            type: "label",
            label: this._loopStack[_bTargetIdx].breakLabel
          }], node);
          break;
        }
      case "ContinueStatement":
        {
          // Find the target loop in the loop stack.
          let _cTargetIdx = -1;
          if (node.label) {
            const _cLabelName = node.label.name;
            for (let _ci = this._loopStack.length - 1; _ci >= 0; _ci--) {
              if (this._loopStack[_ci].label === _cLabelName && this._loopStack[_ci].type === "loop") {
                _cTargetIdx = _ci;
                break;
              }
            }
            if (_cTargetIdx === -1) throw new Error(`Label '${node.label.name}' not found for continue`);
          } else {
            // Find the innermost loop (skip switch, block, and try contexts)
            for (let _ci = this._loopStack.length - 1; _ci >= 0; _ci--) {
              if (this._loopStack[_ci].type === "loop") {
                _cTargetIdx = _ci;
                break;
              }
            }
            if (_cTargetIdx === -1) throw new Error("continue outside loop");
          }
          // Emit TRY_END for every open try block between here and the target loop.
          for (let _ci = this._loopStack.length - 1; _ci > _cTargetIdx; _ci--) {
            if (this._loopStack[_ci].type === "try") {
              this.emit(bc, [this.OP.TRY_END], node);
            }
          }
          this.emit(bc, [this.OP.JUMP, {
            type: "label",
            label: this._loopStack[_cTargetIdx].continueLabel
          }], node);
          break;
        }
      case "SwitchStatement":
        {
          const _swLabel = this._pendingLabel;
          this._pendingLabel = null;
          const switchBreakLabel = this._makeLabel("sw_break");
          this._loopStack.push({
            type: "switch",
            label: _swLabel,
            breakLabel: switchBreakLabel,
            continueLabel: switchBreakLabel // not used for switch
          });

          // Compile the discriminant and leave it on the stack
          this._compileExpr(node.discriminant, scope, bc);
          const cases = node.cases;
          const defaultIdx = cases.findIndex(c => c.test === null);

          // Pre-allocate a label for each case body so dispatch can reference them
          const caseLabels = cases.map((_, i) => this._makeLabel(`sw_case_${i}`));

          // Dispatch section: for each non-default case, check and jump to its body
          for (let i = 0; i < cases.length; i++) {
            const cas = cases[i];
            if (cas.test === null) continue; // skip default in dispatch

            const nextCheckLabel = this._makeLabel("sw_next");
            this.emit(bc, [this.OP.DUP], node);
            this._compileExpr(cas.test, scope, bc);
            this.emit(bc, [this.OP.EQ], node);
            // If not matched, fall through to the next check
            this.emit(bc, [this.OP.JUMP_IF_FALSE, {
              type: "label",
              label: nextCheckLabel
            }], node);
            // If matched, jump directly to this case's body
            this.emit(bc, [this.OP.JUMP, {
              type: "label",
              label: caseLabels[i]
            }], node);
            this.emit(bc, [null, {
              type: "defineLabel",
              label: nextCheckLabel
            }], node);
          }

          // No case matched: jump to default body or exit (which pops discriminant)
          this.emit(bc, [this.OP.JUMP, {
            type: "label",
            label: defaultIdx !== -1 ? caseLabels[defaultIdx] : switchBreakLabel
          }], node);

          // Body section: compile all case bodies in source order (fallthrough intact)
          for (let i = 0; i < cases.length; i++) {
            this.emit(bc, [null, {
              type: "defineLabel",
              label: caseLabels[i]
            }], node);
            for (const stmt of cases[i].consequent) {
              this._compileStatement(stmt, scope, bc);
            }
          }

          // break label lands here; pop the discriminant and continue after switch
          this.emit(bc, [null, {
            type: "defineLabel",
            label: switchBreakLabel
          }], node);
          this.emit(bc, [this.OP.POP], node);
          this._loopStack.pop();
          break;
        }
      case "LabeledStatement":
        {
          const _lName = node.label.name;
          const _lBody = node.body;
          const _lIsLoop = _lBody.type === "ForStatement" || _lBody.type === "WhileStatement" || _lBody.type === "DoWhileStatement" || _lBody.type === "ForInStatement";
          const _lIsSwitch = _lBody.type === "SwitchStatement";
          if (_lIsLoop || _lIsSwitch) {
            // Pass label down to the loop/switch handler via _pendingLabel
            this._pendingLabel = _lName;
            this._compileStatement(_lBody, scope, bc);
            this._pendingLabel = null; // safety clear if handler didn't consume it
          } else {
            // Non-loop labeled statement (e.g. labeled block) -- only break is valid
            const blockBreakLabel = this._makeLabel("block_break");
            this._loopStack.push({
              type: "block",
              label: _lName,
              breakLabel: blockBreakLabel,
              continueLabel: blockBreakLabel // unused
            });
            this._compileStatement(_lBody, scope, bc);
            this._loopStack.pop();
            this.emit(bc, [null, {
              type: "defineLabel",
              label: blockBreakLabel
            }], node);
          }
          break;
        }
      case "ForInStatement":
        {
          const _fiLabel = this._pendingLabel;
          this._pendingLabel = null;

          // Evaluate the object expression -> on stack
          this._compileExpr(node.right, scope, bc);
          // FOR_IN_SETUP: pops obj, pushes iterator {keys, i}
          this.emit(bc, [this.OP.FOR_IN_SETUP], node);

          // Store iterator in a hidden slot so break/continue need no cleanup
          let emitLoadIter;
          let emitStoreIter;
          if (scope) {
            // Reserve a hidden local slot (no name mapping needed)
            const iterSlot = scope._next++;
            emitLoadIter = () => this.emit(bc, [this.OP.LOAD_LOCAL, iterSlot], node);
            emitStoreIter = () => this.emit(bc, [this.OP.STORE_LOCAL, iterSlot], node);
          } else {
            // Top level -- use a synthetic global that won't collide with user code
            const iterNameIdx = b.constantOperand("__fi" + this._forInCount++);
            emitLoadIter = () => this.emit(bc, [this.OP.LOAD_GLOBAL, iterNameIdx], node);
            emitStoreIter = () => this.emit(bc, [this.OP.STORE_GLOBAL, iterNameIdx], node);
          }
          emitStoreIter();
          const loopTopLabel = this._makeLabel("forin_top");
          const exitLabel = this._makeLabel("forin_exit");
          this._loopStack.push({
            type: "loop",
            label: _fiLabel,
            breakLabel: exitLabel,
            continueLabel: loopTopLabel // continue re-checks the iterator
          });
          this.emit(bc, [null, {
            type: "defineLabel",
            label: loopTopLabel
          }], node);

          // Load iterator, attempt to get next key
          emitLoadIter();
          this.emit(bc, [this.OP.FOR_IN_NEXT, {
            type: "label",
            label: exitLabel
          }], node);

          // Assign the key (now on top of stack) to the loop variable
          if (node.left.type === "VariableDeclaration") {
            const identifier = node.left.declarations[0].id;
            ok(identifier.type === "Identifier", "Only simple identifiers can be declared in for-in loops");
            const name = identifier.name;
            if (scope) {
              const slot = scope.define(name);
              this.emit(bc, [this.OP.STORE_LOCAL, slot], node);
            } else {
              this.emit(bc, [this.OP.STORE_GLOBAL, b.constantOperand(name)], node);
            }
          } else if (node.left.type === "Identifier") {
            const res = this._resolve(node.left.name, this._currentCtx);
            if (res.kind === "local") {
              this.emit(bc, [this.OP.STORE_LOCAL, res.slot], node);
            } else if (res.kind === "upvalue") {
              this.emit(bc, [this.OP.STORE_UPVALUE, res.index], node);
            } else {
              this.emit(bc, [this.OP.STORE_GLOBAL, b.constantOperand(node.left.name)], node);
            }
          } else {
            const src = generate(node.left).code;
            throw new Error(`Unsupported for-in left-hand side: ${node.left.type}\n  -> ${src}`);
          }

          // Compile the loop body
          const fiBody = node.body.type === "BlockStatement" ? node.body.body : [node.body];
          for (const stmt of fiBody) {
            this._compileStatement(stmt, scope, bc);
          }
          this.emit(bc, [this.OP.JUMP, {
            type: "label",
            label: loopTopLabel
          }], node);
          this.emit(bc, [null, {
            type: "defineLabel",
            label: exitLabel
          }], node);
          this._loopStack.pop();
          break;
        }
      case "TryStatement":
        {
          if (node.finalizer) {
            throw new Error("try..finally is not supported. Use a helper function instead:\n" + "  function TryCatch(cb) { try { return {value:cb()} } catch(e) { return {error:e} } }");
          }
          if (!node.handler) {
            // try without catch requires finally — not supported
            throw new Error("try without catch is not supported (requires finally).");
          }
          const catchLabel = this._makeLabel("catch");
          const afterCatchLabel = this._makeLabel("after_catch");

          // Emit TRY_SETUP with the catch block's label as the handler PC.
          // At runtime: saves stack depth + frame stack depth, pushes handler.
          this.emit(bc, [this.OP.TRY_SETUP, {
            type: "label",
            label: catchLabel
          }], node);

          // Track the open try block so that break/continue/return inside the
          // try body can emit the matching TRY_END before their jump.
          this._loopStack.push({
            type: "try",
            label: null,
            breakLabel: "",
            // unused
            continueLabel: "" // unused
          });

          // Compile try body
          for (const stmt of node.block.body) {
            this._compileStatement(stmt, scope, bc);
          }

          // Done compiling the try body — pop the tracking entry.
          this._loopStack.pop();

          // Normal exit: disarm the exception handler.
          this.emit(bc, [this.OP.TRY_END], node);

          // Jump over the catch block on normal path.
          this.emit(bc, [this.OP.JUMP, {
            type: "label",
            label: afterCatchLabel
          }], node);

          // Catch block: exception is on top of the stack (pushed by the VM).
          this.emit(bc, [null, {
            type: "defineLabel",
            label: catchLabel
          }], node);
          const handler = node.handler;
          if (handler.param) {
            // Bind the exception value to the catch variable.
            const name = handler.param.name;
            if (scope) {
              const slot = scope.define(name);
              this.emit(bc, [this.OP.STORE_LOCAL, slot], node);
            } else {
              this.emit(bc, [this.OP.STORE_GLOBAL, b.constantOperand(name)], node);
            }
          } else {
            // Optional catch binding (catch without a variable — ES2019+)
            this.emit(bc, [this.OP.POP], node);
          }

          // Compile catch body
          for (const stmt of handler.body.body) {
            this._compileStatement(stmt, scope, bc);
          }

          // Normal-path jump lands here (after the catch block).
          this.emit(bc, [null, {
            type: "defineLabel",
            label: afterCatchLabel
          }], node);
          break;
        }
      default:
        {
          // Use @babel/generator to reproduce the source of unsupported nodes
          // so we can emit a clear error with context.
          const src = generate(node).code;
          throw new Error(`Unsupported statement: ${node.type}\n  -> ${src}`);
        }
    }
  }

  // Expressions
  _compileExpr(node, scope, bc) {
    switch (node.type) {
      case "NumericLiteral":
      case "StringLiteral":
        {
          this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(node.value)], node);
          break;
        }
      case "BooleanLiteral":
        {
          this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(node.value)], node);
          break;
        }
      case "NullLiteral":
        {
          this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(null)], node);
          break;
        }
      case "Identifier":
        {
          // scope=null means we're at the top-level -> always global
          const res = this._resolve(node.name, this._currentCtx);
          if (res.kind === "local") {
            this.emit(bc, [this.OP.LOAD_LOCAL, res.slot], node);
          } else if (res.kind === "upvalue") {
            this.emit(bc, [this.OP.LOAD_UPVALUE, res.index], node);
          } else {
            this.emit(bc, [this.OP.LOAD_GLOBAL, b.constantOperand(node.name)], node);
          }
          break;
        }
      case "ThisExpression":
        {
          this.emit(bc, [this.OP.LOAD_THIS], node);
          break;
        }
      case "NewExpression":
        {
          // Push callee, then args -- identical layout to CALL but uses NEW opcode
          this._compileExpr(node.callee, scope, bc);
          for (const arg of node.arguments) this._compileExpr(arg, scope, bc);
          this.emit(bc, [this.OP.NEW, node.arguments.length], node);
          break;
        }
      case "SequenceExpression":
        {
          // (a, b, c)  ->  eval a -> POP, eval b -> POP, eval c -> leave on stack
          for (let i = 0; i < node.expressions.length - 1; i++) {
            this._compileExpr(node.expressions[i], scope, bc);
            this.emit(bc, [this.OP.POP], node); // discard intermediate result
          }
          // Last expression -- its value is the result of the whole sequence
          this._compileExpr(node.expressions[node.expressions.length - 1], scope, bc);
          break;
        }
      case "ConditionalExpression":
        {
          // test ? consequent : alternate
          const elseLabel = this._makeLabel("ternary_else");
          const endLabel = this._makeLabel("ternary_end");
          this._compileExpr(node.test, scope, bc);
          this.emit(bc, [this.OP.JUMP_IF_FALSE, {
            type: "label",
            label: elseLabel
          }], node);
          this._compileExpr(node.consequent, scope, bc);
          this.emit(bc, [this.OP.JUMP, {
            type: "label",
            label: endLabel
          }], node);
          this.emit(bc, [null, {
            type: "defineLabel",
            label: elseLabel
          }], node);
          this._compileExpr(node.alternate, scope, bc);
          this.emit(bc, [null, {
            type: "defineLabel",
            label: endLabel
          }], node);
          break;
        }
      case "LogicalExpression":
        {
          // Pattern (CPython-style):
          //   eval LHS
          //   JUMP_IF_*_OR_POP  -> target (past RHS)
          //   eval RHS          ← only reached if LHS didn't short-circuit
          //   [target lands here, stack top is the result either way]

          this._compileExpr(node.left, scope, bc);
          if (node.operator === "||") {
            // Short-circuit if LHS is TRUTHY -- keep it, skip RHS
            const endLabel = this._makeLabel("or_end");
            this.emit(bc, [this.OP.JUMP_IF_TRUE_OR_POP, {
              type: "label",
              label: endLabel
            }], node);
            this._compileExpr(node.right, scope, bc);
            this.emit(bc, [null, {
              type: "defineLabel",
              label: endLabel
            }], node);
          } else if (node.operator === "&&") {
            // Short-circuit if LHS is FALSY -- keep it, skip RHS
            const endLabel = this._makeLabel("and_end");
            this.emit(bc, [this.OP.JUMP_IF_FALSE_OR_POP, {
              type: "label",
              label: endLabel
            }], node);
            this._compileExpr(node.right, scope, bc);
            this.emit(bc, [null, {
              type: "defineLabel",
              label: endLabel
            }], node);
          } else {
            throw new Error(`Unsupported logical operator: ${node.operator}`);
          }
          break;
        }
      case "BinaryExpression":
        {
          this._compileExpr(node.left, scope, bc);
          this._compileExpr(node.right, scope, bc);
          const arithOp = {
            "+": this.OP.ADD,
            "-": this.OP.SUB,
            "*": this.OP.MUL,
            "/": this.OP.DIV,
            "%": this.OP.MOD,
            "&": this.OP.BAND,
            "|": this.OP.BOR,
            "^": this.OP.BXOR,
            "<<": this.OP.SHL,
            ">>": this.OP.SHR,
            ">>>": this.OP.USHR
          }[node.operator];
          const cmpOp = {
            "<": this.OP.LT,
            ">": this.OP.GT,
            "===": this.OP.EQ,
            "==": this.OP.LOOSE_EQ,
            "<=": this.OP.LTE,
            ">=": this.OP.GTE,
            "!==": this.OP.NEQ,
            "!=": this.OP.LOOSE_NEQ,
            in: this.OP.IN,
            // ← add
            instanceof: this.OP.INSTANCEOF // ← add
          }[node.operator];
          const resolvedOp = arithOp ?? cmpOp;
          if (resolvedOp === undefined) throw new Error(`Unsupported operator: ${node.operator}`);
          this.emit(bc, [resolvedOp], node);
          break;
        }
      case "UpdateExpression":
        {
          const res = this._resolve(node.argument.name, this._currentCtx);
          const bumpOp = node.operator === "++" ? this.OP.ADD : this.OP.SUB;
          const one = b.constantOperand(1);

          // Helper closures: emit load / store for whichever resolution kind we have
          const emitLoad = () => {
            if (res.kind === "local") this.emit(bc, [this.OP.LOAD_LOCAL, res.slot], node);else if (res.kind === "upvalue") this.emit(bc, [this.OP.LOAD_UPVALUE, res.index], node);else this.emit(bc, [this.OP.LOAD_GLOBAL, b.constantOperand(node.argument.name)], node);
          };
          const emitStore = () => {
            if (res.kind === "local") this.emit(bc, [this.OP.STORE_LOCAL, res.slot], node);else if (res.kind === "upvalue") this.emit(bc, [this.OP.STORE_UPVALUE, res.index], node);else this.emit(bc, [this.OP.STORE_GLOBAL, b.constantOperand(node.argument.name)], node);
          };
          emitLoad();
          if (!node.prefix) this.emit(bc, [this.OP.DUP], node); // post: save old value before mutating
          this.emit(bc, [this.OP.LOAD_CONST, one], node);
          this.emit(bc, [bumpOp], node);
          emitStore();
          if (node.prefix) emitLoad(); // pre: reload new value as result

          break;
        }
      case "AssignmentExpression":
        {
          const compoundOp = {
            "+=": this.OP.ADD,
            "-=": this.OP.SUB,
            "*=": this.OP.MUL,
            "/=": this.OP.DIV,
            "%=": this.OP.MOD,
            "&=": this.OP.BAND,
            "|=": this.OP.BOR,
            "^=": this.OP.BXOR,
            "<<=": this.OP.SHL,
            ">>=": this.OP.SHR,
            ">>>=": this.OP.USHR
          }[node.operator];
          const isCompound = compoundOp !== undefined;
          if (node.operator !== "=" && !isCompound) {
            throw new Error(`Unsupported assignment operator: ${node.operator}`);
          }

          // Member assignment: obj.x = val  or  arr[i] = val
          if (node.left.type === "MemberExpression") {
            this._compileExpr(node.left.object, scope, bc); // push obj

            if (node.left.computed) {
              this._compileExpr(node.left.property, scope, bc); // push key (runtime)
            } else {
              this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(node.left.property.name)], node);
            }
            if (isCompound) {
              // Duplicate obj+key on the stack so we can read before we write.
              // Stack before DUP2: [..., obj, key]
              // We need: [..., obj, key, obj, key] -> GET_PROP_COMPUTED -> [..., obj, key, currentVal]
              // Cheapest approach without a DUP opcode: re-compile the member read.
              // (emits obj + key again; a future peephole pass could DUP instead)
              this._compileExpr(node.left.object, scope, bc);
              if (node.left.computed) {
                this._compileExpr(node.left.property, scope, bc);
              } else {
                this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(node.left.property.name)], node);
              }
              this.emit(bc, [this.OP.GET_PROP_COMPUTED], node); // [..., obj, key, currentVal]
              this._compileExpr(node.right, scope, bc); // [..., obj, key, currentVal, rhs]
              this.emit(bc, [compoundOp], node); // [..., obj, key, newVal]
            } else {
              this._compileExpr(node.right, scope, bc); // [..., obj, key, val]
            }
            this.emit(bc, [this.OP.SET_PROP], node); // obj[key] = val, leaves val on stack
            break;
          }

          // Plain identifier assignment
          const res = this._resolve(node.left.name, this._currentCtx);
          if (isCompound) {
            // Load the current value of the target first
            if (res.kind === "local") {
              this.emit(bc, [this.OP.LOAD_LOCAL, res.slot], node);
            } else if (res.kind === "upvalue") {
              this.emit(bc, [this.OP.LOAD_UPVALUE, res.index], node);
            } else {
              this.emit(bc, [this.OP.LOAD_GLOBAL, b.constantOperand(node.left.name)], node);
            }
          }
          this._compileExpr(node.right, scope, bc); // push RHS

          if (isCompound) {
            this.emit(bc, [compoundOp], node); // apply binary op -> leaves newVal on stack
          }

          // Store & leave value on stack (assignment is an expression)
          if (res.kind === "local") {
            this.emit(bc, [this.OP.STORE_LOCAL, res.slot], node);
            this.emit(bc, [this.OP.LOAD_LOCAL, res.slot], node);
          } else if (res.kind === "upvalue") {
            this.emit(bc, [this.OP.STORE_UPVALUE, res.index], node);
            this.emit(bc, [this.OP.LOAD_UPVALUE, res.index], node);
          } else {
            const nameIdx = b.constantOperand(node.left.name);
            this.emit(bc, [this.OP.STORE_GLOBAL, nameIdx], node);
            this.emit(bc, [this.OP.LOAD_GLOBAL, nameIdx], node);
          }
          break;
        }
      case "CallExpression":
        {
          if (node.callee.type === "MemberExpression") {
            // ── Method call: console.log(...)
            // Push receiver first (GET_PROP leaves it; CALL_METHOD pops it as `this`)
            this._compileExpr(node.callee.object, scope, bc);
            const prop = node.callee.property.name;
            const propIdx = b.constantOperand(prop);
            this.emit(bc, [this.OP.LOAD_CONST, propIdx], node);
            this.emit(bc, [this.OP.GET_PROP], node);
            for (const arg of node.arguments) this._compileExpr(arg, scope, bc);
            this.emit(bc, [this.OP.CALL_METHOD, node.arguments.length], node);
          } else {
            // ── Plain call: add(5, 10)
            this._compileExpr(node.callee, scope, bc);
            for (const arg of node.arguments) this._compileExpr(arg, scope, bc);
            this.emit(bc, [this.OP.CALL, node.arguments.length], node);
          }
          break;
        }
      case "UnaryExpression":
        {
          // Special case: typeof on a bare identifier must not throw if undeclared.
          // We emit TYPEOF_SAFE (operand = name constant index) instead of
          // compiling the argument first. The VM does the guard itself.
          if (node.operator === "typeof" && node.argument.type === "Identifier") {
            const res = this._resolve(node.argument.name, this._currentCtx);
            if (res.kind === "global") {
              // Potentially undeclared -- let VM guard it
              this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(node.argument.name)], node);
              this.emit(bc, [this.OP.TYPEOF_SAFE], node);
              break;
            }
            // Known local or upvalue -- safe to load first, then typeof
          }

          // Special case: delete -- argument must NOT be pre-evaluated.
          if (node.operator === "delete") {
            const arg = node.argument;
            if (arg.type === "MemberExpression") {
              this._compileExpr(arg.object, scope, bc);
              if (arg.computed) {
                this._compileExpr(arg.property, scope, bc);
              } else {
                this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(arg.property.name)], node);
              }
              this.emit(bc, [this.OP.DELETE_PROP], node);
            } else {
              // delete x, delete 0, etc. -- always true in non-strict, just push true
              this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(true)], node);
            }
            break;
          }

          // All other unary ops: compile argument first, then apply operator
          this._compileExpr(node.argument, scope, bc);
          switch (node.operator) {
            case "-":
              this.emit(bc, [this.OP.UNARY_NEG], node);
              break;
            case "+":
              this.emit(bc, [this.OP.UNARY_POS], node);
              break;
            case "!":
              this.emit(bc, [this.OP.UNARY_NOT], node);
              break;
            case "~":
              this.emit(bc, [this.OP.UNARY_BITNOT], node);
              break;
            case "typeof":
              this.emit(bc, [this.OP.TYPEOF], node);
              break;
            case "void":
              this.emit(bc, [this.OP.VOID], node);
              break;
            default:
              throw new Error(`Unsupported unary operator: ${node.operator}`);
          }
          break;
        }
      case "RegExpLiteral":
        {
          // Emit: new RegExp(pattern, flags)
          // Fresh object per evaluation -- correct for stateful g/y flags.
          this.emit(bc, [this.OP.LOAD_GLOBAL, b.constantOperand("RegExp")], node);
          this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(node.pattern)], node);
          this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(node.flags)], node);
          this.emit(bc, [this.OP.NEW, 2], node);
          break;
        }
      case "FunctionExpression":
        {
          // Compile into a descriptor exactly like a declaration,
          // but leave the resulting closure ON THE STACK -- no store.
          // The surrounding expression (assignment, call arg, return) consumes it.
          const desc = this._compileFunctionDecl(node);
          this.emit(bc, [this.OP.MAKE_CLOSURE, b.constantOperand(desc)], node);
          break;
        }
      case "MemberExpression":
        {
          this._compileExpr(node.object, scope, bc);
          if (node.computed) {
            // nums[i] -- key is runtime value
            this._compileExpr(node.property, scope, bc);
          } else {
            // point.x -- push key as string, same opcode handles both
            this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(node.property.name)], node);
          }

          // GET_PROP_COMPUTED pops the object -- correct for value access.
          // GET_PROP (peek) is only used in CallExpression's method call path
          // where the receiver must survive on the stack for CALL_METHOD.
          this.emit(bc, [this.OP.GET_PROP_COMPUTED], node);
          break;
        }
      case "ArrayExpression":
        {
          // Compile each element left->right, then BUILD_ARRAY collapses them.
          // Sparse arrays (holes) get explicit undefined per slot.
          for (const el of node.elements) {
            if (el === null) {
              // hole: e.g. [1,,3]
              this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(undefined)], node);
            } else {
              this._compileExpr(el, scope, bc);
            }
          }
          this.emit(bc, [this.OP.BUILD_ARRAY, node.elements.length], node);
          break;
        }
      case "ObjectExpression":
        {
          // Separate regular data properties from ES5 accessor methods (get/set).
          const regularProps = [];
          const accessorProps = [];
          for (const prop of node.properties) {
            if (prop.type === "SpreadElement") {
              throw new Error("Object spread not supported");
            }
            if (prop.type === "ObjectMethod") {
              if (prop.kind === "get" || prop.kind === "set") {
                if (prop.computed) {
                  throw new Error("Computed getter/setter keys are not supported");
                }
                accessorProps.push(prop);
              } else {
                throw new Error(`Shorthand method syntax is not supported`);
              }
            } else {
              regularProps.push(prop);
            }
          }

          // Build the base object from data properties.
          for (const prop of regularProps) {
            const key = prop.key;
            let keyStr;
            if (key.type === "Identifier") {
              keyStr = key.name;
            } else if (key.type === "StringLiteral" || key.type === "NumericLiteral") {
              keyStr = String(key.value);
            } else {
              throw new Error(`Unsupported object key type: ${key.type}`);
            }
            this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(keyStr)], node);
            this._compileExpr(prop.value, scope, bc);
          }
          this.emit(bc, [this.OP.BUILD_OBJECT, regularProps.length], node);

          // Define each accessor on the object that is now on top of the stack.
          // Stack after BUILD_OBJECT: [..., obj]
          // For each accessor: DUP obj, push key, compile fn, DEFINE_GETTER/DEFINE_SETTER
          // DEFINE_GETTER/DEFINE_SETTER pops fn+key+obj, leaving the original obj.
          for (const prop of accessorProps) {
            const key = prop.key;
            let keyStr;
            if (key.type === "Identifier") {
              keyStr = key.name;
            } else if (key.type === "StringLiteral" || key.type === "NumericLiteral") {
              keyStr = String(key.value);
            } else {
              throw new Error(`Unsupported object key type: ${key.type}`);
            }
            this.emit(bc, [this.OP.DUP], node); // dup so the original obj stays after the define
            this.emit(bc, [this.OP.LOAD_CONST, b.constantOperand(keyStr)], node);

            // Compile the accessor body as an anonymous function descriptor.
            const desc = this._compileFunctionDecl(prop);
            this.emit(bc, [this.OP.MAKE_CLOSURE, b.constantOperand(desc)], node);
            this.emit(bc, [prop.kind === "get" ? this.OP.DEFINE_GETTER : this.OP.DEFINE_SETTER], node);
          }
          break;
        }
      default:
        {
          throw new Error(`Unsupported expression: ${node.type}`);
        }
    }
  }
}

// Serializer
// Turns the compiled output into a commented JS source string.
class Serializer {
  constructor(compiler) {
    this.compiler = compiler;
  }
  get constants() {
    return this.compiler.constants;
  }
  get options() {
    return this.compiler.options;
  }
  get OP() {
    return this.compiler.OP;
  }
  get OP_NAME() {
    return this.compiler.OP_NAME;
  }
  get JUMP_OPS() {
    return this.compiler.JUMP_OPS;
  }
  get fnDescriptors() {
    return this.compiler.fnDescriptors;
  }

  // Produce a JS literal for a constant pool entry
  _serializeConst(val) {
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    if (typeof val === "object" && val._fnIdx !== undefined) {
      return `FN[${val._fnIdx}]`; // fn descriptor -> reference by FN index
    }
    return JSON.stringify(val); // number / string / bool
  }

  // One instruction -> "[op, operand]  // MNEMONIC description"
  _serializeInstr(instr) {
    const constants = this.constants;
    const [op, operand] = instr;
    const name = this.OP_NAME[op] || `OP_${op}`;
    let comment = name;
    const sourceNode = this.compiler._sourceMap.get(instr);
    const sourceLocation = sourceNode ? sourceNode.loc.start?.line + ":" + sourceNode.loc.start?.column : "";
    comment = sourceLocation.padEnd(6) + comment;

    // Annotate operand with its meaning
    if (operand !== undefined) {
      switch (op) {
        case this.OP.LOAD_CONST:
        case this.OP.MAKE_CLOSURE:
          {
            const val = constants[operand];
            if (val && typeof val === "object" && val.name) {
              comment += `  FN[${val._fnIdx}] -> fn:${val.name}`;
            } else {
              comment += `  ${JSON.stringify(val)}`;
            }
            break;
          }
        case this.OP.LOAD_LOCAL:
        case this.OP.STORE_LOCAL:
          comment += `  slot[${operand}]`;
          break;
        case this.OP.LOAD_UPVALUE:
        case this.OP.STORE_UPVALUE:
          comment += `  upvalue[${operand}]`;
          break;
        case this.OP.LOAD_GLOBAL:
        case this.OP.STORE_GLOBAL:
          comment += `  "${constants[operand]}"`;
          break;
        case this.OP.CALL:
        case this.OP.CALL_METHOD:
          comment += `  (${operand} args)`;
          break;
        case this.OP.BUILD_ARRAY:
          comment += `  (${operand} elements)`;
          break;
        case this.OP.BUILD_OBJECT:
          comment += `  (${operand} pairs)`;
          break;
        case this.OP.NEW:
          comment += `  (${operand} args)`;
          break;
        default:
          comment += `  ${operand}`;
      }
    }

    // Pack a [op, operand?] instruction pair into a single 32-bit word.
    // Shared between the Serializer and the obfuscation path in _compileMain.

    const instrText = operand !== undefined ? `[${op}, ${operand}]` : `[${op}]`;
    const text = `${instrText.padEnd(12)}, // ${comment}`;
    if (!this.options.encodeBytecode) {
      return {
        text: text,
        value: operand !== undefined ? [op, operand] : [op]
      };
    }
    function packInstr(instr) {
      const [op, operand] = instr;
      if (operand !== undefined && !Number.isInteger(operand)) throw new Error(`Non-integer operand: ${operand}`);
      if (operand !== undefined && operand < 0) throw new Error(`Negative operand: ${operand}`);
      if (operand !== undefined && operand > 0xffffff) throw new Error(`Operand overflow (max 0xFFFFFF): ${operand}`);
      return operand !== undefined ? operand << 8 | op : op;
    }
    return {
      text: text,
      value: packInstr(instr)
    };
  }

  // Serialize one fn descriptor into its FN[n] block
  _serializeFn(desc) {
    const lines = [`  {                       // FN[${desc._fnIdx}] -- ${desc.name}`, `    paramCount: ${desc.paramCount},`, `    localCount: ${desc.localCount},`, `    upvalueDescriptors: ${JSON5.stringify(desc.upvalueDescriptors)},`, `    startPc: ${desc.startPc},`, `  },`];
    return lines.join("\n");
  }

  // Serialize the CONSTANTS array, showing FN[n] references
  _serializeConstants() {
    const lines = ["var CONSTANTS = ["];
    this.constants.forEach((val, idx) => {
      lines.push(`  /* ${idx} */  ${this._serializeConst(val)},`);
    });
    lines.push("];");
    return lines.join("\n");
  }
  _serializeBytecode(bytecode) {
    if (!this.options.encodeBytecode) {
      return bytecode.map(instr => this._serializeInstr(instr).value);
    }
    let words = [];

    // BYTECODE
    for (const instr of bytecode) {
      words.push(this._serializeInstr(instr).value);
    }

    // Convert packed words -> raw 4-byte little-endian binary -> base64
    const buf = new Uint8Array(words.length * 4);
    words.forEach((w, i) => {
      buf[i * 4] = w & 0xff;
      buf[i * 4 + 1] = w >>> 8 & 0xff;
      buf[i * 4 + 2] = w >>> 16 & 0xff;
      buf[i * 4 + 3] = w >>> 24 & 0xff;
    });
    const b64 = Buffer.from(buf).toString("base64");
    return b64;
  }
  serialize(bytecode, compiler) {
    const mainStartPc = compiler.mainStartPc;
    const sections = [];

    // ── FN array
    const fnLines = ["var FN = ["];
    for (const desc of this.fnDescriptors) {
      fnLines.push(this._serializeFn(desc));
    }
    fnLines.push("];");
    sections.push(fnLines.join("\n"));

    // ── CONSTANTS
    sections.push(this._serializeConstants());
    var textForm = [];
    var valuesArray = [];
    for (const instr of bytecode) {
      if (instr[0] === null) continue; // null opcodes are dropped

      const serialized = this._serializeInstr(instr);
      textForm.push(serialized.text);
      valuesArray.push(serialized.value);
    }
    sections.push("// BYTECODE \n" + textForm.map(line => `// ${line}`).join("\n"));
    if (this.options.encodeBytecode) {
      sections.push(`var BYTECODE = "${this._serializeBytecode(bytecode)}";`);
    } else {
      sections.push(`var BYTECODE = [${valuesArray.map(v => "[" + v.toString() + "]").join(",")}]`);
    }

    // MAIN_START_PC
    sections.push(`var MAIN_START_PC = ${mainStartPc};`);
    sections.push(`var ENCODE_BYTECODE = ${!!this.options.encodeBytecode};`);
    sections.push(`var TIMING_CHECKS = ${!!this.options.timingChecks};`);
    // Opcodes
    sections.push(`var OP = ${JSON5.stringify(this.OP)};`);

    // VM runtime
    sections.push(VM_RUNTIME);
    return sections.join("\n\n");
  }
}
export async function compileAndSerialize(sourceCode, options) {
  const compiler = new Compiler(options);
  let bytecode = compiler.compile(sourceCode);
  const passes = [resolveLabels, resolveConstants];
  for (const pass of passes) {
    const passResult = pass(bytecode, compiler);
    bytecode = passResult.bytecode;
  }
  const output = compiler.serializer.serialize(bytecode, compiler);
  const finalOutput = await obfuscateRuntime(output, options);
  return {
    code: finalOutput
  };
}