import presets from "js-confuser/dist/presets";
import Docs from "../docs/";
import { camelCaseToTitleCase, toTitleCase } from "./format-utils";
import json5 from "json5";
import { groups } from "../groups";
import { trimRemovePrefix } from "./md-utils";

var cachedValue = null;

export function ensureAllDocsLoaded(onLoadingStart) {
  var { docsByPath } = getDocs();

  var promises = [];

  for (var path in docsByPath) {
    var doc = docsByPath[path];

    if (typeof doc.content === "string") {
      continue;
    }

    if (typeof doc.contentPath === "string") {
      promises.push(loadDocContent(doc));
    }
  }

  if (promises.length) {
    onLoadingStart();
  }

  return Promise.allSettled(promises);
}

/**
 * Loads the text content from the URL path on the `doc` object.
 *
 * - Mutates the `doc` to save the content
 * - Makes one request even if called multiple times
 * @param {*} doc
 * @returns
 */
export function loadDocContent(doc) {
  if (doc.promise) return doc.promise;

  var promise = new Promise((resolve, reject) => {
    if (typeof doc.content === "string") return;

    doc.promise = promise;

    fetch(doc.contentPath)
      .then((r) => r.text())
      .then((text) => {
        doc.content = text;
        onDocContentLoaded(doc);
        resolve();
        doc.promise = null;
      })
      .catch((err) => reject(err));
  });

  return promise;
}

/**
 * When a doc's content text is loaded - this function is called to update the 'description' property.
 * @param {*} doc
 */
function onDocContentLoaded(doc) {
  var lines = doc.content.split("\n");

  for (var line of lines) {
    var trim = line.trim();
    if (!trim || trim.startsWith("#") || trim.startsWith("---")) {
      continue;
    }
    doc.description = trimRemovePrefix(trim);
    break;
  }
}

/**
 * Retrieves all documentation pages.
 * @returns {{docsByPath: Object, navigationItems: Object[]}}
 */
export function getDocs() {
  if (cachedValue) {
    return cachedValue;
  }

  cachedValue = generate();
  return cachedValue;
}

function generate() {
  var docsByPath = {};
  var navigationGroups = {};

  const addDoc = (urlPath, group, title, objectContentPathOrContent) => {
    var lowercased = urlPath.toLowerCase();

    var newDoc = {
      group,
      title,
      ...objectContentPathOrContent,
      urlPath,
    };
    docsByPath[lowercased] = newDoc;

    if (!navigationGroups[group]) {
      navigationGroups[group] = [];
    }

    navigationGroups[group].push({
      label: title,
      to: "/docs/" + urlPath,
      order: newDoc.order,
    });

    // Doc content is already loaded - call the onDocContentLoaded function
    // Else it will get called after fetch() is done
    if (typeof newDoc.content === "string") {
      onDocContentLoaded(newDoc);
    }
  };

  for (var path of Docs) {
    var parts = path.split("/");

    console.log(parts[parts.length - 1]);

    // "Getting_Started__FAQ"
    var partsByDot = parts[parts.length - 1].split(".");
    partsByDot.pop();
    partsByDot.pop();
    var fileName = partsByDot.join(".");

    var fileNameSplit = fileName.split("__");
    if (fileNameSplit.length !== 3) {
      throw new Error(fileName + " does not have 3 parts");
    }

    var group = fileNameSplit[0].replace(/_/g, " ");
    var order = parseInt(fileNameSplit[1]);
    var title = fileNameSplit[2].replace(/_/g, " ");

    var urlPath = (group + "/" + title).toLowerCase().replace(/ /g, "-");

    addDoc(urlPath, group, title, { contentPath: path, order });
  }

  createContentDocs(addDoc);

  var navigationItems = Object.keys(navigationGroups).map((groupPath) => {
    return {
      label: toTitleCase(groupPath),
      children: navigationGroups[groupPath].sort((a, b) => a.order - b.order),
    };
  });

  return { navigationItems, docsByPath };
}

