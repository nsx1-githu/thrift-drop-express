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
}: {
  settings: ThemeSettings;
  setSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
  isUploading: boolean;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
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
