import json5 from "json5";
import { groups } from "../groups";

export function getHost() {
  const location = window.location;
  return (
    location.protocol +
    "//" +
    location.hostname +
    (location.port ? ":" + location.port : "")
  );
}

export function getOptionSchemasWithDefaultValues() {
  return Object.values(groups)
    .flat()
    .filter((f) => typeof f.defaultValue !== "undefined");
}

export function getOptionSchema(fieldName) {
  if (fieldName === "preset") {
    return {
      name: "preset",
      description: `The preset to use for obfuscation: "high" | "medium" | "low" (Optional)`,
      path: "/docs/presets",
    };
  }

  return Object.values(groups)
    .flat()
    .find((f) => f.name === fieldName);
}

export function convertOptionsToJS(optionsValue) {
  if (typeof optionsValue === "string") {
    return optionsValue;
  }

  var objectAsString = "";
  var keys = Object.keys(optionsValue);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var rawValue = optionsValue[key];
    var value =
      typeof rawValue === "function"
        ? rawValue.toString()
        : json5.stringify(rawValue, null, 2);

    var optionSchema = getOptionSchema(key);

    if (optionSchema) {
      if (i !== 0) {
        objectAsString += "\n";
      }

      var description = optionSchema.description;
      if (typeof optionSchema.defaultValue !== "undefined") {
        description += ` (Default: ${json5.stringify(optionSchema.defaultValue)})`;
      }

      description.split("\n").forEach((line) => {
        objectAsString += "// " + line + "\n";
      });

      var path = `/docs/options/${optionSchema.name}`;
      if (optionSchema.path) {
        path = optionSchema.path;
      }
      // objectAsString += `// ${getHost()}${path}\n`;
    }
    objectAsString += `${key}: ${value},\n`;
  }

  // Remove last newline
  objectAsString = objectAsString.slice(0, -1);

  // Move objectAsString over by 2 spaces
  objectAsString = objectAsString
    .split("\n")
    .map((line) => "  " + line)
    .join("\n");

  // Add wrapping braces
  objectAsString = "{\n" + objectAsString + "\n}";

  var newOptionsJS = `// This file is evaluated as JavaScript. You can use JavaScript here.
  
module.exports = ${objectAsString};`;

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
