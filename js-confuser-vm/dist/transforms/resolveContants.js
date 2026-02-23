// --- Constant IR ---
// During compilation, constants are symbolic values until assembly time
// This allows the bytecode transforms to introduce any new constant with having to sync with a constant pool
//
// During transforms:
// [OP.LOAD_CONST, { type: "constant", value: "Hello World!" }]
// Processed bytecode:
// const CONSTANTS = [..., "Hello World!", ...]
// const BYTECODE = [OP.LOAD_CONST, 14]

// For now, each constant is simply placed as an auto-incrementing index into the constant array without any effects (XOR)

export function resolveConstants(bc, compiler) {
  const constants = [];
  // JavaScript Map uses SameValueZero equality:
  // - primitives (null, undefined, bool, number, string) deduplicated by value
  // - objects (function descriptors) deduplicated by reference
  const indexMap = new Map();
  function intern(value) {
    if (indexMap.has(value)) return indexMap.get(value);
    const idx = constants.length;
    constants.push(value);
    indexMap.set(value, idx);
    return idx;
  }
  const resolved = [];
  for (const instr of bc) {
    const [op, operand] = instr;
    if (operand !== undefined && operand !== null && typeof operand === "object" && operand.type === "constant") {
      resolved.push([op, intern(operand.value)]);
    } else {
      resolved.push(instr);
    }
  }
  compiler.constants = constants;
  return {
    bytecode: resolved
  };
}