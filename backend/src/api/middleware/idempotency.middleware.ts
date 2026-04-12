import { NextFunction, Request, Response } from "express";
import { redis } from "../../lib/redis";
import { ApiError } from "../../utils/errors";

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const key = req.header("X-Idempotency-Key");

    if (!key || !UUID_V4_PATTERN.test(key)) {
      throw new ApiError(400, "Valid X-Idempotency-Key header is required");
    }

    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const redisKey = `idem:${req.user.investorId}:${key}`;
    const cached = await redis.get(redisKey);

    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    req.idempotencyKey = key;
    req.idempotencyRedisKey = redisKey;

    return next();
  } catch (error) {
    return next(error);
  }
};
