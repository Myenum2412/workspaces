import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { openwaAutomation } from "../services/openwa-automation.js";

const router = Router();
router.use(authenticate);

router.post("/rules", async (req: any, res) => {
  try {
    const rule = await openwaAutomation.create(req.user!.organizationId, req.body);
    res.status(201).json(rule);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/rules", async (req: any, res) => {
  try {
    const rules = await openwaAutomation.findAll(req.user!.organizationId, req.query.sessionId as string);
    res.json(rules);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/rules/:id", async (req: any, res) => {
  try {
    const rule = await openwaAutomation.findOne(req.user!.organizationId, req.params.id);
    res.json(rule);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.put("/rules/:id", async (req: any, res) => {
  try {
    const rule = await openwaAutomation.update(req.user!.organizationId, req.params.id, req.body);
    res.json(rule);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.delete("/rules/:id", async (req: any, res) => {
  try {
    await openwaAutomation.delete(req.user!.organizationId, req.params.id);
    res.status(204).send();
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.post("/rules/:id/toggle", async (req: any, res) => {
  try {
    const rule = await openwaAutomation.toggle(req.user!.organizationId, req.params.id);
    res.json(rule);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

export default router;
