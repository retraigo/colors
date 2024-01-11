import { invertLinear, invertValue, string, rgbaFromHex, invert } from "../mod.ts";
import { createCanvas } from "https://deno.land/x/skia_canvas@0.5.5/mod.ts";

const i = createCanvas(300, 100);

const ctx = i.getContext("2d");
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.font = "10px 900 Arial";

const c = rgbaFromHex("#493929");
ctx.fillStyle = string(c);
ctx.fillRect(0, 0, 100, 100);

ctx.fillStyle = "black";
ctx.fillText(`Normal`, 50, 50, 100);

const inv = invertLinear(c);
ctx.fillStyle = string(inv);
ctx.fillRect(100, 0, 200, 100);

ctx.fillStyle = "black";
ctx.fillText(`Linear Invert`, 100 + 50, 50, 100);

const inv2 = invert(c);
ctx.fillStyle = string(inv2);
ctx.fillRect(200, 0, 300, 100);

ctx.fillStyle = "black";
ctx.fillText(`Value Invert`, 200 + 50, 50, 100);

i.save(`examples/invert.png`, "png");
