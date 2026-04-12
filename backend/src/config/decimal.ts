import Decimal from "decimal.js";
import { env } from "./env";

Decimal.set({
  precision: env.DECIMAL_PRECISION,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 30
});

export { Decimal };
