export {
  Color,
  DELTA,
  meanDistance,
  STANDARD_ILLUMINANT,
} from "./src/color.ts";

export { fromLinear, toLinear } from "./src/util/linear.ts";

export {
  quantizeByMedianCut,
  quantizeByPopularity,
} from "./src/quantize/mod.ts";
