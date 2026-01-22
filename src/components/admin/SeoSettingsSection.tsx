import type React from "react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type SeoSettings = {
  seo_title: string;
  seo_description: string;
  seo_og_image_url: string;
};

const seoSchema = z.object({
  seo_title: z
    .string()
    .trim()
    .max(60, { message: "Site title must be 60 characters or less" })
    .optional()
    .or(z.literal("")),
  seo_description: z
    .string()
    .trim()
    .max(160, { message: "Meta description must be 160 characters or less" })
    .optional()
    .or(z.literal("")),
  seo_og_image_url: z
    .string()
    .trim()
    .url({ message: "OG image must be a valid URL" })
    .optional()
    .or(z.literal("")),
});

export function validateSeoSettings(settings: SeoSettings) {
  return seoSchema.safeParse(settings);
}

export function SeoSettingsSection({
  settings,
  setSettings,
}: {
  settings: SeoSettings;
  setSettings: React.Dispatch<React.SetStateAction<any>>;
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof SeoSettings, string>>>({});

  const preview = useMemo(() => {
    const title = settings.seo_title?.trim();
    const desc = settings.seo_description?.trim();
    return {
      title: title || "(Not set)",
      desc: desc || "(Not set)",
    };
  }, [settings.seo_title, settings.seo_description]);

  const runValidation = () => {
    const res = validateSeoSettings(settings);
    if (!res.success) {
      const next: Partial<Record<keyof SeoSettings, string>> = {};
      for (const issue of res.error.issues) {
        const key = issue.path[0] as keyof SeoSettings | undefined;
        if (key) next[key] = issue.message;
      }
      setErrors(next);
      return false;
    }
    setErrors({});
    return true;
  };

  const openMediaLibraryHint = () => {
    toast.message("Tip: Upload the OG image in Admin → Media, then paste its public URL here.");
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">SEO</h3>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="seo_title">Site title</Label>
          <Input
            id="seo_title"
            value={settings.seo_title}
            onChange={(e) => setSettings((p: any) => ({ ...p, seo_title: e.target.value }))}
            onBlur={runValidation}
            placeholder="e.g., Thrift Vault — Curated Vintage"
            className={`mt-1 ${errors.seo_title ? "border-destructive" : ""}`}
            maxLength={80}
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Recommended: ≤ 60 chars</p>
            <p className="text-xs text-muted-foreground">{settings.seo_title.trim().length}/60</p>
          </div>
          {errors.seo_title ? <p className="text-xs text-destructive mt-1">{errors.seo_title}</p> : null}
        </div>

        <div>
          <Label htmlFor="seo_description">Meta description</Label>
          <textarea
            id="seo_description"
            value={settings.seo_description}
            onChange={(e) => setSettings((p: any) => ({ ...p, seo_description: e.target.value }))}
            onBlur={runValidation}
            placeholder="Short summary shown in search results."
            rows={3}
            className={`input-field mt-1 resize-none ${errors.seo_description ? "border-destructive" : ""}`}
            maxLength={200}
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Recommended: ≤ 160 chars</p>
            <p className="text-xs text-muted-foreground">{settings.seo_description.trim().length}/160</p>
          </div>
          {errors.seo_description ? (
            <p className="text-xs text-destructive mt-1">{errors.seo_description}</p>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="seo_og_image_url">OG image URL</Label>
            <Button type="button" variant="ghost" size="sm" onClick={openMediaLibraryHint}>
              <ImageIcon className="w-4 h-4 mr-2" />
              Use Media Library
            </Button>
          </div>
          <Input
            id="seo_og_image_url"
            value={settings.seo_og_image_url}
            onChange={(e) => setSettings((p: any) => ({ ...p, seo_og_image_url: e.target.value }))}
            onBlur={runValidation}
            placeholder="https://.../og-image.png"
            className={`mt-1 ${errors.seo_og_image_url ? "border-destructive" : ""}`}
          />
          {errors.seo_og_image_url ? (
            <p className="text-xs text-destructive mt-1">{errors.seo_og_image_url}</p>
          ) : null}

          {settings.seo_og_image_url ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="w-24 h-16 rounded-md border bg-muted overflow-hidden">
                <img
                  src={settings.seo_og_image_url}
                  alt="OG preview"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground">Preview only; use 1200×630 for best results.</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground mb-2">Preview</p>
          <p className="text-sm font-medium">{preview.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{preview.desc}</p>
        </div>
      </div>
    </div>
  );
}
