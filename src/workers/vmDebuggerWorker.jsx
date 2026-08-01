import * as babelParser from "@babel/parser";
import traverseImport from "@babel/traverse";
import { generate } from "@babel/generator";
import * as t from "@babel/types";
import { Compiler } from "js-confuser-vm/dist/compiler.js";
import JSConfuserVm from "js-confuser-vm";

var currentVM;
var currentIterator;

var _consoleLog = console.log;

var traverse = traverseImport.default || traverseImport;

const compiler = new Compiler({ target: "browser" });

const { SLOTS } = compiler.FRAME_LAYOUT;

// Jump opcodes: JUMP, JUMP_IF_FALSE, JUMP_IF_TRUE, JUMP_REG, FOR_IN_NEXT
const allJumpOpCodes = new Set([
  compiler.OP.JUMP,
  compiler.OP.JUMP_IF_FALSE,
  compiler.OP.JUMP_IF_TRUE,
  compiler.OP.JUMP_REG,
  compiler.OP.FOR_IN_NEXT,
  compiler.OP.TRY_SETUP, // catch_pc operand needs offset adjustment like jump targets
  compiler.OP.FINALLY_SETUP,
  compiler.OP.RETURN,
  compiler.OP.CALL,
  compiler.OP.CALL_METHOD,
]);

console.log(compiler);

function loadProgram(program) {
  // Parse the program and transform VM.prototype.run into a generator
  var ast = babelParser.parse(program, { sourceType: "script" });

  traverse(ast, {
    AssignmentExpression(path) {
      var right = path.node.right;
      // Find VM.prototype.run = function(...) { ... }
      if (
        right.type === "FunctionExpression" &&
        path.node.left.type === "MemberExpression" &&
        path.node.left.property.type === "Identifier" &&
        path.node.left.property.name === "run"
      ) {
        // Make it a generator
        right.generator = true;
        // Push `yield this;` at the end of the while loop body
        // The while loop is the first statement in the function body
        var body = right.body.body;

        var whileStatement = body.find((x) => x.type === "WhileStatement");

        whileStatement.body.body.push(
          t.expressionStatement(t.yieldExpression(t.thisExpression())),
        );
      }
    },
  });

  // Remove the original vm.run() call (ExpressionStatement: vm.run())
  traverse(ast, {
    ExpressionStatement(path) {
      var expr = path.node.expression;
      // vm.run(...) -> (_vm = vm, _VM = VM, iterator = vm.run(...))
      if (
        expr.type === "CallExpression" &&
        expr.callee.type === "MemberExpression" &&
        expr.callee.object.type === "Identifier" &&
        expr.callee.object.name === "vm" &&
        expr.callee.property.type === "Identifier" &&
        expr.callee.property.name === "run"
      ) {
        path.replaceWith(
          t.expressionStatement(
            t.sequenceExpression([
              t.assignmentExpression(
                "=",
                t.memberExpression(
                  t.identifier("self"),
                  t.identifier("_vm"),
                  false,
                ),
                t.identifier("vm"),
              ),

              t.assignmentExpression(
                "=",
                t.memberExpression(
                  t.identifier("self"),
                  t.identifier("_VM"),
                  false,
                ),
                t.identifier("VM"),
              ),

              t.assignmentExpression("=", t.identifier("iterator"), expr),
            ]),
          ),
        );
      }
    },
  });

  var output = generate(ast, {}, program).code;

  // console.log(output);

  console.log = function (...args) {
    _consoleLog(...args);
    postMessage({
      event: "log",
      data: args,
    });
  };

  // Eval and extract the VM class
  var window = self;
  var iterator;
  eval(output);

  currentVM = self._vm;
  currentIterator = iterator;
  return {
    event: "ready",
    data: getData(),
  };
}

