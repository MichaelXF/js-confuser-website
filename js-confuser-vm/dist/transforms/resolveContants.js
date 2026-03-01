import { SOURCE_NODE_SYM } from "../compiler.js";

// Resolve all {type:"constant", value} operands to integer indices into the
// constants pool.  Returns both the resolved bytecode and the constants array
// so the Serializer can use it for comment generation and output.
export function resolveConstants(bc) {
  const constants = [];
  const constantsMap = new Map();
  function intern(value) {
    let idx = constantsMap.get(value);
    if (typeof idx !== "number") {
      idx = constants.length;
      constantsMap.set(value, idx);
      constants.push(value);
    }
    return idx;
  }
  const resolved = [];
  for (const instr of bc) {
    const [op, operand] = instr;
    if (operand !== undefined && operand !== null && typeof operand === "object" && operand.type === "constant") {
      const newInstr = [op, intern(operand.value)];
      newInstr[SOURCE_NODE_SYM] = instr[SOURCE_NODE_SYM];
      resolved.push(newInstr);
    } else {
      resolved.push(instr);
    }
  }
  return {
    bytecode: resolved,
    constants
  };
}