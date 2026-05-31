import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { openwaSessions } from "../services/openwa-session.js";

const router = Router();
router.use(authenticate);

router.post("/", async (req: any, res) => {
  try {
    const { name, config } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    const session = await openwaSessions.createSession(req.user!.organizationId, name, config || {});
    res.status(201).json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req: any, res) => {
  try {
    const sessions = await openwaSessions.getSessions(req.user!.organizationId);
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats/overview", async (req: any, res) => {
  try {
    const stats = await openwaSessions.getStats(req.user!.organizationId);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req: any, res) => {
  try {
    const session = await openwaSessions.getSession(req.params.id, req.user!.organizationId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req: any, res) => {
  try {
    await openwaSessions.deleteSession(req.params.id, req.user!.organizationId);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.message === "Session not found" ? 404 : 400).json({ error: err.message });
  }
});

router.post("/:id/start", async (req: any, res) => {
  try {
    const session = await openwaSessions.startSession(req.params.id, req.user!.organizationId);
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/stop", async (req: any, res) => {
  try {
    const session = await openwaSessions.stopSession(req.params.id, req.user!.organizationId);
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:id/qr", async (req: any, res) => {
  try {
    const sock = openwaSessions.getSocket(req.params.id);
    if (!sock) return res.status(400).json({ error: "Session not started" });
    // QR is emitted via socket, return status
    const session = await openwaSessions.getSession(req.params.id, req.user!.organizationId);
    res.json({ status: session?.status, message: "Use WebSocket for QR code updates" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/groups", async (req: any, res) => {
  try {
    const { openwaGroups } = await import("../services/openwa-groups.js");
    const groups = await openwaGroups.getGroups(req.user!.organizationId, req.params.id);
    res.json(groups);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
