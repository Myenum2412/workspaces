import Redis, { RedisOptions } from "ioredis";
import { logger } from "../core/logging/logger.js";

let redis: Redis | null = null;
let redisConnected = false;

export function isRedisConnected(): boolean {
  return redisConnected && redis !== null && redis.status === "ready";
}

export function getRedis(): Redis | null {
  return isRedisConnected() ? redis : null;
}

export function initRedis(): void {
  const url = process.env.REDIS_URL;
  if (!url) {
    logger.info("REDIS_URL not set — running without cache");
    return;
  }

  const opts: RedisOptions = {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number): number | null {
      if (times > 5) { logger.error("Redis max reconnect attempts reached"); return null; }
      return Math.min(times * 500, 5000);
    },
    lazyConnect: true,
    enableReadyCheck: true,
  };

  const g = globalThis as unknown as { __redis?: Redis };
  redis = process.env.NODE_ENV === "production" ? new Redis(url, opts) : g.__redis ?? (g.__redis = new Redis(url, opts));

  redis.on("connect", () => { redisConnected = true; logger.info("Redis connected"); });
  redis.on("ready", () => { redisConnected = true; logger.info("Redis ready"); });
  redis.on("close", () => { redisConnected = false; logger.warn("Redis connection closed"); });
  redis.on("error", (err: Error) => { redisConnected = false; logger.error({ err }, "Redis error"); });

  redis.connect().catch((err: Error) => logger.error({ err }, "Redis initial connect failed"));
}

export async function disconnectRedis(): Promise<void> {
  if (redis) { await redis.quit(); redisConnected = false; logger.info("Redis disconnected"); }
}

initRedis();
