"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { workspaceApi } from "@/lib/api/client"
import { Palette, Upload, RotateCcw, Sun, Moon, Monitor } from "lucide-react"

interface ThemeSettings {
  // Primary brand colors
  primaryColor: string
  primaryHover: string
  primaryForeground: string

  // Secondary colors
  secondaryColor: string
  secondaryForeground: string

  // Accent colors
  accentColor: string
  accentForeground: string

  // UI colors
  backgroundColor: string
  foregroundColor: string
  cardColor: string
  cardForeground: string
  borderColor: string
  mutedColor: string
  mutedForeground: string

  // Component-specific
  tableHeaderBg: string
  tableHeaderText: string
  buttonPrimaryBg: string
  buttonPrimaryText: string
  sidebarBg: string
  sidebarText: string

  // Theme mode
  themeMode: "light" | "dark" | "system"

  // Company branding
  companyLogo: string
  companyName: string
  favicon: string

  // Auto-apply from logo
  autoApplyFromLogo: boolean
}

const DEFAULT_THEME: ThemeSettings = {
  primaryColor: "#059669",
  primaryHover: "#047857",
  primaryForeground: "#ffffff",
  secondaryColor: "#f3f4f6",
  secondaryForeground: "#1f2937",
  accentColor: "#10b981",
  accentForeground: "#ffffff",
  backgroundColor: "#ffffff",
  foregroundColor: "#000000",
  cardColor: "#ffffff",
  cardForeground: "#000000",
  borderColor: "#e5e7eb",
  mutedColor: "#f3f4f6",
  mutedForeground: "#6b7280",
  tableHeaderBg: "#f9fafb",
  tableHeaderText: "#374151",
  buttonPrimaryBg: "#059669",
  buttonPrimaryText: "#ffffff",
  sidebarBg: "#ffffff",
  sidebarText: "#1f2937",
  themeMode: "light",
  companyLogo: "",
  companyName: "",
  favicon: "",
  autoApplyFromLogo: false,
}

// Preset themes
const PRESET_THEMES = [
  {
    name: "Emerald (Default)",
    primary: "#059669",
    secondary: "#f3f4f6",
    accent: "#10b981",
  },
  {
    name: "Ocean Blue",
    primary: "#0284c7",
    secondary: "#f0f9ff",
    accent: "#0ea5e9",
  },
  {
    name: "Royal Purple",
    primary: "#7c3aed",
    secondary: "#f5f3ff",
    accent: "#8b5cf6",
  },
  {
    name: "Sunset Orange",
    primary: "#ea580c",
    secondary: "#fff7ed",
    accent: "#f97316",
  },
  {
    name: "Rose Pink",
    primary: "#e11d48",
    secondary: "#fff1f2",
    accent: "#f43f5e",
  },
  {
    name: "Slate Dark",
    primary: "#475569",
    secondary: "#f8fafc",
    accent: "#64748b",
  },
]

