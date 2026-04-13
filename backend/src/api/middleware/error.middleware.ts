import { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/errors";

const isZodLikeError = (
  err: unknown
): err is { name: string; message: string; issues?: unknown } => {
  return typeof err === "object" && err !== null && (err as { name?: unknown }).name === "ZodError";
};

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, "Route not found"));
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details ?? null
    });
  }

  if (isZodLikeError(err)) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues ?? err.message
    });
  }

  if (err instanceof Error) {
    return res.status(500).json({
      error: "Internal server error",
      details: err.message
    });
  }

  return res.status(500).json({
    error: "Internal server error",
    details: null
  });
};
