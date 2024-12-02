import json5 from "json5";
import { groups } from "../groups";
import { getRandomString } from "./random-utils";
import { optionsJSHeader } from "../constants";

export function getHost() {
  const location = window.location;
  return (
    location.protocol +
    "//" +
    location.hostname +
    (location.port ? ":" + location.port : "")
  );
}

const optionsByID = {};
Object.values(groups)
  .flat()
  .forEach((option) => {
    optionsByID[option.name] = option;
  });

export function getOptionSchemasWithDefaultValues() {
  return Object.values(optionsByID).filter(
    (f) => typeof f.defaultValue !== "undefined"
  );
}

export function getOptionSchema(fieldName) {
  if (fieldName === "preset") {
    return {
      name: "preset",
      description: `The preset to use for obfuscation: "high" | "medium" | "low" (Optional)`,
      path: "/docs/presets",
    };
  }

  return optionsByID[fieldName];
}

export function convertOptionsToJS(
  optionsValue,
  exportName = "module.exports"
) {
  if (typeof optionsValue === "string") {
    return optionsValue;
  }

  var replaceMap = new Map();
  var counter = 0;
  const replacePrefix = "__R_" + getRandomString(10);

  var objectAsString = json5.stringify(
    optionsValue,
    (key, value) => {
      var replacementValue;

      // Convert multiline strings to template strings (If possible)
      if (
        typeof value === "string" &&
        value.includes("\n") &&
        !value.includes("${") &&
        !value.includes("\\")
      ) {
        replacementValue = `\`${value}\``;
      }

      // Convert functions to string
      if (typeof value === "function") {
        replacementValue = value.toString();
      }

      if (typeof replacementValue === "string") {
        var index = ++counter;
        var replaceKey = replacePrefix + index;
        replaceMap.set(replaceKey, replacementValue);

        return replaceKey;
      }

      // No change
      return value;
    },
    2
  );

  replaceMap.forEach((value, key) => {
    objectAsString = objectAsString.replace(`'${key}'`, value);
  });

  var newOptionsJS = `${exportName} = ${objectAsString};`;

  if (exportName === "module.exports") {
    newOptionsJS = optionsJSHeader + newOptionsJS;
  }

  return newOptionsJS;
}

export function evaluateOptionsOrJS(optionsJS) {
  try {
    // Already in object form?
    if (typeof optionsJS === "object" && optionsJS) {
      return optionsJS;
    }

    /**
     * When the user provides a JSConfuser config file, we need to evaluate it
     *
     * This partially evaluates the JSConfuser config file by faking imports
     *
     * jsConfuserWorker.js provides concrete require() function
     */

    var value = eval(`
      var module = { exports: {} };
      var require = (id) => ({}); // Mock require

      ${optionsJS}

      // Last expression of the eval is the return value
      module`)?.exports;

    // Make sure result is an object
    if (typeof value === "object" && value) {
      return value;
    }

    return {
      target: "browser",
      error: "Invalid JSConfuser config file",
    };
  } catch (err) {
    return {
      target: "browser",
      error: err.toString(),
    };
  }
}
