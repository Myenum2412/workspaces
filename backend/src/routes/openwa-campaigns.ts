import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/security.js";
import { openwaCampaigns } from "../services/openwa-campaigns.js";

const router = Router();
router.use(authenticate);
router.use(requireRole("member", "admin", "owner"));

router.post("/", async (req: any, res) => {
  try {
    const campaign = await openwaCampaigns.create(req.user!.organizationId, req.body);
    res.status(201).json(campaign);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/", async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string | undefined;
    const campaigns = await openwaCampaigns.findAll(req.user!.organizationId, req.query.sessionId as string, { page, limit, status });
    res.json(campaigns);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req: any, res) => {
  try {
    const campaign = await openwaCampaigns.findOne(req.user!.organizationId, req.params.id);
    res.json(campaign);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.put("/:id", async (req: any, res) => {
  try {
    const campaign = await openwaCampaigns.update(req.user!.organizationId, req.params.id, req.body);
    res.json(campaign);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.delete("/:id", async (req: any, res) => {
  try {
    await openwaCampaigns.softDelete(req.user!.organizationId, req.params.id);
    res.status(204).send();
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.post("/:id/restore", async (req: any, res) => {
  try {
    const campaign = await openwaCampaigns.restore(req.user!.organizationId, req.params.id);
    res.json(campaign);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.post("/:id/start", async (req: any, res) => {
  try {
    const campaign = await openwaCampaigns.startCampaign(req.user!.organizationId, req.params.id);
    res.json(campaign);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/:id/pause", async (req: any, res) => {
  try {
    const campaign = await openwaCampaigns.pauseCampaign(req.user!.organizationId, req.params.id);
    res.json(campaign);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/:id/cancel", async (req: any, res) => {
  try {
    const campaign = await openwaCampaigns.cancelCampaign(req.user!.organizationId, req.params.id);
    res.json(campaign);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/:id/stats", async (req: any, res) => {
  try {
    const stats = await openwaCampaigns.getStats(req.user!.organizationId, req.params.id);
    res.json(stats);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

export default router;
