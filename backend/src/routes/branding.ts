/**
 * Branding API routes — CRUD, validation, history, rollback.
 * All routes require authentication. Mutations require admin/owner role.
 */
import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { BrandingConfig, BrandingHistory, IBrandingConfig, defaultBrandingColors } from "../models/index.js";
import { getIO } from "../ws/server.js";
import { AuditLog } from "../models/index.js";

async function auditLog(data: {
  action: string;
  actorId: string;
  actorName: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    // Best-effort — don't fail the request if audit logging fails
    await AuditLog.create({
      organizationId: data.resourceId,
      action: data.action,
      severity: "info",
      userId: data.actorId,
      userEmail: data.actorName,
      method: "PUT",
      path: `/api/branding`,
      metadata: data.metadata || {},
    });
  } catch (err) {
    console.error("[Branding] Audit log error:", (err as Error).message);
  }
}

const router = Router();
router.use(authenticate);

// ── Color validation helpers ──────────────────────────────────

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const RGB_REGEX = /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
const HSL_REGEX = /^hsl\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)$/;

function isValidColor(value: string): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (HEX_REGEX.test(v)) return true;
  if (RGB_REGEX.test(v)) {
    const m = v.match(RGB_REGEX);
    if (m) return [m[1], m[2], m[3]].every((n) => parseInt(n) <= 255);
  }
  if (HSL_REGEX.test(v)) {
    const m = v.match(HSL_REGEX);
    if (m) return parseInt(m[1]) <= 360 && parseInt(m[2]) <= 100 && parseInt(m[3]) <= 100;
  }
  // Named CSS colors — allow common ones
  const namedColors = ["white", "black", "transparent", "currentColor", "inherit"];
  if (namedColors.includes(v.toLowerCase())) return true;
  return false;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  let r = 0, g = 0, b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  } else {
    return null;
  }
  return { r, g, b };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hex2 === "#ffffff" ? { r: 255, g: 255, b: 255 } :
                hex2 === "#000000" ? { r: 0, g: 0, b: 0 } : hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;
  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── Helper: get user's organization ID ───────────────────────

async function getUserOrgId(userId: string): Promise<string | null> {
  const { OrgMember } = await import("../models/index.js");
  const member = await OrgMember.findOne({ userId }).lean() as any;
  return member?.organizationId ?? null;
}

// ── Permission check ──────────────────────────────────────────

function requireAdmin(actor: any, res: Response): boolean {
  if (actor.role !== "admin" && actor.role !== "owner") {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

// ── GET /api/branding ─────────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const orgId = await getUserOrgId(authReq.user!.userId);
    if (!orgId) return res.status(404).json({ error: "Organization not found" });

    let config = await BrandingConfig.findOne({ organizationId: orgId }).lean() as IBrandingConfig | null;

    if (!config) {
      // Return defaults — don't create until admin explicitly saves
      return res.json({
        success: true,
        branding: {
          organizationId: orgId,
          colors: defaultBrandingColors,
          darkModeColors: {},
          typography: { fontFamily: "Poppins", headingFont: "Poppins", monoFont: "JetBrains Mono", baseFontSize: 16 },
          logo: { url: "", width: 200, height: 40, darkModeUrl: "" },
          favicon: "",
          mode: "light",
          presetName: "emerald",
          version: 0,
        },
        isDefault: true,
      });
    }

    res.json({ success: true, branding: config, isDefault: false });
  } catch (error: any) {
    console.error("[Branding] GET error:", error);
    res.status(500).json({ error: "Failed to fetch branding settings" });
  }
});

// ── PUT /api/branding ─────────────────────────────────────────

