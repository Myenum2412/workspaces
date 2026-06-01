/**
 * Environment variable validation with Zod.
 * Fails fast at startup if required env vars are missing or invalid.
 */
import { z } from "zod";

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Database
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  REDIS_URL: z.string().optional(),

  // Authentication — REQUIRED, no fallbacks
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("30d"),

  // Google OAuth — optional
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default("noreply@myenum.in"),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  // Super-admin (comma-separated emails)
  SUPER_ADMIN_EMAILS: z.string().default(""),

  // Cookie settings
  COOKIE_SECRET: z.string().optional(),
  COOKIE_SECURE: z.coerce.boolean().default(false),
});

// Parse and validate
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:");
  const formatted = result.error.flatten().fieldErrors;
  for (const [key, messages] of Object.entries(formatted)) {
    console.error(`  ${key}: ${messages.join(", ")}`);
  }
  console.error("\nPlease check your .env file and try again.");
  process.exit(1);
}

export const env = result.data;

/** Helper: get super-admin emails as a Set for O(1) lookup */
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
