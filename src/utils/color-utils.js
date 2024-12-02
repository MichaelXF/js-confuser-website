export function rgbToHex(rgb) {
  if (typeof rgb === "string") {
    if (rgb.startsWith("#")) return rgb;

    if (rgb === "transparent") return "#00000000";
  }

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

export function hslToHex(h, s, l, a) {
  // Check if `h` is a string and parse it
  if (typeof h === "string") {
    const hslRegex =
      /hsla?\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/;
    const match = h.match(hslRegex);
    if (match) {
      h = parseInt(match[1], 10); // Hue
      s = parseFloat(match[2]); // Saturation
      l = parseFloat(match[3]); // Lightness
      a = match[4] !== undefined ? parseFloat(match[4]) : undefined; // Alpha (optional)
    } else {
      throw new Error("Invalid HSL(A) string format");
    }
  }

  // Ensure values are valid
  h = h % 360; // Hue wraps around
  s = Math.max(0, Math.min(100, s)) / 100; // Saturation as a fraction
  l = Math.max(0, Math.min(100, l)) / 100; // Lightness as a fraction
  a = a !== undefined ? Math.max(0, Math.min(1, a)) : undefined; // Alpha is a fraction if present

  const chroma = (1 - Math.abs(2 * l - 1)) * s; // Chroma
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1)); // Intermediate value
  const m = l - chroma / 2; // Adjust for lightness

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) [r, g, b] = [chroma, x, 0];
  else if (h < 120) [r, g, b] = [x, chroma, 0];
  else if (h < 180) [r, g, b] = [0, chroma, x];
  else if (h < 240) [r, g, b] = [0, x, chroma];
  else if (h < 300) [r, g, b] = [x, 0, chroma];
  else [r, g, b] = [chroma, 0, x];

  // Convert to [0, 255] range and add lightness adjustment
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  // If alpha is present, convert to HEXA
  if (a !== undefined) {
    const alpha = Math.round(a * 255);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}${alpha
      .toString(16)
      .padStart(2, "0")
      .toUpperCase()}`;
  }

  // Convert to HEX
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}
