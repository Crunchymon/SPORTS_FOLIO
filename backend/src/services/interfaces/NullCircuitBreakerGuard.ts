import { Decimal } from "../../config/decimal";
import { ICircuitBreakerGuard } from "./ICircuitBreakerGuard";

/**
 * Null Object Pattern — a no-op implementation of ICircuitBreakerGuard.
 *
 * All guard checks pass unconditionally. Useful in:
 *   - Unit tests where market-guard logic is not under test
 *   - Seed scripts that need to bypass circuit breakers
 *   - Local development with KYC_REQUIRED=false
 *
 * Injecting this instead of the real guard lets tests exercise TradeService
 * in isolation without spinning up Redis or seeding pool-balance thresholds.
 */
export class NullCircuitBreakerGuard implements ICircuitBreakerGuard {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async assertMarketOpen(_athleteId: string): Promise<void> {
    // no-op
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public assertMaxTradeSize(_amountInr: Decimal, _poolBalance: Decimal): void {
    // no-op
  }

  public assertPoolDrainOrThrow(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _sellProceeds: Decimal,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _poolBalance: Decimal,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _currentSupply: Decimal,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _kConstant: Decimal
  ): void {
    // no-op
  }
}
