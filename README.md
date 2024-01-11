# colors

Color conversion, shade/tint generation, color quantization, and more in TypeScript

**Note: All methods either accept RGB/RGBA colors as parameters or give RGB/RGBA colors as results. In order to work with other color spaces (eg. XYZ), convert them to RGB first.**

## Usage

```ts
// Deno
import { rgbaFromHex, xyz, lab } from "https://deno.land/x/colors/mod.ts";

// Web
import { rgbaFromHex, xyz, lab } from "https://deno.land/x/colors/dist/color.js";

const color = rgbaFromHex("#fceff1");

// CIE XYZ color space
console.log(xyz(color));

// CIE LAB color space
console.log(lab(color));

// Conversion of color into all supported spaces
console.log(json(color));
```

Refer [https://deno.land/x/colors/mod.ts] for documentation.
