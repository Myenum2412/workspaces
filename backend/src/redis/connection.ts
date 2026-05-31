import Redis from "ioredis";

let redis: Redis | null = null;

try {
  const REDIS_URL = process.env.REDIS_URL;
  if (REDIS_URL) {
    if (process.env.NODE_ENV === "production") {
      redis = new Redis(REDIS_URL, { retryStrategy: () => null });
    } else {
      const g = globalThis as unknown as { redisGlobal?: Redis };
    if (!g.redisGlobal) {
      g.redisGlobal = new Redis(REDIS_URL, { retryStrategy: () => null });
    }
    redis = g.redisGlobal!;
    }
    redis!.on("error", (err: Error) => {
      console.error("[Redis] Error:", err.message);
    });
    console.log("[Redis] Connected");
  } else {
    console.log("[Redis] REDIS_URL not set — running without cache");
  }
} catch (err) {
  console.error("[Redis] Init failed:", (err as Error).message);
}

export default redis;
