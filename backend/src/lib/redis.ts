import IORedis from "ioredis";
import { env } from "../config/env";

export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

export const createRedisConnection = () =>
  new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
