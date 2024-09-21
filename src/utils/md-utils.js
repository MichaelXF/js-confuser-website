export function trimRemovePrefix(trimmed) {
  if (!trimmed) return "";
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

  return trimmed;
}

const SECTIONS_CACHE = Symbol("sectionsCache");

export function splitMarkdownIntoHeadingSections(doc) {
  if (doc[SECTIONS_CACHE]) return doc[SECTIONS_CACHE];

  const content = doc.content;

  const lines = content.split("\n");
  const sections = [];
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();

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
