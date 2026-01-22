import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const THEME_COLOR_KEYS: Array<[
  settingKey: string,
  cssVar: string,
]> = [
  ["theme_background", "--background"],
  ["theme_foreground", "--foreground"],
  ["theme_card", "--card"],
  ["theme_card_foreground", "--card-foreground"],
  ["theme_muted", "--muted"],
  ["theme_muted_foreground", "--muted-foreground"],
  ["theme_border", "--border"],
  ["theme_ring", "--ring"],
  ["theme_primary", "--primary"],
  ["theme_primary_foreground", "--primary-foreground"],
  ["theme_accent", "--accent"],
  ["theme_accent_foreground", "--accent-foreground"],
];

/**
 * Applies admin-configured theme settings (CSS vars + theme mode) to the whole app.
 */
export function ThemeApplier() {
  const { setTheme } = useTheme();
  const { get } = useStoreSettings();

  useEffect(() => {
    const mode = get("theme_mode", "dark");
    if (mode === "light" || mode === "dark" || mode === "system") {
      setTheme(mode);
    } else {
      setTheme("dark");
    }
  }, [get, setTheme]);

  useEffect(() => {
    const root = document.documentElement;

    // Fonts
    root.style.setProperty("--font-sans", get("theme_font_sans", "Space Grotesk"));
    root.style.setProperty("--font-mono", get("theme_font_mono", "JetBrains Mono"));

    // Colors (HSL triplets)
    for (const [settingKey, cssVar] of THEME_COLOR_KEYS) {
      const v = get(settingKey, "").trim();
      if (v) root.style.setProperty(cssVar, v);
    }
  }, [get]);

  return null;
}
