import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import redis from "../redis/connection.js";
import { connectDB } from "../config/connection.js";
import { UserStatus, UserStatusHistory } from "../models/index.js";
import jwt from "jsonwebtoken";
import { env, getCorsOrigins } from "../config/env.js";

// ── Types ──────────────────────────────────────────────────────

interface AuthPayload {
  userId: string;
  email: string;
  organizationId: string;
  workspaceId: string | null;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  user: AuthPayload;
}

interface SessionInfo {
  historyId: string;
  currentStatus: string;
  lastChange: Date;
}

interface ManualStatusPayload {
  userId: string;
  status: string;
}

// ── State ──────────────────────────────────────────────────────

let io: Server | null = null;
const onlineUsers = new Map<string, string>();
const sessionHistory = new Map<string, SessionInfo>();

// ── Public API ─────────────────────────────────────────────────

export function getIO(): Server | null {
  return io;
}

export function getOnlineUserIds(): Set<string> {
  return new Set(onlineUsers.values());
}

// ── Helpers ────────────────────────────────────────────────────

async function ensureDB(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await connectDB();
      return true;
    } catch (err) {
      console.error(`[WS] DB attempt ${i + 1} failed:`, (err as Error).message);
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

async function pushSlice(
  historyId: string,
  fromStatus: string,
  startedAt: Date,
  endedAt: Date,
): Promise<void> {
  const durationSeconds = Math.max(
    0,
    Math.round((endedAt.getTime() - startedAt.getTime()) / 1000),
  );
  if (durationSeconds <= 0) return;
  try {
    await UserStatusHistory.findByIdAndUpdate(historyId, {
      $push: {
        durations: { status: fromStatus, startedAt, endedAt, durationSeconds },
      },
    });
  } catch (err) {
    console.error("[WS] pushSlice error:", (err as Error).message);
  }
}

// ── Rate Limiting ──────────────────────────────────────────────

const wsConnectionCounts = new Map<string, { count: number; resetAt: number }>();
const WS_MAX_CONNECTIONS = 10;
const WS_WINDOW_MS = 60 * 1000;

function wsRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = wsConnectionCounts.get(ip);
  if (!record || now > record.resetAt) {
    wsConnectionCounts.set(ip, { count: 1, resetAt: now + WS_WINDOW_MS });
    return true;
  }
  if (record.count >= WS_MAX_CONNECTIONS) return false;
  record.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of wsConnectionCounts) {
    if (now > record.resetAt) wsConnectionCounts.delete(ip);
  }
}, 5 * 60 * 1000);

// ── Initialization ─────────────────────────────────────────────

