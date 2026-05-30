import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { openwaMessages } from "../services/openwa-messages.js";

const router = Router();
router.use(authenticate);

// ── Message History ─────────────────────────────────────────
router.get("/sessions/:sessionId/messages", async (req: any, res) => {
  try {
    const { chatId, limit, offset } = req.query;
    const result = await openwaMessages.getMessages(
      req.user!.organizationId, req.params.sessionId,
      chatId as string, parseInt(limit as string) || 50, parseInt(offset as string) || 0
    );
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Search ──────────────────────────────────────────────────
router.get("/messages/search", async (req: any, res) => {
  try {
    const { q, limit } = req.query;
    if (!q) return res.status(400).json({ error: "Query 'q' required" });
    const messages = await openwaMessages.searchMessages(req.user!.organizationId, q as string, parseInt(limit as string) || 50);
    res.json({ messages });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Send Text ───────────────────────────────────────────────
router.post("/sessions/:sessionId/messages/send-text", async (req: any, res) => {
  try {
    const result = await openwaMessages.sendText(req.user!.organizationId, req.params.sessionId, req.body);
    res.status(201).json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── Send Media ──────────────────────────────────────────────
router.post("/sessions/:sessionId/messages/send-image", async (req: any, res) => {
  try {
    const result = await openwaMessages.sendMedia(req.user!.organizationId, req.params.sessionId, req.body, "image");
    res.status(201).json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/messages/send-video", async (req: any, res) => {
  try {
    const result = await openwaMessages.sendMedia(req.user!.organizationId, req.params.sessionId, req.body, "video");
    res.status(201).json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/messages/send-audio", async (req: any, res) => {
  try {
    const result = await openwaMessages.sendMedia(req.user!.organizationId, req.params.sessionId, req.body, "audio");
    res.status(201).json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/messages/send-document", async (req: any, res) => {
  try {
    const result = await openwaMessages.sendMedia(req.user!.organizationId, req.params.sessionId, req.body, "document");
    res.status(201).json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── Send Location ───────────────────────────────────────────
router.post("/sessions/:sessionId/messages/send-location", async (req: any, res) => {
  try {
    const result = await openwaMessages.sendLocation(req.user!.organizationId, req.params.sessionId, req.body);
    res.status(201).json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── Reply & Forward ─────────────────────────────────────────
router.post("/sessions/:sessionId/messages/reply", async (req: any, res) => {
  try {
    const result = await openwaMessages.reply(req.user!.organizationId, req.params.sessionId, req.body);
    res.status(201).json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/messages/forward", async (req: any, res) => {
  try {
    const result = await openwaMessages.forward(req.user!.organizationId, req.params.sessionId, req.body);
    res.status(201).json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── React ───────────────────────────────────────────────────
router.post("/sessions/:sessionId/messages/react", async (req: any, res) => {
  try {
    await openwaMessages.react(req.user!.organizationId, req.params.sessionId, req.body);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── Delete ──────────────────────────────────────────────────
router.post("/sessions/:sessionId/messages/delete", async (req: any, res) => {
  try {
    await openwaMessages.deleteMessage(req.user!.organizationId, req.params.sessionId, req.body);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── Send Sticker ──────────────────────────────────────────
router.post("/sessions/:sessionId/messages/send-sticker", async (req: any, res) => {
  try {
    const result = await openwaMessages.sendSticker(req.user!.organizationId, req.params.sessionId, req.body);
    res.status(201).json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── Send Contact (vCard) ───────────────────────────────────
router.post("/sessions/:sessionId/messages/send-contact", async (req: any, res) => {
  try {
    const result = await openwaMessages.sendContact(req.user!.organizationId, req.params.sessionId, req.body);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── Bulk Messaging ──────────────────────────────────────────
router.post("/sessions/:sessionId/messages/send-bulk", async (req: any, res) => {
  try {
    const batch = await openwaMessages.createBatch(req.user!.organizationId, req.params.sessionId, req.body);
    res.status(202).json({
      batchId: batch.batchId, status: batch.status,
      totalMessages: batch.totalMessages,
      statusUrl: `/api/openwa/sessions/${req.params.sessionId}/messages/batch/${batch.batchId}`,
    });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/sessions/:sessionId/messages/batch/:batchId", async (req: any, res) => {
  try {
    const batch = await openwaMessages.getBatchStatus(req.params.batchId);
    res.json(batch);
  } catch (err: any) { res.status(err.message === "Batch not found" ? 404 : 400).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/messages/batch/:batchId/cancel", async (req: any, res) => {
  try {
    const batch = await openwaMessages.cancelBatch(req.params.batchId);
    res.json(batch);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