router.put("/", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const actor = authReq.user!;
    if (!requireAdmin(actor, res)) return;

    const orgId = await getUserOrgId(actor.userId);
    if (!orgId) return res.status(404).json({ error: "Organization not found" });

    const { colors, darkModeColors, typography, logo, favicon, mode, presetName } = req.body;

    // Validate color fields
    if (colors) {
      for (const [key, value] of Object.entries(colors)) {
        if (value && typeof value === "string" && !isValidColor(value)) {
          return res.status(400).json({ error: `Invalid color value for ${key}: ${value}` });
        }
      }
    }

    // Load current config for change tracking
    const current = await BrandingConfig.findOne({ organizationId: orgId }).lean() as IBrandingConfig | null;
    const currentVersion = current?.version ?? 0;
    const newVersion = currentVersion + 1;

    // Build changes array
    const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];
    if (colors && current?.colors) {
      for (const key of Object.keys(colors)) {
        const oldVal = (current.colors as any)?.[key];
        const newVal = colors[key];
        if (oldVal !== newVal) {
          changes.push({ field: `colors.${key}`, oldValue: String(oldVal ?? ""), newValue: String(newVal) });
        }
      }
    }
    if (mode && current?.mode && mode !== current.mode) {
      changes.push({ field: "mode", oldValue: current.mode, newValue: mode });
    }
    if (presetName && current?.presetName && presetName !== current.presetName) {
      changes.push({ field: "presetName", oldValue: current.presetName, newValue: presetName });
    }

    // Build update object
    const update: Record<string, any> = {
      organizationId: orgId,
      updatedBy: actor.userId,
      version: newVersion,
    };
    if (colors) update.colors = { ...(current?.colors || defaultBrandingColors), ...colors };
    if (darkModeColors) update.darkModeColors = darkModeColors;
    if (typography) update.typography = { ...current?.typography, ...typography };
    if (logo) update.logo = { ...current?.logo, ...logo };
    if (favicon !== undefined) update.favicon = favicon;
    if (mode) update.mode = mode;
    if (presetName) update.presetName = presetName;

    const updated = await BrandingConfig.findOneAndUpdate(
      { organizationId: orgId },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Save history
    if (changes.length > 0) {
      await BrandingHistory.create({
        organizationId: orgId,
        version: newVersion,
        changes,
        snapshot: updated.toObject(),
        updatedBy: actor.userId,
        updatedByName: actor.email || actor.userId,
      });
    }

    // Audit log
    await auditLog({
      action: "branding.update",
      actorId: actor.userId,
      actorName: actor.email || actor.userId,
      resourceType: "branding",
      resourceId: orgId,
      metadata: { version: newVersion, changes: changes.map(c => c.field) },
    });

    // Emit real-time update to all org members
    const io = getIO();
    if (io) {
      io.to(`org:${orgId}`).emit("branding_updated", {
        branding: updated.toObject(),
        version: newVersion,
        updatedBy: actor.userId,
      });
    }

    res.json({ success: true, branding: updated, version: newVersion });
  } catch (error: any) {
    console.error("[Branding] PUT error:", error);
    res.status(500).json({ error: "Failed to update branding settings" });
  }
});

// ── GET /api/branding/history ─────────────────────────────────

router.get("/history", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const orgId = await getUserOrgId(authReq.user!.userId);
    if (!orgId) return res.status(404).json({ error: "Organization not found" });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      BrandingHistory.find({ organizationId: orgId })
        .sort({ version: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BrandingHistory.countDocuments({ organizationId: orgId }),
    ]);

    res.json({
      success: true,
      history: entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("[Branding] GET history error:", error);
    res.status(500).json({ error: "Failed to fetch branding history" });
  }
});

// ── POST /api/branding/rollback ───────────────────────────────

router.post("/rollback", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const actor = authReq.user!;
    if (!requireAdmin(actor, res)) return;

    const orgId = await getUserOrgId(actor.userId);
    if (!orgId) return res.status(404).json({ error: "Organization not found" });

    const { version } = req.body;
    if (!version || typeof version !== "number") {
      return res.status(400).json({ error: "Target version required" });
    }

    // Find the target history entry
    const targetHistory = await BrandingHistory.findOne({
      organizationId: orgId,
      version,
    }).lean();

    if (!targetHistory) {
      return res.status(404).json({ error: `Version ${version} not found in history` });
    }

    const current = await BrandingConfig.findOne({ organizationId: orgId }).lean() as IBrandingConfig | null;
    const newVersion = (current?.version ?? 0) + 1;

    // Restore from snapshot
    const snapshot = (targetHistory as any).snapshot;
    const restored = await BrandingConfig.findOneAndUpdate(
      { organizationId: orgId },
      {
        $set: {
          colors: snapshot.colors || defaultBrandingColors,
          darkModeColors: snapshot.darkModeColors || {},
          typography: snapshot.typography || {},
          logo: snapshot.logo || {},
          favicon: snapshot.favicon || "",
          mode: snapshot.mode || "light",
          presetName: snapshot.presetName || "emerald",
          version: newVersion,
          updatedBy: actor.userId,
        },
      },
      { upsert: true, new: true }
    );

    // Record rollback in history
    await BrandingHistory.create({
      organizationId: orgId,
      version: newVersion,
      changes: [{ field: "rollback", oldValue: `v${current?.version}`, newValue: `v${version}` }],
      snapshot: restored.toObject(),
      updatedBy: actor.userId,
      updatedByName: actor.email || actor.userId,
      rollbackFrom: version,
    });

    // Audit log
    await auditLog({
      action: "branding.rollback",
      actorId: actor.userId,
      actorName: actor.email || actor.userId,
      resourceType: "branding",
      resourceId: orgId,
      metadata: { rolledBackTo: version, newVersion },
    });

    // Emit real-time update
    const io = getIO();
    if (io) {
      io.to(`org:${orgId}`).emit("branding_updated", {
        branding: restored.toObject(),
        version: newVersion,
        updatedBy: actor.userId,
        rollback: true,
      });
    }

    res.json({ success: true, branding: restored, version: newVersion });
  } catch (error: any) {
    console.error("[Branding] POST rollback error:", error);
    res.status(500).json({ error: "Failed to rollback branding" });
  }
});

