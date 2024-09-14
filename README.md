# colors

Color conversion, shade/tint generation, color quantization, and more in TypeScript

**Note: All methods either accept RGB/RGBA colors as parameters or give RGB/RGBA colors as results. In order to work with other color spaces (eg. XYZ), convert them to RGB first.**

## Installation

If you are using NodeJS, an extra installation step is required.

```sh
# NPM
$ npx jsr add @retraigo/colors
# PNPM
$ pnpm dlx jsr add @retraigo/colors
```

## Usage

For browser usage, use a bundler.

For Node/Deno usage, refer below.

```ts
// Deno /x
import { rgbaFromHex, xyz, lab } from "https://deno.land/x/colors/mod.ts";

// Deno JSR
import { rgbaFromHex, xyz, lab } from "jsr:@retraigo/colors";

// Node JSR (after installation)
import { rgbaFromHex, xyz, lab } from "jsr:@retraigo/colors";

const color = rgbaFromHex("#fceff1");

// CIE XYZ color space
console.log(xyz(color));

// CIE LAB color space
console.log(lab(color));

// Conversion of color into all supported spaces
console.log(json(color));
```

Refer [https://jsr.io/@retraigo/colors] for documentation.