function createContentDocs(addDoc) {
  // Add Options Docs
  Object.values(groups)
    .flat(1)
    .forEach((item) => {
      var titleCase = camelCaseToTitleCase(item.name);

      var options = {
        target: "browser",
      };
      var optionName = item.name;
      var optionValues = "true/false/0-1";

      if (item.modes) {
        optionValues = item.modes.map((x) => `"${x}"`).join("/");
      } else if (item.type === "string") {
        optionValues = "string";
      } else if (item.type === "boolean") {
        optionValues = "true/false";
      }

      if (item.customImplementation) {
        optionValues += "/Function";
      }

      if (item.optionValues) {
        optionValues = item.optionValues;
      }

      if (!item.parentField) {
        options = {
          ...options,
          [item.name]: true,
        };
      } else {
        optionName = item.parentField + "." + item.name;
        options = {
          ...options,
          [item.parentField]: {
            [item.name]: true,
          },
        };
      }

      options = {
        ...options,
        renameVariables: true,
        compact: false,
        indent: 2,
        ...(item?.exampleConfig || {}),
      };

      var usageExample = `import JSConfuser from "js-confuser";
import {readFileSync, writeFileSync} from "fs";

// Read input code
const sourceCode = readFileSync("input.js", "utf8");
const options = ${json5.stringify(options, null, 2)};

JSConfuser.obfuscate(sourceCode, options).then((obfuscated)=>{
  // Write output code
  writeFileSync("output.js", obfuscated);
}).catch(err=>{
  // Error occurred
  console.error(err);  
});`;

      var seeAlso = [];
      if (item.parentField === "lock" && item.name !== "countermeasures") {
        seeAlso.push({
          label: "Countermeasures",
          to: "/docs/options/countermeasures",
        });
      }

      var customImplementation = "";

      if (item.customImplementation) {
        var custom = item.customImplementation;

        customImplementation += `
        ##### Custom Implementation

        ###### \`options.${item.name}(${custom.parameters.map((x) => x.parameter).join(", ")})\`

        ${custom.description}
        ${
          custom.parameters.length
            ? `| Parameter | Type | Description |
        ${custom.parameters.map((x) => `| \`${x.parameter}\` | \`${x.type}\` | ${x.description} |`).join("\n")}`
            : ""
        }
        ${
          custom.exampleConfig
            ? `---{header: "Options.js"}
        ${custom.exampleConfig}
        ---`
            : ""
        }

        ---
        `;
      }

      var content = `
    #### ${titleCase}

    ${item.description}


    Option name: \`"${optionName}"\`

    Option value: \`${optionValues}\`
    ---

    ${item.startDocContent ? item.startDocContent + "\n---" : ""}

    ${customImplementation}

    ${
      item.exampleCode
        ? `
      ##### Input / Output

      This example showcases how \`${titleCase}\` transforms the code. Try it out by changing the input code and see changes apply in real-time.

      ---{ header: "Input.js", language: "javascript", live: true, options: ${JSON.stringify(options)} }
      ${item.exampleCode}
      ---`
        : ""
    }

    ##### Usage Example

    The provided code example will obfuscate the file \`input.js\` and write the output to a file named \`output.js\`.

    ---{header: "Usage Example", language: "javascript"}
    ${usageExample}
    ---

    ${item.endDocContent ? "---\n" + item.endDocContent : ""}

    ${
      seeAlso.length
        ? `
        ---

      ##### See Also

      ${seeAlso.map((x) => `- [${x.label}](${x.to})`).join(", ")}
      `
        : ""
    }
    `;
      addDoc("options/" + item.name, "Options", titleCase, {
        content,
      });
    });

  // Add Preset Docs
  Object.keys(presets).forEach((presetName) => {
    var content = `
    #### ${toTitleCase(presetName)} Preset

    Option name: \`"preset"\`

    Option value: \`"${presetName}"\`

    ---{ header: "Preset.json", language: "json" }
    ${JSON.stringify(presets[presetName], null, 2)}
    ---

    `;

    addDoc("presets/" + presetName, "Presets", toTitleCase(presetName), {
      content,
    });
  });
}
