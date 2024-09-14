/**
 * A collection of functions to extract information from colors,
 * generate shades and tints, convert to other color spaces, etc.
 *
 * **Note: All methods either accept RGB/RGBA colors as parameters or give RGB/RGBA colors as results. In order to work with other color spaces (eg. XYZ), convert them to RGB first.**
 *
 * @example
 * ```ts
 * // Deno /x
 * import { rgbaFromHex, xyz, lab } from "https://deno.land/x/colors/mod.ts";
 *
 * // Deno JSR
 * import { rgbaFromHex, xyz, lab } from "jsr:@retraigo/colors";
 *
 * // Node JSR (after installation)
 * import { rgbaFromHex, xyz, lab } from "jsr:@retraigo/colors";
 *
 * const color = rgbaFromHex("#fceff1");
 *
 * // CIE XYZ color space
 * console.log(xyz(color));
 *
 * // CIE LAB color space
 * console.log(lab(color));
 *
 * // Conversion of color into all supported spaces
 * console.log(json(color));
 * ```
 * @module
 */
export * from "./src/mod.ts";
