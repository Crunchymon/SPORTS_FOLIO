import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.middleware";
import { kycMiddleware } from "../middleware/kyc.middleware";
import { WalletService } from "../../services/wallet.service";

const walletService = new WalletService();

export const walletRouter = Router();

walletRouter.post("/deposit", authMiddleware, kycMiddleware, async (req, res, next) => {
  try {
    const schema = z.object({
      amount: z.string(),
      payment_reference: z.string().min(3)
    });

    const body = schema.parse(req.body);
    const result = await walletService.deposit(req.user!.investorId, body.amount);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

walletRouter.post("/withdraw", authMiddleware, kycMiddleware, async (req, res, next) => {
  try {
    const schema = z.object({ amount: z.string() });
    const body = schema.parse(req.body);
    const result = await walletService.withdraw(req.user!.investorId, body.amount);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

walletRouter.get("/balance", authMiddleware, async (req, res, next) => {
  try {
    const result = await walletService.getBalance(req.user!.investorId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
