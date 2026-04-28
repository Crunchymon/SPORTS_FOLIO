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
