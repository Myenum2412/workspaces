import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Request ID middleware.
 * - Reads X-Request-ID from incoming headers (for distributed tracing)
 * - Generates a new UUID if not present
 * - Sets X-Request-ID on the response header
 * - Makes requestId available as req.requestId
 */

declare module "express-serve-static-core" {
  interface Request {
    requestId: string;
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const id = req.headers["x-request-id"] as string || crypto.randomUUID();
  req.requestId = id;
  res.setHeader("X-Request-ID", id);
  next();
}