export function ThemeSettings() {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>("")

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await workspaceApi.getThemeSettings()
      if (res.success && res.themeSettings && Object.keys(res.themeSettings).length > 0) {
        setSettings({ ...DEFAULT_THEME, ...res.themeSettings })
        if (res.themeSettings.companyLogo) {
          setLogoPreview(res.themeSettings.companyLogo)
        }
        applyTheme({ ...DEFAULT_THEME, ...res.themeSettings })
      } else {
        // Fallback to local storage if API is empty
        const stored = localStorage.getItem("theme-settings")
        if (stored) {
          const parsed = JSON.parse(stored)
          setSettings({ ...DEFAULT_THEME, ...parsed })
          if (parsed.companyLogo) {
            setLogoPreview(parsed.companyLogo)
          }
          applyTheme({ ...DEFAULT_THEME, ...parsed })
        }
      }
    } catch (error) {
      console.error("Error loading theme settings:", error)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    setSaving(true)
    try {
      await workspaceApi.updateThemeSettings(settings)
      localStorage.setItem("theme-settings", JSON.stringify(settings))

      // Update query cache instantly and invalidate for background refetch
      queryClient.setQueryData(["theme-settings"], { success: true, themeSettings: settings })
      queryClient.invalidateQueries({ queryKey: ["theme-settings"] })

      // Apply theme immediately
      applyTheme(settings)

      alert("Theme & Branding settings saved successfully!")
    } catch (error) {
      console.error("Error saving theme settings:", error)
      alert("Failed to save theme settings to server. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  function applyTheme(theme: ThemeSettings) {
    const root = document.documentElement

    // Apply CSS custom properties
    root.style.setProperty("--primary", theme.primaryColor)
    root.style.setProperty("--primary-foreground", theme.primaryForeground)
    root.style.setProperty("--secondary", theme.secondaryColor)
    root.style.setProperty("--secondary-foreground", theme.secondaryForeground)
    root.style.setProperty("--accent", theme.accentColor)
    root.style.setProperty("--accent-foreground", theme.accentForeground)
    root.style.setProperty("--background", theme.backgroundColor)
    root.style.setProperty("--foreground", theme.foregroundColor)
    root.style.setProperty("--card", theme.cardColor)
    root.style.setProperty("--card-foreground", theme.cardForeground)
    root.style.setProperty("--border", theme.borderColor)
    root.style.setProperty("--muted", theme.mutedColor)
    root.style.setProperty("--muted-foreground", theme.mutedForeground)

    // Save to localStorage for persistence
    localStorage.setItem("theme-settings", JSON.stringify(theme))
  }

  function handleColorChange(key: keyof ThemeSettings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function applyPreset(preset: typeof PRESET_THEMES[0]) {
    setSettings((prev) => ({
      ...prev,
      primaryColor: preset.primary,
      primaryHover: adjustBrightness(preset.primary, -20),
      primaryForeground: "#ffffff",
      secondaryColor: preset.secondary,
      secondaryForeground: adjustBrightness(preset.secondary, -80),
      accentColor: preset.accent,
      accentForeground: "#ffffff",
      buttonPrimaryBg: preset.primary,
      buttonPrimaryText: "#ffffff",
    }))
  }

  function adjustBrightness(hex: string, amount: number): string {
    const num = parseInt(hex.replace("#", ""), 16)
    const r = Math.max(0, Math.min(255, (num >> 16) + amount))
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount))
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount))
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      
      // Auto-extract colors locally to avoid CORS canvas taint
      if (settings.autoApplyFromLogo) {
        const localUrl = URL.createObjectURL(file)
        extractColorsFromLogo(localUrl)
      }

      // Upload to R2 via API
      const res = await workspaceApi.uploadImage(file)
      if (res.success && res.url) {
        setSettings((prev) => ({ ...prev, companyLogo: res.url }))
        setLogoPreview(res.url)
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
      alert("Failed to upload logo. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  function extractColorsFromLogo(logoUrl: string) {
    // Create an image element to extract colors
    const img = document.createElement("img")
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Get dominant color from multiple points
      const colors = [
        ctx.getImageData(0, 0, 1, 1).data,
        ctx.getImageData(img.width - 1, 0, 1, 1).data,
        ctx.getImageData(0, img.height - 1, 1, 1).data,
        ctx.getImageData(img.width / 2, img.height / 2, 1, 1).data,
      ]

      const dominantColor = colors[3] // Center color
      const primary = rgbToHex(dominantColor[0], dominantColor[1], dominantColor[2])

      setSettings((prev) => ({
        ...prev,
        primaryColor: primary,
        primaryHover: adjustBrightness(primary, -20),
        buttonPrimaryBg: primary,
      }))

      alert("Colors extracted from logo and applied!")
    }
    img.src = logoUrl
  }

  function rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  }

  function resetToDefaults() {
    setSettings(DEFAULT_THEME)
  }

  function previewTheme() {
    applyTheme(settings)
  }

  if (loading) {
    return <div className="text-center py-8">Loading theme settings...</div>
  }

  return (
    <div className="space-y-6">
    <div className="space-y-8 pb-10">
      {/* Brand Identity */}
      <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="size-5" />
                Company Branding
              </CardTitle>
              <CardDescription>
                Upload your company logo and set your brand identity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={settings.companyName}
                  onChange={(e) => handleColorChange("companyName", e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview && (
                    <div className="size-20 rounded-lg border flex items-center justify-center overflow-hidden bg-gray-50">
                      <img src={logoPreview} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: PNG or SVG with transparent background, max 2MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto-apply colors from logo */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-apply colors from logo</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically extract and apply brand colors when uploading a logo
                  </p>
                </div>
                <Switch
                  checked={settings.autoApplyFromLogo}
                  onCheckedChange={(checked) => handleColorChange("autoApplyFromLogo", checked as any)}
                />
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Color Scheme */}
      <div className="space-y-6">
          {/* Primary Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Colors</CardTitle>
              <CardDescription>Used for buttons, links, and primary actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                      placeholder="#059669"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Primary Hover</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.primaryHover}
                      onChange={(e) => handleColorChange("primaryHover", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.primaryHover}
                      onChange={(e) => handleColorChange("primaryHover", e.target.value)}
                      placeholder="#047857"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Primary Text</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.primaryForeground}
                      onChange={(e) => handleColorChange("primaryForeground", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.primaryForeground}
                      onChange={(e) => handleColorChange("primaryForeground", e.target.value)}
                      placeholder="#ffffff"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: settings.primaryColor }}>
                <p className="text-sm font-medium" style={{ color: settings.primaryForeground }}>
                  Primary Color Preview
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Secondary & Accent */}
          <Card>
            <CardHeader>
              <CardTitle>Secondary & Accent Colors</CardTitle>
              <CardDescription>Used for backgrounds, cards, and highlights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Secondary</h4>
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                        placeholder="#f3f4f6"
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.secondaryForeground}
                        onChange={(e) => handleColorChange("secondaryForeground", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.secondaryForeground}
                        onChange={(e) => handleColorChange("secondaryForeground", e.target.value)}
                        placeholder="#1f2937"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Accent</h4>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => handleColorChange("accentColor", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.accentColor}
                        onChange={(e) => handleColorChange("accentColor", e.target.value)}
                        placeholder="#10b981"
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.accentForeground}
                        onChange={(e) => handleColorChange("accentForeground", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.accentForeground}
                        onChange={(e) => handleColorChange("accentForeground", e.target.value)}
                        placeholder="#ffffff"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Background & Text */}
          <Card>
            <CardHeader>
              <CardTitle>Background & Text</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.backgroundColor}
                      onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                      placeholder="#ffffff"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.foregroundColor}
                      onChange={(e) => handleColorChange("foregroundColor", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.foregroundColor}
                      onChange={(e) => handleColorChange("foregroundColor", e.target.value)}
                      placeholder="#000000"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Card Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.cardColor}
                      onChange={(e) => handleColorChange("cardColor", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.cardColor}
                      onChange={(e) => handleColorChange("cardColor", e.target.value)}
                      placeholder="#ffffff"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.borderColor}
                      onChange={(e) => handleColorChange("borderColor", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.borderColor}
                      onChange={(e) => handleColorChange("borderColor", e.target.value)}
                      placeholder="#e5e7eb"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-6 rounded-lg border" style={{
                backgroundColor: settings.cardColor,
                color: settings.foregroundColor,
                borderColor: settings.borderColor,
              }}>
                <h3 className="text-lg font-semibold mb-2">Preview Card</h3>
                <p className="text-sm" style={{ color: settings.mutedForeground }}>
                  This is how your card content will look with the selected colors.
                </p>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Components */}
      <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Component Customization</CardTitle>
              <CardDescription>
                Customize the appearance of specific UI components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Table Headers */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Table Headers
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Header Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.tableHeaderBg}
                        onChange={(e) => handleColorChange("tableHeaderBg", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.tableHeaderBg}
                        onChange={(e) => handleColorChange("tableHeaderBg", e.target.value)}
                        placeholder="#f9fafb"
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Header Text</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.tableHeaderText}
                        onChange={(e) => handleColorChange("tableHeaderText", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.tableHeaderText}
                        onChange={(e) => handleColorChange("tableHeaderText", e.target.value)}
                        placeholder="#374151"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Table Preview */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="px-4 py-3" style={{
                    backgroundColor: settings.tableHeaderBg,
                    color: settings.tableHeaderText,
                  }}>
                    <span className="text-sm font-semibold">Table Header Preview</span>
                  </div>
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Table content area
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Buttons
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary Button Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.buttonPrimaryBg}
                        onChange={(e) => handleColorChange("buttonPrimaryBg", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.buttonPrimaryBg}
                        onChange={(e) => handleColorChange("buttonPrimaryBg", e.target.value)}
                        placeholder="#059669"
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Button Text</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.buttonPrimaryText}
                        onChange={(e) => handleColorChange("buttonPrimaryText", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.buttonPrimaryText}
                        onChange={(e) => handleColorChange("buttonPrimaryText", e.target.value)}
                        placeholder="#ffffff"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Button Preview */}
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-md text-sm font-medium"
                    style={{
                      backgroundColor: settings.buttonPrimaryBg,
                      color: settings.buttonPrimaryText,
                    }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded-md text-sm font-medium border"
                    style={{
                      borderColor: settings.borderColor,
                      color: settings.foregroundColor,
                      backgroundColor: settings.backgroundColor,
                    }}
                  >
                    Secondary Button
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Sidebar
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Sidebar Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.sidebarBg}
                        onChange={(e) => handleColorChange("sidebarBg", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.sidebarBg}
                        onChange={(e) => handleColorChange("sidebarBg", e.target.value)}
                        placeholder="#ffffff"
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sidebar Text</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.sidebarText}
                        onChange={(e) => handleColorChange("sidebarText", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.sidebarText}
                        onChange={(e) => handleColorChange("sidebarText", e.target.value)}
                        placeholder="#1f2937"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Presets */}
      <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-5" />
                Preset Themes
              </CardTitle>
              <CardDescription>
                Choose from our curated theme presets or create your own custom theme.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRESET_THEMES.map((preset) => (
                  <div
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="cursor-pointer rounded-lg border-2 p-4 hover:border-slate-200 transition-all space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="size-8 rounded-full"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="size-8 rounded-full"
                        style={{ backgroundColor: preset.secondary }}
                      />
                      <div
                        className="size-8 rounded-full"
                        style={{ backgroundColor: preset.accent }}
                      />
                    </div>
                    <p className="font-semibold text-sm">{preset.name}</p>
                    <button
                      className="w-full py-2 rounded-md text-xs font-medium text-white"
                      style={{ backgroundColor: preset.primary }}
                    >
                      Apply Theme
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
      </div>

      </div>
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={resetToDefaults}>
          <RotateCcw className="size-4 mr-2" />
          Reset to Defaults
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={previewTheme}>
            Preview Theme
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? "Saving..." : "Save Theme Settings"}
          </Button>
        </div>
      </div>
    </div>
  )
}
