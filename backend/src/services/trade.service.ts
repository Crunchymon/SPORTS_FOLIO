import { LedgerAccountType, LedgerDirection, Prisma } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { D, quantize, asAmountString } from "../utils/decimal";
import { ApiError } from "../utils/errors";
import { BondingCurveEngine } from "./bonding-curve.engine";
import { CircuitBreakerGuard } from "./circuit-breaker.guard";

type BuyTradeInput = {
  investorId: string;
  athleteId: string;
  amountInr: string;
  idempotencyKey: string;
};

type SellTradeInput = {
  investorId: string;
  athleteId: string;
  tokenAmount: string;
  idempotencyKey: string;
};

const getLastBalance = async (
  tx: Prisma.TransactionClient,
  accountType: LedgerAccountType,
  accountId: string
) => {
  const last = await tx.ledger.findFirst({
    where: { accountType, accountId },
    orderBy: { createdAt: "desc" }
  });

  return last ? D(last.runningBalance.toString()) : D(0);
};

const asDecimal = (value: Prisma.Decimal | null | undefined) => D(value?.toString() ?? "0");

const appendPriceHistoryPoint = async (
  tx: Prisma.TransactionClient,
  athleteId: string,
  price: Prisma.Decimal
) => {
  await tx.priceHistory.create({
    data: {
      athleteId,
      sampledAt: new Date(),
      price
    }
  });
};

export class TradeService {
  constructor(private readonly guard: CircuitBreakerGuard) {}

