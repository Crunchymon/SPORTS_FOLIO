-- CreateEnum
CREATE TYPE "public"."KycStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."TradeType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "public"."TradeStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "public"."LedgerAccountType" AS ENUM ('INVESTOR_WALLET', 'ATHLETE_POOL', 'DONATION_QUEUE', 'TOKENS_MINTED');

-- CreateEnum
CREATE TYPE "public"."LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "public"."StrategyType" AS ENUM ('MOMENTUM', 'MEAN_REVERSION', 'NOISE', 'USER');

-- CreateEnum
CREATE TYPE "public"."WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSED');

-- CreateTable
CREATE TABLE "public"."athletes" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "kyc_status" "public"."KycStatus" NOT NULL DEFAULT 'PENDING',
    "bank_account" VARCHAR(100) NOT NULL,
    "k_constant" DECIMAL(20,8) NOT NULL,
    "p_mid" DECIMAL(20,8) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athletes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."price_history" (
    "id" UUID NOT NULL,
    "athlete_id" UUID NOT NULL,
    "sampled_at" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tokens" (
    "id" UUID NOT NULL,
    "athlete_id" UUID NOT NULL,
    "current_supply" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "current_price" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "pool_balance" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."investors" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "wallet_balance" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "linked_bank" VARCHAR(100),
    "kyc_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trades" (
    "id" UUID NOT NULL,
    "investor_id" UUID NOT NULL,
    "athlete_id" UUID NOT NULL,
    "type" "public"."TradeType" NOT NULL,
    "amount_inr" DECIMAL(20,8) NOT NULL,
    "tokens" DECIMAL(20,8) NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "status" "public"."TradeStatus" NOT NULL DEFAULT 'PENDING',
    "pool_deposit" DECIMAL(20,8),
    "donation_amount" DECIMAL(20,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ledger" (
    "id" UUID NOT NULL,
    "trade_id" UUID,
    "account_type" "public"."LedgerAccountType" NOT NULL,
    "account_id" UUID NOT NULL,
    "direction" "public"."LedgerDirection" NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "running_balance" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolios" (
    "id" UUID NOT NULL,
    "investor_id" UUID NOT NULL,
    "athlete_id" UUID NOT NULL,
    "tokens_held" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "avg_buy_price" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bots" (
    "id" UUID NOT NULL,
    "owner_id" UUID,
    "strategy_type" "public"."StrategyType" NOT NULL,
    "config" JSONB NOT NULL,
    "wallet_balance" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."withdrawals" (
    "id" UUID NOT NULL,
    "investor_id" UUID NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "status" "public"."WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_log" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "before_state" JSONB,
    "after_state" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_history_athlete_id_sampled_at_idx" ON "public"."price_history"("athlete_id", "sampled_at");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_athlete_id_key" ON "public"."tokens"("athlete_id");

-- CreateIndex
CREATE UNIQUE INDEX "investors_email_key" ON "public"."investors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "trades_idempotency_key_key" ON "public"."trades"("idempotency_key");

-- CreateIndex
CREATE INDEX "trades_investor_id_idx" ON "public"."trades"("investor_id");

-- CreateIndex
CREATE INDEX "trades_athlete_id_idx" ON "public"."trades"("athlete_id");

-- CreateIndex
CREATE INDEX "ledger_account_type_account_id_created_at_idx" ON "public"."ledger"("account_type", "account_id", "created_at");

-- CreateIndex
CREATE INDEX "portfolios_investor_id_idx" ON "public"."portfolios"("investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "portfolios_investor_id_athlete_id_key" ON "public"."portfolios"("investor_id", "athlete_id");

-- CreateIndex
CREATE INDEX "withdrawals_investor_id_status_idx" ON "public"."withdrawals"("investor_id", "status");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_created_at_idx" ON "public"."audit_log"("entity_type", "created_at");

-- AddForeignKey
ALTER TABLE "public"."price_history" ADD CONSTRAINT "price_history_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tokens" ADD CONSTRAINT "tokens_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trades" ADD CONSTRAINT "trades_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trades" ADD CONSTRAINT "trades_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ledger" ADD CONSTRAINT "ledger_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."portfolios" ADD CONSTRAINT "portfolios_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."portfolios" ADD CONSTRAINT "portfolios_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bots" ADD CONSTRAINT "bots_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."investors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."withdrawals" ADD CONSTRAINT "withdrawals_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
