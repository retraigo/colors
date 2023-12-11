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
const STANDARD_ILLUMINANT = [
    0.950489,
    1,
    1.088840
];
const DELTA = 0.20689655172413793;
class Color {
    r;
    g;
    b;
    a;
    constructor(rOrHex, g, b, a = 255){
        let red = 0, green = 0, blue = 0, alpha = 255;
        if (typeof rOrHex === "string") {
            [red, green, blue, alpha] = rgbaFromHex(rOrHex);
        } else if (typeof rOrHex === "number" && typeof g === "undefined" && typeof b === "undefined") {
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
    get average() {
        return Math.trunc((this.r + this.g + this.b) / 3);
    }
    get chroma() {
        return this.max - this.min;
    }
    get cmyk() {
        const r = this.r / 255;
        const g = this.g / 255;
        const b = this.b / 255;
        const k = 1 - Math.max(r, g, b);
        const max = this.max;
        return [
            Math.round((1 - r - k) / max * 100),
            Math.round((1 - g - k) / max * 100),
            Math.round((1 - b - k) / max * 100),
            Math.round(k * 100)
        ];
    }
    get grayscale() {
        const l = Math.trunc(fromLinear(this.luminance) * 255);
        return new Color(l, l, l, this.a);
    }
    get hcg() {
        const chroma = this.chroma;
        return [
            Math.round(this.hue),
            chroma,
            chroma < 1 ? this.min / (1 - chroma) : 0
        ];
    }
    get hex() {
        return `#${Color.toHex(this.r)}${Color.toHex(this.g)}${Color.toHex(this.b)}${Color.toHex(this.a)}`;
    }
    get hsl() {
        const s = this.saturation;
        return [
            Math.round(this.hue),
            Math.trunc(s * 10000 / 100),
            Math.trunc(this.lightness * 10000 / 100)
        ];
    }
    get hsv() {
        const s = this.saturation;
        const l = this.lightness;
        const v = l + s * Math.min(l, 1 - l);
        return [
            Math.round(this.hue),
            !v ? 0 : Math.round(2 * (1 - l / v) * 100),
            Math.round(v * 100)
        ];
    }
    get hue() {
        const max = this.max;
        const c = this.chroma;
        if (!c) return 0;
        const r = this.r / 255;
        const g = this.g / 255;
        const b = this.b / 255;
        const hue = max === r ? (g - b) / c : max === g ? (b - r) / c + 2 : (r - g) / c + 4;
        if (hue < 0) return hue * 60 + 360;
        return hue * 60;
    }
    get invert() {
        return new Color(255 - this.r, 255 - this.g, 255 - this.b, this.a);
    }
    get lab() {
        const [x, y, z] = this.xyz;
        const xxn = labF(x / STANDARD_ILLUMINANT[0]);
        const yyn = labF(y / STANDARD_ILLUMINANT[1]);
        const zzn = labF(z / STANDARD_ILLUMINANT[2]);
        return [
            116 * yyn - 16,
            500 * (xxn - yyn),
            200 * (yyn - zzn)
        ];
    }
    get lightness() {
        return (this.max + this.min) / 2;
    }
    get linearRgb() {
        return [
            toLinear(this.r / 255),
            toLinear(this.g / 255),
            toLinear(this.b / 255)
        ];
    }
    get luminance() {
        const [r, g, b] = this.linearRgb;
        return r * 0.2126 + g * 0.7152 + b * 0.0722;
    }
    get max() {
        return Math.max(this.r, this.g, this.b) / 255;
    }
    get min() {
        return Math.min(this.r, this.g, this.b) / 255;
    }
    get perceivedLightness() {
        const lum = this.luminance;
        if (lum <= 216 / 24389) {
            return lum * (24389 / 27);
        }
        return Math.pow(lum, 1 / 3) * 116 - 16;
    }
    get saturation() {
        const c = this.chroma;
        const l = this.lightness;
        if (!c) return 0;
        return (this.max - l) / Math.min(l, 1 - l);
    }
    get xyz() {
        const [r, g, b] = this.linearRgb;
        const x = 0.4124 * r + 0.3576 * g + 0.1805 * b;
        const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const z = 0.0193 * r + 0.1192 * g + 0.9505 * b;
        return [
            x,
            y,
            z
        ];
    }
    contrast(that) {
        const l1 = this.luminance;
        const l2 = that.luminance;
        return l1 > l2 ? (l1 + 0.5) / (l2 + 0.5) : (l2 + 0.5) / (l1 + 0.5);
    }
    mix(that, percentage = 50) {
        let p = percentage / 100;
        if (p > 1) p = 1;
        else if (p < 0) p = 0;
        const w = p * 2 - 1;
        const a = this.a - that.a;
        const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
        const w2 = 1 - w1;
        const r = Math.round(this.r * w1 + that.r * w2);
        const g = Math.round(this.g * w1 + that.g * w2);
        const b = Math.round(this.b * w1 + that.b * w2);
        const alpha = parseFloat((this.a * p + that.a * (1 - p)).toFixed(8));
        return new Color(r, g, b, alpha);
    }
    shade(weight = 50) {
        return new Color(0, 0, 0, 255).mix(this, weight);
    }
    tint(weight = 50) {
        return new Color(255, 255, 255, 255).mix(this, weight);
    }
    toJSON() {
        return {
            rgba: [
                this.r,
                this.g,
                this.b,
                this.a
            ],
            hcg: this.hcg,
            hsl: this.hsl,
            hsv: this.hsv,
            cmyk: this.cmyk,
            hex: this.a === 255 ? this.hex.slice(0, 7) : this.hex,
            xyz: this.xyz,
            lab: this.lab
        };
    }
    toString() {
        return `rgba(${this.r},${this.g},${this.b},${this.a / 255})`;
    }
    static fromCmyk(c, m, y, k) {
        const divi = 1 - k / 100;
        return new Color(255 * (1 - c / 100) * divi, 255 * (1 - m / 100) * divi, 255 * (1 - y / 100) * divi);
    }
    static fromHex(hex) {
        const [red, green, blue, alpha] = rgbaFromHex(hex);
        return new Color(red, green, blue, alpha);
    }
    static fromHsl(h, s, l) {
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
        return new Color(Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255));
    }
    static fromHsv(h, s, v) {
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
        return new Color(Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255));
    }
    static fromLab(l, a, b) {
        const [x, y, z] = xyzFromLab(l, a, b);
        return Color.fromXyz(x, y, z);
    }
    static fromRgba(r, g, b, a = 255) {
        return new Color(r, g, b, a);
    }
    static fromXyz(x, y, z) {
        const [r, g, b] = rgbFromXyz(x, y, z).map((x)=>Math.round(fromLinear(x) * 255)).map((x)=>x < 0 ? 0 : x > 255 ? 255 : x);
        return new Color(r, g, b);
    }
    static toHex(n) {
        return `${(n | 1 << 8).toString(16).slice(1)}`;
    }
}
function meanDistance(from, to) {
    return (Math.abs(from.r - to.r) + Math.abs(from.g - to.g) + Math.abs(from.b - to.b) + Math.abs(from.a - to.a)) / 255 / 4;
}
function labF(t) {
    if (t > 0.008856451679035631) return Math.cbrt(t);
    return t / (3 * 0.04280618311533888) + 0.13793103448275862;
}
function inverseLabF(t) {
    if (t > 0.008856451679035631) return Math.pow(t, 3);
    return 3 * 0.04280618311533888 * (t - 0.13793103448275862);
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
function rgbFromXyz(x, y, z) {
    return [
        3.2406 * x + -1.5372 * y + -0.4986 * z,
        -0.9689 * x + 1.8758 * y + 0.0415 * z,
        0.0557 * x + -0.2040 * y + 1.0570 * z
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
export { Color as Color, DELTA as DELTA, meanDistance as meanDistance, STANDARD_ILLUMINANT as STANDARD_ILLUMINANT };
class ColorHistogram {
    #data;
    constructor(){
        this.#data = new Uint32Array(32768);
    }
    #getIndex(color) {
        const index = (color.r >> 3 << 10) + (color.g >> 3 << 5) + (color.b >> 3);
        return index;
    }
    get(color) {
        const index = this.#getIndex(color);
        return this.#data[index];
    }
    getQuantized(color) {
        const index = (color[0] << 10) + (color[1] << 5) + color[2];
        return this.#data[index];
    }
    add(color, amount) {
        const index = this.#getIndex(color);
        return Atomics.add(this.#data, index, amount);
    }
    get raw() {
        return this.#data;
    }
    get length() {
        return this.#data.filter((x)=>x).length;
    }
    static getColor(index) {
        const ri = index >> 10;
        const gi = index - (ri << 10) >> 5;
        const bi = index - (ri << 10) - (gi << 5);
        return new Color(ri << 3, gi << 3, bi << 3, 255);
    }
}
function getHistogram(colors) {
    const histo = new ColorHistogram();
    let i = 0;
    while(i < colors.length){
        const hIndex = colors[i];
        histo.add(hIndex, 1);
        i += 1;
    }
    return histo;
}
function getAverageColor(vbox, histo) {
    let total = 0;
    let totalR = 0, totalG = 0, totalB = 0;
    let ri = vbox.r.min;
    while(ri <= vbox.r.max){
        let gi = vbox.g.min;
        while(gi <= vbox.g.max){
            let bi = vbox.b.min;
            while(bi <= vbox.b.max){
                const count = histo.getQuantized([
                    ri,
                    gi,
                    bi
                ]) || 0;
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
        return new Color(~~(totalR / total), ~~(totalG / total), ~~(totalB / total), 255);
    }
    return new Color(Math.trunc(8 * (vbox.r.min + vbox.r.max + 1) / 2), Math.trunc(8 * (vbox.g.min + vbox.g.max + 1) / 2), Math.trunc(8 * (vbox.b.min + vbox.b.max + 1) / 2), 255);
}
function getColorRange(colors) {
    const range = {
        r: {
            min: 1000,
            max: 0
        },
        g: {
            min: 1000,
            max: 0
        },
        b: {
            min: 1000,
            max: 0
        }
    };
    let i = 0;
    while(i < colors.length){
        if (colors[i].r >> 3 < range.r.min) range.r.min = colors[i].r >> 3;
        if (colors[i].r >> 3 > range.r.max) range.r.max = colors[i].r >> 3;
        if (colors[i].g >> 3 < range.g.min) range.g.min = colors[i].g >> 3;
        if (colors[i].g >> 3 > range.g.max) range.g.max = colors[i].g >> 3;
        if (colors[i].b >> 3 < range.b.min) range.b.min = colors[i].b >> 3;
        if (colors[i].b >> 3 > range.b.max) range.b.max = colors[i].b >> 3;
        i += 1;
    }
    return range;
}
function quantizeByMedianCut(palette, extractCount) {
    const vbox = getColorRange(palette);
    const histo = getHistogram(palette);
    return quantize(vbox, histo, extractCount);
}
function quantizeByPopularity(palette, extractCount) {
    const histo = getHistogram(palette);
    const result = [];
    histo.raw.forEach((v, i)=>{
        if (v) result.push([
            i,
            v
        ]);
    });
    result.sort((a, b)=>b[1] - a[1]);
    const res = [];
    for (const i of result.slice(0, extractCount)){
        res.push(ColorHistogram.getColor(i[0]));
    }
    return res;
}
export { fromLinear as fromLinear, toLinear as toLinear };
export { quantizeByMedianCut as quantizeByMedianCut, quantizeByPopularity as quantizeByPopularity };
function quantize(vbox, histo, extractCount) {
    const vboxes = [
        vbox
    ];
    let i = 0;
    const firstExtractCount = ~~(extractCount >> 1);
    let generated = 1;
    while(i < 1000){
        const lastBox = vboxes.shift();
        if (!lastBox) break;
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
    vboxes.sort((a, b)=>vboxSize(b, histo) * vboxVolume(b) - vboxSize(a, histo) * vboxVolume(a));
    const secondExtractCount = extractCount - vboxes.length;
    i = 0;
    generated = 0;
    while(i < 1000){
        const lastBox = vboxes.shift();
        if (!lastBox) break;
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
    vboxes.sort((a, b)=>vboxSize(b, histo) - vboxSize(a, histo));
    return vboxes.map((x)=>getAverageColor(x, histo)).slice(0, extractCount);
}
function vboxSize(vbox, histo) {
    let count = 0;
    let ri = vbox.r.min;
    while(ri <= vbox.r.max){
        let gi = vbox.g.min;
        while(gi <= vbox.g.max){
            let bi = vbox.b.min;
            while(bi <= vbox.b.max){
                count += histo.get(new Color(ri, gi, bi, 255)) || 0;
                bi += 1;
            }
            gi += 1;
        }
        ri += 1;
    }
    return count;
}
function vboxVolume(vbox) {
    return ~~(vbox.r.max - vbox.r.min) * ~~(vbox.g.max - vbox.g.min) * ~~(vbox.b.max - vbox.b.min);
}
function medianCutApply(vbox, histo) {
    const count = vboxSize(vbox, histo);
    if (!count || count === 1) return false;
    const rw = vbox.r.max - vbox.r.min + 1;
    const gw = vbox.g.max - vbox.g.min + 1;
    const bw = vbox.b.max - vbox.b.min + 1;
    const axis = Math.max(rw, gw, bw);
    const sumAlongAxis = [];
    let totalSum = 0;
    switch(axis){
        case rw:
            {
                let i = vbox.r.min;
                while(i <= vbox.r.max){
                    let tempSum = 0;
                    let j = vbox.g.min;
                    while(j < vbox.g.max){
                        let k = vbox.b.min;
                        while(k < vbox.b.max){
                            tempSum += histo.getQuantized([
                                i,
                                j,
                                k
                            ]) || 0;
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
        case gw:
            {
                let i = vbox.g.min;
                while(i <= vbox.g.max){
                    let tempSum = 0;
                    let j = vbox.r.min;
                    while(j < vbox.r.max){
                        let k = vbox.b.min;
                        while(k < vbox.b.max){
                            tempSum += histo.getQuantized([
                                j,
                                i,
                                k
                            ]) || 0;
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
        default:
            {
                let i = vbox.b.min;
                while(i <= vbox.b.max){
                    let tempSum = 0;
                    let j = vbox.r.min;
                    while(j < vbox.r.max){
                        let k = vbox.g.min;
                        while(k < vbox.g.max){
                            tempSum += histo.getQuantized([
                                j,
                                k,
                                i
                            ]) || 0;
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
    switch(axis){
        case rw:
            {
                let i = vbox.r.min;
                while(i <= vbox.r.max){
                    if (sumAlongAxis[i] < totalSum / 2) {
                        let cutAt = 0;
                        const vbox1 = {
                            r: {
                                min: vbox.r.min,
                                max: vbox.r.max
                            },
                            g: {
                                min: vbox.g.min,
                                max: vbox.g.max
                            },
                            b: {
                                min: vbox.b.min,
                                max: vbox.b.max
                            }
                        };
                        const vbox2 = {
                            r: {
                                min: vbox.r.min,
                                max: vbox.r.max
                            },
                            g: {
                                min: vbox.g.min,
                                max: vbox.g.max
                            },
                            b: {
                                min: vbox.b.min,
                                max: vbox.b.max
                            }
                        };
                        const left = i - vbox.r.min;
                        const right = vbox.r.max - i;
                        if (left <= right) {
                            cutAt = Math.min(vbox.r.max - 1, Math.trunc(i + right / 2));
                        } else cutAt = Math.max(vbox.r.min, Math.trunc(i - 1 - left / 2));
                        while(!sumAlongAxis[cutAt])cutAt += 1;
                        vbox1.r.max = cutAt;
                        vbox2.r.min = cutAt + 1;
                        return [
                            vbox1,
                            vbox2
                        ];
                    }
                    i += 1;
                }
                break;
            }
        case gw:
            {
                let i = vbox.g.min;
                while(i <= vbox.g.max){
                    if (sumAlongAxis[i] < totalSum / 2) {
                        let cutAt = 0;
                        const vbox1 = {
                            r: {
                                min: vbox.r.min,
                                max: vbox.r.max
                            },
                            g: {
                                min: vbox.g.min,
                                max: vbox.g.max
                            },
                            b: {
                                min: vbox.b.min,
                                max: vbox.b.max
                            }
                        };
                        const vbox2 = {
                            r: {
                                min: vbox.r.min,
                                max: vbox.r.max
                            },
                            g: {
                                min: vbox.g.min,
                                max: vbox.g.max
                            },
                            b: {
                                min: vbox.b.min,
                                max: vbox.b.max
                            }
                        };
                        const left = i - vbox.g.min;
                        const right = vbox.g.max - i;
                        if (left <= right) {
                            cutAt = Math.min(vbox.g.max - 1, Math.trunc(i + right / 2));
                        } else cutAt = Math.max(vbox.g.min, Math.trunc(i - 1 - left / 2));
                        while(!sumAlongAxis[cutAt])cutAt += 1;
                        vbox1.g.max = cutAt;
                        vbox2.g.min = cutAt + 1;
                        return [
                            vbox1,
                            vbox2
                        ];
                    }
                    i += 1;
                }
                break;
            }
        default:
            {
                let i = vbox.b.min;
                while(i <= vbox.b.max){
                    if (sumAlongAxis[i] < totalSum / 2) {
                        let cutAt = 0;
                        const vbox1 = {
                            r: {
                                min: vbox.r.min,
                                max: vbox.r.max
                            },
                            g: {
                                min: vbox.g.min,
                                max: vbox.g.max
                            },
                            b: {
                                min: vbox.b.min,
                                max: vbox.b.max
                            }
                        };
                        const vbox2 = {
                            r: {
                                min: vbox.r.min,
                                max: vbox.r.max
                            },
                            g: {
                                min: vbox.g.min,
                                max: vbox.g.max
                            },
                            b: {
                                min: vbox.b.min,
                                max: vbox.b.max
                            }
                        };
                        const left = i - vbox.b.min;
                        const right = vbox.b.max - i;
                        if (left <= right) {
                            cutAt = Math.min(vbox.b.max - 1, Math.trunc(i + right / 2));
                        } else cutAt = Math.max(vbox.b.min, Math.trunc(i - 1 - left / 2));
                        while(!sumAlongAxis[cutAt])cutAt += 1;
                        vbox1.b.max = cutAt;
                        vbox2.b.min = cutAt + 1;
                        return [
                            vbox1,
                            vbox2
                        ];
                    }
                    i += 1;
                }
                break;
            }
    }
    return false;
}
