/**
 * PWAInstallBanner — Shows iOS "Add to Home Screen" instructions
 * and Android Chrome install prompt for the admin PWA
 */
import { useState, useEffect } from "react";
import { X, Share, Plus, Smartphone } from "lucide-react";

const DISMISSED_KEY = "pwa-install-dismissed";

export default function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if dismissed before
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      // Show iOS instructions after a short delay
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  };

  const installAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-navy-deep text-cream rounded-2xl shadow-2xl border border-white/10 p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="bg-orange/20 rounded-xl p-2 shrink-0">
          <Smartphone className="w-5 h-5 text-orange" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-[Oswald] uppercase tracking-wider text-sm text-orange">Install Admin App</p>
          {isIOS ? (
            <div className="mt-1 space-y-1">
              <p className="text-xs text-cream/70">Add to your home screen for quick access:</p>
              <div className="flex items-center gap-1.5 text-xs text-cream/90">
                <span className="bg-white/10 rounded px-1.5 py-0.5 flex items-center gap-1">
                  <Share className="w-3 h-3" /> Share
                </span>
                <span className="text-cream/50">→</span>
                <span className="bg-white/10 rounded px-1.5 py-0.5 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add to Home Screen
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-1">
              <p className="text-xs text-cream/70 mb-2">Install for quick access from your home screen.</p>
              <button
                onClick={installAndroid}
                className="bg-orange text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-orange/90 transition-colors"
              >
                Install Now
              </button>
            </div>
          )}
        </div>
        <button onClick={dismiss} className="text-cream/40 hover:text-cream/80 transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
