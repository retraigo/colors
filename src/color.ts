// Fully functional, specially for working with Images

import { fromLinear, toLinear } from "./util/linear.ts";
import { Color3, Color4, STANDARD_ILLUMINANT, labF, toHex } from "./common.ts";
import { rgbFromHsv } from "./conversion.ts";

export type ColorData = {
  /** sRGB color space */
  rgba: [number, number, number, number];
  /** Hue, Chroma, Grayscale */
  hcg: [number, number, number];
  /** Hue, Saturation, Lightness */
  hsl: [number, number, number];
  /** Hue, Saturation, Value */
  hsv: [number, number, number];
  /** Cyan, Magenta, Yellow, Black */
  cmyk: [number, number, number, number];
  /** Hexadecimal representation of the color */
  hex: string;
  /** CIE 1931 XYZ color space */
  xyz: [number, number, number];
  /** CIE L*a*b* color space */
  lab: [number, number, number];
};

/** Get average of colors. Can be used for grayscale. */
export function average(color: Color3 | Color4) {
  return Math.trunc((color[0] + color[1] + color[2]) / 3);
}
/** Calculate chroma */
export function chroma(color: Color3 | Color4) {
  return max(color) - min(color);
}

/** Convert RGB(A) to CMYK */
export function cmyk(color: Color3 | Color4): [number, number, number, number] {
  const r = color[0] / 255;
  const g = color[1] / 255;
  const b = color[2] / 255;

  const k = 1 - Math.max(r, g, b);
  const maxC = max(color);
  return [
    Math.round(((1 - r - k) / maxC) * 100),
    Math.round(((1 - g - k) / maxC) * 100),
    Math.round(((1 - b - k) / maxC) * 100),
    Math.round(k * 100),
  ];
}

/** Get contrast ratio  */
export function contrast(color1: Color4, color2: Color4): number {
  const l1 = luminance(color1);
  const l2 = luminance(color2);
  return l1 > l2 ? (l1 + 0.5) / (l2 + 0.5) : (l2 + 0.5) / (l1 + 0.5);
}

/** Convert RGB(A) to HCG */
export function hcg(color: Color3 | Color4): Color3 {
  const chromaC = chroma(color);
  return [
    Math.round(hue(color)),
    chromaC,
    chromaC < 1 ? min(color) / (1 - chromaC) : 0,
  ];
}

/** Convert RGB(A) to Hex */
export function hex(color: Color3 | Color4) {
  return `#${toHex(color[0])}${toHex(color[1])}${toHex(color[2])}${
    color[3] !== undefined ? toHex(color[3]) : ``
  }`;
}
/** Convert RGB(A) to Hue, Saturation, Lightness */
export function hsl(color: Color3 | Color4): Color3 {
  const s = saturation(color);

  return [hue(color), s * 100, lightness(color) * 100];
}
/** Convert RGB(A) to Hue, Saturation, Value */
export function hsv(color: Color3 | Color4): Color3 {
  const s = saturation(color);
  const l = lightness(color);
  const v = l + s * Math.min(l, 1 - l);

  return [hue(color), !v ? 0 : 2 * (1 - l / v) * 100, v * 100];
}
/** Calculate hue using chroma */
export function hue(color: Color3 | Color4) {
  const maxC = max(color);
  const c = chroma(color);
  // No color
  if (!c) return 0;
  const r = color[0] / 255;
  const g = color[1] / 255;
  const b = color[2] / 255;
  const hue =
    maxC === r ? (g - b) / c : maxC === g ? (b - r) / c + 2 : (r - g) / c + 4;
  if (hue < 0) return hue * 60 + 360;
  return hue * 60;
}

/** Invert HSV */
export function invert(color: Color3): Color3;
export function invert(color: Color4): Color4;
export function invert(color: Color3 | Color4): Color3 | Color4 {
  return color.length === 3
    ? [255 - color[0], 255 - color[1], 255 - color[2]]
    : [255 - color[0], 255 - color[1], 255 - color[2], color[3]];
}

/** Invert a color linearly */
export function invertLinear(color: Color3): Color3;
export function invertLinear(color: Color4): Color4;
export function invertLinear(color: Color3 | Color4): Color3 | Color4 {
  const linear = linearRgb(color);
  const inv = linear.map((x) => ~~(fromLinear(1 - x) * 255)) as Color3;
  return color.length === 3 ? inv : [inv[0], inv[1], inv[2], color[3]];
}

