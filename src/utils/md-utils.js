export function trimRemovePrefix(trimmed) {
  if (!trimmed) return "";
  if (trimmed.startsWith("- ")) {
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
