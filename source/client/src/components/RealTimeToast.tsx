/*
 * RealTimeToast — Connects to SSE and shows branded toast notifications
 * for new equipment, promotions, announcements, and notifications.
 * Also invalidates tRPC queries so the UI stays in sync.
 */
import { useSSE, type SSEEvent } from "@/hooks/useSSE";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Package, Megaphone, Bell, Tag } from "lucide-react";
import type { ReactNode } from "react";

const ICON_MAP: Record<SSEEvent["type"], ReactNode> = {
  new_equipment: <Package className="w-5 h-5 text-orange-500" />,
  new_promotion: <Tag className="w-5 h-5 text-green-500" />,
  new_announcement: <Megaphone className="w-5 h-5 text-blue-500" />,
  new_notification: <Bell className="w-5 h-5 text-amber-500" />,
};

const LABEL_MAP: Record<SSEEvent["type"], string> = {
  new_equipment: "New Equipment",
  new_promotion: "Promotion",
  new_announcement: "Announcement",
  new_notification: "Update",
};

export default function RealTimeToast() {
  const utils = trpc.useUtils();

  useSSE({
    onNewEquipment: (event) => {
      showToast(event);
      // Refresh equipment list on the public catalog
      utils.equipment.list.invalidate();
    },
    onNewPromotion: (event) => {
      showToast(event);
      // Refresh announcements (promos come through as announcements)
      utils.announcements.active.invalidate();
    },
    onNewAnnouncement: (event) => {
      showToast(event);
      // Refresh the announcement banner
      utils.announcements.active.invalidate();
    },
    onNewNotification: (event) => {
      showToast(event);
      // Refresh the notification bell
      utils.notifications.active.invalidate();
    },
  });

  return null; // This component is invisible — it only manages SSE + toasts
}

function showToast(event: SSEEvent) {
  const icon = ICON_MAP[event.type];
  const label = LABEL_MAP[event.type];

  toast.custom(
    (id) => (
      <div
        className="flex items-start gap-3 bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-4 shadow-xl max-w-sm cursor-pointer"
        onClick={() => toast.dismiss(id)}
      >
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                backgroundColor:
                  event.type === "new_equipment"
                    ? "rgba(249,115,22,0.15)"
                    : event.type === "new_promotion"
                      ? "rgba(34,197,94,0.15)"
                      : event.type === "new_announcement"
                        ? "rgba(59,130,246,0.15)"
                        : "rgba(245,158,11,0.15)",
                color:
                  event.type === "new_equipment"
                    ? "#f97316"
                    : event.type === "new_promotion"
                      ? "#22c55e"
                      : event.type === "new_announcement"
                        ? "#3b82f6"
                        : "#f59e0b",
              }}
            >
              {label}
            </span>
          </div>
          <p className="text-sm font-semibold text-white truncate">
            {event.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
            {event.message}
          </p>
        </div>
      </div>
    ),
    {
      duration: 6000,
      position: "bottom-right",
    }
  );
}
