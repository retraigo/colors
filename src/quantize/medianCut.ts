/// Uses Modified Median Cut Algorithm
/// TypeScript port of Leptonica
/// http://www.leptonica.org/

import { Color } from "../../mod.ts";
import { ColorHistogram, getHistogram } from "../util/histo.ts";

export function getAverageColor(
  vbox: ColorRange,
  histo: ColorHistogram,
): Color {
  let total = 0;
  let totalR = 0, totalG = 0, totalB = 0;
  let ri = vbox.r.min;
  while (ri <= vbox.r.max) {
    let gi = vbox.g.min;
    while (gi <= vbox.g.max) {
      let bi = vbox.b.min;
      while (bi <= vbox.b.max) {
        const count = histo.getQuantized([ri, gi, bi]) || 0;
        total += count;
        totalR += count * (ri + 0.5) * 8;
        totalG += count * (gi + 0.5) * 8;
        totalB += count * (bi + 0.5) * 8;
        bi += 1;
      }
      gi += 1;
    }
    ri += 1;
  }
  if (total) {
    return new Color(
      ~~(totalR / total),
      ~~(totalG / total),
      ~~(totalB / total),
      255,
    );
  }
  // In case box is empty
  return new Color(
    Math.trunc(8 * (vbox.r.min + vbox.r.max + 1) / 2),
    Math.trunc(8 * (vbox.g.min + vbox.g.max + 1) / 2),
    Math.trunc(8 * (vbox.b.min + vbox.b.max + 1) / 2),
    255,
  );
}

/** The vbox */
export interface ColorRange {
  r: { min: number; max: number };
  g: { min: number; max: number };
  b: { min: number; max: number };
}

/** Get the minimum and maximum RGB values. */
export function getColorRange(
  colors: Color[],
): ColorRange {
  const range = {
    r: { min: 1000, max: 0 },
    g: { min: 1000, max: 0 },
    b: { min: 1000, max: 0 },
  };
  let i = 0;
  while (i < colors.length) {
    if ((colors[i].r >> 3) < range.r.min) range.r.min = colors[i].r >> 3;
    if ((colors[i].r >> 3) > range.r.max) range.r.max = colors[i].r >> 3;

    if ((colors[i].g >> 3) < range.g.min) range.g.min = colors[i].g >> 3;
    if ((colors[i].g >> 3) > range.g.max) range.g.max = colors[i].g >> 3;

    if ((colors[i].b >> 3) < range.b.min) range.b.min = colors[i].b >> 3;
    if ((colors[i].b >> 3) > range.b.max) range.b.max = colors[i].b >> 3;

    i += 1;
  }
  return range;
}

/**
 * Get a reduced color palette using Modified Median Cut.
 * @param palette An array of colors to extract palette from
 * @param extractCount Number of colors to extract
 */
export function quantizeByMedianCut(
  palette: Color[],
  extractCount: number,
): Color[] {
  const vbox = getColorRange(palette);
  const histo = getHistogram(palette);
  return quantize(vbox, histo, extractCount);
}

function quantize(
  vbox: ColorRange,
  histo: ColorHistogram,
  extractCount: number,
): Color[] {
  const vboxes: ColorRange[] = [vbox];

  // Avoid an infinite loop
  const maxIter = 1000;
  let i = 0;

  const firstExtractCount = ~~(extractCount >> 1);
  let generated = 1;

  while (i < maxIter) {
    const lastBox = vboxes.shift();
    if (!lastBox) break; // This shouldn't happen
    if (!vboxSize(lastBox, histo)) {
      vboxes.push(lastBox);
      i += 1;
      continue;
    }
    const cut = medianCutApply(lastBox, histo);

    if (cut) {
      vboxes.push(cut[0], cut[1]);
      generated += 1;
    } else vboxes.push(lastBox);
    if (generated >= firstExtractCount) break;
  }

  vboxes.sort((a, b) =>
    (vboxSize(b, histo) * vboxVolume(b)) - (vboxSize(a, histo) * vboxVolume(a))
  );

  const secondExtractCount = extractCount - vboxes.length;
  i = 0;
  generated = 0;

  while (i < maxIter) {
    const lastBox = vboxes.shift();
    if (!lastBox) break; // This shouldn't happen
    if (!vboxSize(lastBox, histo)) {
      vboxes.push(lastBox);
      i += 1;
      continue;
    }
    const cut = medianCutApply(lastBox, histo);

    if (cut) {
      vboxes.push(cut[0], cut[1]);
      generated += 1;
    } else vboxes.push(lastBox);
    if (generated >= secondExtractCount) break;
  }
  vboxes.sort((a, b) => vboxSize(b, histo) - vboxSize(a, histo));
  return vboxes.map((x) => getAverageColor(x, histo)).slice(0, extractCount);
}

/** Get number of colors in vbox */
function vboxSize(vbox: ColorRange, histo: ColorHistogram): number {
  let count = 0;
  let ri = vbox.r.min;
  while (ri <= vbox.r.max) {
    let gi = vbox.g.min;
    while (gi <= vbox.g.max) {
      let bi = vbox.b.min;
      while (bi <= vbox.b.max) {
        count += histo.get(new Color(ri, gi, bi, 255)) || 0;
        bi += 1;
      }
      gi += 1;
    }
    ri += 1;
  }
  return count;
}

/** Get volume by dimensions of vbox */
function vboxVolume(vbox: ColorRange): number {
  return ~~(vbox.r.max - vbox.r.min) * ~~(vbox.g.max - vbox.g.min) *
    ~~(vbox.b.max - vbox.b.min);
}

