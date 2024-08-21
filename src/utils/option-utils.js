import json5 from "json5";

export function convertOptionsToJS(optionsValue) {
  if (typeof optionsValue === "string") {
    return optionsValue;
  }

  var newOptionsJS = `module.exports = ${json5.stringify(
    optionsValue,
    null,
    2
  )};`;

  return newOptionsJS;
}

export function evaluateOptionsOrJS(optionsJS) {
  try {
    if (typeof optionsJS === "object" && optionsJS) {
      return optionsJS;
    }
    var value = eval(`
      var module = { exports: {} };
        ${optionsJS}
        module
        `)?.exports;

    return value;
  } catch (err) {
    return {
      target: "browser",
      error: err.toString(),
    };
  }
}
