import { luminance } from "./color.ts";
import {
  Color3,
  Color4,
  fromLinear,
} from "./common.ts";

/**
 * Convert RGBA to grayscale using luminance
 *
 * Alternatively use `average()` or `lightness()`
 */
export function grayscale(color: Color3): Color3;
export function grayscale(color: Color4): Color4;
export function grayscale(color: Color3 | Color4): Color3 | Color4 {
  const l = Math.trunc(fromLinear(luminance(color)) * 255);
  return color.length === 3 ? [l, l, l] : [l, l, l, color[3]];
}

