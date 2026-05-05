import { Decimal } from "../../config/decimal";

// ---------------------------------------------------------------------------
// Shared value types
// ---------------------------------------------------------------------------

/**
 * A snapshot of an athlete token's market at the moment a bot tick fires.
 * Passed to every Strategy.tick() call — strategies must not perform their
 * own DB reads, keeping them pure and independently testable.
 */
export type MarketState = {
  athleteId: string;
  currentPrice: Decimal;
  currentSupply: Decimal;
  poolBalance: Decimal;
  /** Most-recent price history points, oldest first. */
  recentPrices: Decimal[];
};

/**
 * The signal a strategy emits after evaluating the market.
 * direction: which side of the market to trade.
 * amount:    INR amount for BUY, token amount for SELL.
 * rationale: human-readable explanation — useful for the leaderboard and logs.
 */
export type TradeSignal = {
  direction: "BUY" | "SELL";
  amount: Decimal;
  rationale: string;
};

// ---------------------------------------------------------------------------
// Strategy interface — Open/Closed Principle
//
// BotRunner calls tick() polymorphically. Adding a new strategy means
// implementing this interface and registering it in BotFactory — the runner
// and all existing strategies are never touched.
// ---------------------------------------------------------------------------

export interface IStrategy {
  /**
   * Evaluate the current market state and return a trade signal, or null if
   * the strategy decides to sit this tick out (e.g. cooldown, no clear signal).
   */
  tick(state: MarketState): TradeSignal | null;
}
