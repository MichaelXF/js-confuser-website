export function trimRemovePrefix(trimmed) {
  if (!trimmed) return "";
  trimmed = trimmed.trim();

  if (trimmed.startsWith("> ")) {
    trimmed = trimmed.substring(2);
  }

  while (trimmed.startsWith("- ")) {
    trimmed = trimmed.substring(2);
  }
  while (trimmed.startsWith("#")) {
    trimmed = trimmed.substring(1);
  }

  trimmed = trimmed.trim();

  if (trimmed.startsWith("`") && trimmed.endsWith("`")) {
    trimmed = trimmed.substring(1, trimmed.length - 1);
  }

  if (trimmed.startsWith("-> ")) {
    trimmed = trimmed.substring(3);
  }

  return trimmed;
}

const SECTIONS_CACHE = Symbol("sectionsCache");

export function splitMarkdownIntoHeadingSections(doc) {
  if (doc[SECTIONS_CACHE]) return doc[SECTIONS_CACHE];

  const content = doc.content;

  const lines = content.split("\n");
  const sections = [];
  let currentSection = null;
  let inCodeBlock = false;
  let endCodeBlockToken = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip Code Blocks in search
    if (inCodeBlock) {
      if (trimmed.startsWith(endCodeBlockToken)) {
        inCodeBlock = false;
      }
      continue;
    }

    if (trimmed.startsWith("---js") || trimmed.startsWith("```")) {
      endCodeBlockToken = trimmed.slice(0, 3);
      inCodeBlock = true;
      continue;
    }

    if (trimmed.startsWith("#")) {
      if (currentSection) {
        sections.push(currentSection);
      }

      let heading = trimmed;
      while (heading.startsWith("#")) {
        heading = heading.substring(1);
      }

      currentSection = {
        heading: heading.trim(),
        lines: [],
      };
    } else {
      if (currentSection) {
        if (trimmed) {
          currentSection.lines.push(line);
        }
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  doc[SECTIONS_CACHE] = sections;
  return sections;
}

/**
 * Mintlify-like parsing markdown codeblock metadata line syntax.
 *
 * @param {string} text - The meta string after the language key.
 * @returns {Object<string, string|boolean>} Parsed key-value pairs.
 *
 * @example
 * parseCodeMeta('title="Hello World" lines');
 * // => { title: "Hello World", lines: true }
 */
export function parseCodeMeta(text) {
  const result = {};
  const re = /([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;

  let m;
  while ((m = re.exec(text)) !== null) {
    const key = m[1];
    const val = m[2] ?? m[3] ?? m[4];
    result[key] = val === undefined ? true : val;
  }
  return result;
}

/**
 * Mintlify-like parsing header document metadata syntax.
 *
 * @param {string} text - The frontmatter body (without the --- fences).
 * @returns {Object<string, string>} Parsed key-value pairs.
 *
 * @example
 * parseHeaderMeta('title: "Usage"\ndescription: "Learn how to use the API"');
 * // => { title: "Usage", description: "Learn how to use the API" }
 */
export function parseHeaderMeta(text) {
  const result = {};
  const re =
    /^\s*([\w-]+)\s*:\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|(.*?))\s*$/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const key = m[1];
    let value;
    if (m[2] !== undefined) {
      value = JSON.parse(`"${m[2]}"`);
    } else if (m[3] !== undefined) {
      value = JSON.parse(`"${m[3].replace(/\\'/g, "'").replace(/"/g, '\\"')}"`);
    } else {
      value = m[4];
    }
    result[key] = value;
  }
  return result;
}
