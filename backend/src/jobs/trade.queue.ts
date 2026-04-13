import { Queue, QueueEvents, Worker } from "bullmq";
import { env } from "../config/env";
import { createRedisConnection } from "../lib/redis";
import { TradeService } from "../services/trade.service";

type BuyJob = {
  type: "BUY";
  investorId: string;
  athleteId: string;
  amountInr: string;
  idempotencyKey: string;
};

type SellJob = {
  type: "SELL";
  investorId: string;
  athleteId: string;
  tokenAmount: string;
  idempotencyKey: string;
};

export type TradeJob = BuyJob | SellJob;

const queueName = `${env.BULLMQ_QUEUE_PREFIX}_trades`;

const tradeQueue = new Queue<TradeJob>(queueName, {
  connection: createRedisConnection()
});

const queueEvents = new QueueEvents(queueName, {
  connection: createRedisConnection()
});

let worker: Worker<TradeJob> | null = null;

export const startTradeWorker = (tradeService: TradeService) => {
  if (worker) {
    return worker;
  }

  worker = new Worker<TradeJob>(
    queueName,
    async (job) => {
      if (job.data.type === "BUY") {
        return tradeService.executeBuy({
          investorId: job.data.investorId,
          athleteId: job.data.athleteId,
          amountInr: job.data.amountInr,
          idempotencyKey: job.data.idempotencyKey
        });
      }

      return tradeService.executeSell({
        investorId: job.data.investorId,
        athleteId: job.data.athleteId,
        tokenAmount: job.data.tokenAmount,
        idempotencyKey: job.data.idempotencyKey
      });
    },
    {
      connection: createRedisConnection(),
      concurrency: 1
    }
  );

  worker.on("failed", (job, error) => {
    const id = job?.id ?? "unknown";
    console.error(`Trade job failed (${id})`, error);
  });

  return worker;
};

export const enqueueTradeJob = async (job: TradeJob) => {
  const enqueued = await tradeQueue.add(
    `trade:${job.type.toLowerCase()}`,
    job,
    {
      removeOnComplete: true,
      removeOnFail: true,
      jobId: job.idempotencyKey
    }
  );

  return enqueued.waitUntilFinished(queueEvents, 30000);
};
