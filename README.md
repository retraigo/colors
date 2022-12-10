# colors

Color conversion and stuff in TypeScript

## Usage

```ts
// Deno
import { Color } from "https://deno.land/x/colors/mod.ts";

// Web
import { Color } from "https://deno.land/x/colors/dist/color.js";

const color = new Color("#fceff1");

// Grayscale version of color
console.log(color.grayscale);

// CIE XYZ color space
console.log(color.xyz);

// CIE LAB color space
console.log(color.lab);

// Conversion of color into all supported spaces
console.log(color.toJSON());
```

Refer [https://deno.land/x/colors/mod.ts] for documentation.