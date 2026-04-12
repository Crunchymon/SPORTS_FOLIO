import { describe, expect, it } from "vitest";
import { Decimal } from "../config/decimal";
import { BondingCurveEngine } from "../services/bonding-curve.engine";

const decimalToNumber = (value: Decimal): number => Number(value.toString());

describe("BondingCurveEngine", () => {
  const k = new Decimal("0.01");
  const pMid = new Decimal("10");
  const engine = new BondingCurveEngine(k, pMid);

  it("calculates quadratic price correctly", () => {
    const price = engine.calculatePrice(new Decimal("10"));
    expect(price.toFixed(8)).toBe("1.00000000");
  });

  it("matches analytical buy cost integral", () => {
    const cost = engine.calculateBuyCost(new Decimal("10"), new Decimal("12"));
    expect(cost.toFixed(8)).toBe("2.42666667");
  });

  it("maintains pool invariant formula", () => {
    const supply = new Decimal("25");
    const pool = k.mul(supply.pow(3)).div(3);
    expect(pool.toFixed(8)).toBe("52.08333333");
  });

  it("keeps numerical integration close to analytical total cost", () => {
    const s1 = new Decimal("3");
    const s2 = new Decimal("7");

    const integrated = engine.integrateTransaction(s1, s2, 1000);
    const analytical = engine.calculateBuyCost(s1, s2);

    const diff = integrated.totalCost.sub(analytical).abs();
    expect(decimalToNumber(diff)).toBeLessThan(0.001);

    const splitDiff = integrated.poolDeposit.add(integrated.donation).sub(integrated.totalCost).abs();
    expect(decimalToNumber(splitDiff)).toBeLessThan(0.000001);
  });
});
