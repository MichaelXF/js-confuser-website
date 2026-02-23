// Bytecode supports both real instructions and IR pseudo-instructions
// Real instruction: [OP.ADD, 5]
// IR instruction: [null, { type: "defineLabel", label: "FN_ENTRY_1" }]

// IR instructions are used to hold symbolic information during compilation
// All "null" instructions are dropped before assembly time

export function constantOperand(value) {
  return {
    type: "constant",
    value: value
  };
}