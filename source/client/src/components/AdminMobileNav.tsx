/**
 * AdminMobileNav — Bottom tab bar for phone, sidebar for tablet/desktop
 * Shows the 5 most-used admin sections with badge counts
 */
import { useLocation } from "wouter";
import {
  Package,
  Camera,
  Bell,
  LayoutDashboard,
  MoreHorizontal,
  FolderOpen,
  PackageOpen,
  Beaker,
  ImageIcon,
  Sparkles,
  FileText,
  ClipboardList,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface AdminMobileNavProps {
  pendingPhotos?: number;
  unreadContacts?: number;
  noPhotoCount?: number;
}

const PRIMARY_TABS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Inventory", icon: Package, path: "/admin/inventory" },
  { label: "Photos", icon: Camera, path: "/admin/photo-approval" },
  { label: "Enquiries", icon: Bell, path: "/admin/notifications" },
  { label: "More", icon: MoreHorizontal, path: null },
];

const MORE_LINKS = [
  { label: "Categories", icon: FolderOpen, path: "/admin/categories" },
  { label: "Bundles", icon: PackageOpen, path: "/admin/bundles" },
  { label: "Consumables", icon: Beaker, path: "/admin/consumables" },
  { label: "Photo Source", icon: ImageIcon, path: "/admin/photo-source" },
  { label: "AI Auto-Fill", icon: Sparkles, path: "/admin/auto-fill" },
  { label: "Descriptions", icon: FileText, path: "/admin/regenerate-descriptions" },
  { label: "Enquiry Tracking", icon: ClipboardList, path: "/admin/enquiry-tracking" },
  { label: "Activity Log", icon: ClipboardList, path: "/admin/activity-log" },
  { label: "Export Data", icon: TrendingUp, path: "/admin/export" },
];

export default function AdminMobileNav({ pendingPhotos = 0, unreadContacts = 0, noPhotoCount = 0 }: AdminMobileNavProps) {
  const [location, setLocation] = useLocation();
  const [showMore, setShowMore] = useState(false);

  const getBadge = (path: string | null) => {
    if (path === "/admin/photo-approval") return pendingPhotos;
    if (path === "/admin/notifications") return unreadContacts;
    if (path === null) return (pendingPhotos > 0 || unreadContacts > 0 || noPhotoCount > 0) ? 1 : 0;
    return 0;
  };

  return (
    <>
      {/* More drawer overlay */}
      {showMore && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMore(false)} />
          <div className="relative bg-white rounded-t-2xl p-4 pb-24 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[Oswald] uppercase tracking-wider text-navy-deep text-sm">More Admin Tools</h3>
              <button onClick={() => setShowMore(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MORE_LINKS.map((link) => (
                <button
                  key={link.path}
                  onClick={() => { setLocation(link.path); setShowMore(false); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                    location === link.path
                      ? "border-orange bg-orange/5 text-orange"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium text-center leading-tight">{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar — phone only */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-navy-deep border-t border-white/10 md:hidden safe-area-pb">
        <div className="flex items-stretch h-16">
          {PRIMARY_TABS.map((tab) => {
            const badge = getBadge(tab.path);
            const isActive = tab.path ? location === tab.path : showMore;
            return (
              <button
                key={tab.label}
                onClick={() => {
                  if (tab.path === null) {
                    setShowMore(!showMore);
                  } else {
                    setLocation(tab.path);
                    setShowMore(false);
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
                  isActive ? "text-orange" : "text-cream/50 hover:text-cream/80"
                }`}
              >
                <div className="relative">
                  <tab.icon className="w-5 h-5" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
