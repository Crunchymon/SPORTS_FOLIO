import { Router } from "express";
import { z } from "zod";
import { AthleteService } from "../../services/athlete.service";

const athleteService = new AthleteService();

export const athleteRouter = Router();

athleteRouter.get("/", async (req, res, next) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(50).default(20),
      sort: z.enum(["market_cap", "price", "volume"]).default("market_cap")
    });

    const query = schema.parse(req.query);
    const result = await athleteService.listAthletes(query);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

athleteRouter.get("/:id", async (req, res, next) => {
  try {
    const schema = z.object({ id: z.string().uuid() });
    const { id } = schema.parse(req.params);
    const result = await athleteService.getAthleteById(id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
