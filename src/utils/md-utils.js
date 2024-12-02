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

    if (
      trimmed.startsWith("---{") ||
      trimmed.startsWith("---js") ||
      trimmed.startsWith("```")
    ) {
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
