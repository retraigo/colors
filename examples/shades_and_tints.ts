import { shade, tint, string, rgbaFromHex } from "../mod.ts";
import { createCanvas } from "https://deno.land/x/skia_canvas@0.5.5/mod.ts";

const i = createCanvas(550, 100);

const ctx = i.getContext("2d");
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.font = "10px 900 Arial";

const c = rgbaFromHex("#e3242b");

for (let i = 0; i < 11; ++i) {
  const s = shade(c, i * 10);
  ctx.fillStyle = string(s);
  ctx.fillRect(i * 50, 0, 50, 50);

  ctx.fillStyle = "white";
  ctx.fillText(`${i * 10}%`, i * 50 + 25, 25, 50);

  const t = tint(c, i * 10);
  ctx.fillStyle = string(t);
  ctx.fillRect(i * 50, 50, 50, 50);
  ctx.fillStyle = "black";
  ctx.fillText(`${i * 10}%`, i * 50 + 25, 75, 50);
}

i.save(`examples/shades_and_tints.png`, "png");
