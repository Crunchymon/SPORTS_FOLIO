import { Decimal } from "../config/decimal";
import { env } from "../config/env";
import { redis } from "../lib/redis";
import { D, asAmountString } from "../utils/decimal";
import { ApiError } from "../utils/errors";

export class CircuitBreakerGuard {
  private readonly maxTradePct = D(env.MAX_TRADE_SIZE_PCT).div(100);
  private readonly poolDrainPct = D(env.POOL_DRAIN_GUARD_PCT).div(100);

  public async assertMarketOpen(athleteId: string): Promise<void> {
    const key = `market:paused:${athleteId}`;
    const isPaused = await redis.get(key);

    if (isPaused) {
      throw new ApiError(423, "Trading paused for this athlete");
    }
  }

  public assertMaxTradeSize(amountInr: Decimal, poolBalance: Decimal): void {
    if (poolBalance.lte(0)) {
      return;
    }

    const maxAllowed = poolBalance.mul(this.maxTradePct);

    if (amountInr.gt(maxAllowed)) {
      throw new ApiError(400, "Max trade size exceeded", {
        max_allowed_trade_amount: asAmountString(maxAllowed)
      });
    }
  }

  public assertPoolDrainOrThrow(
    sellProceeds: Decimal,
    poolBalance: Decimal,
    currentSupply: Decimal,
    kConstant: Decimal
  ): void {
    const maxDrain = poolBalance.mul(this.poolDrainPct);

    if (sellProceeds.lte(maxDrain)) {
      return;
    }

    const inside = currentSupply.pow(3).sub(maxDrain.mul(3).div(kConstant));
    const newSupply = inside.gte(0) ? inside.cbrt() : D(0);
    const maxAllowedSell = currentSupply.sub(newSupply);

    throw new ApiError(400, "Pool drain guard triggered", {
      max_allowed_sell: asAmountString(maxAllowedSell)
    });
  }
}
