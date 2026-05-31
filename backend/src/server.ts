import "dotenv/config";

// ── Validate environment BEFORE any other imports ────────────
import { env } from "./config/env.js";

import express from "express";
import cors from "cors";
import passport from "passport";
import path from "path";
import fs from "fs";
import compression from "compression";
import { createServer } from "http";
import { connectDB } from "./config/connection.js";
import { initSocketServer } from "./ws/server.js";
import { whatsappService } from "./services/whatsapp.js";
import { openwaSessions } from "./services/openwa-session.js";
import { securityHeaders, sanitizeInput, mongoSanitizeMiddleware } from "./middleware/security.js";
import { requestIdMiddleware } from "./core/middleware/requestId.js";
import { globalErrorHandler } from "./core/errors/handler.js";
import { apiResponse } from "./core/utils/apiResponse.js";

// Core routes
import authRoutes from "./routes/auth.js";
import inviteRoutes from "./routes/invites.js";
import setupRoutes from "./routes/setup.js";
import uploadRoutes from "./routes/upload.js";
import whatsappRoutes from "./routes/whatsapp.js";
import contactRoutes from "./routes/contacts.js";
import webhookRoutes from "./routes/webhooks.js";
import templateRoutes from "./routes/templates.js";
import campaignRoutesOld from "./routes/campaigns.js";
import { auditMiddleware } from "./middleware/audit.js";
import profileRoutes from "./routes/profile.js";
import workspaceRoutes from "./routes/workspace.js";
import staffRoutes from "./routes/staff.js";
import taskRoutes from "./routes/tasks.js";

// Entity routes (replaces generic /api/db proxy)
import teamRoutes from "./routes/team-routes.js";
import clientRoutes from "./routes/client-routes.js";
import branchRoutes from "./routes/branch-routes.js";
import orgRoutes from "./routes/org-routes.js";

// OpenWA migrated routes
import openwaSessionRoutes from "./routes/openwa-sessions.js";
import openwaMessageRoutes from "./routes/openwa-messages.js";
import openwaWebhookRoutes from "./routes/openwa-webhooks.js";
import openwaContactRoutes from "./routes/openwa-contacts.js";
import openwaGroupRoutes from "./routes/openwa-groups.js";
import openwaCampaignRoutes from "./routes/openwa-campaigns.js";
import openwaAutomationRoutes from "./routes/openwa-automation.js";
import openwaStatsRoutes from "./routes/openwa-stats.js";
import openwaLabelRoutes from "./routes/openwa-labels.js";
import openwaChatRoutes from "./routes/openwa-chats.js";
import openwaTemplateRoutes from "./routes/openwa-templates.js";

// Admin
import adminRoutes from "./routes/admin.js";
import { checkHealth } from "./services/health.js";

const app = express();

// ── Trust proxy ─────────────────────────────────────────────
app.set("trust proxy", 1);

// ── Core Middleware ─────────────────────────────────────────
app.use(requestIdMiddleware);
app.use(securityHeaders);
app.use(mongoSanitizeMiddleware);

// CORS
const allowedOrigins = env.FRONTEND_URL.split(",").map((s) => s.trim());
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  exposedHeaders: ["X-Request-ID"],
  maxAge: 86400,
}));

app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(passport.initialize());
app.use(sanitizeInput);

// ── Rate limiting ──────────────────────────────────────────
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many auth attempts. Try again in 15 minutes." } },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 120,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." } },
});

app.use("/api/auth/", authLimiter);
app.use("/api/", apiLimiter);

// ── Audit logging ──────────────────────────────────────────
app.use("/api", auditMiddleware);

// ── Route Mounting ─────────────────────────────────────────
// Auth & Users
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/invites", inviteRoutes);

// Workspace
app.use("/api/workspace", workspaceRoutes);

// Tasks (CRUD + saved templates)
app.use("/api/tasks", taskRoutes);

// Entities (mounted at their collection paths)
app.use("/api/teams", teamRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/branches", branchRoutes);
// Org routes: /api/organizations, /api/members, /api/invitations, /api/master-data
app.use("/api", orgRoutes);

// WhatsApp
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/campaigns", campaignRoutesOld);
app.use("/api/upload", uploadRoutes);
app.use("/api/setup", setupRoutes);

// Admin
app.use("/api/admin", adminRoutes);

// OpenWA
app.use("/api/openwa/sessions", openwaSessionRoutes);
app.use("/api/openwa", openwaMessageRoutes);
app.use("/api/openwa", openwaWebhookRoutes);
app.use("/api/openwa", openwaContactRoutes);
app.use("/api/openwa", openwaGroupRoutes);
app.use("/api/openwa/campaigns", openwaCampaignRoutes);
app.use("/api/openwa/automation", openwaAutomationRoutes);
app.use("/api/openwa/stats", openwaStatsRoutes);
app.use("/api/openwa", openwaLabelRoutes);
app.use("/api/openwa/chats", openwaChatRoutes);
app.use("/api/openwa/templates", openwaTemplateRoutes);

// ── Static files ───────────────────────────────────────────
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ── Health check ───────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  try {
    const health = await checkHealth();
    const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;
    res.status(statusCode).json({ success: health.status !== "unhealthy", ...health });
  } catch (error: any) {
    res.status(503).json({ success: false, status: "unhealthy", error: error.message });
  }
});

// ── Server setup ───────────────────────────────────────────
const httpServer = createServer(app);

const io = initSocketServer(httpServer);
whatsappService.setSocketIO(io);
openwaSessions.setSocketIO(io);

const uploadDirs = ["uploads", "uploads/avatars", "uploads/files", "uploads/temp"];
for (const dir of uploadDirs) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
}

httpServer.listen(env.PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  connectDB()
    .then(() => { console.log("✅ MongoDB connected"); return openwaSessions.onStartup(); })
    .then(() => console.log("✅ OpenWA session service initialized"))
    .catch((err) => { console.error("❌ Startup failed:", err); process.exit(1); });
});

// ── Graceful shutdown ──────────────────────────────────────
let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  httpServer.close(() => console.log("HTTP server closed."));
  await openwaSessions.onShutdown();
  try {
    const mongoose = await import("mongoose");
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  } catch { /* ignore */ }
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ── Global error handler (MUST be last) ────────────────────
app.use(globalErrorHandler);
