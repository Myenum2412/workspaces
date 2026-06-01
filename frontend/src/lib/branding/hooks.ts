"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useBrandingStore } from "./store";
import { toHex, hexToRgb, hexToHsl, adjustBrightness, generateColorVariants, checkContrast, isValidColor } from "./colors";
import type { BrandingColors, BrandingConfig } from "@/lib/api/client";

/**
 * Primary branding hook — full store access.
 * Use in settings pages and components needing write access.
 */
export function useBranding() {
  return useBrandingStore();
}

/**
 * Lightweight hook — read-only theme config.
 * Use in display components for performance.
 */
export function useThemeConfig() {
  const branding = useBrandingStore((s) => s.branding);

  const colors = useMemo(() => branding.colors, [branding.colors]);
  const mode = useMemo(() => branding.mode, [branding.mode]);

  return { colors, mode, branding };
}

/**
 * Generate CSS variable object from current branding.
 * Apply to a wrapper element's style prop for scoped theming.
 */
export function useCSSVars() {
  const colors = useBrandingStore((s) => s.branding.colors);

  return useMemo(() => {
    const vars: Record<string, string> = {};
    for (const [key, value] of Object.entries(colors)) {
      const cssName = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      vars[`--${cssName}`] = value as string;
    }
    vars["--ring"] = colors.primary;
    return vars;
  }, [colors]);
}

/**
 * Color variant utilities — auto-generate shades from current primary.
 */
export function useColorVariants(colorKey: keyof BrandingColors = "primary") {
  const color = useBrandingStore((s) => s.branding.colors[colorKey]);

  return useMemo(() => generateColorVariants(color), [color]);
}

/**
 * Contrast check against current background.
 */
export function useContrastCheck(foregroundKey: keyof BrandingColors, backgroundKey: keyof BrandingColors = "background") {
  const fg = useBrandingStore((s) => s.branding.colors[foregroundKey]);
  const bg = useBrandingStore((s) => s.branding.colors[backgroundKey]);

  return useMemo(() => checkContrast(fg, bg), [fg, bg]);
}

/**
 * Sync branding from WebSocket events.
 * Call once at app root level.
 */
export function useBrandingSync() {
  const syncFromWs = useBrandingStore((s) => s.syncFromWs);
  const load = useBrandingStore((s) => s.load);

  useEffect(() => {
    // Load on mount
    load();

    // Listen for WS branding updates
    // This assumes socket.io client is available globally or injected.
    // The actual WS connection is in use-profile-socket.ts
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "branding_updated" || data.branding) {
          syncFromWs(data.branding);
        }
      } catch { /* ignore */ }
    };

    window.addEventListener("branding-update", handler as EventListener);

    return () => {
      window.removeEventListener("branding-update", handler as EventListener);
    };
  }, [load, syncFromWs]);
}

/**
 * Format a color value for display.
 */
export function useColorDisplay(color: string, format: "hex" | "rgb" | "hsl" = "hex") {
  return useMemo(() => {
    switch (format) {
      case "rgb": {
        const rgb = hexToRgb(toHex(color));
        return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : color;
      }
      case "hsl": {
        const hsl = hexToHsl(toHex(color));
        return hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : color;
      }
      default:
        return toHex(color);
    }
  }, [color, format]);
}

/**
 * Validate a color input string.
 */
export function useColorValidation() {
  return useCallback((value: string) => isValidColor(value), []);
}

/**
 * Re-export utilities for convenience.
 */
export { toHex, hexToRgb, hexToHsl, adjustBrightness, generateColorVariants, checkContrast, isValidColor };
