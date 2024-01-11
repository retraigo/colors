// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function toLinear(sRGB) {
    if (sRGB <= 0.04045) {
        return sRGB / 12.92;
    } else {
        return Math.pow((sRGB + 0.055) / 1.055, 2.4);
    }
}
function fromLinear(linear) {
    if (linear <= 0.0031398) {
        return linear * 12.92;
    } else {
        return Math.pow(linear, 1 / 2.4) * 1.055 - 0.055;
    }
}
export { fromLinear as fromLinear, toLinear as toLinear };
const STANDARD_ILLUMINANT = [
    0.950489,
    1,
    1.08884
];
const DELTA = 0.20689655172413793;
const DELTA_SQUARE = 0.04280618311533888;
const DELTA_CUBE = 0.008856451679035631;
const DELTA_ADD = 0.13793103448275862;
function meanDistance(from, to) {
    if (from.length !== to.length) {
        throw new Error(`Expected input elements to be of same length (${from.length}, ${from.length}) or (${to.length}, ${to.length}), got (${from.length}, ${to.length})`);
    }
    let agg = 0;
    for(let i = 0; i < from.length; i += 1){
        agg += Math.abs(from[i] - to[i]);
    }
    return agg / 1020;
}
function labF(t) {
    if (t > 0.008856451679035631) return Math.cbrt(t);
    return t / (3 * 0.04280618311533888) + 0.13793103448275862;
}
function inverseLabF(t) {
    if (t > 0.008856451679035631) return Math.pow(t, 3);
    return 3 * 0.04280618311533888 * (t - 0.13793103448275862);
}
function toHex(n) {
    return `${(n | 1 << 8).toString(16).slice(1)}`;
}
function findClosestColor(color, palette) {
    const closest = {
        dist: Infinity,
        i: 0
    };
    let i = 0;
    while(i < palette.length){
        const m = meanDistance(color, palette[i]);
        if (m < closest.dist) {
            closest.dist = m;
            closest.i = i;
        }
        i += 1;
    }
    return palette[closest.i];
}
export { STANDARD_ILLUMINANT as STANDARD_ILLUMINANT };
export { DELTA as DELTA };
export { DELTA_SQUARE as DELTA_SQUARE };
export { DELTA_CUBE as DELTA_CUBE };
export { DELTA_ADD as DELTA_ADD };
export { meanDistance as meanDistance };
export { labF as labF };
export { inverseLabF as inverseLabF };
export { toHex as toHex };
export { findClosestColor as findClosestColor };
function rgbFromHsl(h, s, l) {
    l = l / 100;
    s = s / 100;
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const h1 = h / 60;
    const m = l - chroma / 2;
    const x = chroma * (1 - Math.abs(h1 % 2 - 1));
    let intermediate = [
        0,
        0,
        0
    ];
    if (0 <= h1 && h1 < 1) intermediate = [
        chroma,
        x,
        0
    ];
    else if (1 <= h1 && h1 < 2) intermediate = [
        x,
        chroma,
        0
    ];
    else if (2 <= h1 && h1 < 3) intermediate = [
        0,
        chroma,
        x
    ];
    else if (3 <= h1 && h1 < 4) intermediate = [
        0,
        x,
        chroma
    ];
    else if (4 <= h1 && h1 < 5) intermediate = [
        x,
        0,
        chroma
    ];
    else if (5 <= h1 && h1 < 6) intermediate = [
        chroma,
        0,
        x
    ];
    const rgb = [
        intermediate[0] + m,
        intermediate[1] + m,
        intermediate[2] + m
    ];
    return [
        Math.round(rgb[0] * 255),
        Math.round(rgb[1] * 255),
        Math.round(rgb[2] * 255)
    ];
}
function rgbFromHsv(h, s, v) {
    s = s / 100;
    v = v / 100;
    const chroma = v * s;
    const h1 = h / 60;
    const m = v - chroma;
    const x = chroma * (1 - Math.abs(h1 % 2 - 1));
    let intermediate = [
        0,
        0,
        0
    ];
    if (0 <= h1 && h1 < 1) intermediate = [
        chroma,
        x,
        0
    ];
    else if (1 <= h1 && h1 < 2) intermediate = [
        x,
        chroma,
        0
    ];
    else if (2 <= h1 && h1 < 3) intermediate = [
        0,
        chroma,
        x
    ];
    else if (3 <= h1 && h1 < 4) intermediate = [
        0,
        x,
        chroma
    ];
    else if (4 <= h1 && h1 < 5) intermediate = [
        x,
        0,
        chroma
    ];
    else if (5 <= h1 && h1 < 6) intermediate = [
        chroma,
        0,
        x
    ];
    const rgb = [
        intermediate[0] + m,
        intermediate[1] + m,
        intermediate[2] + m
    ];
    return [
        Math.round(rgb[0] * 255),
        Math.round(rgb[1] * 255),
        Math.round(rgb[2] * 255)
    ];
}
function rgbaFromHex(hex) {
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
            colors[2]
        ];
    }
    const red = parseInt(`${colors[0]}${colors[1]}`, 16) || 0;
    const green = parseInt(`${colors[2]}${colors[3]}`, 16) || 0;
    const blue = parseInt(`${colors[4]}${colors[5]}`, 16) || 0;
    let alpha = 255;
    if (colors[6] && colors[7]) {
        alpha = parseInt(`${colors[6]}${colors[7]}`, 16) ?? 255;
    }
    return [
        red,
        green,
        blue,
        alpha
    ];
}
function rgbFromLab(l, a, b) {
    const [x, y, z] = xyzFromLab(l, a, b);
    return rgbFromXyz(x, y, z);
}
function rgbFromXyz(x, y, z) {
    return [
        3.2406 * x + -1.5372 * y + -0.4986 * z,
        -0.9689 * x + 1.8758 * y + 0.0415 * z,
        0.0557 * x + -0.204 * y + 1.057 * z
    ];
}
function xyzFromLab(l, a, b) {
    const add = (l + 16) / 116;
    const x = STANDARD_ILLUMINANT[0] * inverseLabF(add + a / 500);
    const y = STANDARD_ILLUMINANT[1] * inverseLabF(add);
    const z = STANDARD_ILLUMINANT[2] * inverseLabF(add - b / 200);
    return [
        x,
        y,
        z
    ];
}
function rgbFromCmyk(c, m, y, k) {
    const divi = 1 - k / 100;
    return [
        255 * (1 - c / 100) * divi,
        255 * (1 - m / 100) * divi,
        255 * (1 - y / 100) * divi
    ];
}
export { rgbFromHsl as rgbFromHsl };
export { rgbFromHsv as rgbFromHsv };
export { rgbaFromHex as rgbaFromHex };
export { rgbFromLab as rgbFromLab };
export { rgbFromXyz as rgbFromXyz };
export { xyzFromLab as xyzFromLab };
export { rgbFromCmyk as rgbFromCmyk };
function average(color) {
    return Math.trunc((color[0] + color[1] + color[2]) / 3);
}
function chroma(color) {
    return max(color) - min(color);
}
function cmyk(color) {
    const r = color[0] / 255;
    const g = color[1] / 255;
    const b = color[2] / 255;
    const k = 1 - Math.max(r, g, b);
    const maxC = max(color);
    return [
        Math.round((1 - r - k) / maxC * 100),
        Math.round((1 - g - k) / maxC * 100),
        Math.round((1 - b - k) / maxC * 100),
        Math.round(k * 100)
    ];
}
function contrast(color1, color2) {
    const l1 = luminance(color1);
    const l2 = luminance(color2);
    return l1 > l2 ? (l1 + 0.5) / (l2 + 0.5) : (l2 + 0.5) / (l1 + 0.5);
}
function hcg(color) {
    const chromaC = chroma(color);
    return [
        Math.round(hue(color)),
        chromaC,
        chromaC < 1 ? min(color) / (1 - chromaC) : 0
    ];
}
function hex(color) {
    return `#${toHex(color[0])}${toHex(color[1])}${toHex(color[2])}${color[3] !== undefined ? toHex(color[3]) : ``}`;
}
function hsl(color) {
    const s = saturation(color);
    return [
        Math.round(hue(color)),
        Math.trunc(s * 10000 / 100),
        Math.trunc(lightness(color) * 10000 / 100)
    ];
}
function hsv(color) {
    const s = saturation(color);
    const l = lightness(color);
    const v = l + s * Math.min(l, 1 - l);
    return [
        Math.round(hue(color)),
        !v ? 0 : Math.round(2 * (1 - l / v) * 100),
        Math.round(v * 100)
    ];
}
function hue(color) {
    const maxC = max(color);
    const c = chroma(color);
    if (!c) return 0;
    const r = color[0] / 255;
    const g = color[1] / 255;
    const b = color[2] / 255;
    const hue = maxC === r ? (g - b) / c : maxC === g ? (b - r) / c + 2 : (r - g) / c + 4;
    if (hue < 0) return hue * 60 + 360;
    return hue * 60;
}
function invert(color) {
    return color.length === 3 ? [
        255 - color[0],
        255 - color[1],
        255 - color[2]
    ] : [
        255 - color[0],
        255 - color[1],
        255 - color[2],
        color[3]
    ];
}
function invertLinear(color) {
    const linear = linearRgb(color);
    const inv = linear.map((x)=>~~(fromLinear(1 - x) * 255));
    return color.length === 3 ? inv : [
        inv[0],
        inv[1],
        inv[2],
        color[3]
    ];
}
function invertValue(color) {
    const conv = hsv(color);
    conv[2] = 100 - conv[2];
    const inverted = rgbFromHsv(conv[0], conv[1], conv[2]);
    return color.length === 3 ? inverted : [
        ...inverted,
        color[3]
    ];
}
function json(color) {
    return {
        rgba: color.length === 3 ? [
            ...color,
            255
        ] : color,
        hcg: hcg(color),
        hsl: hsl(color),
        hsv: hsv(color),
        cmyk: cmyk(color),
        hex: color[3] === 255 ? hex(color).slice(0, 7) : hex(color),
        xyz: xyz(color),
        lab: lab(color)
    };
}
function lab(color) {
    const [x, y, z] = xyz(color);
    const xxn = labF(x / STANDARD_ILLUMINANT[0]);
    const yyn = labF(y / STANDARD_ILLUMINANT[1]);
    const zzn = labF(z / STANDARD_ILLUMINANT[2]);
    return [
        116 * yyn - 16,
        500 * (xxn - yyn),
        200 * (yyn - zzn)
    ];
}
function lightness(color) {
    return (max(color) + min(color)) / 2;
}
function linearRgb(color) {
    return [
        toLinear(color[0] / 255),
        toLinear(color[1] / 255),
        toLinear(color[2] / 255)
    ];
}
function luminance(color) {
    const [r, g, b] = linearRgb(color);
    return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
function max(color) {
    return Math.max(color[0], color[1], color[2]) / 255;
}
function min(color) {
    return Math.min(color[0], color[1], color[2]) / 255;
}
function mix(color1, color2, percentage = 50) {
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
    return [
        r,
        g,
        b,
        alpha
    ];
}
function perceivedLightness(color) {
    const lum = luminance(color);
    if (lum <= 216 / 24389) {
        return lum * (24389 / 27);
    }
    return Math.pow(lum, 1 / 3) * 116 - 16;
}
function saturation(color) {
    const c = chroma(color);
    const l = lightness(color);
    if (!c) return 0;
    return (max(color) - l) / Math.min(l, 1 - l);
}
function shade(color, weight = 50) {
    return mix([
        0,
        0,
        0,
        255
    ], color, weight);
}
function string(color) {
    return color.length === 3 ? `rgb(${color[0]},${color[1]},${color[2]})` : `rgba(${color[0]},${color[1]},${color[2]},${color[3] / 255})`;
}
function tint(color, weight = 50) {
    return mix([
        255,
        255,
        255,
        255
    ], color, weight);
}
function xyz(color) {
    const [r, g, b] = linearRgb(color);
    const x = 0.4124 * r + 0.3576 * g + 0.1805 * b;
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const z = 0.0193 * r + 0.1192 * g + 0.9505 * b;
    return [
        x,
        y,
        z
    ];
}
export { average as average };
export { chroma as chroma };
export { cmyk as cmyk };
export { contrast as contrast };
export { hcg as hcg };
export { hex as hex };
export { hsl as hsl };
export { hsv as hsv };
export { hue as hue };
export { invert as invert };
export { invertLinear as invertLinear };
export { invertValue as invertValue };
export { json as json };
export { lab as lab };
export { lightness as lightness };
export { linearRgb as linearRgb };
export { luminance as luminance };
export { max as max };
export { min as min };
export { mix as mix };
export { perceivedLightness as perceivedLightness };
export { saturation as saturation };
export { shade as shade };
export { string as string };
export { tint as tint };
export { xyz as xyz };
