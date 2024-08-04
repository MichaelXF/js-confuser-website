export const toTitleCase = (camelCase) =>
  ("" + camelCase)
    .replace(/([A-Z])/g, (match) => ` ${match}`)
    .replace(/^./, (match) => match.toUpperCase())
    .trim();

export const isValidRegex = (s) => {
  try {
    const m = s.match(/^([/~@;%#'])(.*?)\1([gimsuy]*)$/);
    return m ? !!new RegExp(m[2], m[3]) : false;
  } catch (e) {
    return false;
  }
};
