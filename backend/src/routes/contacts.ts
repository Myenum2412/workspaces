import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { Contact } from "../models/index.js";
import { connectDB } from "../config/connection.js";

const router = Router();
router.use(authenticate);

// ── List contacts ───────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { search, isBlocked, page = "1", limit = "50" } = req.query;
    await connectDB();

    const filter: any = { organizationId: authReq.user!.organizationId };
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === "true";
    if (search) {
      const s = search as string;
      filter.$or = [
        { name: { $regex: s, $options: "i" } },
        { pushName: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } },
        { waContactId: { $regex: s, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const total = await Contact.countDocuments(filter);
    const contacts = await Contact.find(filter)
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({ total, page: pageNum, limit: limitNum, contacts });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch contacts" });
  }
});

// ── Get single contact ──────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const contact = await Contact.findOne({
      _id: req.params.id,
      organizationId: authReq.user!.organizationId,
    }).lean();
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json(contact);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Bulk import contacts ────────────────────────────────────
router.post("/import", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { contacts } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: "Contacts array required" });
    }
    await connectDB();

    const orgId = authReq.user!.organizationId;
    const ops = contacts.map((c: any) => ({
      updateOne: {
        filter: { organizationId: orgId, waContactId: c.waContactId },
        update: {
          $set: {
            ...c,
            _id: c._id || crypto.randomUUID(),
            organizationId: orgId,
            updatedAt: new Date().toISOString(),
          },
          $setOnInsert: { createdAt: new Date().toISOString() },
        },
        upsert: true,
      },
    }));

    const result = await Contact.bulkWrite(ops);
    res.json({
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Block/Unblock contact ───────────────────────────────────
router.post("/:id/block", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId },
      { isBlocked: true, updatedAt: new Date().toISOString() },
      { new: true },
    ).lean();
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json({ success: true, contact });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id/block", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId },
      { isBlocked: false, updatedAt: new Date().toISOString() },
      { new: true },
    ).lean();
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json({ success: true, contact });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Delete contact ──────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const result = await Contact.deleteOne({
      _id: req.params.id,
      organizationId: authReq.user!.organizationId,
    });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Contact not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
