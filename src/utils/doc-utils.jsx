import presets from "js-confuser/src/presets.ts";
import Docs from "../docs";
import {
  camelCaseToTitleCase,
  formatPercentage,
  toTitleCase,
} from "./format-utils";
import { groups } from "../groups";
import { trimRemovePrefix } from "./md-utils";
import { convertOptionsToJS } from "./option-utils";
import useJSConfuser, { jsConfuserObfuscate } from "../hooks/useJSConfuser.jsx";
import { formatCodePrettier } from "../hooks/useCodeWorker.jsx";

export const DOC_PATH_SEPARATOR = " --- ";

var cachedValue = null;

// Ensures all doc's content is loaded
// Used for the search bar so all results always come back
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
    onLoadingStart?.();
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

    var subGroup = objectContentPathOrContent.subGroup;

    navigationGroups[group].push({
      label: title,
      to: "/docs/" + urlPath,
      order: newDoc.order,
      subGroup: subGroup,
      fullLabel:
        group +
        DOC_PATH_SEPARATOR +
        (subGroup || "default") +
        DOC_PATH_SEPARATOR +
        title,
    });

    // Doc content is already loaded - call the onDocContentLoaded function
    // Else it will get called after fetch() is done
    if (typeof newDoc.content === "string") {
      onDocContentLoaded(newDoc);
    }
  };

  for (var path in Docs) {
    var content = Docs[path];

    // "Getting_Started__FAQ"
    var fileName = path;
    if (fileName.startsWith("./")) {
      fileName = fileName.slice(2);
    }
    if (fileName.endsWith(".md")) {
      fileName = fileName.slice(0, -3);
    }

    var fileNameSplit = fileName.split("__");
    if (fileNameSplit.length !== 3) {
      throw new Error(JSON.stringify(fileName) + " does not have 3 parts");
    }

    var group = fileNameSplit[0].replace(/_/g, " ");
    var order = parseInt(fileNameSplit[1]);
    var title = fileNameSplit[2].replace(/_/g, " ");

    var urlPath = group;
    if (order !== -1) {
      // If order is negative remove the title from the URL path
      // Special case for All Presets page
      urlPath += "/" + title;
    }

    if (title === "What Is Obfuscation") {
      title = "What Is Obfuscation?";
    }

    urlPath = urlPath.toLowerCase().replace(/ /g, "-");

    addDoc(urlPath, group, title, { contentPath: path, content, order });
  }

  createContentDocs(addDoc);

  var navigationItems = Object.keys(navigationGroups)
    .map((groupPath) => {
      function subGroups(children) {
        var defaultGroup = [];
        var otherGroups = {};

        for (var item of children) {
          if (!item.subGroup) {
            defaultGroup.push(item);
          } else {
            if (!otherGroups[item.subGroup]) {
              otherGroups[item.subGroup] = [item];
            } else {
              otherGroups[item.subGroup].push(item);
            }
          }
        }

        var sortByOrder = (items) => {
          return items.sort((a, b) => a.order - b.order);
        };

        if (!Object.keys(otherGroups).length) {
          return sortByOrder(defaultGroup);
        }

        return [
          ...sortByOrder(defaultGroup),
          ...Object.keys(otherGroups).map((subGroup) => ({
            label: toTitleCase(subGroup),
            children: sortByOrder(otherGroups[subGroup]),
            fullLabel: groupPath + DOC_PATH_SEPARATOR + subGroup,
          })),
        ];
      }

      return {
        label: toTitleCase(groupPath),
        children: subGroups(navigationGroups[groupPath]),
        fullLabel: groupPath,
        order: {
          "Getting Started": 0,
          Options: 1,
          Presets: 2,
        }[groupPath],
      };
    })
    .sort((a, b) => a.order - b.order);

  // Add default 'Welcome page' to the Getting Started group
  navigationItems[0].children.unshift({
    label: "Welcome Page",
    to: "/docs",
    fullLabel: "Getting Started" + DOC_PATH_SEPARATOR + "Welcome Page",
  });

  return { navigationItems, docsByPath };
}

