import { Router } from "express";
import { z } from "zod";
import { BotService } from "../../services/bot.service";
import { authMiddleware } from "../middleware/auth.middleware";

const botService = new BotService();
export const botRouter = Router();

botRouter.use(authMiddleware);

botRouter.get("/", async (req, res, next) => {
  try {
    const bots = await botService.getBots(req.user!.investorId);
    res.status(200).json({ bots });
  } catch (error) {
    next(error);
  }
});

botRouter.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string(),
      targetAthlete: z.string(),
      strategy: z.string(),
      tradeSize: z.number().min(1)
    });

    const body = schema.parse(req.body);
    const bot = await botService.createBot(req.user!.investorId, body);

    res.status(201).json({ bot });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /bots/:id/tick
 *
 * Manually trigger one strategy tick for the given bot. Returns the trade
 * signal emitted by the strategy (or null if the strategy sat this tick out)
 * along with the market snapshot used as input.
 *
 * This endpoint demonstrates the Strategy + Factory pattern end-to-end:
 * the route has zero knowledge of which strategy runs — it only sees the
 * IStrategy interface result returned by BotService.runTick().
 */
botRouter.post("/:id/tick", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const result = await botService.runTick(id, req.user!.investorId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
