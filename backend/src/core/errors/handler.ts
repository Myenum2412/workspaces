import { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError.js";
import mongoose from "mongoose";
import { ZodError } from "zod";

/**
 * Global error handler middleware — must be registered LAST in Express app.
 * Handles all error types and returns standardized error responses.
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = (req as any).requestId as string | undefined;

  // Default error values
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred";
  let details: Record<string, unknown> | undefined;

  // AppError — our structured application errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }
  // Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Validation failed";
    details = {
      fields: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }
  // Mongoose validation errors
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Database validation failed";
    details = {
      fields: Object.entries(err.errors).map(([key, val]) => ({
        path: key,
        message: (val as any).message,
      })),
    };
  }
  // Mongoose cast error (invalid ObjectId, etc.)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = `Invalid value for ${err.path}: ${err.value}`;
  }
  // Mongoose duplicate key
  else if ((err as any).code === 11000) {
    statusCode = 409;
    code = "CONFLICT";
    const key = Object.keys((err as any).keyValue || {})[0];
    message = `Duplicate value for: ${key}`;
    details = { field: key, value: (err as any).keyValue?.[key] };
  }
  // JSON parse error
  else if (err instanceof SyntaxError && "body" in err) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Invalid JSON request body";
  }

  // Log unexpected errors (500s) with full stack trace
  if (statusCode === 500) {
    console.error(`[Error${requestId ? ` ${requestId}` : ""}]`, err.message);
    if (process.env.NODE_ENV !== "production") {
      console.error(err.stack);
    } else {
      // In production, log stack but don't send to client
      console.error("Stack:", err.stack?.split("\n").slice(0, 3).join("\n"));
    }
  }

  // Send standardized error response
  res.status(statusCode).json({
    success: false as const,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(requestId && { reference: requestId }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    },
  });
}
