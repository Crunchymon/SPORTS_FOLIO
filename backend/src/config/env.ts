import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3001"),
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/sportsfolio?schema=public"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(16).default("sportsfolio-dev-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  KYC_REQUIRED: z.enum(["true", "false"]).default("true"),
  DECIMAL_PRECISION: z.string().default("28"),
  BULLMQ_QUEUE_PREFIX: z.string().default("sportsfolio"),
  PRICE_CIRCUIT_BREAKER_PCT: z.string().default("5"),
  POOL_DRAIN_GUARD_PCT: z.string().default("15"),
  MAX_TRADE_SIZE_PCT: z.string().default("10"),
  IDEMPOTENCY_TTL_SECONDS: z.string().default("86400"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  BOT_TICK_INTERVAL_MS: z.string().default("30000")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

export const env = {
  ...parsed.data,
  PORT: Number(parsed.data.PORT),
  KYC_REQUIRED: parsed.data.KYC_REQUIRED === "true",
  DECIMAL_PRECISION: Number(parsed.data.DECIMAL_PRECISION),
  PRICE_CIRCUIT_BREAKER_PCT: Number(parsed.data.PRICE_CIRCUIT_BREAKER_PCT),
  POOL_DRAIN_GUARD_PCT: Number(parsed.data.POOL_DRAIN_GUARD_PCT),
  MAX_TRADE_SIZE_PCT: Number(parsed.data.MAX_TRADE_SIZE_PCT),
  IDEMPOTENCY_TTL_SECONDS: Number(parsed.data.IDEMPOTENCY_TTL_SECONDS),
  BOT_TICK_INTERVAL_MS: Number(parsed.data.BOT_TICK_INTERVAL_MS)
};
