import { Router } from "express";
import { AnalyticsService } from "../../services/analytics.service";

const analyticsService = new AnalyticsService();

export const analyticsRouter = Router();

analyticsRouter.get("/", async (req, res, next) => {
  try {
    const metrics = await analyticsService.getDashboardMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    next(error);
  }
});
