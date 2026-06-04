// @ts-nocheck
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

import { env, getCorsOrigins } from "./config/env.js";
import { logger } from "./core/logging/logger.js";
import { connectDB, disconnectDB } from "./db/connection.js";
import { disconnectRedis } from "./db/redis.js";

import { requestIdMiddleware } from "./core/middleware/requestId.js";
import { securityHeaders, preventParameterPollution, sanitizeInput } from "./middleware/security.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { globalErrorHandler } from "./core/errors/handler.js";

import authRoutes from "./modules/auth/routes/authRoutes.js";
import userRoutes from "./modules/users/routes/userRoutes.js";
import workspaceRoutes from "./modules/workspaces/routes/workspaceRoutes.js";
import teamRoutes from "./modules/teams/routes/teamRoutes.js";
import projectRoutes from "./modules/projects/routes/projectRoutes.js";
import taskRoutes from "./modules/tasks/routes/taskRoutes.js";
import notificationRoutes from "./modules/notifications/routes/notificationRoutes.js";
import fileRoutes from "./modules/files/routes/fileRoutes.js";
import activityRoutes from "./modules/activity/routes/activityRoutes.js";
import dashboardRoutes from "./modules/dashboard/routes/dashboardRoutes.js";
import settingRoutes from "./modules/settings/routes/settingRoutes.js";
import searchRoutes from "./modules/search/routes/searchRoutes.js";
import exportRoutes from "./modules/export/routes/exportRoutes.js";

const app = express();

app.set("trust proxy", 1);

// ── Core middleware ─────────────────────────────────────────
app.use(requestIdMiddleware);
app.use(securityHeaders);
app.use(preventParameterPollution);

const allowedOrigins = getCorsOrigins();
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn(`[CORS] Blocked: ${origin}`);
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
app.use(sanitizeInput);

// ── Rate limiting ────────────────────────────────────────────
app.use("/api/", apiLimiter);

// ── Health check ─────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? "up" : "down";
    const health = {
      status: dbStatus === "up" ? "healthy" as const : "unhealthy" as const,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      services: { mongodb: dbStatus as "up" | "down", redis: "unknown" as const },
      memory: { heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) },
    };
    res.status(dbStatus === "up" ? 200 : 503).json({ success: dbStatus === "up", ...health });
  } catch (err) {
    logger.error({ err }, "Health check failed");
    res.status(503).json({ success: false, status: "unhealthy", error: "Database connection failed", meta: { timestamp: new Date().toISOString() } });
  }
});

// ── API v1 ────────────────────────────────────────────────────
const v1 = "/api/v1";
app.use(`${v1}/auth`, authRoutes);
app.use(`${v1}/users`, userRoutes);
app.use(`${v1}/workspaces`, workspaceRoutes);
app.use(`${v1}/teams`, teamRoutes);
app.use(`${v1}/projects`, projectRoutes);
app.use(`${v1}/tasks`, taskRoutes);
app.use(`${v1}/notifications`, notificationRoutes);
app.use(`${v1}/files`, fileRoutes);
app.use(`${v1}/activity`, activityRoutes);
app.use(`${v1}/dashboard`, dashboardRoutes);
app.use(`${v1}/settings`, settingRoutes);
app.use(`${v1}/search`, searchRoutes);
app.use(`${v1}/export`, exportRoutes);

// ── Static ────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" }, meta: { timestamp: new Date().toISOString() } });
});

// ── Error handler ─────────────────────────────────────────────
app.use(globalErrorHandler);

// ── Server ────────────────────────────────────────────────────
const httpServer = createServer(app);

const uploadDirs = ["uploads", "uploads/avatars", "uploads/files", "uploads/temp"];
for (const dir of uploadDirs) {
  const p = path.join(process.cwd(), dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

httpServer.listen(env.PORT, () => {
  logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`📡 API base: ${env.API_BASE_URL}/api/${env.API_VERSION}`);
  connectDB().catch((err) => { logger.error({ err }, "DB connection failed"); process.exit(1); });
});

// ── Graceful shutdown ──────────────────────────────────────────
let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Received ${signal}. Shutting down...`);
  httpServer.close(() => {
    logger.info("HTTP server closed");
    Promise.all([disconnectDB(), disconnectRedis()]).then(() => { logger.info("All connections closed"); process.exit(0); });
  });
  setTimeout(() => { logger.error("Forced shutdown"); process.exit(1); }, 30000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason: unknown) => { logger.error({ reason }, "Unhandled rejection"); });
process.on("uncaughtException", (err: Error) => { logger.error({ err }, "Uncaught exception"); shutdown("uncaughtException"); });

export { app, httpServer };
