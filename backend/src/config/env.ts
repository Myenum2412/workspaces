import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_VERSION: z.string().default("v1"),
  API_BASE_URL: z.string().url().default("https://workspaceapi.myenum.in"),
  FRONTEND_URL: z.string().url().default("https://myenum.in"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  REDIS_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be ≥32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be ≥32 chars"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("30d"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),

  COOKIE_SECRET: z.string().optional(),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("lax"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),

  MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024),
  UPLOAD_DIR: z.string().default("uploads"),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().default("noreply@myenum.in"),

  SUPER_ADMIN_EMAILS: z.string().default(""),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  CORS_ORIGINS: z.string().default("https://myenum.in,https://www.myenum.in"),

  IP_WHITELIST: z.string().default(""),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.error("❌ Invalid environment variables:");
  const formatted = result.error.flatten().fieldErrors;
  for (const [key, messages] of Object.entries(formatted)) {
    console.error(`  ${key}: ${messages.join(", ")}`);
  }
  process.exit(1);
}

export const env = result.data;

export function getSuperAdminEmails(): Set<string> {
  return new Set(
    env.SUPER_ADMIN_EMAILS
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isSuperAdmin(email: string): boolean {
  return getSuperAdminEmails().has(email.toLowerCase());
}

export function getCorsOrigins(): string[] {
  return env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
}

export function getIpWhitelist(): string[] {
  return env.IP_WHITELIST.split(",").map((s) => s.trim()).filter(Boolean);
}
