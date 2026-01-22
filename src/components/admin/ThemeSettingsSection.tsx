import { useMemo } from "react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Palette, Type, SunMoon, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ThemeMode = "dark" | "light";

export type ThemeSettings = {
  theme_mode: string;
  theme_primary: string;
  theme_primary_foreground: string;
  theme_accent: string;
  theme_accent_foreground: string;
  theme_background: string;
  theme_foreground: string;
  theme_card: string;
  theme_card_foreground: string;
  theme_muted: string;
  theme_muted_foreground: string;
  theme_border: string;
  theme_ring: string;
  theme_font_sans: string;
  theme_font_mono: string;
  theme_logo_url: string;
};

const HSL_TRIPLET = /^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/;

export function ThemeSettingsSection({
  settings,
  setSettings,
  isUploading,
  setIsUploading,
  isSaving,
  onApplyPreset,
}: {
  settings: ThemeSettings;
  setSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
  isUploading: boolean;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  isSaving?: boolean;
  onApplyPreset?: (preset: Partial<ThemeSettings>) => Promise<void> | void;
}) {
  const fontOptions = useMemo(
    () => [
      { label: "Space Grotesk", value: "Space Grotesk" },
      { label: "System", value: "system-ui" },
    ],
    [],
  );

  const monoOptions = useMemo(
    () => [
      { label: "JetBrains Mono", value: "JetBrains Mono" },
      { label: "System Mono", value: "ui-monospace" },
    ],
    [],
  );

  const presets = useMemo(
    () =>
      [
        {
          id: "streetwear_dark",
          label: "Streetwear Dark",
          values: {
            theme_mode: "dark",
            theme_primary: "35 30% 75%",
            theme_primary_foreground: "30 5% 8%",
            theme_accent: "25 60% 55%",
            theme_accent_foreground: "40 20% 95%",
            theme_background: "30 5% 8%",
            theme_foreground: "40 20% 92%",
            theme_card: "30 5% 11%",
            theme_card_foreground: "40 20% 92%",
            theme_muted: "30 5% 18%",
            theme_muted_foreground: "30 10% 55%",
            theme_border: "30 5% 20%",
            theme_ring: "35 30% 75%",
            theme_font_sans: "Space Grotesk",
            theme_font_mono: "JetBrains Mono",
          } satisfies Partial<ThemeSettings>,
        },
        {
          id: "vintage_cream",
          label: "Vintage Cream",
          values: {
            theme_mode: "light",
            theme_primary: "18 65% 36%",
            theme_primary_foreground: "40 20% 96%",
            theme_accent: "35 55% 55%",
            theme_accent_foreground: "30 25% 12%",
            theme_background: "40 30% 96%",
            theme_foreground: "30 25% 12%",
            theme_card: "38 28% 92%",
            theme_card_foreground: "30 25% 12%",
            theme_muted: "38 18% 88%",
            theme_muted_foreground: "30 15% 35%",
            theme_border: "32 15% 82%",
            theme_ring: "18 65% 36%",
            theme_font_sans: "Space Grotesk",
            theme_font_mono: "JetBrains Mono",
          } satisfies Partial<ThemeSettings>,
        },
        {
          id: "minimal_light",
          label: "Minimal Light",
          values: {
            theme_mode: "light",
            theme_primary: "222 14% 16%",
            theme_primary_foreground: "0 0% 100%",
            theme_accent: "210 20% 92%",
            theme_accent_foreground: "222 14% 16%",
            theme_background: "0 0% 100%",
            theme_foreground: "222 14% 16%",
            theme_card: "210 20% 98%",
            theme_card_foreground: "222 14% 16%",
            theme_muted: "210 20% 94%",
            theme_muted_foreground: "220 10% 40%",
            theme_border: "214 18% 86%",
            theme_ring: "222 14% 16%",
            theme_font_sans: "Space Grotesk",
            theme_font_mono: "JetBrains Mono",
          } satisfies Partial<ThemeSettings>,
        },
        {
          id: "neon_night",
          label: "Neon Night",
          values: {
            theme_mode: "dark",
            theme_primary: "168 88% 48%",
            theme_primary_foreground: "200 25% 6%",
            theme_accent: "300 85% 60%",
            theme_accent_foreground: "200 25% 6%",
            theme_background: "210 25% 6%",
            theme_foreground: "210 20% 92%",
            theme_card: "210 22% 9%",
            theme_card_foreground: "210 20% 92%",
            theme_muted: "210 18% 14%",
            theme_muted_foreground: "210 10% 65%",
            theme_border: "210 16% 18%",
            theme_ring: "168 88% 48%",
            theme_font_sans: "Space Grotesk",
            theme_font_mono: "JetBrains Mono",
          } satisfies Partial<ThemeSettings>,
        },
        {
          id: "olive_utility",
          label: "Olive Utility",
          values: {
            theme_mode: "dark",
            theme_primary: "82 28% 45%",
            theme_primary_foreground: "60 20% 96%",
            theme_accent: "20 65% 52%",
            theme_accent_foreground: "60 20% 96%",
            theme_background: "60 10% 8%",
            theme_foreground: "60 20% 92%",
            theme_card: "60 10% 11%",
            theme_card_foreground: "60 20% 92%",
            theme_muted: "60 8% 16%",
            theme_muted_foreground: "60 10% 60%",
            theme_border: "60 8% 20%",
            theme_ring: "82 28% 45%",
            theme_font_sans: "Space Grotesk",
            theme_font_mono: "JetBrains Mono",
          } satisfies Partial<ThemeSettings>,
        },
      ] as const,
    [],
  );

  const applyPreset = async (preset: Partial<ThemeSettings>) => {
    try {
      // Client-safe validation (presets are internal constants, but keep it consistent)
      const keysToValidate: Array<keyof ThemeSettings> = [
        "theme_primary",
        "theme_primary_foreground",
        "theme_accent",
        "theme_accent_foreground",
        "theme_background",
        "theme_foreground",
        "theme_card",
        "theme_card_foreground",
        "theme_muted",
        "theme_muted_foreground",
        "theme_border",
        "theme_ring",
      ];
      for (const k of keysToValidate) {
        const v = (preset[k] ?? "").toString().trim();
        if (v && !validateHsl(v, k)) return;
      }

      // Apply + Save
      if (onApplyPreset) {
        await onApplyPreset(preset);
      } else {
        setSettings((p) => ({ ...p, ...preset }));
        toast.success("Preset applied (tap Save Settings)");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to apply preset");
    }
  };

  const validateHsl = (value: string, label: string) => {
    const v = value.trim();
    if (!v) return true;
    if (!HSL_TRIPLET.test(v)) {
      toast.error(`${label} must look like: 35 30% 75%`);
      return false;
    }
    return true;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `settings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      setSettings((prev) => ({ ...prev, theme_logo_url: publicUrl }));
      toast.success("Logo uploaded! Remember to save settings.");
    } catch (err) {
      console.error("Error uploading logo:", err);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Theme</h3>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2">Quick presets</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant="outline"
              className="justify-start"
              disabled={Boolean(isSaving) || Boolean(isUploading)}
              onClick={() => void applyPreset(p.values)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Tap a preset to apply it{onApplyPreset ? " and save" : ""}.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mode */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SunMoon className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="theme_mode">Light/Dark mode</Label>
          </div>
          <select
            id="theme_mode"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={(settings.theme_mode as ThemeMode) || "dark"}
            onChange={(e) => setSettings((p) => ({ ...p, theme_mode: e.target.value }))}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
          <p className="text-xs text-muted-foreground">Applies to the whole app.</p>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            <Label>Logo</Label>
          </div>

          <div className="flex items-center gap-3">
            {settings.theme_logo_url ? (
              <div className="w-12 h-12 rounded-md border overflow-hidden bg-card">
                <img
                  src={settings.theme_logo_url}
                  alt="Store logo"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-md border flex items-center justify-center text-muted-foreground">
                <ImageIcon className="w-5 h-5" />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("logo-upload")?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {settings.theme_logo_url ? "Change" : "Upload"}
              </Button>
              {settings.theme_logo_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettings((p) => ({ ...p, theme_logo_url: "" }))}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">PNG/SVG/JPG, up to 2MB.</p>
        </div>

        {/* Fonts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="theme_font_sans">Body font</Label>
          </div>
          <select
            id="theme_font_sans"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={settings.theme_font_sans || fontOptions[0]?.value || "Space Grotesk"}
            onChange={(e) => setSettings((p) => ({ ...p, theme_font_sans: e.target.value }))}
          >
            {fontOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="theme_font_mono">Mono font</Label>
          </div>
          <select
            id="theme_font_mono"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={settings.theme_font_mono || monoOptions[0]?.value || "JetBrains Mono"}
            onChange={(e) => setSettings((p) => ({ ...p, theme_font_mono: e.target.value }))}
          >
            {monoOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-3">Colors (HSL triplets)</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="theme_primary">Primary</Label>
            <Input
              id="theme_primary"
              value={settings.theme_primary}
              onChange={(e) =>
                setSettings((p) => ({ ...p, theme_primary: e.target.value }))
              }
              onBlur={() => validateHsl(settings.theme_primary, "Primary")}
              placeholder="35 30% 75%"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="theme_accent">Accent</Label>
            <Input
              id="theme_accent"
              value={settings.theme_accent}
              onChange={(e) =>
                setSettings((p) => ({ ...p, theme_accent: e.target.value }))
              }
              onBlur={() => validateHsl(settings.theme_accent, "Accent")}
              placeholder="25 60% 55%"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="theme_background">Background</Label>
            <Input
              id="theme_background"
              value={settings.theme_background}
              onChange={(e) =>
                setSettings((p) => ({ ...p, theme_background: e.target.value }))
              }
              onBlur={() => validateHsl(settings.theme_background, "Background")}
              placeholder="30 5% 8%"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="theme_foreground">Foreground</Label>
            <Input
              id="theme_foreground"
              value={settings.theme_foreground}
              onChange={(e) =>
                setSettings((p) => ({ ...p, theme_foreground: e.target.value }))
              }
              onBlur={() => validateHsl(settings.theme_foreground, "Foreground")}
              placeholder="40 20% 92%"
              className="mt-1"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Format: <span className="font-mono">H S% L%</span> (no commas)
        </p>
      </div>
    </div>
  );
}
