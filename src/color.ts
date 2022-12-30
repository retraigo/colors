import { fromLinear, toLinear } from "./util/linear.ts";

/** Standard illuminant D65 */
export const STANDARD_ILLUMINANT = [0.950489, 1, 1.088840];

/** 6 / 29 */
export const DELTA = 0.20689655172413793;
export const DELTA_SQUARE = 0.04280618311533888;
export const DELTA_CUBE = 0.008856451679035631;

/** 4 / 29 */
export const DELTA_ADD = 0.13793103448275862;

export interface ColorData {
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
  lab: [number, number, number];
}

/** General class for RGBA colors */
export class Color {
  /** Red value of color */
  r: number;
  /** Green value of color */
  g: number;
  /** Blue value of color */
  b: number;
  /** Alpha (opacity) of color */
  a: number;
  /** Construct a color from hex code */
  constructor(hex: string);
  /** Construct a color from hex number */
  constructor(hex: number);
  /** Construct a color from rgba values */
  constructor(r: number, g: number, b: number, a?: number);
  constructor(rOrHex: number | string, g?: number, b?: number, a = 255) {
    let red = 0, green = 0, blue = 0, alpha = 255;
    if (typeof rOrHex === "string") {
      [red, green, blue, alpha] = rgbaFromHex(rOrHex);
    } else if (
      typeof rOrHex === "number" && typeof g === "undefined" &&
      typeof b === "undefined"
    ) {
      const hex = rOrHex.toString(16);
      [red, green, blue, alpha] = rgbaFromHex(`#${hex}`);
    } else {
      red = rOrHex || 0;
      green = g || 0;
      blue = b || 0;
      alpha = a ?? 255;
    }
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = alpha;
  }
  /** Get the average of all colors
   * Can also be used instead of `grayscale` using
   * ```ts
   * const color = new Color(r, g, b, a);
   * const avg = color.average;
   * const grayscaleColor = new Color(avg, avg, avg, a);
   * ```
   */
  get average() {
    return Math.trunc((this.r + this.g + this.b) / 3);
  }
  /** Calculate chroma */
  get chroma() {
    return (this.max - this.min);
  }
  get cmyk(): [number, number, number, number] {
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;

    const k = 1 - Math.max(r, g, b);
    const max = this.max;
    return [
      Math.round(((1 - r - k) / max) * 100),
      Math.round(((1 - g - k) / max) * 100),
      Math.round(((1 - b - k) / max) * 100),
      Math.round(k * 100),
    ];
  }
  /**
   * Convert to grayscale using luminance
   */
  get grayscale(): Color {
    // Can alternatively be done using
    // this.lightness and this.average
    const l = Math.trunc(fromLinear(this.luminance) * 255);
    return new Color(l, l, l, this.a);
  }
  get hcg(): [number, number, number] {
    const chroma = this.chroma;
    return [
      Math.round(this.hue),
      chroma,
      chroma < 1 ? this.min / (1 - chroma) : 0,
    ];
  }
  get hex() {
    return `#${Color.toHex(this.r)}${Color.toHex(this.g)}${
      Color.toHex(this.b)
    }${Color.toHex(this.a)}`;
  }
  /** Hue, Saturation, Lightness */
  get hsl(): [number, number, number] {
    const s = this.saturation;

    return [
      Math.round(this.hue),
      Math.trunc((s * 10000) / 100),
      Math.trunc((this.lightness * 10000) / 100),
    ];
  }
  /** Hue, Saturation, Value */
  get hsv(): [number, number, number] {
    const s = this.saturation;
    const l = this.lightness;
    const v = (l + (s * Math.min(l, 1 - l)));

    return [
      Math.round(this.hue),
      !v ? 0 : Math.round((2 * (1 - (l / v))) * 100),
      Math.round(v * 100),
    ];
  }
  /** Calculate hue using chroma */
  get hue() {
    const max = this.max;
    const c = this.chroma;
    // No color
    if (!c) return 0;
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;
    const hue =
      (max === r
        ? (g - b) / c
        : max === g
        ? ((b - r) / c) + 2
        : ((r - g) / c) + 4);
    if (hue < 0) return (hue * 60) + 360;
    return hue * 60;
  }
  get invert() {
    return new Color(255 - this.r, 255 - this.g, 255 - this.b, this.a);
  }
  /** CIE L*a*b color space */
  get lab(): [number, number, number] {
    const [x, y, z] = this.xyz;

    const xxn = labF(x / STANDARD_ILLUMINANT[0]);
    const yyn = labF(y / STANDARD_ILLUMINANT[1]);
    const zzn = labF(z / STANDARD_ILLUMINANT[2]);

    return [
      (116 * yyn) - 16,
      500 * (xxn - yyn),
      200 * (yyn - zzn),
    ];
  }
  /**
   * Get lightness of image. Can also be used instead of `grayscale` using
   * ```ts
   * const color = new Color(r, g, b, a);
   * const l = color.lightness * 255;
   * const grayscaleColor = new Color(l, l, l, a);
   * ```
   */
  get lightness() {
    return ((this.max + this.min) / 2);
  }
  /** Get linear rgb values */
  get linearRgb() {
    return [
      toLinear(this.r / 255),
      toLinear(this.g / 255),
      toLinear(this.b / 255),
    ];
  }
  /** Calculate luminance */
  get luminance(): number {
    const [r, g, b] = this.linearRgb;
    return (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
    // the below can also be used
    // return Math.sqrt((0.299 * r * r) + (0.587 * g * g) + (0.114 * b * b));
  }
  /** Get maximum of r, g, b */
  get max(): number {
    return Math.max(this.r, this.g, this.b) / 255;
  }
  /** Get minimum of r, g, b */
  get min(): number {
    return Math.min(this.r, this.g, this.b) / 255;
  }
  /** Get perceived lightness */
  get perceivedLightness(): number {
    const lum = this.luminance;
    if (lum <= (216 / 24389)) {
      return lum * (24389 / 27);
    }

    return Math.pow(lum, 1 / 3) * 116 - 16;
  }
  /** Get saturation */
  get saturation() {
    const c = this.chroma;
    const l = this.lightness;
    // No color
    if (!c) return 0;
    return (this.max - l) / Math.min(l, 1 - l);
  }
  /** CIE 1931 XYZ */
  get xyz(): [number, number, number] {
    const [r, g, b] = this.linearRgb;

    const x = (0.4124 * r) + (0.3576 * g) + (0.1805 * b);
    const y = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    const z = (0.0193 * r) + (0.1192 * g) + (0.9505 * b);
    return [x, y, z];
  }
  /*
  xyz is a very bad idea

  brighten(amt: number): Color {
    let [x, y, z] = this.xyz;
    y += y * amt;
    if(y > 1) y = 1
    if(y < 0) y = 0
    const [r, g, b] = rgbFromXyz(x, y, z)
    return new Color(
      Math.round(fromLinear(r) * 255),
      Math.round(fromLinear(g) * 255),
      Math.round(fromLinear(b) * 255),
      this.a,
    );
  }
  */
  /** Get contrast ratio  */
  contrast(that: Color): number {
    const l1 = this.luminance;
    const l2 = that.luminance;
    return l1 > l2 ? (l1 + 0.5) / (l2 + 0.5) : (l2 + 0.5) / (l1 + 0.5);
  }
  /** Get a detailed conversion of the color. */
  toJSON(): ColorData {
    return {
      rgba: [this.r, this.g, this.b, this.a],
      hcg: this.hcg,
      hsl: this.hsl,
      hsv: this.hsv,
      cmyk: this.cmyk,
      hex: this.a === 255 ? this.hex.slice(0, 7) : this.hex,
      xyz: this.xyz,
      lab: this.lab,
    };
  }

  toString(): string {
    return `rgba(${this.r},${this.g},${this.b},${this.a / 255})`;
  }
  static fromHex(hex: string): Color {
    const [red, green, blue, alpha] = rgbaFromHex(hex);
    return new Color(red, green, blue, alpha);
  }
  static fromHsl(h: number, s: number, l: number): Color {
    l = l / 100
    s = s / 100
    const chroma = (1 - Math.abs((2 * l) - 1)) * s;
    const h1 = h / 60;
    const m = l - (chroma / 2);

    const x = chroma * (1 - Math.abs((h1 % 2) - 1));

    let intermediate = [0, 0, 0];

    if (0 <= h1 && h1 < 1) intermediate = [chroma, x, 0];
    else if (1 <= h1 && h1 < 2) intermediate = [x, chroma, 0];
    else if (2 <= h1 && h1 < 3) intermediate = [0, chroma, x];
    else if (3 <= h1 && h1 < 4) intermediate = [0, x, chroma];
    else if (4 <= h1 && h1 < 5) intermediate = [x, 0, chroma];
    else if (5 <= h1 && h1 < 6) intermediate = [chroma, 0, x];

    const rgb = [intermediate[0] + m, intermediate[1] + m, intermediate[2] + m];

    return new Color(
      Math.round(rgb[0] * 255),
      Math.round(rgb[1] * 255),
      Math.round(rgb[2] * 255),
    );
  }
  static fromLab(l: number, a: number, b: number): Color {
    const [x, y, z] = xyzFromLab(l, a, b);
    return Color.fromXyz(x, y, z);
  }
  /** Redundant static method for conversion from sRGB color space */
  static fromRgba(r: number, g: number, b: number): Color;
  static fromRgba(r: number, g: number, b: number, a = 255): Color {
    return new Color(r, g, b, a);
  }
  /** Convert from CIE XYZ color space */
  static fromXyz(x: number, y: number, z: number): Color {
    const [r, g, b] = rgbFromXyz(x, y, z).map((x) =>
      Math.round(fromLinear(x) * 255)
    ).map((x) => x < 0 ? 0 : x > 255 ? 255 : x);
    return new Color(
      r,
      g,
      b,
    );
  }
  static toHex(n: number): string {
    return `${(n | 1 << 8).toString(16).slice(1)}`;
  }
}

/** Calculate mean distance between two colors */
export function meanDistance(from: Color, to: Color): number {
  return (
    (
      Math.abs(from.r - to.r) +
      Math.abs(from.g - to.g) +
      Math.abs(from.b - to.b) +
      Math.abs(from.a - to.a)
    ) / 255
  ) / 4;
}

/** t = C / Cn ratio */
function labF(t: number): number {
  if (t > DELTA_CUBE) return Math.cbrt(t);
  return (t / (3 * DELTA_SQUARE)) + DELTA_ADD;
}

/** Inverse lab function */
function inverseLabF(t: number): number {
  if (t > DELTA_CUBE) return Math.pow(t, 3);
  return (3 * DELTA_SQUARE) * (t - DELTA_ADD);
}

function rgbaFromHex(hex: string): [number, number, number, number] {
  if (!/^#([A-Fa-f0-9]{3}){1,2}([A-Fa-f0-9]{2})?$/.test(hex)) {
    throw new TypeError(`Expected number or hex code. Got ${hex}`);
  }
  let colors = hex.slice(1).split("");
  if (colors.length === 3) {
    colors = [
      colors[0],
      colors[0],
      colors[1],
      colors[1],
      colors[2],
      colors[2],
    ];
  }
  // Convert hexadecimal to decimal
  const red = parseInt(`${colors[0]}${colors[1]}`, 16) || 0;
  const green = parseInt(`${colors[2]}${colors[3]}`, 16) || 0;
  const blue = parseInt(`${colors[4]}${colors[5]}`, 16) || 0;
  let alpha = 255;
  if (colors[6] && colors[7]) {
    alpha = parseInt(`${colors[6]}${colors[7]}`, 16) ?? 255;
  }
  return [red, green, blue, alpha];
}

/** Convert CIE XYZ to Linear RGB color space */
export function rgbFromXyz(
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  return [
    (3.2406 * x) + (-1.5372 * y) + (-0.4986 * z),
    (-0.9689 * x) + (1.8758 * y) + (0.0415 * z),
    (0.0557 * x) + (-0.2040 * y) + (1.0570 * z),
  ];
}

export function xyzFromLab(
  l: number,
  a: number,
  b: number,
): [number, number, number] {
  const add = (l + 16) / 116;
  const x = STANDARD_ILLUMINANT[0] * inverseLabF(add + (a / 500));
  const y = STANDARD_ILLUMINANT[1] * inverseLabF(add);
  const z = STANDARD_ILLUMINANT[2] * inverseLabF(add - (b / 200));

  return [x, y, z];
}

/**
 * Find the nearest neighbour of a color in a palette
 * It would be more accurate to use consider luminance
 * along with Euclidean distance but I chose to stay with
 * distance for performance.
 */
export function findClosestColor(color: Color, palette: Color[]): Color {
  const closest = {
    dist: Infinity,
    i: 0,
  };
  let i = 0;
  while (i < palette.length) {
    const m = meanDistance(color, palette[i]);
    if (m < closest.dist) {
      closest.dist = m;
      closest.i = i;
    }
    i += 1;
  }
  return palette[closest.i];
}
