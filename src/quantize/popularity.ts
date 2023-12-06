import { Color } from "../../mod.ts";
import { ColorHistogram, getHistogram } from "../util/histo.ts";

/**
 * Get a a reduced palette of just popular colors from the given palette.
 * @param palette An array of colors to extract palette from
 * @param extractCount Number of colors to extract
 */
export function quantizeByPopularity(
  palette: Color[],
  extractCount: number,
): Color[] {
  const histo = getHistogram(palette);
  const result: [number, number][] = [];

  histo.raw.forEach((v, i) => {
    if (v) result.push([i, v]);
  });

  result.sort((a, b) => b[1] - a[1]);
  const res = [];
  for (const i of result.slice(0, extractCount)) {
    res.push(ColorHistogram.getColor(i[0]));
  }
  return res;
}
