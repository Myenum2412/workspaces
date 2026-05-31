import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/security.js";
import { openwaTemplates } from "../services/openwa-templates.js";

const router = Router();
router.use(authenticate);
router.use(requireRole("member", "admin", "owner"));

// CRUD
router.post("/", async (req: any, res) => {
  try {
    const template = await openwaTemplates.create(req.user!.organizationId, req.body);
    res.status(201).json(template);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/", async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const templates = await openwaTemplates.findAll(req.user!.organizationId, { page, limit, category, search });
    res.json(templates);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req: any, res) => {
  try {
    const template = await openwaTemplates.findOne(req.user!.organizationId, req.params.id);
    res.json(template);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.put("/:id", async (req: any, res) => {
  try {
    const template = await openwaTemplates.update(req.user!.organizationId, req.params.id, req.body);
    res.json(template);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.delete("/:id", async (req: any, res) => {
  try {
    await openwaTemplates.delete(req.user!.organizationId, req.params.id);
    res.status(204).send();
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

// Send using template
router.post("/:id/send", async (req: any, res) => {
  try {
    const { sessionId, chatId, variables } = req.body;
    if (!sessionId || !chatId) return res.status(400).json({ error: "sessionId and chatId required" });
    const result = await openwaTemplates.sendWithTemplate(req.user!.organizationId, sessionId, {
      chatId, templateId: req.params.id, variables: variables || {},
    });
    res.status(201).json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
