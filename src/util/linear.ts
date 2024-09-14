/** Convert sRGB to Linear RGB */
export function toLinear(sRGB: number): number {
  if (sRGB <= 0.04045) {
    return sRGB / 12.92;
  } else {
    return Math.pow((sRGB + 0.055) / 1.055, 2.4);
  }
}
/** Convert Linear RGB to sRGB */
export function fromLinear(linear: number): number {
  if (linear <= 0.0031398) {
    return linear * 12.92;
  } else {
    return Math.pow(linear, 1 / 2.4) * 1.055 - 0.055;
  }
}