export function initSocketServer(httpServer: HTTPServer): Server {
  if (io) return io;

  const allowedOrigins = getCorsOrigins();

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : false,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Rate limit middleware
  io.use((socket, next) => {
    const ip = socket.handshake.address || "unknown";
    if (!wsRateLimit(ip)) {
      console.warn(`[WS] Rate limited: ${ip}`);
      return next(new Error("Too many connection attempts. Try again later."));
    }
    next();
  });

  // Auth middleware
  io.use((socket, next) => {
    let token: string | undefined =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(" ")[1];

    if (!token && socket.handshake.headers.cookie) {
      const match = socket.handshake.headers.cookie.match(
        /(?:^|; )access_token=([^;]*)/,
      );
      if (match) token = decodeURIComponent(match[1]);
    }

    if (!token) return next(new Error("No token"));

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
      (socket as AuthenticatedSocket).user = decoded;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as AuthenticatedSocket).user;
    console.log(`[Socket] Connected: ${socket.id} (user: ${user?.userId})`);

    if (user?.organizationId) {
      socket.join(`org:${user.organizationId}`);
    }
    if (user?.userId) {
      socket.join(`user:${user.userId}`);
    }

    // ── Identify ──────────────────────────────────────────────
    socket.on("identify", async (userId: string, currentStatus?: string) => {
      if (!userId) return;
      onlineUsers.set(socket.id, userId);

      try {
        if (!(await ensureDB())) throw new Error("DB not connected");

        const effectiveStatus = currentStatus || "Online";
        const now = new Date();

        await UserStatus.findOneAndUpdate(
          { userId },
          { $set: { status: effectiveStatus, lastActiveAt: now } },
          { upsert: true, new: true },
        );

        const history = await UserStatusHistory.create({
          userId,
          status: effectiveStatus,
          loginTimestamp: now,
          lastActiveTime: now,
          durations: [],
        });

        sessionHistory.set(socket.id, {
          historyId: history._id.toString(),
          currentStatus: effectiveStatus,
          lastChange: now,
        });

        io?.emit("presence_update", {
          userId,
          online: true,
          status: effectiveStatus,
        });
        console.log(`[WS] Identify: ${userId} → ${effectiveStatus}`);
      } catch (error) {
        console.error(`[WS] Identify error:`, (error as Error).message);
      }
    });

    // ── Heartbeat ─────────────────────────────────────────────
    socket.on("heartbeat", async () => {
      const userId = onlineUsers.get(socket.id);
      if (!userId) return;
      try {
        if (!(await ensureDB())) return;
        const now = new Date();
        await UserStatus.updateOne({ userId }, { lastActiveAt: now });
        const sess = sessionHistory.get(socket.id);
        if (sess) {
          await UserStatusHistory.findByIdAndUpdate(sess.historyId, {
            lastActiveTime: now,
          });
        }
      } catch (error) {
        console.error(`[WS] Heartbeat error:`, (error as Error).message);
      }
    });

    // ── Manual status change ──────────────────────────────────
    socket.on("manual_status", async (payload: ManualStatusPayload) => {
      const { userId, status } = payload;
      if (!userId || !status) return;
      io?.emit("presence_update", { userId, online: status === "Online", status });

      try {
        if (!(await ensureDB())) throw new Error("DB not connected");

        await UserStatus.findOneAndUpdate(
          { userId },
          { status, lastActiveAt: new Date() },
          { upsert: true, new: true },
        );

        const sess = sessionHistory.get(socket.id);
        if (sess && sess.currentStatus !== status) {
          const now = new Date();
          await pushSlice(sess.historyId, sess.currentStatus, sess.lastChange, now);
          sess.currentStatus = status;
          sess.lastChange = now;
          sessionHistory.set(socket.id, sess);
        }

        console.log(`[WS] Status: ${userId} → ${status}`);
      } catch (error) {
        console.error(`[WS] manual_status error:`, (error as Error).message);
      }
    });

    // ── Get online users ──────────────────────────────────────
    socket.on("get_online_users", (callback: (users: string[]) => void) => {
      if (typeof callback === "function") {
        callback(Array.from(new Set(onlineUsers.values())));
      }
    });

    // ── Subscribe / Unsubscribe ───────────────────────────────
    socket.on("subscribe", (channel: string) => {
      socket.join(channel);
    });
    socket.on("unsubscribe", (channel: string) => {
      socket.leave(channel);
    });

    // ── Disconnect ────────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const userId = onlineUsers.get(socket.id);
      if (!userId) return;

      onlineUsers.delete(socket.id);
      const sess = sessionHistory.get(socket.id);
      sessionHistory.delete(socket.id);

      try {
        if (!(await ensureDB())) throw new Error("DB not connected");

        const stillOnline = Array.from(onlineUsers.values()).includes(userId);
        if (!stillOnline) {
          io?.emit("presence_update", { userId, online: false });
          await UserStatus.updateOne({ userId }, { status: "Offline" });
        }

        if (sess) {
          const now = new Date();
          await pushSlice(sess.historyId, sess.currentStatus, sess.lastChange, now);
          await UserStatusHistory.findByIdAndUpdate(sess.historyId, {
            logoutTimestamp: now,
            status: "Offline",
          });
        }
        console.log(`[WS] Disconnect: ${userId}, session saved`);
      } catch (error) {
        console.error(`[WS] Disconnect error:`, (error as Error).message);
      }
    });
  });

  return io;
}

export async function publishChange(channel: string, data: unknown): Promise<void> {
  if (io) io.to(channel).emit("change", data);
  if (redis) {
    try {
      await redis.publish(channel, JSON.stringify(data));
    } catch {
      /* redis optional */
    }
  }
}
