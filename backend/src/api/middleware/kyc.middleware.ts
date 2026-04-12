import { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/errors";

export const kycMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (!req.user.kycVerified) {
    return next(new ApiError(403, "KYC verification required"));
  }

  return next();
};
