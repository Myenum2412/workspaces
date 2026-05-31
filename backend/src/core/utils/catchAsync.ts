import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * catchAsync — Wraps async route handlers to automatically catch errors
 * and forward them to Express error middleware.
 *
 * Usage:
 *   router.get("/users", catchAsync(async (req, res) => {
 *     const users = await userService.list();
 *     res.json(apiResponse.success(users));
 *   }));
 */
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function catchAsync(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
