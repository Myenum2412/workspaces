import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL as string;

declare global {
  var redisGlobal: Redis | undefined;
}

let redis: Redis;

if (process.env.NODE_ENV === "production") {
  redis = new Redis(REDIS_URL);
} else {
  if (!global.redisGlobal) {
    global.redisGlobal = new Redis(REDIS_URL);
  }
  redis = global.redisGlobal;
}

export default redis;
