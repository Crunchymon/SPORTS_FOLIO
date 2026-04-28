import bcrypt from "bcryptjs";
import { KycStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

type AthleteSeedConfig = {
  name: string;
  bankAccount: string;
  kConstant: string;
  pMid: string;
  basePrice: number;
  trendPct: number;
  volatilityPct: number;
  phase: number;
};

const createSeededPriceHistory = (config: AthleteSeedConfig) => {
  const points: Array<{ sampledAt: Date; price: Prisma.Decimal }> = [];
  const now = new Date();

  for (let day = 30; day >= 0; day -= 1) {
    const progress = (30 - day) / 30;
    const trend = 1 + config.trendPct * progress;
    const waveA = Math.sin((day + config.phase) * 0.62) * config.volatilityPct;
    const waveB = Math.cos((day + config.phase * 1.4) * 0.29) * (config.volatilityPct * 0.45);
    const rawPrice = Math.max(config.basePrice * 0.55, config.basePrice * trend * (1 + waveA + waveB));

    const sampledAt = new Date(now);
    sampledAt.setUTCHours(12, 0, 0, 0);
    sampledAt.setUTCDate(sampledAt.getUTCDate() - day);

    points.push({
      sampledAt,
      price: new Prisma.Decimal(rawPrice.toFixed(8))
    });
  }

  return points;
};

async function seedAthletes() {
  const athletes: AthleteSeedConfig[] = [
    {
      name: "Arjun Menon",
      bankAccount: "ATH001BANK",
      kConstant: "0.00800000",
      pMid: "12.00000000",
      basePrice: 72,
      trendPct: 0.42,
      volatilityPct: 0.06,
      phase: 1.3
    },
    {
      name: "Rohan Kulkarni",
      bankAccount: "ATH002BANK",
      kConstant: "0.01200000",
      pMid: "20.00000000",
      basePrice: 81,
      trendPct: 0.31,
      volatilityPct: 0.055,
      phase: 2.2
    },
    {
      name: "Aditya Verma",
      bankAccount: "ATH003BANK",
      kConstant: "0.00500000",
      pMid: "15.00000000",
      basePrice: 50,
      trendPct: 0.8,
      volatilityPct: 0.09,
      phase: 0.5
    },
    {
      name: "Siddharth Rao",
      bankAccount: "ATH004BANK",
      kConstant: "0.00900000",
      pMid: "18.00000000",
      basePrice: 65,
      trendPct: 0.1,
      volatilityPct: 0.12,
      phase: 3.1
    }
  ];

  for (const athlete of athletes) {
    const existing = await prisma.athlete.findFirst({ where: { name: athlete.name } });
    const athleteRecord = existing
      ? await prisma.athlete.update({
          where: { id: existing.id },
          data: {
            bankAccount: athlete.bankAccount,
            kConstant: new Prisma.Decimal(athlete.kConstant),
            pMid: new Prisma.Decimal(athlete.pMid),
            kycStatus: KycStatus.VERIFIED,
            verified: true
          }
        })
      : await prisma.athlete.create({
          data: {
            name: athlete.name,
            bankAccount: athlete.bankAccount,
            kConstant: new Prisma.Decimal(athlete.kConstant),
            pMid: new Prisma.Decimal(athlete.pMid),
            kycStatus: KycStatus.VERIFIED,
            verified: true
          }
        });

    const priceHistory = createSeededPriceHistory(athlete);
    const latestPrice = priceHistory[priceHistory.length - 1].price;
    const currentSupply = Math.sqrt(
      Number(latestPrice.toString()) / Number(athlete.kConstant)
    );
    const poolBalance = Number(latestPrice.toString()) * currentSupply * 1.6;

    await prisma.token.upsert({
      where: { athleteId: athleteRecord.id },
      update: {
        currentSupply: new Prisma.Decimal(currentSupply.toFixed(8)),
        currentPrice: latestPrice,
        poolBalance: new Prisma.Decimal(poolBalance.toFixed(8))
      },
      create: {
        athleteId: athleteRecord.id,
        currentSupply: new Prisma.Decimal(currentSupply.toFixed(8)),
        currentPrice: latestPrice,
        poolBalance: new Prisma.Decimal(poolBalance.toFixed(8))
      }
    });

    await prisma.priceHistory.deleteMany({ where: { athleteId: athleteRecord.id } });
    await prisma.priceHistory.createMany({
      data: priceHistory.map((point) => ({
        athleteId: athleteRecord.id,
        sampledAt: point.sampledAt,
        price: point.price
      }))
    });
  }
}

async function seedInvestor() {
  const email = "demo.investor@sportsfolio.dev";
  const existing = await prisma.investor.findUnique({ where: { email } });

  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash("Password@123", 10);

  const investorRecord = await prisma.investor.create({
    data: {
      name: "Demo Investor",
      email,
      passwordHash,
      kycVerified: true,
      linkedBank: "INVESTORBANK001",
      walletBalance: new Prisma.Decimal("100000.00000000")
    }
  });

  return investorRecord;
}

async function seedTrades(investorId: string) {
  // Let's create a few trades to simulate volume
  const athletes = await prisma.athlete.findMany();
  
  for (const athlete of athletes) {
    await prisma.trade.create({
      data: {
        investorId: investorId,
        athleteId: athlete.id,
        type: "BUY",
        amountInr: new Prisma.Decimal("5000.00"),
        tokens: new Prisma.Decimal("100.00"),
        idempotencyKey: crypto.randomUUID(),
        status: "COMPLETED",
        poolDeposit: new Prisma.Decimal("4800.00"),
        donationAmount: new Prisma.Decimal("200.00"),
        createdAt: new Date() // created today, will show up in 24h volume
      }
    });
  }
}

async function main() {
  await seedAthletes();
  const investor = await seedInvestor();
  if (investor) {
    await seedTrades(investor.id);
  }

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
