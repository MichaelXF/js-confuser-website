export function toTitleCase(str) {
  str = String(str);

  return str
    .toLowerCase() // Convert the entire string to lowercase first
    .split(" ") // Split the string into an array of words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
    .join(" "); // Join the words back into a single string
}

export function toUrlCase(string) {
  return string
    .trim() // Remove leading and trailing whitespace
    .toLowerCase() // Convert to lowercase
    .replace(/[^a-z0-9+]+/g, "-") // Replace non-alphanumeric characters (except +) with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
}

export function textEllipsis(str, maxLength = 40) {
  str = "" + str;
  if (str.length <= maxLength) return str;

  return str.slice(0, maxLength - 3) + "...";
}

export function camelCaseToTitleCase(str) {
  if (str === "es5") return "ES5";
  if (str === "rgf") return "RGF";
  if (str === "osLock") return "OS Lock";
  if (str === "astScrambler") return "AST Scrambler";

  // Split the string at each uppercase letter and add a space before it
  const result = str.replace(/([A-Z])/g, " $1");

  // Capitalize the first letter of each word and return the result
  return result
    .replace(/^./, (match) => match.toUpperCase()) // Capitalize the first letter
    .replace(/\s+/g, " ") // Remove extra spaces if any
    .trim(); // Trim any leading or trailing whitespace
}

export const formatTimeDuration = (ms, allowMsPrecision = false) => {
  if (ms > 1000 * 60) {
    return Math.floor(ms / 1000 / 60).toLocaleString() + "m";
  }

  if (allowMsPrecision && ms < 100) {
    return Math.floor(ms) + "ms";
  }

  return (Math.floor((ms / 1000) * 100) / 100).toLocaleString() + "s";
};

export const formatSize = (b) => {
  if (b > 1000 * 1000) {
    return Math.floor(b / 1000 / 1000).toLocaleString() + "mb";
  }
  return Math.floor(b / 1000).toLocaleString() + "kb";
};

export const formatPercentage = (p, addPlusSign = false) => {
  const floored = Math.floor(p * 100);
  let output = floored.toLocaleString() + "%";

  if (addPlusSign && floored > 0) {
    output = "+" + output;
  }

  return output;
};

export function formatNumberWithCommas(number) {
  return number.toLocaleString();
}
