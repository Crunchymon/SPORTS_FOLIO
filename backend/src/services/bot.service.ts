import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";
import { StrategyType } from "@prisma/client";
import { D } from "../utils/decimal";
import { ApiError } from "../utils/errors";
import { enqueueTradeJob } from "../jobs/trade.queue";
import { BotFactory } from "./strategies/BotFactory";
import { MarketState } from "./strategies/IStrategy";

export class BotService {
  public async getBots(investorId: string) {
    return await prisma.bot.findMany({
      where: { ownerId: investorId },
      orderBy: { createdAt: "desc" }
    });
  }

  public async createBot(
    investorId: string,
    input: { name: string; targetAthlete: string; strategy: string; tradeSize: number }
  ) {
    let strategyType: StrategyType = StrategyType.MOMENTUM;
    if (input.strategy === "Mean Reversion") strategyType = StrategyType.MEAN_REVERSION;
    else if (input.strategy === "Noise Trader") strategyType = StrategyType.NOISE;

    const bot = await prisma.bot.create({
      data: {
        ownerId: investorId,
        strategyType,
        config: {
          name: input.name,
          targetAthlete: input.targetAthlete,
          tradeSize: input.tradeSize
        },
        isActive: true,
        walletBalance: 0
      }
    });

    return bot;
  }

  /**
   * Strategy + Factory Pattern — runTick()
   *
   * 1. Load the bot and the athlete's current market state from the DB.
   * 2. Use BotFactory to instantiate the correct IStrategy for this bot's
   *    strategyType and config.
   * 3. Call strategy.tick(marketState) — polymorphically dispatched to the
   *    correct concrete strategy at runtime.
   * 4. If a signal is returned, submit it as a real trade through enqueueTradeJob
   *    using a fresh idempotency key. The trade goes through the same queue,
   *    lock, and ledger path as any human-initiated trade.
   */
  public async runTick(botId: string, investorId: string) {
    const bot = await prisma.bot.findUnique({ where: { id: botId } });

    if (!bot) {
      throw new ApiError(404, "Bot not found");
    }

    if (bot.ownerId !== investorId) {
      throw new ApiError(403, "Not your bot");
    }

    if (!bot.isActive) {
      throw new ApiError(400, "Bot is inactive");
    }

    const config = bot.config as Record<string, unknown>;
    const targetAthleteId = config.targetAthlete as string | undefined;

    if (!targetAthleteId) {
      throw new ApiError(400, "Bot config is missing targetAthlete");
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: targetAthleteId },
      include: {
        token: true,
        priceHistory: {
          orderBy: { sampledAt: "asc" },
          take: 20
        }
      }
    });

    if (!athlete || !athlete.token) {
      throw new ApiError(404, "Target athlete or token not found");
    }

    const marketState: MarketState = {
      athleteId: athlete.id,
      currentPrice: D(athlete.token.currentPrice.toString()),
      currentSupply: D(athlete.token.currentSupply.toString()),
      poolBalance: D(athlete.token.poolBalance.toString()),
      recentPrices: athlete.priceHistory.map((p) => D(p.price.toString()))
    };

    // Factory — instantiate correct strategy
    const strategy = BotFactory.create(bot.strategyType, config);

    // Strategy — polymorphic tick call
    const signal = strategy.tick(marketState);

    if (!signal) {
      return {
        bot_id: bot.id,
        strategy_type: bot.strategyType,
        signal: null,
        trade_result: null,
        market_snapshot: buildSnapshot(athlete.id, athlete.token)
      };
    }

    // Submit the signal as a real trade through the existing queue pipeline.
    // Each bot tick gets a fresh UUID as the idempotency key so retries from
    // the scheduler never double-execute the same trade.
    let tradeResult: unknown = null;

    try {
      if (signal.direction === "BUY") {
        tradeResult = await enqueueTradeJob({
          type: "BUY",
          investorId,
          athleteId: targetAthleteId,
          amountInr: signal.amount.toFixed(8),
          idempotencyKey: randomUUID()
        });
      } else {
        tradeResult = await enqueueTradeJob({
          type: "SELL",
          investorId,
          athleteId: targetAthleteId,
          tokenAmount: signal.amount.toFixed(8),
          idempotencyKey: randomUUID()
        });
      }
    } catch (err) {
      // Trade execution can legitimately fail (insufficient balance, pool drain
      // guard, market paused). Log it but don't throw — the scheduler must
      // continue ticking other bots, and the HTTP endpoint should still return
      // the signal so the caller can see what was attempted.
      console.error(`[BotService] Trade execution failed for bot ${bot.id}:`, err);
      tradeResult = {
        error: err instanceof Error ? err.message : "Trade execution failed"
      };
    }

    return {
      bot_id: bot.id,
      strategy_type: bot.strategyType,
      signal: {
        direction: signal.direction,
        amount: signal.amount.toFixed(8),
        rationale: signal.rationale
      },
      trade_result: tradeResult,
      market_snapshot: buildSnapshot(athlete.id, athlete.token)
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSnapshot(
  athleteId: string,
  token: { currentPrice: { toString(): string }; currentSupply: { toString(): string }; poolBalance: { toString(): string } }
) {
  return {
    athlete_id: athleteId,
    current_price: token.currentPrice.toString(),
    current_supply: token.currentSupply.toString(),
    pool_balance: token.poolBalance.toString()
  };
}