// ── POST /api/branding/validate ───────────────────────────────

router.post("/validate", async (req: Request, res: Response) => {
  try {
    const { colors } = req.body;
    if (!colors || typeof colors !== "object") {
      return res.status(400).json({ error: "Colors object required" });
    }

    const results: Record<string, { valid: boolean; contrastAA: boolean; contrastAAA: boolean; ratio: number; message: string }> = {};

    for (const [key, value] of Object.entries(colors)) {
      if (typeof value !== "string") continue;
      const valid = isValidColor(value);

      // Check contrast against white and black
      let ratio = 0;
      let contrastAA = false;
      let contrastAAA = false;
      let message = "";

      if (valid && value.startsWith("#")) {
        const ratioWhite = contrastRatio(value, "#ffffff");
        const ratioBlack = contrastRatio(value, "#000000");
        ratio = Math.max(ratioWhite, ratioBlack);
        contrastAA = ratio >= 4.5;
        contrastAAA = ratio >= 7;
        message = contrastAAA ? "AAA — Excellent" :
                  contrastAA ? "AA — Good" :
                  ratio >= 3 ? "AA Large — Acceptable for large text only" :
                  "Fail — Insufficient contrast";
      }

      results[key] = { valid, contrastAA, contrastAAA, ratio: Math.round(ratio * 100) / 100, message };
    }

    res.json({ success: true, validation: results });
  } catch (error: any) {
    console.error("[Branding] POST validate error:", error);
    res.status(500).json({ error: "Failed to validate colors" });
  }
});

// ── POST /api/branding/reset ──────────────────────────────────

router.post("/reset", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const actor = authReq.user!;
    if (!requireAdmin(actor, res)) return;

    const orgId = await getUserOrgId(actor.userId);
    if (!orgId) return res.status(404).json({ error: "Organization not found" });

    const current = await BrandingConfig.findOne({ organizationId: orgId }).lean() as IBrandingConfig | null;
    const newVersion = (current?.version ?? 0) + 1;

    const reset = await BrandingConfig.findOneAndUpdate(
      { organizationId: orgId },
      {
        $set: {
          colors: defaultBrandingColors,
          darkModeColors: {},
          typography: { fontFamily: "Poppins", headingFont: "Poppins", monoFont: "JetBrains Mono", baseFontSize: 16 },
          logo: { url: "", width: 200, height: 40, darkModeUrl: "" },
          favicon: "",
          mode: "light",
          presetName: "emerald",
          version: newVersion,
          updatedBy: actor.userId,
        },
      },
      { upsert: true, new: true }
    );

    await BrandingHistory.create({
      organizationId: orgId,
      version: newVersion,
      changes: [{ field: "reset", oldValue: "custom", newValue: "default" }],
      snapshot: reset.toObject(),
      updatedBy: actor.userId,
      updatedByName: actor.email || actor.userId,
    });

    const io = getIO();
    if (io) {
      io.to(`org:${orgId}`).emit("branding_updated", {
        branding: reset.toObject(),
        version: newVersion,
        updatedBy: actor.userId,
        reset: true,
      });
    }

    res.json({ success: true, branding: reset, version: newVersion });
  } catch (error: any) {
    console.error("[Branding] POST reset error:", error);
    res.status(500).json({ error: "Failed to reset branding" });
  }
});

export default router;
