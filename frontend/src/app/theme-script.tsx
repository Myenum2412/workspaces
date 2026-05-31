"use client";

import { useEffect } from "react";
import { workspaceApi } from "@/lib/api/client";

export default function ThemeScript() {
  useEffect(() => {
    async function initTheme() {
      // 1. Try to apply immediately from local storage for fast render
      try {
        const stored = localStorage.getItem("theme-settings");
        if (stored) apply(JSON.parse(stored));
      } catch {}

      // 2. Fetch the latest from backend
      try {
        const res = await workspaceApi.getThemeSettings();
        if (res.success && res.themeSettings && Object.keys(res.themeSettings).length > 0) {
          localStorage.setItem("theme-settings", JSON.stringify(res.themeSettings));
          apply(res.themeSettings);
        }
      } catch (err) {
        console.error("Failed to load theme settings from server", err);
      }
    }

    function apply(theme: any) {
      try {
        const root = document.documentElement;
        if (theme.primaryColor) root.style.setProperty("--primary", theme.primaryColor);
        if (theme.primaryForeground) root.style.setProperty("--primary-foreground", theme.primaryForeground);
        if (theme.secondaryColor) root.style.setProperty("--secondary", theme.secondaryColor);
        if (theme.secondaryForeground) root.style.setProperty("--secondary-foreground", theme.secondaryForeground);
        if (theme.accentColor) root.style.setProperty("--accent", theme.accentColor);
        if (theme.accentForeground) root.style.setProperty("--accent-foreground", theme.accentForeground);
        if (theme.backgroundColor) root.style.setProperty("--background", theme.backgroundColor);
        if (theme.foregroundColor) root.style.setProperty("--foreground", theme.foregroundColor);
        if (theme.cardColor) root.style.setProperty("--card", theme.cardColor);
        if (theme.cardForeground) root.style.setProperty("--card-foreground", theme.cardForeground);
        if (theme.borderColor) root.style.setProperty("--border", theme.borderColor);
        if (theme.mutedColor) root.style.setProperty("--muted", theme.mutedColor);
        if (theme.mutedForeground) root.style.setProperty("--muted-foreground", theme.mutedForeground);
      } catch {
        // ignore parse errors
      }
    }

    initTheme();
  }, []);

  return null;
}