function createAllOptionsDocPage(addDoc) {
  // "All Options" Doc page

  var str = `---
title: "All Options"
slug: "/options/all-options"
---

JS-Confuser provides a wide range of options to customize the obfuscation process. Below is a list of all available options in the obfuscator.

- Remember, [presets](/docs/presets) can be used to quickly apply a set of options to the obfuscator.


${Object.keys(groups)
  .map((groupName) => {
    return `
#### ${toTitleCase(groupName)}

| Option | Description |
| --- | --- |
${groups[groupName]
  .map((item) => {
    return `| [${camelCaseToTitleCase(item.name)}](/docs/options/${item.name}) | ${item.description.split("\n")[0]} `;
  })
  .join("\n")}
`;
  })
  .join("\n")}
  `;

  addDoc("options", "Options", "All Options", {
    content: str,
  });
}

function createContentDocs(addDoc) {
  createAllOptionsDocPage(addDoc);

  // Add Options Docs
  Object.values(groups)
    .flat(1)
    .forEach((item) => {
      var titleCase = camelCaseToTitleCase(item.name);

      var baseOptions = {
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
      } else if (item.type === "regex[]") {
        optionValues = "RegExp[]/string[]";
      } else if (item.type === "object") {
        optionValues = "true/false/Object";
      }

      if (item.customImplementation) {
        optionValues += "/Function";
      }

      if (item.optionValues) {
        optionValues = item.optionValues;
      }

      if (!item.parentField) {
        baseOptions = {
          ...baseOptions,
          [item.name]: true,
        };
      } else {
        optionName = item.parentField + "." + item.name;
        baseOptions = {
          ...baseOptions,
          [item.parentField]: {
            [item.name]: true,
          },
        };
      }

      baseOptions = {
        ...baseOptions,
        ...(item?.exampleConfig || {}),
      };

      var liveExampleOptions = {
        ...baseOptions,
        renameVariables: true,
        compact: false,
        minify: true,
      };

      if (item.name === "compact") {
        liveExampleOptions.compact = true;
        liveExampleOptions.renameVariables = false;
      }

      // For 'target' page
      if (Object.keys(baseOptions).length === 1 && baseOptions.target) {
        baseOptions.compact = true;
      }

      var docVariables = {};

      docVariables.warnings = "";

      if (Array.isArray(item.tags) && item.tags.length > 0) {
        var warnings = [];

        for (const tagName of item.tags) {
          const tagInfo = {
            unsafeEvalExpressions: {
              title: "Requires Eval",
              description:
                "The obfuscated code will contain unsafe eval expressions.\nThe code will not work properly in [environments that have disabled eval](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_eval_expressions).",
            },
            nonStrictMode: {
              title: "Requires Non-Strict Mode",
              description:
                "The obfuscated code will not work properly in Strict Mode.\nYou can use the [Pack](./pack) option to bypass Strict Mode constraints.",
            },
          }[tagName];

          warnings.push(`
<Card title=${JSON.stringify(tagInfo.title)} type="warning">
${tagInfo.description}
</Card>
`);
        }

        docVariables.warnings = "\n" + warnings.join("\n");
      }

      const usageExampleCode = `import JSConfuser from "js-confuser";
import {readFileSync, writeFileSync} from "fs";

// Read input code
const sourceCode = readFileSync("input.js", "utf8");
${convertOptionsToJS(baseOptions, "const options")}

JSConfuser.obfuscate(sourceCode, options).then((result)=>{
  // Write output code
  writeFileSync("output.js", result.code);
}).catch(err=>{
  // Error occurred
  console.error(err);  
});`;

      docVariables.usageExample = `
### Usage Example

The provided code example will obfuscate the file \`input.js\` and write the output to a file named \`output.js\`.

\`\`\`js title="Usage Example" lines
${usageExampleCode}
\`\`\`

---

#### Enabled In

${Object.keys(presets)
  .map((presetName) => {
    const preset = presets[presetName];
    let configObject = preset;
    if (item.parentField) {
      configObject = configObject[item.parentField] || {};
    }
    let configValue = configObject[item.name];
    if (
      !(item.name in configObject) &&
      typeof item.defaultValue !== "undefined"
    ) {
      configValue = item.defaultValue;
    }

    let displayText = configValue ? "Yes" : "No";
    if (typeof configValue === "number" && configValue > 0) {
      displayText = "Yes (" + formatPercentage(configValue) + ")";
    }

    return `- [${toTitleCase(presetName)} Preset](/docs/presets/${presetName}): ${displayText}`;
  })
  .join("\n")} 
`;

      var seeAlso = [];
      if (item.parentField === "lock" && item.name !== "countermeasures") {
        seeAlso.push({
          label: "Countermeasures",
          to: "/docs/options/countermeasures",
        });
      }
      if (item.seeAlso) {
        seeAlso = seeAlso.concat(item.seeAlso);
      }

      docVariables.seeAlso = seeAlso.length
        ? `\n---

#### See Also

${seeAlso.map((x) => `- [${x.label}](${x.to})`).join("\n")}`
        : "";

      docVariables.customImplementation = "";

      if (item.customImplementation) {
        var custom = item.customImplementation;
        var optionNamePrefix = "options." + item.name;
        if (item.parentField) {
          optionNamePrefix = "options." + item.parentField + "." + item.name;
        }

        docVariables.customImplementation += `
### Custom Implementation
#### \`${optionNamePrefix}(${custom.parameters.map((x) => x.parameter).join(", ")})\`

${custom.description}
${
  custom.parameters.length
    ? `| Parameter | Type | Description |
| --- | --- | --- |
${custom.parameters.map((x) => `| \`${x.parameter}\` | \`${x.type}\` | ${x.description} |`).join("\n")}`
    : ""
}
${
  custom.exampleConfig
    ? `\`\`\`js title="Options.js" lines
${custom.exampleConfig}
\`\`\``
    : ""
}

---`;
      }

      docVariables.header = `
- Option name: \`"${optionName}"\`

- Option value${optionValues.includes("/") ? "s" : ""}: \`${optionValues}\`
${docVariables.warnings}
---

`;

      docVariables.inputOutput = item.exampleCode
        ? `### Input / Output

This example showcases how \`${titleCase}\` transforms the code. Try it out by changing the input code and see changes apply in real-time.

\`\`\`js title="Input.js" lines interactive-mode="obfuscate"
${convertOptionsToJS(liveExampleOptions)}
===END OPTIONS===
${item.exampleCode}
\`\`\`

---

`
        : "";

      // Allow replacing usage example
      if (item.usageExample) {
        docVariables.usageExample = item.usageExample;
      }

      var subgroup = Object.keys(groups).find((x) => groups[x].includes(item));

      var content = `---
title: ${JSON.stringify(titleCase)}
description: ${JSON.stringify(item.description)}
slug: "options/${optionName}"
---
${docVariables.header}
${item.startDocContent ? item.startDocContent + "\n---\n" : ""}
${docVariables.inputOutput}
${item.docContent ? item.docContent + "\n---\n" : ""}
${docVariables.customImplementation}
${docVariables.usageExample}
${item.endDocContent ? "---\n" + item.endDocContent : ""}
${docVariables.seeAlso}
`;

      addDoc("options/" + item.name, "Options", titleCase, {
        content,
        subGroup: subgroup,
      });
    });

  // Add Preset Docs
  Object.keys(presets).forEach((presetName) => {
    var content = `---
title: "${toTitleCase(presetName)} Preset"
description: ""
slug: "presets/${presetName}"
---

- Option name: \`"preset"\`

- Option value: \`"${presetName}"\`

\`\`\`json title="Preset.json" lines
${JSON.stringify(presets[presetName], null, 2)}
\`\`\`
    `;

    addDoc("presets/" + presetName, "Presets", toTitleCase(presetName), {
      content,
    });
  });
}

