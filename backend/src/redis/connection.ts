// @ts-nocheck — ioredis v5 types are incompatible with strict TS, runtime is correct
import Redis, { RedisOptions } from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

let redis: Redis | null = null;
let connected = false;

export function isRedisConnected(): boolean {
  return connected && redis !== null && redis.status === "ready";
}

export function getRedis(): Redis | null {
  return isRedisConnected() ? redis : null;
}

export function initRedis(): void {
  if (!REDIS_URL) return;

  const opts: RedisOptions = {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number): number | null {
      if (times > 5) return null;
      return Math.min(times * 500, 5000);
    },
    lazyConnect: true,
    enableReadyCheck: true,
  };

  const g = globalThis as unknown as { redisGlobal?: Redis };
  redis = process.env.NODE_ENV === "production"
    ? new Redis(REDIS_URL, opts)
    : g.redisGlobal ?? (g.redisGlobal = new Redis(REDIS_URL, opts));

  redis.on("connect", () => { connected = true; });
  redis.on("ready", () => { connected = true; });
  redis.on("close", () => { connected = false; });
  redis.on("error", () => { connected = false; });

  redis.connect().catch(() => {});
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    connected = false;
  }
}

initRedis();
