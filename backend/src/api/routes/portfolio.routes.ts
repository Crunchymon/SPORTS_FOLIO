import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { PortfolioService } from "../../services/portfolio.service";

const portfolioService = new PortfolioService();

export const portfolioRouter = Router();

portfolioRouter.get("/", authMiddleware, async (req, res, next) => {
  try {
    const result = await portfolioService.getPortfolio(req.user!.investorId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