  public async executeBuy(input: BuyTradeInput) {
    const existing = await prisma.trade.findUnique({
      where: { idempotencyKey: input.idempotencyKey }
    });

    if (existing?.status === "COMPLETED") {
      return {
        trade_id: existing.id,
        tokens_received: asAmountString(asDecimal(existing.tokens)),
        pool_deposit: asAmountString(asDecimal(existing.poolDeposit)),
        donation: asAmountString(asDecimal(existing.donationAmount)),
        new_token_price: "0.00000000",
        new_supply: "0.00000000"
      };
    }

    const amountInr = quantize(D(input.amountInr));

    if (amountInr.lte(0)) {
      throw new ApiError(400, "amount_inr must be greater than zero");
    }

    await this.guard.assertMarketOpen(input.athleteId);

    return prisma.$transaction(async (tx) => {
      const investor = await tx.investor.findUnique({ where: { id: input.investorId } });
      const athlete = await tx.athlete.findUnique({ where: { id: input.athleteId }, include: { token: true } });

      if (!investor || !athlete || !athlete.token) {
        throw new ApiError(404, "Investor or athlete not found");
      }

      if (env.KYC_REQUIRED && !investor.kycVerified) {
        throw new ApiError(403, "KYC verification required");
      }

      if (!athlete.verified) {
        throw new ApiError(400, "Athlete is not yet verified for trading");
      }

      if (investor.linkedBank && investor.linkedBank === athlete.bankAccount) {
        throw new ApiError(400, "Self investment blocked");
      }

      const walletBalance = D(investor.walletBalance.toString());

      if (walletBalance.lt(amountInr)) {
        throw new ApiError(400, "Insufficient wallet balance");
      }

      const lockRows = await tx.$queryRaw<Array<{ version: number; current_supply: Prisma.Decimal; pool_balance: Prisma.Decimal }>>`
        SELECT version, current_supply, pool_balance
        FROM tokens
        WHERE athlete_id = ${input.athleteId}::uuid
        FOR UPDATE
      `;

      if (lockRows.length === 0) {
        throw new ApiError(404, "Token not found for athlete");
      }

      const locked = lockRows[0];
      const currentSupply = D(locked.current_supply.toString());
      const currentPoolBalance = D(locked.pool_balance.toString());

      this.guard.assertMaxTradeSize(amountInr, currentPoolBalance);

      const engine = new BondingCurveEngine(
        D(athlete.kConstant.toString()),
        D(athlete.pMid.toString())
      );

      const newSupply = engine.solveSupplyAfterBuy(currentSupply, amountInr);
      const tokensReceived = quantize(newSupply.sub(currentSupply));

      if (tokensReceived.lte(0)) {
        throw new ApiError(400, "Trade amount too small");
      }

      const integrated = engine.integrateTransaction(currentSupply, newSupply, 1000);
      const scale = amountInr.div(integrated.totalCost);
      const poolDeposit = quantize(integrated.poolDeposit.mul(scale));
      const donation = quantize(integrated.donation.mul(scale));
      const price = quantize(engine.calculatePrice(newSupply));
      const newPoolBalance = quantize(currentPoolBalance.add(poolDeposit));
      const newWalletBalance = quantize(walletBalance.sub(amountInr));

      const tokenUpdate = await tx.token.updateMany({
        where: {
          id: athlete.token.id,
          version: locked.version
        },
        data: {
          currentSupply: new Prisma.Decimal(newSupply.toString()),
          currentPrice: new Prisma.Decimal(price.toString()),
          poolBalance: new Prisma.Decimal(newPoolBalance.toString()),
          version: {
            increment: 1
          }
        }
      });

      if (tokenUpdate.count !== 1) {
        throw new ApiError(409, "Concurrent token update detected");
      }

      await appendPriceHistoryPoint(tx, athlete.id, new Prisma.Decimal(price.toString()));

      await tx.investor.update({
        where: { id: investor.id },
        data: { walletBalance: new Prisma.Decimal(newWalletBalance.toString()) }
      });

      const existingPortfolio = await tx.portfolio.findUnique({
        where: {
          investorId_athleteId: {
            investorId: investor.id,
            athleteId: athlete.id
          }
        }
      });

      if (!existingPortfolio) {
        const avgPrice = quantize(amountInr.div(tokensReceived));

        await tx.portfolio.create({
          data: {
            investorId: investor.id,
            athleteId: athlete.id,
            tokensHeld: new Prisma.Decimal(tokensReceived.toString()),
            avgBuyPrice: new Prisma.Decimal(avgPrice.toString())
          }
        });
      } else {
        const currentTokens = D(existingPortfolio.tokensHeld.toString());
        const currentAvg = D(existingPortfolio.avgBuyPrice.toString());
        const newTokensHeld = quantize(currentTokens.add(tokensReceived));
        const weightedCost = currentTokens.mul(currentAvg).add(amountInr);
        const newAvgPrice = quantize(weightedCost.div(newTokensHeld));

        await tx.portfolio.update({
          where: {
            investorId_athleteId: {
              investorId: investor.id,
              athleteId: athlete.id
            }
          },
          data: {
            tokensHeld: new Prisma.Decimal(newTokensHeld.toString()),
            avgBuyPrice: new Prisma.Decimal(newAvgPrice.toString())
          }
        });
      }

      const trade = await tx.trade.create({
        data: {
          investorId: investor.id,
          athleteId: athlete.id,
          type: "BUY",
          amountInr: new Prisma.Decimal(amountInr.toString()),
          tokens: new Prisma.Decimal(tokensReceived.toString()),
          idempotencyKey: input.idempotencyKey,
          status: "COMPLETED",
          poolDeposit: new Prisma.Decimal(poolDeposit.toString()),
          donationAmount: new Prisma.Decimal(donation.toString())
        }
      });

      const donationBefore = await getLastBalance(tx, LedgerAccountType.DONATION_QUEUE, athlete.id);
      const mintedBefore = await getLastBalance(tx, LedgerAccountType.TOKENS_MINTED, athlete.id);

      await tx.ledger.createMany({
        data: [
          {
            tradeId: trade.id,
            accountType: LedgerAccountType.INVESTOR_WALLET,
            accountId: investor.id,
            direction: LedgerDirection.DEBIT,
            amount: new Prisma.Decimal(amountInr.toString()),
            runningBalance: new Prisma.Decimal(newWalletBalance.toString())
          },
          {
            tradeId: trade.id,
            accountType: LedgerAccountType.ATHLETE_POOL,
            accountId: athlete.id,
            direction: LedgerDirection.CREDIT,
            amount: new Prisma.Decimal(poolDeposit.toString()),
            runningBalance: new Prisma.Decimal(newPoolBalance.toString())
          },
          {
            tradeId: trade.id,
            accountType: LedgerAccountType.DONATION_QUEUE,
            accountId: athlete.id,
            direction: LedgerDirection.CREDIT,
            amount: new Prisma.Decimal(donation.toString()),
            runningBalance: new Prisma.Decimal(donationBefore.add(donation).toString())
          },
          {
            tradeId: trade.id,
            accountType: LedgerAccountType.TOKENS_MINTED,
            accountId: athlete.id,
            direction: LedgerDirection.CREDIT,
            amount: new Prisma.Decimal(tokensReceived.toString()),
            runningBalance: new Prisma.Decimal(mintedBefore.add(tokensReceived).toString())
          }
        ]
      });

      return {
        trade_id: trade.id,
        tokens_received: asAmountString(tokensReceived),
        pool_deposit: asAmountString(poolDeposit),
        donation: asAmountString(donation),
        new_token_price: asAmountString(price),
        new_supply: asAmountString(newSupply)
      };
    });
  }

