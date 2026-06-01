/**
 * Zustand store for branding/theme state.
 * Handles: loading from API, applying to DOM, WS sync, localStorage cache.
 */
import { create } from "zustand";
import { brandingApi } from "@/lib/api/client";
import type { BrandingConfig, BrandingColors, BrandingHistoryEntry } from "@/lib/api/client";
import { toHex, adjustBrightness, generateColorVariants } from "./colors";

const STORAGE_KEY = "workspace-branding";

/** Default colors matching the original emerald theme. */
const DEFAULT_COLORS: BrandingColors = {
  primary: "#059669",
  primaryHover: "#047857",
  primaryForeground: "#ffffff",
  secondary: "#f3f4f6",
  secondaryForeground: "#1f2937",
  accent: "#10b981",
  accentForeground: "#ffffff",
  background: "#ffffff",
  foreground: "#000000",
  card: "#ffffff",
  cardForeground: "#000000",
  border: "#e5e7eb",
  muted: "#f3f4f6",
  mutedForeground: "#6b7280",
  ring: "#059669",
  sidebar: "#ffffff",
  sidebarForeground: "#1f2937",
  sidebarPrimary: "#059669",
  sidebarPrimaryForeground: "#ffffff",
  sidebarAccent: "#f3f4f6",
  sidebarAccentForeground: "#1f2937",
};

const DEFAULT_CONFIG: BrandingConfig = {
  organizationId: "",
  colors: DEFAULT_COLORS,
  darkModeColors: {},
  typography: { fontFamily: "Poppins", headingFont: "Poppins", monoFont: "JetBrains Mono", baseFontSize: 16 },
  logo: { url: "", width: 200, height: 40, darkModeUrl: "" },
  favicon: "",
  mode: "light",
  presetName: "emerald",
  version: 0,
  updatedBy: "",
};

export interface BrandingState {
  branding: BrandingConfig;
  isDefault: boolean;
  isLoading: boolean;
  isSaving: boolean;
  history: BrandingHistoryEntry[];
  historyPagination: { page: number; limit: number; total: number; pages: number };
  lastError: string | null;

  load: () => Promise<void>;
  save: (updates: Partial<BrandingConfig>) => Promise<boolean>;
  updateColors: (colors: Partial<BrandingColors>) => void;
  applyColors: (colors: BrandingColors) => void;
  resetDefaults: () => Promise<boolean>;
  setMode: (mode: "light" | "dark" | "system") => void;
  loadHistory: (page?: number, limit?: number) => Promise<void>;
  rollback: (version: number) => Promise<boolean>;
  syncFromWs: (branding: BrandingConfig) => void;
}

function colorsToCSSVars(colors: BrandingColors, prefix = ""): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors)) {
    // camelCase to kebab-case
    const cssName = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    vars[`${prefix}${cssName}`] = value as string;
  }
  return vars;
}

function applyToDOM(colors: BrandingColors, mode: "light" | "dark" | "system") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Apply primary CSS variables
  const vars = colorsToCSSVars(colors);
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(`--${name}`, value);
  }

  // Apply ring color (derived from primary)
  root.style.setProperty("--ring", colors.primary);

  // Mode handling
  root.classList.remove("light", "dark");
  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "light") {
    root.classList.add("light");
  } else {
    // system
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "dark" : "light");
  }
}

function saveToStorage(config: BrandingConfig) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch { /* quota exceeded, ignore */ }
}

function loadFromStorage(): BrandingConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* parse error, ignore */ }
  return null;
}

export const useBrandingStore = create<BrandingState>((set, get) => ({
  branding: loadFromStorage() || { ...DEFAULT_CONFIG },
  isDefault: true,
  isLoading: false,
  isSaving: false,
  history: [],
  historyPagination: { page: 1, limit: 20, total: 0, pages: 0 },
  lastError: null,

  load: async () => {
    set({ isLoading: true, lastError: null });
    try {
      const res = await brandingApi.get();
      if (res.success && res.branding) {
        const branding = res.branding;
        applyToDOM(branding.colors, branding.mode);
        saveToStorage(branding);
        set({ branding, isDefault: !!res.isDefault, isLoading: false });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Branding] Load failed:", msg);
      set({ isLoading: false, lastError: msg });
    }
  },

  save: async (updates: Partial<BrandingConfig>) => {
    set({ isSaving: true, lastError: null });
    try {
      const res = await brandingApi.update(updates);
      if (res.success && res.branding) {
        applyToDOM(res.branding.colors, res.branding.mode);
        saveToStorage(res.branding);
        set({ branding: res.branding, isSaving: false, isDefault: false });
        return true;
      }
      set({ isSaving: false, lastError: "Save returned no data" });
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ isSaving: false, lastError: msg });
      return false;
    }
  },

  updateColors: (colors: Partial<BrandingColors>) => {
    const current = get().branding;
    const merged = { ...current.colors, ...colors };
    // Auto-generate hover variants
    if (colors.primary && !colors.primaryHover) {
      merged.primaryHover = adjustBrightness(colors.primary, -20);
    }
    applyToDOM(merged, current.mode);
    const updated = { ...current, colors: merged };
    saveToStorage(updated);
    set({ branding: updated });
  },

  applyColors: (colors: BrandingColors) => {
    const current = get().branding;
    applyToDOM(colors, current.mode);
    const updated = { ...current, colors };
    saveToStorage(updated);
    set({ branding: updated });
  },

  resetDefaults: async () => {
    set({ isSaving: true });
    try {
      const res = await brandingApi.reset();
      if (res.success && res.branding) {
        applyToDOM(res.branding.colors, res.branding.mode);
        saveToStorage(res.branding);
        set({ branding: res.branding, isSaving: false, isDefault: true });
        return true;
      }
      // Fallback: apply locally
      applyToDOM(DEFAULT_COLORS, "light");
      const fallback = { ...DEFAULT_CONFIG };
      saveToStorage(fallback);
      set({ branding: fallback, isSaving: false, isDefault: true });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      applyToDOM(DEFAULT_COLORS, "light");
      const fallback = { ...DEFAULT_CONFIG };
      saveToStorage(fallback);
      set({ branding: fallback, isSaving: false, isDefault: true, lastError: msg });
      return true;
    }
  },

  setMode: (mode: "light" | "dark" | "system") => {
    const current = get().branding;
    applyToDOM(current.colors, mode);
    const updated = { ...current, mode };
    saveToStorage(updated);
    set({ branding: updated });
  },

  loadHistory: async (page = 1, limit = 20) => {
    try {
      const res = await brandingApi.getHistory(page, limit);
      if (res.success) {
        set({ history: res.history, historyPagination: res.pagination });
      }
    } catch (err: any) {
      console.error("[Branding] Load history failed:", err.message);
    }
  },

  rollback: async (version: number) => {
    set({ isSaving: true });
    try {
      const res = await brandingApi.rollback(version);
      if (res.success && res.branding) {
        applyToDOM(res.branding.colors, res.branding.mode);
        saveToStorage(res.branding);
        set({ branding: res.branding, isSaving: false });
        return true;
      }
      set({ isSaving: false });
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ isSaving: false, lastError: msg });
      return false;
    }
  },

  syncFromWs: (branding: BrandingConfig) => {
    applyToDOM(branding.colors, branding.mode);
    saveToStorage(branding);
    set({ branding, isDefault: false });
  },
}));
