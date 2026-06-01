/**
 * Color utility functions — conversion, validation, variant generation, contrast.
 */

export function isValidHex(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color.trim());
}

export function isValidRgb(color: string): boolean {
  const m = color.trim().match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (!m) return false;
  return [m[1], m[2], m[3]].every((n) => parseInt(n) <= 255);
}

export function isValidHsl(color: string): boolean {
  const m = color.trim().match(/^hsl\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)$/);
  if (!m) return false;
  return parseInt(m[1]) <= 360 && parseInt(m[2]) <= 100 && parseInt(m[3]) <= 100;
}

export function isValidColor(color: string): boolean {
  if (typeof color !== "string") return false;
  const v = color.trim();
  if (isValidHex(v) || isValidRgb(v) || isValidHsl(v)) return true;
  const named = ["white", "black", "transparent", "currentColor", "inherit"];
  return named.includes(v.toLowerCase());
}

/** Normalize any supported color to #rrggbb hex. */
export function toHex(color: string): string {
  const v = color.trim();

  // Already hex
  if (isValidHex(v)) {
    const clean = v.replace("#", "");
    if (clean.length === 3) {
      return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`.toLowerCase();
    }
    if (clean.length === 4) {
      // RGBA short — drop alpha
      return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`.toLowerCase();
    }
    if (clean.length === 8) {
      // RRGGBBAA — drop alpha
      return `#${clean.substring(0, 6)}`.toLowerCase();
    }
    return v.toLowerCase();
  }

  // rgb(r, g, b)
  const rgbMatch = v.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  // hsl(h, s%, l%) — convert via RGB
  const hslMatch = v.match(/^hsl\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)$/);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]) / 360;
    const s = parseInt(hslMatch[2]) / 100;
    const l = parseInt(hslMatch[3]) / 100;
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  // Named colors
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  if (canvas) {
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }
  }

  return v; // fallback
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = toHex(hex).replace("#", "");
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Adjust brightness: amount > 0 = lighter, < 0 = darker. Range roughly -100 to 100. */
export function adjustBrightness(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(rgb.r + amount);
  const g = clamp(rgb.g + amount);
  const b = clamp(rgb.b + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** Generate a full set of lighter/darker variants from a base color. */
export function generateColorVariants(hex: string): { lightest: string; lighter: string; base: string; darker: string; darkest: string } {
  return {
    lightest: adjustBrightness(hex, 80),
    lighter: adjustBrightness(hex, 40),
    base: toHex(hex),
    darker: adjustBrightness(hex, -30),
    darkest: adjustBrightness(hex, -60),
  };
}

/** Relative luminance per WCAG 2.1 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Contrast ratio between two hex colors per WCAG 2.1 */
export function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(toHex(hex1));
  const rgb2 = hexToRgb(toHex(hex2));
  if (!rgb1 || !rgb2) return 1;
  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

export interface ContrastResult {
  ratio: number;
  aa: boolean;
  aaa: boolean;
  aaLarge: boolean;
  grade: "AAA" | "AA" | "AA Large" | "Fail";
}

export function checkContrast(foreground: string, background: string): ContrastResult {
  const ratio = contrastRatio(foreground, background);
  return {
    ratio,
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    aaLarge: ratio >= 3,
    grade: ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA Large" : "Fail",
  };
}

/** Convert hex to CSS oklch string for use with modern CSS. Approximate. */
export function hexToOklch(hex: string): string {
  const rgb = hexToRgb(toHex(hex));
  if (!rgb) return "oklch(0.5 0 0)";
  // Linearize
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  // Luminance
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Approximate oklch lightness (0-1)
  const oklchL = Math.pow(l, 0.42); // rough perceptual mapping
  // Chroma & hue approximation
  const maxC = Math.max(r, g, b) - Math.min(r, g, b);
  const c = maxC / 255 * 0.3;
  let h = 0;
  if (maxC !== 0) {
    if (r >= g && r >= b) h = ((g - b) / maxC) * 60;
    else if (g >= r && g >= b) h = (2 + (b - r) / maxC) * 60;
    else h = (4 + (r - g) / maxC) * 60;
    if (h < 0) h += 360;
  }
  return `oklch(${Math.round(oklchL * 1000) / 1000} ${Math.round(c * 1000) / 1000} ${Math.round(h)})`;
}
