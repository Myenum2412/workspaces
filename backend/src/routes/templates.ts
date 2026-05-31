import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { MessageTemplate } from "../models/index.js";
import { connectDB } from "../config/connection.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { category, search, page = "1", limit = "50" } = req.query;
    await connectDB();
    const filter: any = { organizationId: authReq.user!.organizationId };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search as string, $options: "i" };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const total = await MessageTemplate.countDocuments(filter);
    const templates = await MessageTemplate.find(filter).sort({ updatedAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean();
    res.json({ total, page: pageNum, limit: limitNum, templates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const template = await MessageTemplate.findOne({ _id: req.params.id, organizationId: authReq.user!.organizationId }).lean();
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { name, category, language, body, variables, header, headerType, footer, buttons } = req.body;
    if (!name || !body) return res.status(400).json({ error: "Name and body required" });
    await connectDB();
    const template = await MessageTemplate.create({
      _id: crypto.randomUUID(),
      organizationId: authReq.user!.organizationId,
      name, category: category || "marketing", language: language || "en",
      body, variables: variables || [], header, headerType, footer,
      buttons: buttons || [], isActive: true,
    });
    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const update: any = { ...req.body, updatedAt: new Date().toISOString() };
    delete update.organizationId;
    const template = await MessageTemplate.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId },
      update, { new: true },
    ).lean();
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const result = await MessageTemplate.deleteOne({ _id: req.params.id, organizationId: authReq.user!.organizationId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Template not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
