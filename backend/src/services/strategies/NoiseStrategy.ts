import { D } from "../../utils/decimal";
import { IStrategy, MarketState, TradeSignal } from "./IStrategy";

export type NoiseConfig = {
  /** Probability (0–1) of emitting any signal on a given tick. Default: 0.4. */
  activityRate: number;
  /** Min INR amount (or token amount) per trade. Default: 10. */
  minAmount: number;
  /** Max INR amount (or token amount) per trade. Default: 200. */
  maxAmount: number;
};

/**
 * Strategy Pattern — NoiseStrategy (concrete implementation of IStrategy)
 *
 * Logic: on each tick, decide randomly whether to trade (controlled by
 * `activityRate`). If trading, pick a random direction and a random amount
 * within [minAmount, maxAmount].
 *
 * Rationale: real markets always have some fraction of participants making
 * irrational or uninformed trades. In a thin market (few athletes, early
 * stage) without noise traders the price chart would be perfectly smooth and
 * unappealing — it would look fake. Noise bots simulate organic market chaos,
 * keep charts alive between real-investor trades, and stress-test the circuit
 * breakers and idempotency system under randomised load.
 *
 * Noise bots are excluded from circuit-breaker triggers by design (they are
 * market-makers, not manipulators) but they do consume the same trade path,
 * so all financial invariants are verified on every noise trade.
 */
export class NoiseStrategy implements IStrategy {
  private readonly config: NoiseConfig;

  constructor(config: Partial<NoiseConfig> = {}) {
    this.config = {
      activityRate: config.activityRate ?? 0.4,
      minAmount: config.minAmount ?? 10,
      maxAmount: config.maxAmount ?? 200
    };
  }

  public tick(_state: MarketState): TradeSignal | null {
    // Sit out this tick based on activity rate
    if (Math.random() > this.config.activityRate) {
      return null;
    }

    const direction: "BUY" | "SELL" = Math.random() > 0.5 ? "BUY" : "SELL";
    const range = this.config.maxAmount - this.config.minAmount;
    const rawAmount = this.config.minAmount + Math.random() * range;
    const amount = D(rawAmount.toFixed(2));

    return {
      direction,
      amount,
      rationale: `Noise ${direction}: random trade of ${amount.toFixed(2)}`
    };
  }
}
