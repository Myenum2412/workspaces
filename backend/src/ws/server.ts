import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import redis from "../redis/connection.js";

let io: Server | null = null;

export function getIO(): Server | null {
  return io;
}

export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on("subscribe", (channel: string) => {
      socket.join(channel);
    });

    socket.on("unsubscribe", (channel: string) => {
      socket.leave(channel);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
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
