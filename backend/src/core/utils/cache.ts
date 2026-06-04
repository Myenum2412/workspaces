// @ts-nocheck
import { getRedis, isRedisConnected } from "../../db/redis.js";
import { logger } from "../logging/logger.js";

const DEFAULT_TTL = 300; // 5 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isRedisConnected()) return null;
  try {
    const raw = await getRedis()!.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.warn({ err, key }, "Cache get failed");
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttl = DEFAULT_TTL,
): Promise<void> {
  if (!isRedisConnected()) return;
  try {
    await getRedis()!.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    logger.warn({ err, key }, "Cache set failed");
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!isRedisConnected()) return;
  try {
    await getRedis()!.del(key);
  } catch (err) {
    logger.warn({ err, key }, "Cache del failed");
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  if (!isRedisConnected()) return;
  try {
    const r = getRedis()!;
    let cursor = "0";
    do {
      const [next, keys] = await r.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = next;
      if (keys.length > 0) await r.del(...keys);
    } while (cursor !== "0");
  } catch (err) {
    logger.warn({ err, pattern }, "Cache invalidation failed");
  }
}

export function cacheKey(...parts: string[]): string {
  return `cache:${parts.join(":")}`;
}
