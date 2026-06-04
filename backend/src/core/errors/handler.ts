// @ts-nocheck
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { AppError } from "./AppError.js";
import { logger } from "../logging/logger.js";

declare module "express-serve-static-core" {
  interface Request {
    requestId: string;
  }
}

export function globalErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId;
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred";
  let details: Record<string, unknown> | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Validation failed";
    details = { fields: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) };
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Validation failed";
    details = { fields: Object.entries(err.errors).map(([k, v]) => ({ path: k, message: (v as Error).message })) };
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = `Invalid value for ${err.path}: ${err.value}`;
  } else if ((err as unknown as Record<string, unknown>).code === 11000) {
    statusCode = 409;
    code = "CONFLICT";
    const errRecord = err as unknown as Record<string, unknown>;
    const key = Object.keys((errRecord.keyValue as Record<string, unknown>) || {})[0];
    message = `Duplicate value for: ${key}`;
    details = { field: key, value: (errRecord.keyValue as Record<string, unknown>)?.[key] };
  } else if (err instanceof SyntaxError && "body" in err) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Invalid JSON request body";
  }

  if (statusCode >= 500) {
    logger.error({ err, requestId, path: req.path, method: req.method }, "Internal server error");
  }

  res.status(statusCode).json({
    success: false as const,
    error: { code, message, ...(details && { details }), ...(requestId && { reference: requestId }) },
    meta: { timestamp: new Date().toISOString(), ...(requestId && { requestId }) },
  });
}
