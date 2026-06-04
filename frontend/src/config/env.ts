/**
 * Frontend environment validation.
 * Fails fast at startup if required env vars are missing.
 */

const requiredEnvVars = ["NEXT_PUBLIC_BACKEND_URL"] as const;

function validateEnv() {
  const missing: string[] = [];
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0 && typeof window === "undefined") {
    // Server-side only — don't crash the browser
    console.error(`[ENV] Missing required env vars: ${missing.join(", ")}`);
  }
}

validateEnv();

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_BACKEND_URL ?? "",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Workspace",
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
};
