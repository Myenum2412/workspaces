import Redis, { RedisOptions } from "ioredis";

let redis: Redis | null = null;
let redisConnected = false;

export function isRedisConnected(): boolean {
  return redisConnected && redis !== null && redis.status === "ready";
}

export function getRedis(): Redis | null {
  return isRedisConnected() ? redis : null;
}

function initRedis(): void {
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) {
    console.log("[Redis] REDIS_URL not set — running without cache");
    return;
  }

  try {
    const opts: RedisOptions = {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number): number | null {
        if (times > 5) {
          console.error("[Redis] Max reconnect attempts reached. Giving up.");
          return null;
        }
        return Math.min(times * 500, 5000);
      },
      lazyConnect: true,
      enableReadyCheck: true,
    };

    const g = globalThis as unknown as { redisGlobal?: Redis };
    if (process.env.NODE_ENV === "production") {
      redis = new Redis(REDIS_URL, opts);
    } else {
      if (!g.redisGlobal) {
        g.redisGlobal = new Redis(REDIS_URL, opts);
      }
      redis = g.redisGlobal!;
    }

    redis!.on("connect", () => {
      redisConnected = true;
      console.log("[Redis] Connected");
    });
    redis!.on("ready", () => {
      redisConnected = true;
      console.log("[Redis] Ready");
    });
    redis!.on("close", () => {
      redisConnected = false;
      console.warn("[Redis] Connection closed");
    });
    redis!.on("error", (err: Error) => {
      redisConnected = false;
      console.error("[Redis] Error:", err.message);
    });
    redis!.on("reconnecting", () => {
      console.warn("[Redis] Reconnecting...");
    });

    // Eagerly connect
    redis!.connect().catch((err: Error) => {
      console.error("[Redis] Initial connect failed:", err.message);
    });
  } catch (err) {
    console.error("[Redis] Init failed:", (err as Error).message);
  }
}

initRedis();

export default redis;
