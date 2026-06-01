/**
 * Branding configuration model — stores per-workspace branding settings.
 * Supports colors, logo, dark/light mode, typography, and component-level overrides.
 */
import mongoose, { Schema, Document } from "mongoose";

export interface IBrandingColors {
  primary: string;
  primaryHover: string;
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
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
}

export interface IBrandingTypography {
  fontFamily: string;
  headingFont: string;
  monoFont: string;
  baseFontSize: number;
}

export interface IBrandingLogo {
  url: string;
  width: number;
  height: number;
  darkModeUrl: string;
}

export interface IBrandingConfig extends Document<string> {
  organizationId: string;
  colors: IBrandingColors;
  darkModeColors: Partial<IBrandingColors>;
  typography: IBrandingTypography;
  logo: IBrandingLogo;
  favicon: string;
  mode: "light" | "dark" | "system";
  presetName: string;
  version: number;
  updatedBy: string;
  updatedAt: Date;
  createdAt: Date;
}

const defaultColors: IBrandingColors = {
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

const BrandingColorsSchema = new Schema<IBrandingColors>({
  primary: { type: String, default: defaultColors.primary },
  primaryHover: { type: String, default: defaultColors.primaryHover },
  primaryForeground: { type: String, default: defaultColors.primaryForeground },
  secondary: { type: String, default: defaultColors.secondary },
  secondaryForeground: { type: String, default: defaultColors.secondaryForeground },
  accent: { type: String, default: defaultColors.accent },
  accentForeground: { type: String, default: defaultColors.accentForeground },
  background: { type: String, default: defaultColors.background },
  foreground: { type: String, default: defaultColors.foreground },
  card: { type: String, default: defaultColors.card },
  cardForeground: { type: String, default: defaultColors.cardForeground },
  border: { type: String, default: defaultColors.border },
  muted: { type: String, default: defaultColors.muted },
  mutedForeground: { type: String, default: defaultColors.mutedForeground },
  ring: { type: String, default: defaultColors.ring },
  sidebar: { type: String, default: defaultColors.sidebar },
  sidebarForeground: { type: String, default: defaultColors.sidebarForeground },
  sidebarPrimary: { type: String, default: defaultColors.sidebarPrimary },
  sidebarPrimaryForeground: { type: String, default: defaultColors.sidebarPrimaryForeground },
  sidebarAccent: { type: String, default: defaultColors.sidebarAccent },
  sidebarAccentForeground: { type: String, default: defaultColors.sidebarAccentForeground },
}, { _id: false });

const BrandingTypographySchema = new Schema<IBrandingTypography>({
  fontFamily: { type: String, default: "Poppins" },
  headingFont: { type: String, default: "Poppins" },
  monoFont: { type: String, default: "JetBrains Mono" },
  baseFontSize: { type: Number, default: 16 },
}, { _id: false });

const BrandingLogoSchema = new Schema<IBrandingLogo>({
  url: { type: String, default: "" },
  width: { type: Number, default: 200 },
  height: { type: Number, default: 40 },
  darkModeUrl: { type: String, default: "" },
}, { _id: false });

const BrandingConfigSchema = new Schema<IBrandingConfig>({
  _id: { type: String },
  organizationId: { type: String, required: true, unique: true, index: true },
  colors: { type: BrandingColorsSchema, default: () => ({ ...defaultColors }) },
  darkModeColors: { type: Schema.Types.Mixed, default: {} },
  typography: { type: BrandingTypographySchema, default: () => ({}) },
  logo: { type: BrandingLogoSchema, default: () => ({}) },
  favicon: { type: String, default: "" },
  mode: { type: String, enum: ["light", "dark", "system"], default: "light" },
  presetName: { type: String, default: "emerald" },
  version: { type: Number, default: 1 },
  updatedBy: { type: String, default: "" },
}, { timestamps: true });

export const BrandingConfig = mongoose.models.BrandingConfig ?? mongoose.model<IBrandingConfig>("BrandingConfig", BrandingConfigSchema);

export { defaultColors };
