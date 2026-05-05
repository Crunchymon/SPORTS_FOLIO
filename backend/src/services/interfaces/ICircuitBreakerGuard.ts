import { Decimal } from "../../config/decimal";

/**
 * Dependency Inversion Principle — TradeService depends on this abstraction,
 * not on the concrete CircuitBreakerGuard. This allows a NullCircuitBreakerGuard
 * (or any future guard) to be injected without touching TradeService.
 */
export interface ICircuitBreakerGuard {
  /**
   * Throws ApiError(423) if trading is paused for the given athlete.
   */
  assertMarketOpen(athleteId: string): Promise<void>;

  /**
   * Throws ApiError(400) if the trade amount exceeds the max-trade-size cap
   * (configured as a % of current pool balance).
   */
  assertMaxTradeSize(amountInr: Decimal, poolBalance: Decimal): void;

  /**
   * Throws ApiError(400) if selling the given proceeds would drain more than
   * the configured % of the pool. Returns the max allowed sell amount in the
   * error detail so the client can immediately retry with a valid amount.
   */
  assertPoolDrainOrThrow(
    sellProceeds: Decimal,
    poolBalance: Decimal,
    currentSupply: Decimal,
    kConstant: Decimal
  ): void;
}
