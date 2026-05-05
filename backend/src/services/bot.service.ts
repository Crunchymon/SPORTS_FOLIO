import { prisma } from "../lib/prisma";
import { StrategyType } from "@prisma/client";
import { D } from "../utils/decimal";
import { ApiError } from "../utils/errors";
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
   *    strategyType and config — the caller never knows which concrete class
   *    is used.
   * 3. Call strategy.tick(marketState) — the Strategy interface's single
   *    method, polymorphically dispatched to MomentumStrategy,
   *    MeanReversionStrategy, or NoiseStrategy at runtime.
   * 4. Return the signal. Actual trade execution (idempotency key, queue
   *    submission) is left to the caller so this method stays pure and testable.
   *
   * Open/Closed: adding a 4th strategy type requires no change here — only
   * the new strategy class and one BotFactory case.
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

    // Resolve target athlete from bot config
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
          take: 20 // Enough for any strategy's lookback window
        }
      }
    });

    if (!athlete || !athlete.token) {
      throw new ApiError(404, "Target athlete or token not found");
    }

    // Build MarketState — passed to strategy.tick() as the sole input.
    // Strategies must not perform DB reads; all data is provided here.
    const marketState: MarketState = {
      athleteId: athlete.id,
      currentPrice: D(athlete.token.currentPrice.toString()),
      currentSupply: D(athlete.token.currentSupply.toString()),
      poolBalance: D(athlete.token.poolBalance.toString()),
      recentPrices: athlete.priceHistory.map((p) => D(p.price.toString()))
    };

    // Factory Pattern — create the correct strategy without the caller knowing
    // which concrete class is instantiated.
    const strategy = BotFactory.create(bot.strategyType, config);

    // Strategy Pattern — polymorphic tick() call. Returns a TradeSignal or
    // null if the strategy decides to sit this tick out.
    const signal = strategy.tick(marketState);

    return {
      bot_id: bot.id,
      strategy_type: bot.strategyType,
      signal: signal
        ? {
            direction: signal.direction,
            amount: signal.amount.toFixed(8),
            rationale: signal.rationale
          }
        : null,
      market_snapshot: {
        athlete_id: athlete.id,
        current_price: athlete.token.currentPrice.toString(),
        current_supply: athlete.token.currentSupply.toString(),
        pool_balance: athlete.token.poolBalance.toString()
      }
    };
  }
}
