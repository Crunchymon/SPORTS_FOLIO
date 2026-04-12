import "./config/decimal";
import { app } from "./api/app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { redis } from "./lib/redis";
import { startTradeWorker } from "./jobs/trade.queue";
import { TradeService } from "./services/trade.service";
import { CircuitBreakerGuard } from "./services/circuit-breaker.guard";

const tradeService = new TradeService(new CircuitBreakerGuard());
startTradeWorker(tradeService);

const server = app.listen(env.PORT, () => {
  console.log(`SportsFolio backend listening on port ${env.PORT}`);
});

const shutdown = async () => {
  console.log("Shutting down services...");
  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
