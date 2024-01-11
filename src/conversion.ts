/** This module has all X -> RGBA methods */

import { Color3, Color4, STANDARD_ILLUMINANT, inverseLabF } from "./common.ts";

/** Convert HSL color to RGB */
export function rgbFromHsl(h: number, s: number, l: number): Color3 {
  l = l / 100;
  s = s / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const h1 = h / 60;
  const m = l - chroma / 2;

  const x = chroma * (1 - Math.abs((h1 % 2) - 1));

  let intermediate = [0, 0, 0];

  if (0 <= h1 && h1 < 1) intermediate = [chroma, x, 0];
  else if (1 <= h1 && h1 < 2) intermediate = [x, chroma, 0];
  else if (2 <= h1 && h1 < 3) intermediate = [0, chroma, x];
  else if (3 <= h1 && h1 < 4) intermediate = [0, x, chroma];
  else if (4 <= h1 && h1 < 5) intermediate = [x, 0, chroma];
  else if (5 <= h1 && h1 < 6) intermediate = [chroma, 0, x];

  const rgb = [intermediate[0] + m, intermediate[1] + m, intermediate[2] + m];

  return [
    Math.round(rgb[0] * 255),
    Math.round(rgb[1] * 255),
    Math.round(rgb[2] * 255),
  ];
}

/** Convert HSV color to RGB */
export function rgbFromHsv(h: number, s: number, v: number): Color3 {
  s = s / 100;
  v = v / 100;
  const chroma = v * s;
  const h1 = h / 60;
  const m = v - chroma;

  const x = chroma * (1 - Math.abs((h1 % 2) - 1));

  let intermediate = [0, 0, 0];

  if (0 <= h1 && h1 < 1) intermediate = [chroma, x, 0];
  else if (1 <= h1 && h1 < 2) intermediate = [x, chroma, 0];
  else if (2 <= h1 && h1 < 3) intermediate = [0, chroma, x];
  else if (3 <= h1 && h1 < 4) intermediate = [0, x, chroma];
  else if (4 <= h1 && h1 < 5) intermediate = [x, 0, chroma];
  else if (5 <= h1 && h1 < 6) intermediate = [chroma, 0, x];

  const rgb = [intermediate[0] + m, intermediate[1] + m, intermediate[2] + m];

  return [
    Math.round(rgb[0] * 255),
    Math.round(rgb[1] * 255),
    Math.round(rgb[2] * 255),
  ];
}

/** Convert Hexadecimal string to RGBA */
export function rgbaFromHex(hex: string): Color4 {
  if (!/^#([A-Fa-f0-9]{3}){1,2}([A-Fa-f0-9]{2})?$/.test(hex)) {
    throw new TypeError(`Expected number or hex code. Got ${hex}`);
  }
  let colors = hex.slice(1).split("");
  if (colors.length === 3) {
    colors = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
  }
  const red = parseInt(`${colors[0]}${colors[1]}`, 16) || 0;
  const green = parseInt(`${colors[2]}${colors[3]}`, 16) || 0;
  const blue = parseInt(`${colors[4]}${colors[5]}`, 16) || 0;
  let alpha = 255;
  if (colors[6] && colors[7]) {
    alpha = parseInt(`${colors[6]}${colors[7]}`, 16) ?? 255;
  }
  return [red, green, blue, alpha];
}

/** Convert CIE Lab to Linear RGB color space */
export function rgbFromLab(l: number, a: number, b: number): Color3 {
  const [x, y, z] = xyzFromLab(l, a, b);
  return rgbFromXyz(x, y, z);
}

/** Convert CIE XYZ to Linear RGB color space */
export function rgbFromXyz(
  x: number,
  y: number,
  z: number
): [number, number, number] {
  return [
    3.2406 * x + -1.5372 * y + -0.4986 * z,
    -0.9689 * x + 1.8758 * y + 0.0415 * z,
    0.0557 * x + -0.204 * y + 1.057 * z,
  ];
}

/** Convert CIE L*a*b* to CIE XYZ */
export function xyzFromLab(
  l: number,
  a: number,
  b: number
): [number, number, number] {
  const add = (l + 16) / 116;
  const x = STANDARD_ILLUMINANT[0] * inverseLabF(add + a / 500);
  const y = STANDARD_ILLUMINANT[1] * inverseLabF(add);
  const z = STANDARD_ILLUMINANT[2] * inverseLabF(add - b / 200);

  return [x, y, z];
}

/** Convert CMYK to RGB */
export function rgbFromCmyk(
  c: number,
  m: number,
  y: number,
  k: number
): Color3 {
  const divi = 1 - k / 100;
  return [
    255 * (1 - c / 100) * divi,
    255 * (1 - m / 100) * divi,
    255 * (1 - y / 100) * divi,
  ];
}
