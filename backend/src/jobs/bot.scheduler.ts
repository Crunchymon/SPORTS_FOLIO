import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { BotService } from "../services/bot.service";

/**
 * BotScheduler
 *
 * Runs a tick for every active user-owned bot on a fixed interval.
 * Each tick: fetches current market state, evaluates the bot's strategy,
 * and — if the strategy fires a signal — submits a real trade through the
 * existing queue pipeline.
 *
 * Only bots with a non-null ownerId are ticked. System bots (ownerId = null)
 * are excluded here and would be driven by a separate admin-controlled process.
 *
 * Errors from individual ticks are caught and logged so one failing bot
 * never blocks the rest of the interval.
 *
 * Configuration:
 *   BOT_TICK_INTERVAL_MS — milliseconds between each full sweep (default: 30000)
 *   Set to a higher value (e.g. 300000 = 5 min) in production to reduce load.
 */
export class BotScheduler {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly botService: BotService,
    private readonly intervalMs: number = env.BOT_TICK_INTERVAL_MS
  ) {}

  public start(): void {
    if (this.timer) {
      return; // Already running — idempotent start
    }

    console.log(`[BotScheduler] Starting — interval: ${this.intervalMs}ms`);
    this.timer = setInterval(() => this.sweep(), this.intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("[BotScheduler] Stopped");
    }
  }

  /**
   * Fetch all active user-owned bots and fire a tick for each.
   * Runs sequentially to avoid hammering the DB and queue simultaneously.
   * A single sweep failing mid-way does not affect the next interval.
   */
  private async sweep(): Promise<void> {
    if (this.running) {
      // Previous sweep is still in progress — skip this interval to avoid
      // concurrent sweeps piling up under load.
      console.warn("[BotScheduler] Previous sweep still running — skipping interval");
      return;
    }

    this.running = true;

    try {
      const bots = await prisma.bot.findMany({
        where: {
          isActive: true,
          ownerId: { not: null }
        },
        select: { id: true, ownerId: true }
      });

      if (bots.length === 0) {
        this.running = false;
        return;
      }

      console.log(`[BotScheduler] Sweeping ${bots.length} active bot(s)`);

      for (const bot of bots) {
        try {
          const result = await this.botService.runTick(bot.id, bot.ownerId!);

          if (result.signal) {
            console.log(
              `[BotScheduler] Bot ${bot.id} fired ${result.signal.direction} — ${result.signal.rationale}`
            );
          }
        } catch (err) {
          // Per-bot errors are fully isolated — a bad bot config, an inactive
          // athlete, or insufficient balance must never crash the sweep.
          console.error(`[BotScheduler] Tick failed for bot ${bot.id}:`, err);
        }
      }
    } catch (err) {
      console.error("[BotScheduler] Sweep failed:", err);
    } finally {
      this.running = false;
    }
  }
}
