import "dotenv/config";
import express from "express";
import cors from "cors";
import passport from "passport";
import path from "path";
import { createServer } from "http";
import { connectDB } from "./config/connection.js";
import { initSocketServer } from "./ws/server.js";
import { whatsappService } from "./services/whatsapp.js";

// Route imports
import authRoutes from "./routes/auth.js";
import dbRoutes from "./routes/db.js";
import inviteRoutes from "./routes/invites.js";
import setupRoutes from "./routes/setup.js";
import uploadRoutes from "./routes/upload.js";
import whatsappRoutes from "./routes/whatsapp.js";

const app = express();
const PORT = process.env.PORT as string;

// ── Middleware ──────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(passport.initialize());

// ── Rate limiting ──────────────────────────────────────────
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many attempts. Try again in 15 min.",
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: "Too many requests. Slow down.",
});

app.use("/api/auth/", authLimiter);
app.use("/api/", apiLimiter);

// ── Routes ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/db", dbRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/whatsapp", whatsappRoutes);

// ── Static files ───────────────────────────────────────────
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ── Health check ───────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Server setup ───────────────────────────────────────────
const httpServer = createServer(app);
const io = initSocketServer(httpServer);

// Pass Socket.io to WhatsApp service for real-time events
whatsappService.setSocketIO(io);

httpServer.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  connectDB()
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err);
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
  try {
    const mongoose = await import("mongoose");
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  } catch {
    /* ignore */
  }
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ── Global error handler ───────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const errorId = crypto.randomUUID();
    console.error(`[Error ${errorId}]`, err.message);
    const statusCode = (err as any).statusCode ?? (err as any).status ?? 500;
    res.status(statusCode).json({ error: "Internal server error", reference: errorId });
  }
);
