import { prisma } from "../lib/prisma";
import { D, asAmountString } from "../utils/decimal";
import { ApiError } from "../utils/errors";

type ListAthletesInput = {
  page: number;
  limit: number;
  sort: "market_cap" | "price" | "volume";
};

export class AthleteService {
  public async listAthletes(input: ListAthletesInput) {
    const athletes = await prisma.athlete.findMany({
      include: { token: true }
    });

    const transformed = athletes.map((athlete) => {
      const token = athlete.token;
      const currentPrice = D(token?.currentPrice.toString() ?? "0");
      const currentSupply = D(token?.currentSupply.toString() ?? "0");
      const poolBalance = D(token?.poolBalance.toString() ?? "0");
      const marketCap = currentPrice.mul(currentSupply);

      return {
        id: athlete.id,
        name: athlete.name,
        kyc_status: athlete.kycStatus,
        market_cap: marketCap,
        token: {
          current_price: asAmountString(currentPrice),
          current_supply: asAmountString(currentSupply),
          pool_balance: asAmountString(poolBalance)
        }
      };
    });

    transformed.sort((a, b) => {
      if (input.sort === "price") {
        return Number(D(b.token.current_price).sub(a.token.current_price).toString());
      }

      if (input.sort === "market_cap") {
        return Number(b.market_cap.sub(a.market_cap).toString());
      }

      return Number(D(b.token.pool_balance).sub(a.token.pool_balance).toString());
    });

    const start = (input.page - 1) * input.limit;
    const end = start + input.limit;

    return {
      athletes: transformed.slice(start, end).map((athlete) => ({
        id: athlete.id,
        name: athlete.name,
        kyc_status: athlete.kyc_status,
        token: athlete.token
      })),
      total: transformed.length,
      page: input.page
    };
  }

  public async getAthleteById(id: string) {
    const athlete = await prisma.athlete.findUnique({
      where: { id },
      include: {
        token: true,
        priceHistory: {
          orderBy: { sampledAt: "asc" }
        }
      }
    });

    if (!athlete) {
      throw new ApiError(404, "Athlete not found");
    }

    const currentPrice = D(athlete.token?.currentPrice.toString() ?? "0");
    const currentSupply = D(athlete.token?.currentSupply.toString() ?? "0");
    const poolBalance = D(athlete.token?.poolBalance.toString() ?? "0");

    const priceHistory = athlete.priceHistory.map((point) => ({
      sampled_at: point.sampledAt,
      price: asAmountString(D(point.price.toString()))
    }));

    if (currentPrice.gt(0)) {
      const lastPoint = athlete.priceHistory[athlete.priceHistory.length - 1];
      const lastPrice = D(lastPoint?.price.toString() ?? "0");

      if (!lastPoint || !lastPrice.eq(currentPrice)) {
        priceHistory.push({
          sampled_at: new Date(),
          price: asAmountString(currentPrice)
        });
      }
    }

    return {
      athlete: {
        id: athlete.id,
        name: athlete.name,
        kyc_status: athlete.kycStatus,
        token: {
          current_price: asAmountString(currentPrice),
          current_supply: asAmountString(currentSupply),
          pool_balance: asAmountString(poolBalance)
        },
        price_history: priceHistory
      }
    };
  }
}
