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
            if (!/^#([A-Fa-f0-9]{3}){1,2}([A-Fa-f0-9]{2})?$/.test(rOrHex)) {
                throw new TypeError(`Expected number or hex code. Got ${rOrHex}`);
            }
            let colors = rOrHex.slice(1).split("");
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
            red = parseInt(`${colors[0]}${colors[1]}`, 16) || 0;
            green = parseInt(`${colors[2]}${colors[3]}`, 16) || 0;
            blue = parseInt(`${colors[4]}${colors[5]}`, 16) || 0;
            if (colors[6] && colors[7]) {
                alpha = parseInt(`${colors[6]}${colors[7]}`, 16) ?? 255;
            }
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
export { Color as Color, DELTA as DELTA, meanDistance as meanDistance, STANDARD_ILLUMINANT as STANDARD_ILLUMINANT };
export { fromLinear as fromLinear, toLinear as toLinear };