// Exports all the docs for an AI knowledge base
window.exportDocs = async function () {
  await ensureAllDocsLoaded();

  const { docsByPath } = getDocs();
  const docs = Object.values(docsByPath);

  const root = await window.showDirectoryPicker({ mode: "readwrite" });

  for (const doc of docs) {
    const parts = doc.urlPath.split("/").filter(Boolean);
    const fileName = parts.pop() + ".mdx";

    let dir = root;
    for (const part of parts) {
      console.log("Getting folder", part);
      dir = await dir.getDirectoryHandle(part, { create: true });
    }

    // We must first replace all hyperlinks "docs/options/renameVariables" -> "options/renameVariables"
    // as this is hosted on "docs.js-confuser.com/..." not "js-confuser.com/docs/..."
    var writtenContent = doc.content.replace(/\/docs\//g, "/");

    // Pre-compute "live" obfuscation codeblocks (full iframe solution not started)
    writtenContent = await precomputeLiveCodeblocks(writtenContent);

    console.log("Writing", fileName);

    const handle = await dir.getFileHandle(fileName, { create: true });
    const writable = await handle.createWritable();
    await writable.write(writtenContent);
    await writable.close();
  }

  var exportDocs = docs.map((doc) => {
    return {
      title: doc.title,
      content: doc.content,
      metadata: {
        url: "https://docs.js-confuser.com/" + doc.urlPath,
        group: doc.group,
      },
    };
  });

  function toTitleCase(str) {
    return str
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function buildNavigation() {
    const groups = [];
    const groupMap = new Map();

    for (const doc of docs) {
      const segments = doc.urlPath.split("/").filter(Boolean);
      const groupName =
        segments.length > 1 ? toTitleCase(segments[0]) : doc.group;

      let group = groupMap.get(groupName);
      if (!group) {
        group = { group: groupName, pages: [], _subs: new Map() };
        groupMap.set(groupName, group);
        groups.push(group);
      }

      if (doc.subGroup) {
        let sub = group._subs.get(doc.subGroup);
        if (!sub) {
          sub = { group: doc.subGroup, pages: [] };
          group._subs.set(doc.subGroup, sub);
          group.pages.push(sub);
        }
        sub.pages.push(doc.urlPath);
      } else {
        group.pages.push(doc.urlPath);
      }
    }

    return {
      groups: groups.map(({ group, pages }) => ({ group, pages })),
    };
  }

  return {
    navigation: buildNavigation(),
  };

  // return exportDocs;
};

export async function precomputeLiveCodeblocks(writtenContent) {
  const outputLines = [];
  const lines = writtenContent.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    let isLiveCodeBlock =
      line.startsWith("```") && line.includes('interactive-mode="obfuscate"');

    if (!isLiveCodeBlock) {
      outputLines.push(line);
    } else {
      let startLine = line;
      let codeLines = [];
      i++;
      while (!lines[i].includes("```")) {
        codeLines.push(lines[i]);
        i++;
      }

      let optionsIndex = codeLines.findIndex((line) =>
        line.includes("===END OPTIONS==="),
      );
      let optionsLines = codeLines.slice(0, optionsIndex);
      let inputLines = codeLines.slice(optionsIndex + 1);

      let code = inputLines.join("\n");
      let options = optionsLines.join("\n");

      console.log("input", code, options);

      let { code: outputCode } = await jsConfuserObfuscate(code, options);

      let inputCodePretty = await formatCodePrettier(code, "javascript");
      let outputCodePretty = await formatCodePrettier(outputCode, "javascript");

      console.log("output", outputCode);

      outputLines.push(startLine);
      outputLines.push("// Input.js");
      outputLines.push(inputCodePretty.trim());
      outputLines.push("\n// Output.js");
      outputLines.push(outputCodePretty.trim());

      outputLines.push("```");
    }
  }

  return outputLines.join("\n");
}
window.precomputeLiveCodeblocks = precomputeLiveCodeblocks;
