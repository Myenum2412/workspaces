import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { openwaStats } from "../services/openwa-stats.js";

const router = Router();
router.use(authenticate);

router.get("/overview", async (req: any, res) => {
  try {
    const stats = await openwaStats.getOverview(req.user!.organizationId);
    res.json(stats);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/messages", async (req: any, res) => {
  try {
    const period = (req.query.period as "24h" | "7d" | "30d") || "24h";
    const stats = await openwaStats.getMessageStats(req.user!.organizationId, period);
    res.json(stats);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/sessions/:sessionId", async (req: any, res) => {
  try {
    const stats = await openwaStats.getSessionStats(req.user!.organizationId, req.params.sessionId);
    res.json(stats);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

export default router;
