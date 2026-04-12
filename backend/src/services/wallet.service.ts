import { LedgerAccountType, LedgerDirection, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { D, quantize, asAmountString } from "../utils/decimal";
import { ApiError } from "../utils/errors";

const MIN_WITHDRAWAL = D("100");

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

export class WalletService {
  public async deposit(investorId: string, amountRaw: string) {
    const amount = quantize(D(amountRaw));

    if (amount.lte(0)) {
      throw new ApiError(400, "Deposit amount must be greater than zero");
    }

    return prisma.$transaction(async (tx) => {
      const investor = await tx.investor.findUnique({ where: { id: investorId } });

      if (!investor) {
        throw new ApiError(404, "Investor not found");
      }

      const currentBalance = D(investor.walletBalance.toString());
      const fee = quantize(amount.mul("0.01"));
      const creditedAmount = quantize(amount.sub(fee));
      const newBalance = quantize(currentBalance.add(creditedAmount));

      await tx.investor.update({
        where: { id: investorId },
        data: { walletBalance: new Prisma.Decimal(newBalance.toString()) }
      });

      const runningBalance = await getLastBalance(tx, LedgerAccountType.INVESTOR_WALLET, investorId);
      const updatedRunningBalance = quantize(runningBalance.add(creditedAmount));

      await tx.ledger.create({
        data: {
          tradeId: null,
          accountType: LedgerAccountType.INVESTOR_WALLET,
          accountId: investorId,
          direction: LedgerDirection.CREDIT,
          amount: new Prisma.Decimal(creditedAmount.toString()),
          runningBalance: new Prisma.Decimal(updatedRunningBalance.toString())
        }
      });

      return {
        credited_amount: asAmountString(creditedAmount),
        fee_charged: asAmountString(fee),
        new_balance: asAmountString(newBalance)
      };
    });
  }

  public async withdraw(investorId: string, amountRaw: string) {
    const amount = quantize(D(amountRaw));

    if (amount.lt(MIN_WITHDRAWAL)) {
      throw new ApiError(400, "Amount below minimum withdrawal limit", {
        minimum_withdrawal: asAmountString(MIN_WITHDRAWAL)
      });
    }

    return prisma.$transaction(async (tx) => {
      const investor = await tx.investor.findUnique({ where: { id: investorId } });

      if (!investor) {
        throw new ApiError(404, "Investor not found");
      }

      if (!investor.linkedBank) {
        throw new ApiError(400, "Linked bank account is required for withdrawals");
      }

      const currentBalance = D(investor.walletBalance.toString());

      if (currentBalance.lt(amount)) {
        throw new ApiError(400, "Insufficient balance");
      }

      const newBalance = quantize(currentBalance.sub(amount));

      await tx.investor.update({
        where: { id: investorId },
        data: { walletBalance: new Prisma.Decimal(newBalance.toString()) }
      });

      const withdrawal = await tx.withdrawal.create({
        data: {
          investorId,
          amount: new Prisma.Decimal(amount.toString())
        }
      });

      const runningBalance = await getLastBalance(tx, LedgerAccountType.INVESTOR_WALLET, investorId);
      const updatedRunningBalance = quantize(runningBalance.sub(amount));

      await tx.ledger.create({
        data: {
          tradeId: null,
          accountType: LedgerAccountType.INVESTOR_WALLET,
          accountId: investorId,
          direction: LedgerDirection.DEBIT,
          amount: new Prisma.Decimal(amount.toString()),
          runningBalance: new Prisma.Decimal(updatedRunningBalance.toString())
        }
      });

      return {
        withdrawal_id: withdrawal.id,
        amount: asAmountString(amount),
        status: withdrawal.status,
        estimated_processing: "within 24 hours"
      };
    });
  }

  public async getBalance(investorId: string) {
    const [investor, pendingWithdrawals] = await Promise.all([
      prisma.investor.findUnique({ where: { id: investorId } }),
      prisma.withdrawal.aggregate({
        where: { investorId, status: "PENDING" },
        _sum: { amount: true }
      })
    ]);

    if (!investor) {
      throw new ApiError(404, "Investor not found");
    }

    return {
      balance: asAmountString(D(investor.walletBalance.toString())),
      pending_withdrawals: asAmountString(D(pendingWithdrawals._sum.amount?.toString() ?? "0"))
    };
  }
}
