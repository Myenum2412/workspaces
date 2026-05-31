/**
 * Database health check and connection monitoring.
 */
import mongoose from "mongoose";
import redis from "../redis/connection.js";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  services: {
    mongodb: { status: "up" | "down"; responseTimeMs: number; details?: string };
    redis: { status: "up" | "down"; responseTimeMs: number; details?: string };
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
}

export async function checkHealth(): Promise<HealthStatus> {
  const mem = process.memoryUsage();
  const result: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    services: {
      mongodb: { status: "down", responseTimeMs: 0 },
      redis: { status: "down", responseTimeMs: 0 },
    },
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024),
      external: Math.round((mem.external || 0) / 1024 / 1024),
    },
  };

  // MongoDB check
  try {
    const start = Date.now();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db!.admin().ping();
      result.services.mongodb = { status: "up", responseTimeMs: Date.now() - start };
    } else {
      result.services.mongodb = { status: "down", responseTimeMs: 0, details: `readyState=${mongoose.connection.readyState}` };
    }
  } catch (err: any) {
    result.services.mongodb = { status: "down", responseTimeMs: 0, details: err.message };
  }

  // Redis check
  try {
    if (!redis) throw new Error("Redis client not initialized");
    const start = Date.now();
    await redis.ping();
    result.services.redis = { status: "up", responseTimeMs: Date.now() - start };
  } catch {
    result.services.redis = { status: "down", responseTimeMs: 0, details: "Redis not available" };
  }

  // Overall status
  if (result.services.mongodb.status === "down") {
    result.status = "unhealthy";
  } else if (result.services.redis.status === "down") {
    result.status = "degraded";
  }

  return result;
}
