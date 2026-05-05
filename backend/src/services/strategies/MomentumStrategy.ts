import { D } from "../../utils/decimal";
import { IStrategy, MarketState, TradeSignal } from "./IStrategy";

export type MomentumConfig = {
  /** How many trailing price points to examine. Default: 5. */
  lookback: number;
  /** Minimum consecutive moves in the same direction to trigger. Default: 3. */
  consecutiveThreshold: number;
  /** Fixed INR trade size per tick. */
  tradeSize: number;
};

/**
 * Strategy Pattern — MomentumStrategy (concrete implementation of IStrategy)
 *
 * Logic: examine the last `lookback` prices. If at least
 * `consecutiveThreshold` consecutive intervals are all rising → BUY.
 * If all falling → SELL. Otherwise sit out.
 *
 * Rationale: momentum strategies amplify genuine price trends. They are
 * well-suited to bonding curve markets because a sustained buying wave
 * mathematically pushes price upward on every trade — the curve creates the
 * very momentum this strategy exploits.
 */
export class MomentumStrategy implements IStrategy {
  private readonly config: MomentumConfig;

  constructor(config: Partial<MomentumConfig> = {}) {
    this.config = {
      lookback: config.lookback ?? 5,
      consecutiveThreshold: config.consecutiveThreshold ?? 3,
      tradeSize: config.tradeSize ?? 100
    };
  }

  public tick(state: MarketState): TradeSignal | null {
    const prices = state.recentPrices.slice(-this.config.lookback);

    if (prices.length < 2) {
      return null; // Not enough history yet
    }

    let consecutiveRises = 0;
    let consecutiveFalls = 0;

    for (let i = 1; i < prices.length; i++) {
      if (prices[i].gt(prices[i - 1])) {
        consecutiveRises++;
        consecutiveFalls = 0;
      } else if (prices[i].lt(prices[i - 1])) {
        consecutiveFalls++;
        consecutiveRises = 0;
      } else {
        consecutiveRises = 0;
        consecutiveFalls = 0;
      }
    }

    const tradeSize = D(this.config.tradeSize);

    if (consecutiveRises >= this.config.consecutiveThreshold) {
      return {
        direction: "BUY",
        amount: tradeSize,
        rationale: `Momentum BUY: ${consecutiveRises} consecutive price rises detected`
      };
    }

    if (consecutiveFalls >= this.config.consecutiveThreshold) {
      // For a SELL signal, amount is expressed in tokens: use pool-balance
      // heuristic — sell a small fraction of estimated holdings.
      const estimatedSellTokens = D("0.01");
      return {
        direction: "SELL",
        amount: estimatedSellTokens,
        rationale: `Momentum SELL: ${consecutiveFalls} consecutive price falls detected`
      };
    }

    return null; // No clear momentum signal
  }
}
