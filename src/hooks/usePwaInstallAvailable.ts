import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone(): boolean {
  // iOS Safari
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any;
  if (typeof nav?.standalone === "boolean") return nav.standalone;

  // Modern browsers
  return window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
}

/**
 * True when the browser has fired `beforeinstallprompt` (i.e., one-tap install is available).
 * This intentionally does NOT show on iOS where install is manual.
 */
export function usePwaInstallAvailable(): boolean {
  const [hasBipEvent, setHasBipEvent] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      // Prevent mini-infobar and keep event for later; we only need availability.
      e.preventDefault();
      setHasBipEvent(true);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setHasBipEvent(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  return useMemo(() => {
    if (installed) return false;
    if (isStandalone()) return false;
    return hasBipEvent;
  }, [hasBipEvent, installed]);
}
