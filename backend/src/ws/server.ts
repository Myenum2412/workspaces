import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import redis from "../redis/connection.js";
import { connectDB } from "../config/connection.js";
import { UserStatus, UserStatusHistory } from "../models/index.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const SUPER_ADMIN_EMAIL = "zoo@myenum.in";

let io: Server | null = null;
const onlineUsers = new Map<string, string>(); // socketId -> userId

interface SessionInfo {
  historyId: string;
  currentStatus: string;
  lastChange: Date;
}
const sessionHistory = new Map<string, SessionInfo>();

export function getIO(): Server | null {
  return io;
}

/** Get set of currently-online user IDs from socket map */
export function getOnlineUserIds(): Set<string> {
  return new Set(onlineUsers.values());
}

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

/** Push a status slice to DB */
async function pushSlice(historyId: string, fromStatus: string, startedAt: Date, endedAt: Date) {
  const durationSeconds = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
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

export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL as string || "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
    if (!token) return next(new Error("No token"));
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    console.log(`[Socket] Connected: ${socket.id} (user: ${user?.userId})`);

    if (user?.organizationId) {
      socket.join(`org:${user.organizationId}`);
    }
    if (user?.userId) {
      socket.join(`user:${user.userId}`);
    }

    // ── Identify ──────────────────────────────────────────
    socket.on("identify", async (userId: string, currentStatus?: string) => {
      if (!userId) return;
      onlineUsers.set(socket.id, userId);

      try {
        if (!(await ensureDB())) throw new Error("DB not connected");

        // Fresh session always Online — lastStatus preserved for data but showing Online
        const effectiveStatus = currentStatus || "Online";
        const now = new Date();

        await UserStatus.findOneAndUpdate(
          { userId },
          { $set: { status: effectiveStatus, lastActiveAt: now } },
          { upsert: true, new: true }
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

        io?.emit("presence_update", { userId, online: true, status: effectiveStatus });
        console.log(`[WS] Identify: ${userId} → ${effectiveStatus}`);
      } catch (error) {
        console.error(`[WS] Identify error:`, (error as Error).message);
      }
    });

    // ── Heartbeat ─────────────────────────────────────────
    socket.on("heartbeat", async () => {
      const userId = onlineUsers.get(socket.id);
      if (!userId) return;
      try {
        if (!(await ensureDB())) return;
        const now = new Date();
        await UserStatus.updateOne({ userId }, { lastActiveAt: now });
        const sess = sessionHistory.get(socket.id);
        if (sess) {
          await UserStatusHistory.findByIdAndUpdate(sess.historyId, { lastActiveTime: now });
        }
      } catch (error) {
        console.error(`[WS] Heartbeat error:`, (error as Error).message);
      }
    });

    // ── Manual status change — record slice ───────────────
    socket.on("manual_status", async ({ userId, status }: { userId: string; status: string }) => {
      if (!userId || !status) return;
      io?.emit("presence_update", { userId, online: status === "Online", status });

      try {
        if (!(await ensureDB())) throw new Error("DB not connected");

        await UserStatus.findOneAndUpdate(
          { userId },
          { status, lastActiveAt: new Date() },
          { upsert: true, new: true }
        );

        // Record slice
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

    socket.on("get_online_users", (callback) => {
      if (typeof callback === "function") {
        callback(Array.from(new Set(onlineUsers.values())));
      }
    });

    socket.on("whatsapp:subscribe", (orgId: string) => {
      if (user?.organizationId === orgId || user?.email === SUPER_ADMIN_EMAIL) socket.join(`org:${orgId}`);
    });
    socket.on("whatsapp:unsubscribe", (orgId: string) => { socket.leave(`org:${orgId}`); });
    socket.on("subscribe", (ch: string) => { socket.join(ch); });
    socket.on("unsubscribe", (ch: string) => { socket.leave(ch); });

    // ── Disconnect — push final slice + close session ─────
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
          // Push final slice
          await pushSlice(sess.historyId, sess.currentStatus, sess.lastChange, now);
          // Close session
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

export async function publishChange(channel: string, data: unknown) {
  if (io) io.to(channel).emit("change", data);
  if (redis) {
    try { await redis.publish(channel, JSON.stringify(data)); } catch { /* redis optional */ }
  }
}
