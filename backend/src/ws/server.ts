import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import redis from "../redis/connection.js";

let io: Server | null = null;
const onlineUsers = new Map<string, string>(); // socketId -> userId

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

    socket.on("identify", (userId: string) => {
      if (userId) {
        onlineUsers.set(socket.id, userId);
        io?.emit("presence_update", { userId, online: true });
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

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        onlineUsers.delete(socket.id);
        const stillOnline = Array.from(onlineUsers.values()).includes(userId);
        if (!stillOnline) {
          io?.emit("presence_update", { userId, online: false });
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
