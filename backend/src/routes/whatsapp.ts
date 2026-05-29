import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { OrgMember } from "../models/index.js";
import { whatsappService } from "../services/whatsapp.js";

const SUPER_ADMIN_EMAIL = "zoo@myenum.in";

const router = Router();
router.use(authenticate);

// Helper: verify user belongs to the org
async function verifyOrgAccess(req: AuthRequest, organizationId: string): Promise<boolean> {
  if (req.user!.email.toLowerCase() === SUPER_ADMIN_EMAIL) return true;
  return req.user!.organizationId === organizationId;
}

// Helper: verify user is owner/admin
async function verifyAdminAccess(req: AuthRequest): Promise<boolean> {
  if (req.user!.email.toLowerCase() === SUPER_ADMIN_EMAIL) return true;
  const member = await OrgMember.findOne({ userId: req.user!.userId }).lean() as any;
  return member && ["owner", "admin"].includes(member.role);
}

// ── Create WhatsApp Instance ───────────────────────────────
router.post("/instances", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { instanceName } = req.body;

    if (!(await verifyAdminAccess(authReq))) {
      return res.status(403).json({ error: "Only admin can create WhatsApp instances" });
    }

    const instance = await whatsappService.createInstance(
      authReq.user!.organizationId,
      authReq.user!.userId,
      instanceName || "WhatsApp"
    );

    res.status(201).json({ success: true, instance });
  } catch (error: any) {
    console.error("[WA create instance]", error);
    res.status(400).json({ error: error.message || "Failed to create instance" });
  }
});

// ── Get Instance ───────────────────────────────────────────
router.get("/instances", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const instances = await whatsappService.getInstancesByOrg(authReq.user!.organizationId);
    res.json({ instances });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Connect (Generate QR) ──────────────────────────────────
router.post("/connect", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;

    if (!(await verifyAdminAccess(authReq))) {
      return res.status(403).json({ error: "Only admin can connect WhatsApp" });
    }

    const qrData = await whatsappService.connect(authReq.user!.organizationId);
    res.json({ success: true, qr: qrData.qr, timestamp: qrData.timestamp });
  } catch (error: any) {
    console.error("[WA connect]", error);
    res.status(400).json({ error: error.message || "Failed to connect" });
  }
});

// ── Disconnect ─────────────────────────────────────────────
router.post("/disconnect", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;

    if (!(await verifyAdminAccess(authReq))) {
      return res.status(403).json({ error: "Only admin can disconnect WhatsApp" });
    }

    await whatsappService.disconnect(authReq.user!.organizationId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Get Connection Status ──────────────────────────────────
router.get("/status", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const instance = await whatsappService.getInstance(authReq.user!.organizationId);
    res.json({
      instance: instance || null,
      connected: instance?.connectionStatus === "connected",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Send Message ───────────────────────────────────────────
router.post("/send", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: "Recipient and message are required" });
    }

    const result = await whatsappService.sendMessage(
      authReq.user!.organizationId,
      to,
      message
    );

    res.json({ success: true, result });
  } catch (error: any) {
    console.error("[WA send]", error);
    res.status(400).json({ error: error.message || "Failed to send message" });
  }
});

// ── Get Chats ──────────────────────────────────────────────
router.get("/chats", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const chats = await whatsappService.getChats(authReq.user!.organizationId);
    res.json({ chats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Get Messages ───────────────────────────────────────────
router.get("/chats/:jid/messages", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { jid } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await whatsappService.getMessages(
      authReq.user!.organizationId,
      jid,
      limit
    );
    res.json({ messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Delete Instance ────────────────────────────────────────
router.delete("/instances", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;

    if (!(await verifyAdminAccess(authReq))) {
      return res.status(403).json({ error: "Only admin can delete WhatsApp instances" });
    }

    await whatsappService.deleteInstance(authReq.user!.organizationId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
