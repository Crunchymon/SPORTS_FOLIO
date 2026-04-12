import bcrypt from "bcryptjs";
import { KycStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function seedAthletes() {
  const athletes = [
    {
      name: "Arjun Menon",
      bankAccount: "ATH001BANK",
      kConstant: "0.00800000",
      pMid: "12.00000000"
    },
    {
      name: "Rohan Kulkarni",
      bankAccount: "ATH002BANK",
      kConstant: "0.01200000",
      pMid: "20.00000000"
    }
  ];

  for (const athlete of athletes) {
    const existing = await prisma.athlete.findFirst({ where: { name: athlete.name } });

    if (existing) {
      continue;
    }

    const created = await prisma.athlete.create({
      data: {
        name: athlete.name,
        bankAccount: athlete.bankAccount,
        kConstant: new Prisma.Decimal(athlete.kConstant),
        pMid: new Prisma.Decimal(athlete.pMid),
        kycStatus: KycStatus.VERIFIED,
        verified: true
      }
    });

    await prisma.token.create({
      data: {
        athleteId: created.id,
        currentSupply: new Prisma.Decimal("0"),
        currentPrice: new Prisma.Decimal("0"),
        poolBalance: new Prisma.Decimal("0")
      }
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

  await prisma.investor.create({
    data: {
      name: "Demo Investor",
      email,
      passwordHash,
      kycVerified: true,
      linkedBank: "INVESTORBANK001",
      walletBalance: new Prisma.Decimal("100000.00000000")
    }
  });
}

async function main() {
  await seedAthletes();
  await seedInvestor();

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
