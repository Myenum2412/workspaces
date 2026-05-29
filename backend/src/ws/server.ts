import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import redis from "../redis/connection.js";
import { UserStatus, UserStatusHistory } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const SUPER_ADMIN_EMAIL = "zoo@myenum.in";

let io: Server | null = null;
const onlineUsers = new Map<string, string>(); // socketId -> userId
const sessionHistory = new Map<string, string>(); // socketId -> historyId

export function getIO(): Server | null {
  return io;
}

export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL as string || "*",
      methods: ["GET", "POST"],
    },
  });

  // ── Socket.io auth middleware ──────────────────────────
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
    console.log(`[Socket] Client connected: ${socket.id} (user: ${user?.userId})`);

    // Join org room for WhatsApp events
    if (user?.organizationId) {
      socket.join(`org:${user.organizationId}`);
    }

    socket.on("identify", async (userId: string) => {
      if (userId) {
        onlineUsers.set(socket.id, userId);
        try {
          const existing = await UserStatus.findOneAndUpdate(
            { userId },
            { $setOnInsert: { status: "Online" }, $set: { lastActiveAt: new Date() } },
            { upsert: true, new: true }
          );
          
          io?.emit("presence_update", { userId, online: true, status: existing.status });

          const history = new UserStatusHistory({
            userId,
            status: existing.status,
            loginTimestamp: new Date(),
            lastActiveTime: new Date()
          });
          await history.save();
          sessionHistory.set(socket.id, history._id.toString());
        } catch (error) {
          console.error("[Socket] DB Error on identify:", error);
        }
      }
    });

    socket.on("heartbeat", async () => {
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        try {
          await UserStatus.updateOne({ userId }, { lastActiveAt: new Date() });
          const historyId = sessionHistory.get(socket.id);
          if (historyId) {
            await UserStatusHistory.findByIdAndUpdate(historyId, { lastActiveTime: new Date() });
          }
        } catch {}
      }
    });

    socket.on("manual_status", async ({ userId, status }: { userId: string, status: string }) => {
      if (userId) {
         io?.emit("presence_update", { userId, online: status === "Online", status });
         try {
           await UserStatus.findOneAndUpdate(
             { userId }, 
             { status, lastActiveAt: new Date() },
             { upsert: true, new: true }
           );
         } catch {}
      }
    });

    socket.on("get_online_users", (callback) => {
      if (typeof callback === "function") {
        const users = Array.from(new Set(onlineUsers.values()));
        callback(users);
      }
    });

    // WhatsApp room subscription
    socket.on("whatsapp:subscribe", (organizationId: string) => {
      if (user?.organizationId === organizationId || user?.email === SUPER_ADMIN_EMAIL) {
        socket.join(`org:${organizationId}`);
      }
    });

    socket.on("whatsapp:unsubscribe", (organizationId: string) => {
      socket.leave(`org:${organizationId}`);
    });

    socket.on("subscribe", (channel: string) => {
      socket.join(channel);
    });

    socket.on("unsubscribe", (channel: string) => {
      socket.leave(channel);
    });

    socket.on("disconnect", async () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        onlineUsers.delete(socket.id);
        const historyId = sessionHistory.get(socket.id);
        sessionHistory.delete(socket.id);

        const stillOnline = Array.from(onlineUsers.values()).includes(userId);
        if (!stillOnline) {
          io?.emit("presence_update", { userId, online: false });
          try {
            await UserStatus.updateOne({ userId }, { status: "Offline" });
          } catch {}
        }
        
        if (historyId) {
          try {
            await UserStatusHistory.findByIdAndUpdate(historyId, { 
              logoutTimestamp: new Date(), 
              status: "Offline" 
            });
          } catch {}
        }
      }
    });
  });

  return io;
}

export async function publishChange(channel: string, data: unknown) {
  if (io) {
    io.to(channel).emit("change", data);
  }
  try {
    await redis.publish(channel, JSON.stringify(data));
  } catch {
    // Redis not available
  }
}
