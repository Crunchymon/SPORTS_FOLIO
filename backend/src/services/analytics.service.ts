import { prisma } from "../lib/prisma";

export class AnalyticsService {
  public async getDashboardMetrics() {
    const tokens = await prisma.token.aggregate({
      _sum: {
        poolBalance: true
      }
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const volume = await prisma.trade.aggregate({
      where: {
        createdAt: {
          gte: yesterday
        },
        status: "COMPLETED"
      },
      _sum: {
        amountInr: true
      }
    });

    const athletesFunded = await prisma.token.count({
      where: {
        poolBalance: {
          gt: 0
        }
      }
    });

    const topTokens = await prisma.token.findMany({
      orderBy: {
        currentPrice: 'desc'
      },
      take: 4,
      include: {
        athlete: true
      }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const enrichedTokens = await Promise.all(topTokens.map(async (t) => {
      const pastPrice = await prisma.priceHistory.findFirst({
        where: {
          athleteId: t.athleteId,
          sampledAt: { lte: sevenDaysAgo }
        },
        orderBy: { sampledAt: 'desc' }
      });

      const startPrice = pastPrice ? Number(pastPrice.price) : Number(t.currentPrice);
      const current = Number(t.currentPrice);
      let returnPct = 0;
      if (startPrice > 0) {
        returnPct = ((current - startPrice) / startPrice) * 100;
      }

      const athleteVolume = await prisma.trade.aggregate({
        where: { athleteId: t.athleteId, status: "COMPLETED" },
        _sum: { amountInr: true }
      });

      return {
        name: t.athlete.name,
        currentPrice: current.toString(),
        return: returnPct > 0 ? `+${returnPct.toFixed(1)}%` : `${returnPct.toFixed(1)}%`,
        volume: `₹${(Number(athleteVolume._sum.amountInr) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
      };
    }));

    return {
      totalValueLocked: tokens._sum.poolBalance || 0,
      platformVolume24h: volume._sum.amountInr || 0,
      totalAthletesFunded: athletesFunded,
      topPerformingTokens: enrichedTokens
    };
  }
}
