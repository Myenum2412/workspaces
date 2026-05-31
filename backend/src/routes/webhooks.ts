import { Router, Request, Response } from "express";
import crypto from "crypto";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { Webhook } from "../models/index.js";
import { connectDB } from "../config/connection.js";

const router = Router();
router.use(authenticate);

// ── List webhooks ───────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const webhooks = await Webhook.find({ organizationId: authReq.user!.organizationId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ webhooks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Create webhook ──────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { url, events, secret, headers, retryCount, sessionId } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    await connectDB();
    const doc = await Webhook.create({
      _id: crypto.randomUUID(),
      organizationId: authReq.user!.organizationId,
      sessionId: sessionId || "default",
      url,
      events: events || ["message.received"],
      secret: secret || null,
      headers: headers || {},
      retryCount: retryCount ?? 3,
      active: true,
    });
    res.status(201).json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Update webhook ──────────────────────────────────────────
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { url, events, secret, headers, retryCount, active } = req.body;
    await connectDB();

    const update: any = { updatedAt: new Date().toISOString() };
    if (url !== undefined) update.url = url;
    if (events !== undefined) update.events = events;
    if (secret !== undefined) update.secret = secret;
    if (headers !== undefined) update.headers = headers;
    if (retryCount !== undefined) update.retryCount = retryCount;
    if (active !== undefined) update.active = active;

    const webhook = await Webhook.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId },
      update,
      { new: true },
    ).lean();
    if (!webhook) return res.status(404).json({ error: "Webhook not found" });
    res.json(webhook);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Delete webhook ──────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const result = await Webhook.deleteOne({
      _id: req.params.id,
      organizationId: authReq.user!.organizationId,
    });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Webhook not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Test webhook ────────────────────────────────────────────
router.post("/:id/test", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      organizationId: authReq.user!.organizationId,
    }).lean() as any;
    if (!webhook) return res.status(404).json({ error: "Webhook not found" });

    const payload = {
      event: "test",
      timestamp: new Date().toISOString(),
      sessionId: webhook.sessionId,
      data: { message: "Test webhook from OpenWA" },
    };

    const body = JSON.stringify(payload);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (webhook.secret) {
      const hmac = crypto.createHmac("sha256", webhook.secret);
      hmac.update(body);
      headers["X-Signature"] = `sha256=${hmac.digest("hex")}`;
    }

    try {
      const r = await fetch(webhook.url, { method: "POST", headers, body, signal: AbortSignal.timeout(10000) });
      res.json({ success: r.ok, statusCode: r.status });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
