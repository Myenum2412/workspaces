import { cookies } from "next/headers";
import { cache } from "react";
import { API_BASE_URL } from "@/lib/api/config";

function getAuthHeaders(): Promise<Record<string, string> | undefined> {
  return cookies()
    .then((cookieStore) => {
      const token = cookieStore.get("access_token")?.value;
      return token ? { Cookie: `access_token=${token}` } : undefined;
    })
    .catch(() => undefined);
}

export const getHrSettings = cache(async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/workspace/hr-settings`, {
      headers,
      next: { revalidate: 120, tags: ["hr-settings"] },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.hrSettings ?? null;
  } catch {
    return null;
  }
});

export const getThemeSettings = cache(async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/workspace/theme-settings`, {
      headers,
      next: { revalidate: 120, tags: ["theme-settings"] },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.themeSettings ?? null;
  } catch {
    return null;
  }
});

export const getBranding = cache(async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/branding`, {
      headers,
      next: { revalidate: 300, tags: ["branding"] },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.branding ?? null;
  } catch {
    return null;
  }
});

export interface BrandingColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  border: string;
  muted: string;
  mutedForeground: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
}

export function brandingToCSSVars(colors: BrandingColors, mode: string): string {
  const entries: string[] = [
    `--primary:${colors.primary}`,
    `--primary-foreground:${colors.primaryForeground}`,
    `--secondary:${colors.secondary}`,
    `--secondary-foreground:${colors.secondaryForeground}`,
    `--accent:${colors.accent}`,
    `--accent-foreground:${colors.accentForeground}`,
    `--background:${colors.background}`,
    `--foreground:${colors.foreground}`,
    `--card:${colors.card}`,
    `--card-foreground:${colors.cardForeground}`,
    `--border:${colors.border}`,
    `--muted:${colors.muted}`,
    `--muted-foreground:${colors.mutedForeground}`,
    `--ring:${colors.primary}`,
    `--sidebar:${colors.sidebar}`,
    `--sidebar-foreground:${colors.sidebarForeground}`,
    `--sidebar-primary:${colors.sidebarPrimary}`,
    `--sidebar-primary-foreground:${colors.sidebarPrimaryForeground}`,
    `--sidebar-accent:${colors.sidebarAccent}`,
    `--sidebar-accent-foreground:${colors.sidebarAccentForeground}`,
    `--chart-1:${colors.primary}`,
    `--chart-2:${colors.accent}`,
    `--chart-3:${colors.secondary}`,
    `--sidebar-border:${colors.border}`,
    `--sidebar-ring:${colors.primary}`,
  ];

  if (mode === "dark") entries.push("color-scheme:dark");

  return entries.join(";");
}
