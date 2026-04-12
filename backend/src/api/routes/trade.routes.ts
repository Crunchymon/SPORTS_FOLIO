import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.middleware";
import { kycMiddleware } from "../middleware/kyc.middleware";
import { idempotencyMiddleware } from "../middleware/idempotency.middleware";
import { enqueueTradeJob } from "../../jobs/trade.queue";
import { redis } from "../../lib/redis";
import { env } from "../../config/env";
import { ApiError } from "../../utils/errors";
import { TradeService } from "../../services/trade.service";
import { CircuitBreakerGuard } from "../../services/circuit-breaker.guard";

const tradeService = new TradeService(new CircuitBreakerGuard());

export const tradeRouter = Router();

tradeRouter.post("/buy", authMiddleware, kycMiddleware, idempotencyMiddleware, async (req, res, next) => {
  try {
    const schema = z.object({
      athlete_id: z.string().uuid(),
      amount_inr: z.string()
    });

    const body = schema.parse(req.body);

    if (!req.idempotencyKey || !req.idempotencyRedisKey) {
      throw new ApiError(400, "Idempotency key is required");
    }

    const result = await enqueueTradeJob({
      type: "BUY",
      investorId: req.user!.investorId,
      athleteId: body.athlete_id,
      amountInr: body.amount_inr,
      idempotencyKey: req.idempotencyKey
    });

    await redis.set(req.idempotencyRedisKey, JSON.stringify(result), "EX", env.IDEMPOTENCY_TTL_SECONDS);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

tradeRouter.post("/sell", authMiddleware, kycMiddleware, idempotencyMiddleware, async (req, res, next) => {
  try {
    const schema = z.object({
      athlete_id: z.string().uuid(),
      token_amount: z.string()
    });

    const body = schema.parse(req.body);

    if (!req.idempotencyKey || !req.idempotencyRedisKey) {
      throw new ApiError(400, "Idempotency key is required");
    }

    const result = await enqueueTradeJob({
      type: "SELL",
      investorId: req.user!.investorId,
      athleteId: body.athlete_id,
      tokenAmount: body.token_amount,
      idempotencyKey: req.idempotencyKey
    });

    await redis.set(req.idempotencyRedisKey, JSON.stringify(result), "EX", env.IDEMPOTENCY_TTL_SECONDS);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

tradeRouter.get("/history", authMiddleware, async (req, res, next) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(50).default(20),
      athlete_id: z.string().uuid().optional()
    });

    const query = schema.parse(req.query);

    const result = await tradeService.getHistory(
      req.user!.investorId,
      query.page,
      query.limit,
      query.athlete_id
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
