import { D } from "../../utils/decimal";
import { IStrategy, MarketState, TradeSignal } from "./IStrategy";

export type MeanReversionConfig = {
  /** Number of recent prices used to compute the rolling average. Default: 10. */
  windowSize: number;
  /**
   * Deviation threshold as a fraction of the mean (e.g. 0.05 = 5%).
   * A signal is only emitted when the current price deviates by at least
   * this much from the rolling average. Default: 0.05.
   */
  deviationThreshold: number;
  /** Fixed INR trade size for BUY signals. */
  tradeSize: number;
};

/**
 * Strategy Pattern — MeanReversionStrategy (concrete implementation of IStrategy)
 *
 * Logic: compute the rolling average of the last `windowSize` prices.
 *   - current price < avg × (1 - threshold)  → BUY  (price is cheap vs. mean)
 *   - current price > avg × (1 + threshold)  → SELL (price is expensive vs. mean)
 *   - otherwise                              → null (price is within normal range)
 *
 * Rationale: bonding curve prices are deterministically tied to supply. Without
 * external demand shocks a "fair" price exists around the rolling mean. This
 * strategy bets that short-term deviations revert — providing liquidity when
 * prices dip and taking profit when prices spike. It anchors the market near
 * fundamental value and dampens volatility from momentum or noise bots.
 */
export class MeanReversionStrategy implements IStrategy {
  private readonly config: MeanReversionConfig;

  constructor(config: Partial<MeanReversionConfig> = {}) {
    this.config = {
      windowSize: config.windowSize ?? 10,
      deviationThreshold: config.deviationThreshold ?? 0.05,
      tradeSize: config.tradeSize ?? 100
    };
  }

  public tick(state: MarketState): TradeSignal | null {
    const window = state.recentPrices.slice(-this.config.windowSize);

    if (window.length < 2) {
      return null;
    }

    const sum = window.reduce((acc, p) => acc.add(p), D(0));
    const avg = sum.div(window.length);

    if (avg.lte(0)) {
      return null;
    }

    const deviation = D(this.config.deviationThreshold);
    const lowerBound = avg.mul(D(1).sub(deviation));
    const upperBound = avg.mul(D(1).add(deviation));
    const current = state.currentPrice;
    const tradeSize = D(this.config.tradeSize);

    if (current.lt(lowerBound)) {
      return {
        direction: "BUY",
        amount: tradeSize,
        rationale: `Mean reversion BUY: price ${current.toFixed(4)} is ${deviation.mul(100).toFixed(1)}%+ below rolling avg ${avg.toFixed(4)}`
      };
    }

    if (current.gt(upperBound)) {
      const estimatedSellTokens = D("0.01");
      return {
        direction: "SELL",
        amount: estimatedSellTokens,
        rationale: `Mean reversion SELL: price ${current.toFixed(4)} is ${deviation.mul(100).toFixed(1)}%+ above rolling avg ${avg.toFixed(4)}`
      };
    }

    return null;
  }
}
