import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = (err as ZodError).issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        res.status(400).json({ error: "Validation failed", details: errors });
      } else {
        next(err);
      }
    }
  };
}