/** Bright colors darken, dark colors brighten. */
export function invertValue(color: Color3): Color3;
export function invertValue(color: Color4): Color4;
export function invertValue(color: Color3 | Color4): Color3 | Color4 {
  const conv = hsv(color);
  conv[2] = 100 - conv[2];
  const inverted = rgbFromHsv(conv[0], conv[1], conv[2]);
  return color.length === 3 ? inverted : [...inverted, color[3]];
}

export function json(color: Color3 | Color4): ColorData {
  return {
    rgba: color.length === 3 ? [...color, 255] : color,
    hcg: hcg(color),
    hsl: hsl(color),
    hsv: hsv(color),
    cmyk: cmyk(color),
    hex: color[3] === 255 ? hex(color).slice(0, 7) : hex(color),
    xyz: xyz(color),
    lab: lab(color),
  };
}
/** CIE L*a*b color space */
export function lab(color: Color3 | Color4): [number, number, number] {
  const [x, y, z] = xyz(color);

  const xxn = labF(x / STANDARD_ILLUMINANT[0]);
  const yyn = labF(y / STANDARD_ILLUMINANT[1]);
  const zzn = labF(z / STANDARD_ILLUMINANT[2]);

  return [116 * yyn - 16, 500 * (xxn - yyn), 200 * (yyn - zzn)];
}

/** Get lightness of color. */
export function lightness(color: Color3 | Color4) {
  return (max(color) + min(color)) / 2;
}
/** Get linear rgb values */
export function linearRgb(color: Color3 | Color4): Color3 {
  return [
    toLinear(color[0] / 255),
    toLinear(color[1] / 255),
    toLinear(color[2] / 255),
  ];
}
/** Calculate luminance */
export function luminance(color: Color3 | Color4): number {
  const [r, g, b] = linearRgb(color);
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
  // the below can also be used
  // return Math.sqrt((0.299 * r * r) + (0.587 * g * g) + (0.114 * b * b));
}
/** Get maximum of r, g, b */
export function max(color: Color3 | Color4): number {
  return Math.max(color[0], color[1], color[2]) / 255;
}
/** Get minimum of r, g, b */
export function min(color: Color3 | Color4): number {
  return Math.min(color[0], color[1], color[2]) / 255;
}
/**
 * Mix with a different color.
 * Copyright (c) 2006-2009 Hampton Catlin, Natalie Weizenbaum, and Chris Eppstein
 * http://sass-lang.com
 * @see https://github.com/less/less.js/blob/cae5021358a5fca932c32ed071f652403d07def8/lib/less/functions/color.js#L302
 */
export function mix(color1: Color4, color2: Color4, percentage = 50): Color4 {
  let p = percentage / 100;
  if (p > 1) p = 1;
  else if (p < 0) p = 0;
  const w = p * 2 - 1;
  const a = color1[3] - color2[3];

  const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
  const w2 = 1 - w1;

  const r = Math.round(color1[0] * w1 + color2[0] * w2);
  const g = Math.round(color1[1] * w1 + color2[1] * w2);
  const b = Math.round(color1[2] * w1 + color2[2] * w2);
  const alpha = parseFloat((color1[3] * p + color2[3] * (1 - p)).toFixed(8));
  return [r, g, b, alpha];
}
/** Get perceived lightness */
export function perceivedLightness(color: Color3 | Color4): number {
  const lum = luminance(color);
  if (lum <= 216 / 24389) {
    return lum * (24389 / 27);
  }
  return Math.pow(lum, 1 / 3) * 116 - 16;
}
/** Get saturation */
export function saturation(color: Color3 | Color4) {
  const c = chroma(color);
  const l = lightness(color);
  // No color
  if (!c) return 0;
  return (max(color) - l) / Math.min(l, 1 - l);
}
/** Get a shade of the color */
export function shade(color: Color4, weight = 50): Color4 {
  return mix([0, 0, 0, 255], color, weight);
}

/** Stringify the RGBA color */
export function string(color: Color3 | Color4): string {
  return color.length === 3
    ? `rgb(${color[0]},${color[1]},${color[2]})`
    : `rgba(${color[0]},${color[1]},${color[2]},${color[3] / 255})`;
}

/** Get a tint of the color */
export function tint(color: Color4, weight = 50): Color4 {
  return mix([255, 255, 255, 255], color, weight);
}

/** CIE 1931 XYZ */
export function xyz(color: Color3 | Color4): Color3 {
  const [r, g, b] = linearRgb(color);

  const x = 0.4124 * r + 0.3576 * g + 0.1805 * b;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = 0.0193 * r + 0.1192 * g + 0.9505 * b;
  return [x, y, z];
}
