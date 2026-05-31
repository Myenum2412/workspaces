import { Router, Request, Response } from "express";
import crypto from "crypto";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { Campaign, MessageTemplate, Contact, WhatsappInstance, WhatsappMessage } from "../models/index.js";
import { connectDB } from "../config/connection.js";

const router = Router();
router.use(authenticate);

// ── List campaigns ──────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { status, page = "1", limit = "20" } = req.query;
    await connectDB();
    const filter: any = { organizationId: authReq.user!.organizationId };
    if (status) filter.status = status;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const total = await Campaign.countDocuments(filter);
    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean();
    res.json({ total, campaigns });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Create campaign ─────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { name, description, sessionId, templateId, audienceType, audienceFilter, scheduledAt } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    await connectDB();
    const campaign = await Campaign.create({
      _id: crypto.randomUUID(),
      organizationId: authReq.user!.organizationId,
      sessionId: sessionId || "default",
      name, description, templateId, audienceType: audienceType || "all_contacts",
      audienceFilter: audienceFilter || {}, audienceCount: 0, scheduledAt,
      status: scheduledAt ? "scheduled" : "draft",
      stats: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 },
    });
    res.status(201).json(campaign);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Update campaign ─────────────────────────────────────────
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    delete req.body.organizationId;
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId },
      { ...req.body, updatedAt: new Date().toISOString() },
      { new: true },
    ).lean();
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Delete campaign ─────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const result = await Campaign.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId },
      { $set: { deletedAt: new Date().toISOString() } },
      { new: true }
    ).lean();
    if (!result) return res.status(404).json({ error: "Campaign not found" });
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/:id/restore", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const restored = await Campaign.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId, deletedAt: { $ne: null } },
      { $unset: { deletedAt: 1 } },
      { new: true }
    ).lean();
    if (!restored) return res.status(404).json({ error: "Campaign not found or not deleted" });
    res.json({ success: true, campaign: restored });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Execute campaign ────────────────────────────────────────
router.post("/:id/execute", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const campaign = await Campaign.findOne({ _id: req.params.id, organizationId: authReq.user!.organizationId });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      return res.status(400).json({ error: `Cannot execute campaign in status: ${campaign.status}` });
    }

    // Get target audience
    const contactFilter: any = { organizationId: campaign.organizationId };
    if (campaign.audienceType === "group" && campaign.audienceFilter?.groupId) {
      contactFilter.groupId = campaign.audienceFilter.groupId;
    }
    const contacts = await Contact.find(contactFilter).lean();
    campaign.audienceCount = contacts.length;
    campaign.stats.total = contacts.length;
    campaign.stats.pending = contacts.length;
    campaign.status = "running";
    campaign.startedAt = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();
    await campaign.save();

    res.json({ success: true, message: `Campaign started. Targeting ${contacts.length} contacts.` });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Pause/Resume campaign ───────────────────────────────────
router.post("/:id/pause", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId, status: "running" },
      { status: "paused", updatedAt: new Date().toISOString() },
      { new: true },
    ).lean();
    if (!campaign) return res.status(404).json({ error: "Campaign not found or not running" });
    res.json(campaign);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/:id/resume", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId, status: "paused" },
      { status: "running", updatedAt: new Date().toISOString() },
      { new: true },
    ).lean();
    if (!campaign) return res.status(404).json({ error: "Campaign not found or not paused" });
    res.json(campaign);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Export campaigns ────────────────────────────────────────
router.get("/export", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const { status } = req.query;
    const filter: any = { organizationId: authReq.user!.organizationId };
    if (status) filter.status = status;
    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 }).lean();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="campaigns-${Date.now()}.json"`);
    res.json({ total: campaigns.length, campaigns, exportedAt: new Date().toISOString() });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Bulk update campaign status ─────────────────────────────
router.patch("/bulk/status", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !status) return res.status(400).json({ error: "ids and status required" });
    await connectDB();
    const result = await Campaign.updateMany(
      { _id: { $in: ids }, organizationId: authReq.user!.organizationId },
      { $set: { status, updatedAt: new Date().toISOString() } }
    );
    res.json({ success: true, modified: result.modifiedCount });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Campaign stats ──────────────────────────────────────────
router.get("/:id/stats", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const campaign = await Campaign.findOne({ _id: req.params.id, organizationId: authReq.user!.organizationId }).lean();
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json((campaign as any).stats);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

export default router;
