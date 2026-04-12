import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/errors";

type JwtPayload = {
  investorId: string;
  email: string;
};

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Missing or invalid Authorization header");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const investor = await prisma.investor.findUnique({ where: { id: payload.investorId } });

    if (!investor) {
      throw new ApiError(401, "Invalid token subject");
    }

    req.user = {
      investorId: investor.id,
      email: investor.email,
      kycVerified: investor.kycVerified
    };

    next();
  } catch (error) {
    next(error);
  }
};
