import "dotenv/config";

// ── Validate environment BEFORE any other imports ────────────
import { env } from "./config/env.js";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import path from "path";
import fs from "fs";
import compression from "compression";
import { createServer } from "http";
import { connectDB } from "./config/connection.js";
import { initSocketServer } from "./ws/server.js";
import { securityHeaders, sanitizeInput, mongoSanitizeMiddleware, validateCsrf } from "./middleware/security.js";
import { requestIdMiddleware } from "./core/middleware/requestId.js";
import { globalErrorHandler } from "./core/errors/handler.js";
import { apiResponse } from "./core/utils/apiResponse.js";

// Core routes
import authRoutes from "./routes/auth.js";
import inviteRoutes from "./routes/invites.js";
import setupRoutes from "./routes/setup.js";
import uploadRoutes from "./routes/upload.js";
import { auditMiddleware } from "./middleware/audit.js";
import profileRoutes from "./routes/profile.js";
import workspaceRoutes from "./routes/workspace.js";
import fileRoutes from "./routes/file-routes.js";
import staffRoutes from "./routes/staff.js";
import taskRoutes from "./routes/tasks.js";

// Entity routes (replaces generic /api/db proxy)
import teamRoutes from "./routes/team-routes.js";
import clientRoutes from "./routes/client-routes.js";
import branchRoutes from "./routes/branch-routes.js";
import orgRoutes from "./routes/org-routes.js";

// Branding
import brandingRoutes from "./routes/branding.js";

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
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-CSRF-Token"],
  exposedHeaders: ["X-Request-ID"],
  maxAge: 86400,
}));

app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(sanitizeInput);
app.use(validateCsrf);

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

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many upload attempts. Try again in 15 minutes." } },
});

app.use("/api/auth/", authLimiter);
app.use("/api/upload/", uploadLimiter);
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

// File records management
app.use("/api/workspace/files", fileRoutes);

// Tasks (CRUD + saved templates)
app.use("/api/tasks", taskRoutes);

// Entities (mounted at their collection paths)
app.use("/api/teams", teamRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/branches", branchRoutes);
// Org routes: /api/organizations, /api/members, /api/invitations, /api/master-data
app.use("/api", orgRoutes);

app.use("/api/upload", uploadRoutes);
app.use("/api/setup", setupRoutes);

// Branding
app.use("/api/branding", brandingRoutes);

// Admin
app.use("/api/admin", adminRoutes);

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

const uploadDirs = ["uploads", "uploads/avatars", "uploads/files", "uploads/temp"];
for (const dir of uploadDirs) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
}

httpServer.listen(env.PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  connectDB()
    .then(() => { console.log("✅ MongoDB connected"); })
    .catch((err) => { console.error("❌ Startup failed:", err); process.exit(1); });
});

// ── Graceful shutdown ──────────────────────────────────────
let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  httpServer.close(() => console.log("HTTP server closed."));
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
