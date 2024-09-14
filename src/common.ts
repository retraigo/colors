export { fromLinear, toLinear } from "./util/linear.ts";

/** Standard illuminant D65 */
export const STANDARD_ILLUMINANT = [0.950489, 1, 1.08884];

/** 6 / 29 */
export const DELTA = 0.20689655172413793;
/** (6 / 29)^2 */
export const DELTA_SQUARE = 0.04280618311533888;
/** (6 / 29)^3 */
export const DELTA_CUBE = 0.008856451679035631;

/** 4 / 29 */
export const DELTA_ADD = 0.13793103448275862;

/** Calculate mean distance between two colors */
export function meanDistance(from: number[], to: number[]): number {
  if (from.length !== to.length) {
    throw new Error(
      `Expected input elements to be of same length (${from.length}, ${from.length}) or (${to.length}, ${to.length}), got (${from.length}, ${to.length})`
    );
  }
  let agg = 0;
  for (let i = 0; i < from.length; i += 1) {
    agg += Math.abs(from[i] - to[i]);
  }
  return agg / 1020;
}

/** t = C / Cn ratio */
export function labF(t: number): number {
  if (t > DELTA_CUBE) return Math.cbrt(t);
  return t / (3 * DELTA_SQUARE) + DELTA_ADD;
}

/** Inverse lab function */
export function inverseLabF(t: number): number {
  if (t > DELTA_CUBE) return Math.pow(t, 3);
  return 3 * DELTA_SQUARE * (t - DELTA_ADD);
}

export function toHex(n: number): string {
  return `${(n | (1 << 8)).toString(16).slice(1)}`;
}

/**
 * Find the nearest neighbour of a color in a palette
 * It would be more accurate to use consider luminance
 * along with Euclidean distance but I chose to stay with
 * distance for performance.
 */
export function findClosestColor(color: Color1, palette: Color1[]): Color1;
export function findClosestColor(color: Color3, palette: Color3[]): Color3;
export function findClosestColor(color: Color4, palette: Color4[]): Color4;
export function findClosestColor(color: number[], palette: number[][]): number[] {
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

/** 1-Channel Color (Grayscale) */
export type Color1 = [number];
/** 3-Channel Color */
export type Color3 = [number, number, number];
/** 4-Channel Color */
export type Color4 = [number, number, number, number];
