import { Router } from "express";
import { z } from "zod";
import { AuthService } from "../../services/auth.service";
import { authMiddleware } from "../middleware/auth.middleware";

const authService = new AuthService();

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8)
    });

    const body = schema.parse(req.body);
    const investor = await authService.register(body);

    res.status(201).json({ investor });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8)
    });

    const body = schema.parse(req.body);
    const result = await authService.login(body);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/kyc/verify", authMiddleware, async (req, res, next) => {
  try {
    const schema = z.object({
      pan_number: z.string().min(6),
      bank_account: z.string().min(6),
      bank_ifsc: z.string().min(6)
    });

    const body = schema.parse(req.body);
    const result = await authService.verifyKyc(req.user!.investorId, {
      panNumber: body.pan_number,
      bankAccount: body.bank_account,
      bankIfsc: body.bank_ifsc
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
