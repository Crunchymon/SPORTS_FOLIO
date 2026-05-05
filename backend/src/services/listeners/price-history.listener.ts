import { Prisma } from "@prisma/client";
import { MarketEventBus, TradeCompletedPayload } from "../../lib/market-event-bus";
import { prisma } from "../../lib/prisma";

/**
 * Observer Pattern — PriceHistoryListener
 *
 * Subscribes to "trade:completed" events emitted by the MarketEventBus.
 * Writes a PriceHistory row for every completed trade, recording the post-
 * trade price and timestamp.
 *
 * Before this pattern was introduced, this write lived inside TradeService —
 * coupling trade orchestration to price-history persistence. Now TradeService
 * simply emits an event and has zero knowledge of this listener. Adding or
 * removing price-history logging never requires touching the trade path.
 *
 * This write is intentionally outside the trade transaction. Price history is
 * a derived audit record, not a core financial invariant. Eventual consistency
 * is acceptable: the worst case is a single missing chart point, which the
 * nightly reconciliation would flag.
 */
export class PriceHistoryListener {
  public register(bus: MarketEventBus): void {
    bus.onTradeCompleted(async ({ athleteId, newPrice }: TradeCompletedPayload) => {
      try {
        await prisma.priceHistory.create({
          data: {
            athleteId,
            sampledAt: new Date(),
            price: new Prisma.Decimal(newPrice.toString())
          }
        });
      } catch (err) {
        // Log and continue — a missed price point must never crash the server
        // or affect the already-committed trade.
        console.error("[PriceHistoryListener] Failed to write price point", err);
      }
    });
  }
}
