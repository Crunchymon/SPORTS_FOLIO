import { EventEmitter } from "events";
import { Decimal } from "../config/decimal";

// ---------------------------------------------------------------------------
// Event payload types
// ---------------------------------------------------------------------------

export type TradeCompletedPayload = {
  tradeId: string;
  athleteId: string;
  investorId: string;
  type: "BUY" | "SELL";
  newPrice: Decimal;
  newSupply: Decimal;
};

// ---------------------------------------------------------------------------
// Typed event map — keeps emitter calls and listener signatures in sync
// ---------------------------------------------------------------------------

type MarketEvents = {
  "trade:completed": [payload: TradeCompletedPayload];
};

// ---------------------------------------------------------------------------
// MarketEventBus — Observer Pattern
//
// TradeService is the Subject. It emits events after each completed trade.
// Listeners (PriceHistoryListener, future WebSocketServer, LeaderboardService,
// etc.) are the Observers. They subscribe here at startup and react to events
// without TradeService knowing they exist.
//
// Using Node's built-in EventEmitter keeps this dependency-free. Any number
// of subscribers can be added by calling bus.onTradeCompleted() in server.ts
// — TradeService never needs to be touched.
// ---------------------------------------------------------------------------

export class MarketEventBus extends EventEmitter {
  public emitTradeCompleted(payload: TradeCompletedPayload): void {
    this.emit("trade:completed", payload);
  }

  public onTradeCompleted(
    listener: (payload: TradeCompletedPayload) => void
  ): this {
    return this.on("trade:completed", listener);
  }
}

// Singleton — one bus for the entire process lifetime.
export const marketEventBus = new MarketEventBus();

// Silence unhandled-listener warnings during development (EventEmitter default
// is 10; a real system with many subscribers can exceed this).
marketEventBus.setMaxListeners(50);

// Satisfy TypeScript's strict event typing without casting at every call site.
export declare interface MarketEventBus {
  emit<K extends keyof MarketEvents>(
    event: K,
    ...args: MarketEvents[K]
  ): boolean;
  on<K extends keyof MarketEvents>(
    event: K,
    listener: (...args: MarketEvents[K]) => void
  ): this;
}
