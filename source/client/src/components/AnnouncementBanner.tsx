/*
 * Equip.HK Announcement Banner — Site-wide dismissable banner
 * Pulls active announcements from the backend
 * Supports info, warning, success, and promo types
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, Info, AlertTriangle, CheckCircle, Megaphone, ArrowRight } from "lucide-react";

const typeConfig: Record<string, { bg: string; text: string; icon: React.ReactNode; border: string }> = {
  info: {
    bg: "bg-blue-600",
    text: "text-white",
    icon: <Info className="w-4 h-4" />,
    border: "border-blue-700",
  },
  warning: {
    bg: "bg-amber-500",
    text: "text-navy-deep",
    icon: <AlertTriangle className="w-4 h-4" />,
    border: "border-amber-600",
  },
  success: {
    bg: "bg-emerald-600",
    text: "text-white",
    icon: <CheckCircle className="w-4 h-4" />,
    border: "border-emerald-700",
  },
  promo: {
    bg: "bg-orange",
    text: "text-white",
    icon: <Megaphone className="w-4 h-4" />,
    border: "border-orange-dark",
  },
};

export default function AnnouncementBanner() {
  const { data: announcements } = trpc.announcements.active.useQuery();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  // Load dismissed IDs from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("equiphk_dismissed_announcements");
      if (stored) {
        setDismissed(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  const dismiss = (id: number) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      sessionStorage.setItem("equiphk_dismissed_announcements", JSON.stringify(Array.from(next)));
    } catch {}
  };

  const visible = announcements?.filter((a) => !dismissed.has(a.id)) ?? [];

  if (visible.length === 0) return null;

  // Show only the most recent active announcement
  const announcement = visible[0];
  const config = typeConfig[announcement.type] ?? typeConfig.info;

  return (
    <div className={`${config.bg} ${config.text} ${config.border} border-b relative z-40`}>
      <div className="container flex items-center justify-center gap-3 py-2.5 px-10 text-sm">
        <span className="shrink-0">{config.icon}</span>
        <span className="font-medium">{announcement.title}</span>
        <span className="hidden sm:inline opacity-80">— {announcement.message}</span>
        {announcement.linkUrl && announcement.linkText && (
          <a
            href={announcement.linkUrl}
            className="inline-flex items-center gap-1 underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity shrink-0"
          >
            {announcement.linkText}
            <ArrowRight className="w-3 h-3" />
          </a>
        )}
        <button
          onClick={() => dismiss(announcement.id)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/20 transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
