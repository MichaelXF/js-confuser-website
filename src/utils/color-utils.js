export function rgbToHex(rgb) {
  var [r, g, b] = rgb
    .split("rgb(")[1]
    .split(")")[0]
    .split(",")
    .map((x) => parseInt(x));

  // Ensure each color value is within the range of 0-255
  const toHex = (value) => {
    const hex = value.toString(16); // Convert to hexadecimal
    return hex.length === 1 ? "0" + hex : hex; // Pad single digits with a leading 0
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
