import { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/errors";

type JwtPayload = {
  investorId?: string;
  sub?: string;
  email?: string;
};

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Missing or invalid Authorization header");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (!decoded || typeof decoded !== "object") {
      throw new ApiError(401, "Invalid authentication token");
    }

    const payload = decoded as JwtPayload;
    const investorId =
      payload.investorId ?? (typeof payload.sub === "string" ? payload.sub : undefined);

    if (!investorId) {
      throw new ApiError(401, "Invalid authentication token");
    }

    const investor = await prisma.investor.findUnique({ where: { id: investorId } });

    if (!investor) {
      throw new ApiError(401, "Session expired. Please sign in again.");
    }

    req.user = {
      investorId: investor.id,
      email: investor.email,
      kycVerified: investor.kycVerified
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(new ApiError(401, "Session expired. Please sign in again."));
    }

    if (error instanceof JsonWebTokenError) {
      return next(new ApiError(401, "Invalid authentication token"));
    }

    next(error);
  }
};
