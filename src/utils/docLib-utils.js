import jsConfuserOptionsTS from "!!raw-loader!js-confuser/src/options.ts"; // eslint-disable-line import/no-webpack-loader-syntax
import jsConfuserChangelogMD from "!!raw-loader!js-confuser/CHANGELOG.md"; // eslint-disable-line import/no-webpack-loader-syntax

const jsConfuserTypes = `
declare module 'js-confuser' {
  export class Template {}
  
  ${jsConfuserOptionsTS}
}

interface Module {
  exports: import('js-confuser').ObfuscateOptions;
}

// Simulate Node.js-like 'module' behavior
declare var module: Module;

// Simulate Node.js-like 'require' behavior
type Require = (id: string) => any;

declare var require: Require;
`;

export function getJSConfuserTypes() {
  return jsConfuserTypes;
}

var changelog;
export function getChangelog() {
  // Use cached value
  if (changelog) return changelog;

  var entries = {};

  var versionNumber = "";

  jsConfuserChangelogMD
    .replace("2.0.0-alpha.0", "2.0.0")
    .split(/(# `\d.\d.\d`\n)/)
    .forEach((entry) => {
      if (!entry) return;
      if (!versionNumber) {
        let split = entry.split("`");
        if (split.length === 3) {
          versionNumber = split[1].trim();
        }

        return;
      }

      var contentLines = entry.trim().split("\n");

      var title = contentLines[0];
      var content = contentLines.slice(1).join("\n");

      entries[versionNumber] = {
        title,
        content,
      };
      versionNumber = null;
    });

  changelog = entries;

  return changelog;
}

export function getChangelogForVersion(versionNumber) {
  versionNumber = versionNumber.split("-alpha")[0];

  return getChangelog()[versionNumber];
}
