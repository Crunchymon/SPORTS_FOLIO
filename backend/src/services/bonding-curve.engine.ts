import { Decimal } from "../config/decimal";
import { D } from "../utils/decimal";

const BASE_POOL_RATIO = D("0.10");
const POOL_RATIO_RANGE = D("0.89");

export class BondingCurveEngine {
  constructor(
    private readonly k: Decimal,
    private readonly pMid: Decimal
  ) {}

  public calculatePrice(supply: Decimal): Decimal {
    return this.k.mul(supply.pow(2));
  }

  public calculatePoolRatio(price: Decimal): Decimal {
    if (price.lte(0)) {
      return BASE_POOL_RATIO;
    }

    return BASE_POOL_RATIO.add(POOL_RATIO_RANGE.mul(price.div(price.add(this.pMid))));
  }

  public calculateBuyCost(s1: Decimal, s2: Decimal): Decimal {
    return this.k.mul(s2.pow(3).sub(s1.pow(3))).div(3);
  }

  public calculateSellProceeds(s2: Decimal, s1: Decimal): Decimal {
    return this.k.mul(s2.pow(3).sub(s1.pow(3))).div(3);
  }

  public solveSupplyAfterBuy(s1: Decimal, amountInr: Decimal): Decimal {
    const inside = s1.pow(3).add(amountInr.mul(3).div(this.k));
    return inside.cbrt();
  }

  public solveSupplyAfterSell(s2: Decimal, proceedsInr: Decimal): Decimal {
    const inside = s2.pow(3).sub(proceedsInr.mul(3).div(this.k));

    if (inside.lt(0)) {
      return D(0);
    }

    return inside.cbrt();
  }

  public integrateTransaction(s1: Decimal, s2: Decimal, steps = 1000): {
    poolDeposit: Decimal;
    donation: Decimal;
    totalCost: Decimal;
  } {
    if (steps <= 0) {
      throw new Error("steps must be greater than 0");
    }

    if (s2.lte(s1)) {
      return {
        poolDeposit: D(0),
        donation: D(0),
        totalCost: D(0)
      };
    }

    let poolDeposit = D(0);
    let donation = D(0);
    let totalCost = D(0);

    const ds = s2.sub(s1).div(steps);

    for (let i = 0; i < steps; i += 1) {
      const midpoint = s1.add(ds.mul(i).add(ds.div(2)));
      const priceStep = this.calculatePrice(midpoint);
      const costStep = priceStep.mul(ds);
      const ratioStep = this.calculatePoolRatio(priceStep);

      poolDeposit = poolDeposit.add(costStep.mul(ratioStep));
      donation = donation.add(costStep.mul(D(1).sub(ratioStep)));
      totalCost = totalCost.add(costStep);
    }

    return {
      poolDeposit,
      donation,
      totalCost
    };
  }
}
