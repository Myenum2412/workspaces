import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { openwaWebhooks } from "../services/openwa-webhooks.js";

const router = Router();
router.use(authenticate);

router.post("/sessions/:sessionId/webhooks", async (req: any, res) => {
  try {
    const webhook = await openwaWebhooks.create(req.user!.organizationId, req.params.sessionId, req.body);
    res.status(201).json(webhook);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/sessions/:sessionId/webhooks", async (req: any, res) => {
  try {
    const webhooks = await openwaWebhooks.findBySession(req.user!.organizationId, req.params.sessionId);
    res.json(webhooks);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/webhooks/:id", async (req: any, res) => {
  try {
    const webhook = await openwaWebhooks.findOne(req.user!.organizationId, req.params.id);
    res.json(webhook);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.put("/webhooks/:id", async (req: any, res) => {
  try {
    const webhook = await openwaWebhooks.update(req.user!.organizationId, req.params.id, req.body);
    res.json(webhook);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.delete("/webhooks/:id", async (req: any, res) => {
  try {
    await openwaWebhooks.delete(req.user!.organizationId, req.params.id);
    res.status(204).send();
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.post("/webhooks/:id/test", async (req: any, res) => {
  try {
    const result = await openwaWebhooks.test(req.user!.organizationId, req.params.id);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
