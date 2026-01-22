import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StoreSettingsMap = Record<string, string>;

/**
 * Reads store_settings into a key->value map and keeps it in sync via realtime.
 * Public SELECT is allowed by backend policies.
 */
export function useStoreSettings() {
  const [data, setData] = useState<StoreSettingsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from("store_settings").select("key, value");
        if (error) throw error;

        const map: StoreSettingsMap = {};
        (data ?? []).forEach((row) => {
          map[row.key] = row.value ?? "";
        });
        if (isMounted) setData(map);
      } catch (e) {
        if (isMounted) setError(e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSettings();

    const channel = supabase
      .channel("store_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_settings" },
        () => fetchSettings(),
      )
      .subscribe();

    return () => {
      isMounted = false;
      // Avoid unhandled promise rejections (Supabase can reject with AbortError during teardown)
      void supabase.removeChannel(channel).catch(() => {
        /* ignore */
      });
    };
  }, []);

  const get = useMemo(() => {
    return (key: string, fallback = "") => data[key] ?? fallback;
  }, [data]);

  return { settings: data, get, isLoading, error };
}
