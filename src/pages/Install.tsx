import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  // iOS standalone
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navAny = navigator as any;
  return window.matchMedia?.("(display-mode: standalone)").matches || navAny.standalone === true;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  const canInstall = useMemo(() => !!deferredPrompt && !installed, [deferredPrompt, installed]);

  useEffect(() => {
    setInstalled(isStandalone());

    const onBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Install the app</h1>
        <p className="text-sm text-muted-foreground">
          Install this store to your home screen for a faster, app-like experience.
        </p>
      </header>

      <div className="mt-6 space-y-4">
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">One-tap install (Android / Desktop)</p>
              <p className="text-sm text-muted-foreground">
                If your browser supports it, you’ll see an install button.
              </p>
            </div>
            <Button onClick={handleInstall} disabled={!canInstall}>
              {installed ? "Installed" : canInstall ? "Install" : "Not available"}
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-medium text-foreground">Install on iPhone / iPad (Safari)</p>
          <Separator className="my-3" />
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Open this website in Safari.</li>
            <li>Tap the Share icon (square with an arrow).</li>
            <li>Tap <span className="text-foreground">Add to Home Screen</span>.</li>
            <li>Tap <span className="text-foreground">Add</span>.</li>
          </ol>
          {isIos() && !installed && (
            <p className="mt-3 text-xs text-muted-foreground">
              Tip: iOS doesn’t show an “Install” button—use “Add to Home Screen” instead.
            </p>
          )}
        </Card>

        <Card className="p-4">
          <p className="text-sm font-medium text-foreground">Install on Android (Chrome)</p>
          <Separator className="my-3" />
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Open this website in Chrome.</li>
            <li>Tap the ⋮ menu (top-right).</li>
            <li>Tap <span className="text-foreground">Install app</span> or <span className="text-foreground">Add to Home screen</span>.</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
