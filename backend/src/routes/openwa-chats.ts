import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/security.js";
import { openwaChats } from "../services/openwa-chats.js";
import { Message } from "../models/openwa.js";

const router = Router();
router.use(authenticate);
router.use(requireRole("member", "admin", "owner"));

// ── Chat List ──────────────────────────────────────────────
router.get("/", async (req: any, res) => {
  try {
    const { sessionId, archived, pinned } = req.query;
    const filter: any = {};
    if (archived !== undefined) filter.archived = archived === "true";
    if (pinned !== undefined) filter.pinned = pinned === "true";
    const chats = await openwaChats.getChats(req.user!.organizationId, sessionId as string, filter);
    res.json(chats);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Chat History / Get Chat ────────────────────────────────
router.get("/:chatId", async (req: any, res) => {
  try {
    const chat = await openwaChats.getChat(req.user!.organizationId, req.params.chatId);
    res.json(chat);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

// ── Messages for Chat ──────────────────────────────────────
router.get("/:chatId/messages", async (req: any, res) => {
  try {
    const { limit, before, direction } = req.query;
    const chatId = decodeURIComponent(req.params.chatId);
    const jid = chatId.includes("@") ? chatId : `${chatId}@s.whatsapp.net`;
    let q: any = { organizationId: req.user!.organizationId, chatId: jid };
    if (before) q.createdAt = { $lt: before as string };
    if (direction) q.direction = direction as string;

    const messages = await Message.find(q)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string) || 50)
      .lean();
    res.json({ messages: messages.reverse(), total: await Message.countDocuments({ organizationId: req.user!.organizationId, chatId: jid }) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Sync Chats from Baileys ────────────────────────────────
router.post("/sessions/:sessionId/sync", async (req: any, res) => {
  try {
    const result = await openwaChats.syncChatsFromBaileys(req.user!.organizationId, req.params.sessionId);
    res.json({ synced: result.length });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── Send Seen (Mark as Read) ───────────────────────────────
router.post("/:chatId/seen", async (req: any, res) => {
  try {
    const { sessionId, messageIds } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });
    const result = await openwaChats.sendSeen(req.user!.organizationId, sessionId, req.params.chatId, messageIds || []);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── Clear Chat History ─────────────────────────────────────
router.post("/:chatId/clear", async (req: any, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });
    const result = await openwaChats.clearChat(req.user!.organizationId, sessionId, req.params.chatId);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── Archive/Unarchive ──────────────────────────────────────
router.post("/:chatId/archive", async (req: any, res) => {
  try {
    const result = await openwaChats.archiveChat(req.user!.organizationId, req.params.chatId, true);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.delete("/:chatId/archive", async (req: any, res) => {
  try {
    const result = await openwaChats.archiveChat(req.user!.organizationId, req.params.chatId, false);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── Pin/Unpin ──────────────────────────────────────────────
router.post("/:chatId/pin", async (req: any, res) => {
  try {
    const result = await openwaChats.pinChat(req.user!.organizationId, req.params.chatId, true);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.delete("/:chatId/pin", async (req: any, res) => {
  try {
    const result = await openwaChats.pinChat(req.user!.organizationId, req.params.chatId, false);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── Mute/Unmute ────────────────────────────────────────────
router.post("/:chatId/mute", async (req: any, res) => {
  try {
    const { untilMs } = req.body;
    if (!untilMs) return res.status(400).json({ error: "untilMs required" });
    const result = await openwaChats.muteChat(req.user!.organizationId, req.params.chatId, untilMs);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.delete("/:chatId/mute", async (req: any, res) => {
  try {
    const result = await openwaChats.unmuteChat(req.user!.organizationId, req.params.chatId);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
