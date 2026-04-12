import { Decimal } from "../config/decimal";

export const D = (value: Decimal.Value): Decimal => new Decimal(value);

export const quantize = (value: Decimal): Decimal => value.toDecimalPlaces(8, Decimal.ROUND_HALF_UP);

export const asAmountString = (value: Decimal): string => quantize(value).toFixed(8);
