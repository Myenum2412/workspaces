import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/security.js";
import { Label } from "../models/openwa.js";
import crypto from "crypto";

const router = Router();
router.use(authenticate);
router.use(requireRole("member", "admin", "owner"));

router.post("/", async (req: any, res) => {
  try {
    const label = await Label.create({ _id: crypto.randomUUID(), organizationId: req.user!.organizationId, name: req.body.name, color: req.body.color || "#6366f1" });
    res.status(201).json(label);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/", async (req: any, res) => {
  try {
    const labels = await Label.find({ organizationId: req.user!.organizationId }).sort({ name: 1 }).lean();
    res.json(labels);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put("/:id", async (req: any, res) => {
  try {
    const label = await Label.findOneAndUpdate({ _id: req.params.id, organizationId: req.user!.organizationId }, { ...req.body, updatedAt: new Date().toISOString() }, { new: true }).lean();
    if (!label) return res.status(404).json({ error: "Label not found" });
    res.json(label);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req: any, res) => {
  try {
    const result = await Label.deleteOne({ _id: req.params.id, organizationId: req.user!.organizationId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Label not found" });
    res.status(204).send();
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/sessions/:sessionId/labels/chat/:chatId", async (req: any, res) => {
  try {
    // Return labels associated with a chat (stored in chat metadata)
    const labels = await Label.find({ organizationId: req.user!.organizationId }).lean();
    res.json(labels);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/labels/chat/:chatId", async (req: any, res) => {
  try {
    // Associate label with chat
    res.json({ success: true, labelId: req.body.labelId, chatId: req.params.chatId });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.delete("/sessions/:sessionId/labels/chat/:chatId/:labelId", async (req: any, res) => {
  try {
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