/** Cut vbox into two */
function medianCutApply(
  vbox: ColorRange,
  histo: ColorHistogram,
): [ColorRange, ColorRange] | false {
  const count = vboxSize(vbox, histo);

  if (!count || count === 1) return false;
  const rw = vbox.r.max - vbox.r.min + 1;
  const gw = vbox.g.max - vbox.g.min + 1;
  const bw = vbox.b.max - vbox.b.min + 1;

  const axis = Math.max(rw, gw, bw);

  // Find partial sums along each axis
  const sumAlongAxis = [];
  // avoid running another loop to compute sum
  let totalSum = 0;
  switch (axis) {
    case rw: {
      let i = vbox.r.min;
      while (i <= vbox.r.max) {
        let tempSum = 0;
        let j = vbox.g.min;
        while (j < vbox.g.max) {
          let k = vbox.b.min;
          while (k < vbox.b.max) {
            tempSum += histo.getQuantized([i, j, k]) || 0;
            k += 1;
          }
          j += 1;
        }
        totalSum += tempSum;
        sumAlongAxis[i] = totalSum;
        i += 1;
      }
      break;
    }
    case gw: {
      let i = vbox.g.min;
      while (i <= vbox.g.max) {
        let tempSum = 0;
        let j = vbox.r.min;
        while (j < vbox.r.max) {
          let k = vbox.b.min;
          while (k < vbox.b.max) {
            tempSum += histo.getQuantized([j, i, k]) || 0;
            k += 1;
          }
          j += 1;
        }
        totalSum += tempSum;
        sumAlongAxis[i] = totalSum;
        i += 1;
      }
      break;
    }
    default: {
      let i = vbox.b.min;
      while (i <= vbox.b.max) {
        let tempSum = 0;
        let j = vbox.r.min;
        while (j < vbox.r.max) {
          let k = vbox.g.min;
          while (k < vbox.g.max) {
            tempSum += histo.getQuantized([j, k, i]) || 0;
            k += 1;
          }
          j += 1;
        }
        totalSum += tempSum;
        sumAlongAxis[i] = totalSum;
        i += 1;
      }
      break;
    }
  }

  // Apply median cut
  switch (axis) {
    case rw: {
      let i = vbox.r.min;
      while (i <= vbox.r.max) {
        // Find the mid point through linear search
        if (sumAlongAxis[i] < totalSum / 2) {
          let cutAt = 0;
          const vbox1 = {
            r: { min: vbox.r.min, max: vbox.r.max },
            g: { min: vbox.g.min, max: vbox.g.max },
            b: { min: vbox.b.min, max: vbox.b.max },
          };
          const vbox2 = {
            r: { min: vbox.r.min, max: vbox.r.max },
            g: { min: vbox.g.min, max: vbox.g.max },
            b: { min: vbox.b.min, max: vbox.b.max },
          };
          const left = i - vbox.r.min;
          const right = vbox.r.max - i;
          if (left <= right) {
            cutAt = Math.min(vbox.r.max - 1, Math.trunc(i + right / 2));
          } else cutAt = Math.max(vbox.r.min, Math.trunc(i - 1 - left / 2));

          while (!sumAlongAxis[cutAt]) cutAt += 1;

          vbox1.r.max = cutAt;
          vbox2.r.min = cutAt + 1;
          return [vbox1, vbox2];
        }
        i += 1;
      }
      break;
    }
    case gw: {
      let i = vbox.g.min;
      while (i <= vbox.g.max) {
        // Find the mid point through linear search
        if (sumAlongAxis[i] < totalSum / 2) {
          let cutAt = 0;
          const vbox1 = {
            r: { min: vbox.r.min, max: vbox.r.max },
            g: { min: vbox.g.min, max: vbox.g.max },
            b: { min: vbox.b.min, max: vbox.b.max },
          };
          const vbox2 = {
            r: { min: vbox.r.min, max: vbox.r.max },
            g: { min: vbox.g.min, max: vbox.g.max },
            b: { min: vbox.b.min, max: vbox.b.max },
          };
          const left = i - vbox.g.min;
          const right = vbox.g.max - i;
          if (left <= right) {
            cutAt = Math.min(vbox.g.max - 1, Math.trunc(i + right / 2));
          } else cutAt = Math.max(vbox.g.min, Math.trunc(i - 1 - left / 2));
          while (!sumAlongAxis[cutAt]) cutAt += 1;

          vbox1.g.max = cutAt;
          vbox2.g.min = cutAt + 1;
          return [vbox1, vbox2];
        }
        i += 1;
      }
      break;
    }
    default: {
      let i = vbox.b.min;
      while (i <= vbox.b.max) {
        // Find the mid point through linear search
        if (sumAlongAxis[i] < totalSum / 2) {
          let cutAt = 0;
          const vbox1 = {
            r: { min: vbox.r.min, max: vbox.r.max },
            g: { min: vbox.g.min, max: vbox.g.max },
            b: { min: vbox.b.min, max: vbox.b.max },
          };
          const vbox2 = {
            r: { min: vbox.r.min, max: vbox.r.max },
            g: { min: vbox.g.min, max: vbox.g.max },
            b: { min: vbox.b.min, max: vbox.b.max },
          };
          const left = i - vbox.b.min;
          const right = vbox.b.max - i;
          if (left <= right) {
            cutAt = Math.min(vbox.b.max - 1, Math.trunc(i + right / 2));
          } else cutAt = Math.max(vbox.b.min, Math.trunc(i - 1 - left / 2));
          while (!sumAlongAxis[cutAt]) cutAt += 1;

          vbox1.b.max = cutAt;
          vbox2.b.min = cutAt + 1;
          return [vbox1, vbox2];
        }
        i += 1;
      }
      break;
    }
  }

  return false;
}
