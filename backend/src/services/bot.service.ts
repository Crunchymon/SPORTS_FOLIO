import { prisma } from "../lib/prisma";
import { StrategyType } from "@prisma/client";

export class BotService {
  public async getBots(investorId: string) {
    return await prisma.bot.findMany({
      where: { ownerId: investorId },
      orderBy: { createdAt: 'desc' }
    });
  }

  public async createBot(investorId: string, input: { name: string, targetAthlete: string, strategy: string, tradeSize: number }) {
    // Basic mapping for strategies
    let strategyType = StrategyType.MOMENTUM;
    if (input.strategy === "Mean Reversion") strategyType = StrategyType.MEAN_REVERSION;
    else if (input.strategy === "Noise Trader") strategyType = StrategyType.NOISE;

    const bot = await prisma.bot.create({
      data: {
        ownerId: investorId,
        strategyType: strategyType,
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
}
