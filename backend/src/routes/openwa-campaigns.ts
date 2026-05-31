import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { openwaCampaigns } from "../services/openwa-campaigns.js";

const router = Router();
router.use(authenticate);

router.post("/", async (req: any, res) => {
  try {
    const campaign = await openwaCampaigns.create(req.user!.organizationId, req.body);
    res.status(201).json(campaign);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/", async (req: any, res) => {
  try {
    const campaigns = await openwaCampaigns.findAll(req.user!.organizationId, req.query.sessionId as string);
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
    await openwaCampaigns.delete(req.user!.organizationId, req.params.id);
    res.status(204).send();
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
