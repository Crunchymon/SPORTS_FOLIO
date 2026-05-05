import "./config/decimal";
import { app } from "./api/app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { redis } from "./lib/redis";
import { marketEventBus } from "./lib/market-event-bus";
import { startTradeWorker } from "./jobs/trade.queue";
import { TradeService } from "./services/trade.service";
import { CircuitBreakerGuard } from "./services/circuit-breaker.guard";
import { PriceHistoryListener } from "./services/listeners/price-history.listener";
import { BotService } from "./services/bot.service";
import { BotScheduler } from "./jobs/bot.scheduler";

// ---------------------------------------------------------------------------
// Dependency wiring — all object construction and observer registration
// happens here at startup, keeping individual modules free of hard deps.
// ---------------------------------------------------------------------------

// Observer Pattern — register all MarketEventBus listeners before the first
// trade can arrive. New listeners (WebSocket, Leaderboard, Analytics) are
// added here without touching any other file.
new PriceHistoryListener().register(marketEventBus);

// Dependency Inversion — CircuitBreakerGuard is the concrete implementation
// of ICircuitBreakerGuard. Swap for NullCircuitBreakerGuard in tests.
const tradeService = new TradeService(new CircuitBreakerGuard());
startTradeWorker(tradeService);

// BotScheduler — ticks every active user-owned bot on a fixed interval.
// Interval is configurable via BOT_TICK_INTERVAL_MS env var (default: 30s).
const botScheduler = new BotScheduler(new BotService());
botScheduler.start();

const server = app.listen(env.PORT, () => {
  console.log(`SportsFolio backend listening on port ${env.PORT}`);
  console.log(`Bot scheduler running every ${env.BOT_TICK_INTERVAL_MS}ms`);
});

const shutdown = async () => {
  console.log("Shutting down services...");
  botScheduler.stop();
  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
