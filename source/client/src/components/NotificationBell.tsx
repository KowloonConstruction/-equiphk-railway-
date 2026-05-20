/*
 * Equip.HK Notification Bell — Floating notification icon
 * Shows recent site notifications (new equipment, deals, updates)
 * Persists read state in localStorage
 */
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  X,
  Package,
  Tag,
  RefreshCw,
  Megaphone,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const typeIcons: Record<string, React.ReactNode> = {
  new_equipment: <Package className="w-4 h-4 text-blue-500" />,
  deal: <Tag className="w-4 h-4 text-emerald-500" />,
  update: <RefreshCw className="w-4 h-4 text-orange" />,
  announcement: <Megaphone className="w-4 h-4 text-purple-500" />,
};

const typeLabels: Record<string, string> = {
  new_equipment: "New Equipment",
  deal: "Deal",
  update: "Update",
  announcement: "Announcement",
};

export default function NotificationBell() {
  const { data: notifications } = trpc.notifications.active.useQuery();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  // Load read IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("equiphk_read_notifications");
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => {
    if (!notifications) return;
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem("equiphk_read_notifications", JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const unreadCount = notifications
    ? notifications.filter((n) => !readIds.has(n.id)).length
    : 0;

  if (!notifications || notifications.length === 0) return null;

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50">
      {/* Bell Button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) markAllRead();
        }}
        className="relative w-12 h-12 rounded-full bg-navy-deep text-cream shadow-lg hover:bg-navy-deep/90 transition-colors flex items-center justify-center group"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-navy-deep text-cream">
              <h3 className="font-[Oswald] uppercase tracking-wider text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange" />
                Notifications
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 hover:bg-muted/50 transition-colors ${
                    !readIds.has(notif.id) ? "bg-orange/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {typeIcons[notif.type] ?? typeIcons.update}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-data uppercase tracking-wider text-orange">
                          {typeLabels[notif.type] ?? "Update"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-data">
                          {new Date(notif.createdAt).toLocaleDateString("en-HK", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-navy-deep leading-snug">
                        {notif.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      {notif.linkUrl && (
                        <a
                          href={notif.linkUrl}
                          className="inline-flex items-center gap-1 text-xs text-orange hover:underline mt-1"
                        >
                          Learn more <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-muted/30 border-t text-center">
              <span className="text-xs text-muted-foreground">
                {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
