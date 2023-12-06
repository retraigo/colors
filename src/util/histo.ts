import { Color } from "../../mod.ts";

/**
 * Histogram of colors with reduced space
 * Effectively quantizes the image into 32768 colors
 */
export class ColorHistogram {
  #data: Uint32Array;
  constructor() {
    this.#data = new Uint32Array(32768);
  }
  #getIndex(color: Color) {
    // ignore alpha
    const index = ((color.r >> 3) << (10)) + ((color.g >> 3) << 5) +
      (color.b >> 3);
    return index;
  }
  get(color: Color): number {
    const index = this.#getIndex(color);
    return this.#data[index];
  }
  getQuantized(color: [number, number, number]): number {
    const index = (color[0] << 10) + (color[1] << 5) + color[2];
    return this.#data[index];
  }
  add(color: Color, amount: number): number {
    const index = this.#getIndex(color);
    return Atomics.add(this.#data, index, amount);
  }
  get raw(): Uint32Array {
    return this.#data;
  }
  get length(): number {
    return this.#data.filter((x) => x).length;
  }
  static getColor(index: number): Color {
    const ri = index >> 10;
    const gi = (index - (ri << 10)) >> 5;
    const bi = (index - (ri << 10) - (gi << 5));
    return new Color(ri << 3, gi << 3, bi << 3, 255);
  }
}

/** Get a histogram of frequency of colors. */
export function getHistogram(colors: Color[]): ColorHistogram {
  const histo = new ColorHistogram();
  let i = 0;
  while (i < colors.length) {
    const hIndex = colors[i];
    histo.add(hIndex, 1);
    i += 1;
  }
  return histo;
}
