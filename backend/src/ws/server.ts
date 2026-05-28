import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import redis from "../redis/connection.js";
import { UserStatus, UserStatusHistory } from "../models/index.js";

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

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on("identify", async (userId: string) => {
      if (userId) {
        onlineUsers.set(socket.id, userId);
        io?.emit("presence_update", { userId, online: true });

        try {
          await UserStatus.findOneAndUpdate(
            { userId },
            { status: "Online", lastActiveAt: new Date() },
            { upsert: true, new: true }
          );

          const history = new UserStatusHistory({
            userId,
            status: "Online",
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

    socket.on("manual_status", async ({ userId, status }: { userId: string, status: "Online" | "Offline" }) => {
      if (userId) {
         io?.emit("presence_update", { userId, online: status === "Online" });
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
