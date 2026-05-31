import "dotenv/config";
import express from "express";
import cors from "cors";
import passport from "passport";
import path from "path";
import fs from "fs";
import { createServer } from "http";
import { connectDB } from "./config/connection.js";
import { initSocketServer } from "./ws/server.js";
import { whatsappService } from "./services/whatsapp.js";
import { openwaSessions } from "./services/openwa-session.js";
import { securityHeaders, sanitizeInput } from "./middleware/security.js";

// Existing routes
import authRoutes from "./routes/auth.js";
import dbRoutes from "./routes/db.js";
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

// New routes
import adminRoutes from "./routes/admin.js";
import { checkHealth } from "./services/health.js";

const app = express();
const PORT = process.env.PORT as string;

// ── Middleware ──────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

app.use(securityHeaders);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(passport.initialize());
app.use(sanitizeInput);

// ── Rate limiting ──────────────────────────────────────────
import rateLimit from "express-rate-limit";
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: "Too many attempts. Try again in 15 min." });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, message: "Too many requests. Slow down." });
app.use("/api/auth/", authLimiter);
app.use("/api/", apiLimiter);

// ── Audit logging ──────────────────────────────────────────
app.use("/api", auditMiddleware);

// ── Existing Routes ────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/db", dbRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/campaigns", campaignRoutesOld);

// ── Admin Routes ─────────────────────────────────────────────
app.use("/api/admin", adminRoutes);

// ── OpenWA Routes (migrated from PostgreSQL → MongoDB) ─────
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
    res.status(statusCode).json(health);
  } catch (error: any) {
    res.status(503).json({ status: "unhealthy", error: error.message });
  }
});

// ── Server setup ───────────────────────────────────────────
const httpServer = createServer(app);

const io = initSocketServer(httpServer);

// Pass Socket.io to all services that need it
whatsappService.setSocketIO(io);
openwaSessions.setSocketIO(io);

// Ensure uploads directories exist
const uploadDirs = ["uploads", "uploads/avatars", "uploads/files", "uploads/temp"];
for (const dir of uploadDirs) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created: ${fullPath}`);
  }
}

httpServer.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  connectDB()
    .then(() => {
      console.log("MongoDB connected");
      return openwaSessions.onStartup();
    })
    .then(() => console.log("OpenWA session service initialized"))
    .catch((err) => {
      console.error("Startup failed:", err);
      process.exit(1);
    });
});

// ── Graceful shutdown ──────────────────────────────────────
let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}. Shutting down...`);
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

// ── Global error handler ───────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const errorId = crypto.randomUUID();
  console.error(`[Error ${errorId}]`, err.message);
  const statusCode = (err as any).statusCode ?? (err as any).status ?? 500;
  res.status(statusCode).json({ error: "Internal server error", reference: errorId });
});
