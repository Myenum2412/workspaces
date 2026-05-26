import { Router, Request, Response } from "express";
import { connectDB } from "../config/connection.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    await connectDB();
    res.json({ success: true, message: "Database connected" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Database connection failed" });
  }
});

export default router;