function getFrame(runtime, fp) {
  if (!fp) return null;

  var regs = runtime._regs;
  var closure = regs[fp + SLOTS.CLOSURE];
  var fn = closure && closure.fn;
  var base = regs[fp + SLOTS.REG_BASE];
  var caller = regs[fp + SLOTS.CALLER];
  var retDst = regs[fp + SLOTS.RET_DST];

  var params = [];
  if (fn) {
    for (var i = 0; i < fn.paramCount; i++) {
      params.push(String(regs[base + i]));
    }
  }

  var handlers = regs[fp + SLOTS.HANDLERS];

  return {
    fp,
    pc: regs[fp + SLOTS.PC],
    base,
    size: regs[fp + SLOTS.FRAME_SIZE],
    caller,

    startPc: fn?.startPc,
    name: fn?.startPc !== 0 ? "fn@" + fn.startPc : "main", // 0 is main

    params,
    hasRest: fn ? !!fn.hasRest : false,
    thisValue: String(regs[fp + SLOTS.THIS]),
    isNew: !!(retDst & 1),

    // return address and where to store return value
    returnPc: caller ? regs[caller + SLOTS.PC] : null,
    returnReg: caller ? retDst >> 1 : null,

    // try/finally handlers (from TRY_SETUP)
    handlerCount: handlers ? handlers.length : 0,
  };
}

function getStack(runtime) {
  var stack = [];
  var fp = runtime._f;

  while (fp && stack.length < 256) {
    var frame = getFrame(runtime, fp);
    stack.push(frame);
    fp = frame.caller;
  }

  return stack;
}

function getData() {
  var runtime = currentVM;
  var regs = runtime._regs;
  var stack = getStack(runtime);
  var frame = stack[0];

  if (!frame) {
    return {
      pc: null,
      op: null,
      opName: null,
      regs: {},
      frame: null,
      stack: [],
    };
  }

  var pc = frame.pc;
  var op = runtime.bytecode[pc];

  var end = frame.fp + frame.size;

  var regStringed = {};
  for (var i = frame.base; i < end; i++) {
    regStringed[i - frame.base] = String(regs[i]);
  }

  var data = {
    pc,
    op,
    opName: compiler.OP_NAME[op],
    regs: regStringed,
    frame,
    stack,
  };

  return data;
}

// runMode: "instruction" | "jump" | "all"
function next(runMode) {
  if (!currentIterator) return null;

  var stepResult;
  try {
    stepResult = currentIterator.next();
  } catch (err) {
    console.log("VM Debugger Step error", err);
    return {
      event: "error",
      error: "" + (err?.stack || err),
      data: getData(),
    };
  }
  if (stepResult.done) {
    return { event: "done", data: getData() };
  }

  var runtime = stepResult.value;

  if (runMode === "all") {
    // Run to completion
    while (!stepResult.done) {
      stepResult = currentIterator.next();
    }
    return { event: "done", data: getData() };
  }

  if (runMode === "jump") {
    // Step until we hit a jump opcode or done
    while (!stepResult.done) {
      var frame = getFrame(stepResult.value, stepResult.value._f);
      var op = frame ? stepResult.value.bytecode[frame.pc] : null;

      if (allJumpOpCodes.has(op)) break;
      stepResult = currentIterator.next();
    }
    if (stepResult.done) return { event: "done", data: getData() };
    runtime = stepResult.value;
  }

  // "instruction" mode or after stopping at a jump
  return {
    event: "step",
    data: getData(),
    isDebugger: true,
  };
}

async function disassemble(outputCode) {
  var code = await JSConfuserVm.disassemble(outputCode);
  return { event: "disassemble", code, isDebugger: false };
}

// Handle incoming messages
self.onmessage = async function (event) {
  const { method, requestID, args } = event.data;
  let response;

  try {
    switch (method) {
      case "loadProgram":
        response = loadProgram(...args);
        break;
      case "next":
        response = next(...args);
        break;

      case "disassemble":
        response = await disassemble(...args);
        break;

      default:
        throw new Error("Unknown method: " + method);
    }
  } catch (error) {
    console.log("Error in worker message handler:", error);
    postMessage({
      event: "error",
      data: {
        requestID,
        errorString: error.toString(),
        errorStack: error?.stack?.toString?.() || null,
      },
    });
  }

  if (response !== undefined) {
    postMessage({ ...response, requestID });
  }
};