  public async executeSell(input: SellTradeInput) {
    const existing = await prisma.trade.findUnique({
      where: { idempotencyKey: input.idempotencyKey }
    });

    if (existing?.status === "COMPLETED") {
      return {
        trade_id: existing.id,
        inr_received: asAmountString(asDecimal(existing.amountInr)),
        new_token_price: "0.00000000",
        new_supply: "0.00000000"
      };
    }

    const tokenAmount = quantize(D(input.tokenAmount));

    if (tokenAmount.lte(0)) {
      throw new ApiError(400, "token_amount must be greater than zero");
    }

    await this.guard.assertMarketOpen(input.athleteId);

    return prisma.$transaction(async (tx) => {
      const investor = await tx.investor.findUnique({ where: { id: input.investorId } });
      const athlete = await tx.athlete.findUnique({ where: { id: input.athleteId }, include: { token: true } });

      if (!investor || !athlete || !athlete.token) {
        throw new ApiError(404, "Investor or athlete not found");
      }

      const portfolio = await tx.portfolio.findUnique({
        where: {
          investorId_athleteId: {
            investorId: investor.id,
            athleteId: athlete.id
          }
        }
      });

      if (!portfolio) {
        throw new ApiError(400, "No holdings found for this athlete");
      }

      const currentHeld = D(portfolio.tokensHeld.toString());

      if (currentHeld.lt(tokenAmount)) {
        throw new ApiError(400, "Insufficient tokens to sell");
      }

      const lockRows = await tx.$queryRaw<Array<{ version: number; current_supply: Prisma.Decimal; pool_balance: Prisma.Decimal }>>`
        SELECT version, current_supply, pool_balance
        FROM tokens
        WHERE athlete_id = ${input.athleteId}::uuid
        FOR UPDATE
      `;

      if (lockRows.length === 0) {
        throw new ApiError(404, "Token not found for athlete");
      }

      const locked = lockRows[0];
      const currentSupply = D(locked.current_supply.toString());
      const currentPoolBalance = D(locked.pool_balance.toString());

      if (currentSupply.lt(tokenAmount)) {
        throw new ApiError(400, "Sell amount exceeds total token supply");
      }

      const newSupply = currentSupply.sub(tokenAmount);

      const engine = new BondingCurveEngine(
        D(athlete.kConstant.toString()),
        D(athlete.pMid.toString())
      );

      const sellProceeds = quantize(engine.calculateSellProceeds(currentSupply, newSupply));
      this.guard.assertPoolDrainOrThrow(
        sellProceeds,
        currentPoolBalance,
        currentSupply,
        D(athlete.kConstant.toString())
      );

      const newPrice = quantize(engine.calculatePrice(newSupply));
      const newPoolBalance = quantize(currentPoolBalance.sub(sellProceeds));
      const currentWallet = D(investor.walletBalance.toString());
      const newWalletBalance = quantize(currentWallet.add(sellProceeds));

      const tokenUpdate = await tx.token.updateMany({
        where: {
          id: athlete.token.id,
          version: locked.version
        },
        data: {
          currentSupply: new Prisma.Decimal(newSupply.toString()),
          currentPrice: new Prisma.Decimal(newPrice.toString()),
          poolBalance: new Prisma.Decimal(newPoolBalance.toString()),
          version: {
            increment: 1
          }
        }
      });

      if (tokenUpdate.count !== 1) {
        throw new ApiError(409, "Concurrent token update detected");
      }

      await appendPriceHistoryPoint(tx, athlete.id, new Prisma.Decimal(newPrice.toString()));

      await tx.investor.update({
        where: { id: investor.id },
        data: { walletBalance: new Prisma.Decimal(newWalletBalance.toString()) }
      });

      const newHeld = quantize(currentHeld.sub(tokenAmount));

      await tx.portfolio.update({
        where: {
          investorId_athleteId: {
            investorId: investor.id,
            athleteId: athlete.id
          }
        },
        data: {
          tokensHeld: new Prisma.Decimal(newHeld.toString()),
          avgBuyPrice: new Prisma.Decimal(newHeld.eq(0) ? "0" : portfolio.avgBuyPrice.toString())
        }
      });

      const trade = await tx.trade.create({
        data: {
          investorId: investor.id,
          athleteId: athlete.id,
          type: "SELL",
          amountInr: new Prisma.Decimal(sellProceeds.toString()),
          tokens: new Prisma.Decimal(tokenAmount.toString()),
          idempotencyKey: input.idempotencyKey,
          status: "COMPLETED"
        }
      });

      const donationBefore = await getLastBalance(tx, LedgerAccountType.DONATION_QUEUE, athlete.id);
      const mintedBefore = await getLastBalance(tx, LedgerAccountType.TOKENS_MINTED, athlete.id);

      await tx.ledger.createMany({
        data: [
          {
            tradeId: trade.id,
            accountType: LedgerAccountType.ATHLETE_POOL,
            accountId: athlete.id,
            direction: LedgerDirection.DEBIT,
            amount: new Prisma.Decimal(sellProceeds.toString()),
            runningBalance: new Prisma.Decimal(newPoolBalance.toString())
          },
          {
            tradeId: trade.id,
            accountType: LedgerAccountType.INVESTOR_WALLET,
            accountId: investor.id,
            direction: LedgerDirection.CREDIT,
            amount: new Prisma.Decimal(sellProceeds.toString()),
            runningBalance: new Prisma.Decimal(newWalletBalance.toString())
          },
          {
            tradeId: trade.id,
            accountType: LedgerAccountType.TOKENS_MINTED,
            accountId: athlete.id,
            direction: LedgerDirection.DEBIT,
            amount: new Prisma.Decimal(tokenAmount.toString()),
            runningBalance: new Prisma.Decimal(mintedBefore.sub(tokenAmount).toString())
          },
          {
            tradeId: trade.id,
            accountType: LedgerAccountType.DONATION_QUEUE,
            accountId: athlete.id,
            direction: LedgerDirection.CREDIT,
            amount: new Prisma.Decimal("0"),
            runningBalance: new Prisma.Decimal(donationBefore.toString())
          }
        ]
      });

      return {
        trade_id: trade.id,
        inr_received: asAmountString(sellProceeds),
        new_token_price: asAmountString(newPrice),
        new_supply: asAmountString(newSupply)
      };
    });
  }

  public async getHistory(investorId: string, page: number, limit: number, athleteId?: string) {
    const where: Prisma.TradeWhereInput = {
      investorId,
      ...(athleteId ? { athleteId } : {})
    };

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.trade.count({ where })
    ]);

    return {
      trades: trades.map((trade) => ({
        id: trade.id,
        athlete_id: trade.athleteId,
        type: trade.type,
        amount_inr: asAmountString(D(trade.amountInr.toString())),
        tokens: asAmountString(D(trade.tokens.toString())),
        status: trade.status,
        created_at: trade.createdAt
      })),
      total,
      page
    };
  }
}
