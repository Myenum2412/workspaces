import mongoose from "mongoose";
import { logger } from "../core/logging/logger.js";

const MONGODB_URI = process.env.MONGODB_URI as string;

declare global {
  // eslint-disable-next-line no-var
  var mongooseGlobal: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } =
  global.mongooseGlobal ?? { conn: null, promise: null };

if (!global.mongooseGlobal) {
  global.mongooseGlobal = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  try {
    cached.conn = await cached.promise;
    logger.info("MongoDB connected");
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
