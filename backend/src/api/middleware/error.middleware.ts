import { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/errors";

type ErrorHandler = (err: unknown, res: Response) => Response | null;

/**
 * Handles our own ApiError — carries an explicit HTTP status code and
 * optional structured details.
 */
const handleApiError: ErrorHandler = (err, res) => {
  if (!(err instanceof ApiError)) return null;

  return res.status(err.statusCode).json({
    error: err.message,
    details: err.details ?? null
  });
};

/**
 * Handles Zod validation errors. Zod errors are not ApiErrors but carry a
 * well-known shape we can present to the client as a 400.
 */
const handleZodError: ErrorHandler = (err, res) => {
  const isZod =
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === "ZodError";

  if (!isZod) return null;

  const zod = err as { message: string; issues?: unknown };
  return res.status(400).json({
    error: "Validation failed",
    details: zod.issues ?? zod.message
  });
};

/**
 * Handles any remaining Error subclasses (DB errors, unexpected throws, etc.)
 * as an opaque 500.
 */
const handleGenericError: ErrorHandler = (err, res) => {
  if (!(err instanceof Error)) return null;

  return res.status(500).json({
    error: "Internal server error",
    details: err.message
  });
};

/**
 * Final fallback — always claims the error. Catches anything that is not an
 * Error instance (e.g. a raw string throw).
 */
const handleUnknownError: ErrorHandler = (_err, res) => {
  return res.status(500).json({
    error: "Internal server error",
    details: null
  });
};

const ERROR_HANDLERS: ErrorHandler[] = [
  handleApiError,
  handleZodError,
  handleGenericError,
  handleUnknownError
];


export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, "Route not found"));
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  for (const handler of ERROR_HANDLERS) {
    const handled = handler(err, res);
    if (handled !== null) return;
  }
};
