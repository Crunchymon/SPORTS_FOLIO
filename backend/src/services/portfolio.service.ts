import { prisma } from "../lib/prisma";
import { D, asAmountString } from "../utils/decimal";

export class PortfolioService {
  public async getPortfolio(investorId: string) {
    const rows = await prisma.portfolio.findMany({
      where: { investorId },
      include: {
        athlete: {
          include: {
            token: true
          }
        }
      }
    });

    return {
      portfolio: rows.map((row) => {
        const tokensHeld = D(row.tokensHeld.toString());
        const avgBuyPrice = D(row.avgBuyPrice.toString());
        const currentPrice = D(row.athlete.token?.currentPrice.toString() ?? "0");
        const currentValue = tokensHeld.mul(currentPrice);
        const investedValue = tokensHeld.mul(avgBuyPrice);
        const pnl = currentValue.sub(investedValue);

        return {
          athlete_id: row.athleteId,
          athlete_name: row.athlete.name,
          tokens_held: asAmountString(tokensHeld),
          avg_buy_price: asAmountString(avgBuyPrice),
          current_price: asAmountString(currentPrice),
          current_value: asAmountString(currentValue),
          pnl: asAmountString(pnl)
        };
      })
    };
  }
}
