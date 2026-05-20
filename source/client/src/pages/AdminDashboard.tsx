/*
 * Equip.HK Admin Dashboard
 * Central hub with stats overview, pending actions, and quick navigation
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AccessDenied from "@/components/AccessDenied";
import {
  Package,
  FolderOpen,
  CheckCircle,
  BarChart3,
  Wrench,
  Camera,
  Layers,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  ShoppingBag,
  Box,
  FileText,
  Bell,
  Tag,
  ImageIcon,
  TrendingUp,
  Users,
  Beaker,
  PackageOpen,
  Settings,
  ClipboardList,
  UserCog,
  Pin,
  PinOff,
  CloudUpload,
} from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { useLocation } from "wouter";
import AdminMobileNav from "@/components/AdminMobileNav";
import PWAInstallBanner from "@/components/PWAInstallBanner";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-logo_22cf3871.png";

function StatCard({
  label,
  value,
  icon,
  color = "orange",
  onClick,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  onClick?: () => void;
}) {
  const colorClasses: Record<string, string> = {
    orange: "border-orange/30 bg-orange/5 text-orange",
    green: "border-green-500/30 bg-green-500/5 text-green-600",
    blue: "border-blue-500/30 bg-blue-500/5 text-blue-600",
    red: "border-red-500/30 bg-red-500/5 text-red-600",
    yellow: "border-yellow-500/30 bg-yellow-500/5 text-yellow-600",
    purple: "border-purple-500/30 bg-purple-500/5 text-purple-600",
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-4 ${colorClasses[color] || colorClasses.orange} ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
          <p className="text-2xl font-[Oswald] font-bold mt-1">{value}</p>
        </div>
        <div className="opacity-50">{icon}</div>
      </div>
    </div>
  );
}

function QuickLink({
  label,
  description,
  icon,
  onClick,
  badge,
  badgeColor = "destructive",
  isPinned,
  onTogglePin,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: number;
  badgeColor?: "destructive" | "default" | "secondary" | "outline";
  isPinned?: boolean;
  onTogglePin?: (label: string) => void;
}) {
  return (
    <div className="relative group/card">
      <button
        onClick={onClick}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-white hover:bg-concrete/50 hover:border-orange/30 transition-all text-left group w-full"
      >
        <div className="shrink-0 p-1.5 rounded-md bg-navy-deep/5 text-navy-deep group-hover:bg-orange/10 group-hover:text-orange transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-[Oswald] uppercase tracking-wider text-xs text-navy-deep truncate">{label}</h3>
            {badge !== undefined && badge > 0 && (
              <Badge variant={badgeColor} className="text-[9px] px-1 py-0 shrink-0">
                {badge > 99 ? "99+" : badge}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight truncate">{description}</p>
        </div>
      </button>
      {onTogglePin && (
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePin(label); }}
          title={isPinned ? "Unpin from favourites" : "Pin to favourites"}
          className={`absolute top-1.5 right-1.5 p-1 rounded transition-all ${
            isPinned
              ? "text-orange opacity-100"
              : "text-muted-foreground opacity-0 group-hover/card:opacity-100"
          } hover:bg-orange/10`}
        >
          {isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const statsQ = trpc.equipment.stats.useQuery();
  const pendingPhotoQ = trpc.admin.pendingImageCount.useQuery();
  const unreadContactsQ = trpc.contact.unreadCount.useQuery();
  const consumablesQ = trpc.consumables.list.useQuery({});
  const bundlesQ = trpc.bundles.list.useQuery({});
  const categoriesQ = trpc.categories.list.useQuery();
  const equipmentQ = trpc.equipment.list.useQuery();
  const activeOrderCountQ = trpc.warehouse.activeOrderCount.useQuery();

  // Pinned favourites — persisted per user in localStorage
  const PINS_KEY = `equiphk_admin_pins_${user?.id ?? "guest"}`;
  const [pinnedLabels, setPinnedLabels] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`equiphk_admin_pins_${user?.id ?? "guest"}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const togglePin = useCallback((label: string) => {
    setPinnedLabels(prev => {
      const next = prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label];
      try { localStorage.setItem(PINS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [PINS_KEY]);

  // Count items with no image
  const noPhotoCount = useMemo(() => {
    if (!equipmentQ.data) return 0;
    return equipmentQ.data.filter((item: any) => !item.imageUrl).length;
  }, [equipmentQ.data]);

  // Count low stock items (availableQty === 0)
  const lowStockCount = useMemo(() => {
    if (!equipmentQ.data) return 0;
    return equipmentQ.data.filter((item: any) => item.availableQty === 0 && item.isActive).length;
  }, [equipmentQ.data]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-concrete">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
      </div>
    );
  }

  const isStaff = user?.role === "admin" || user?.role === "manager" || user?.role === "warehouse";

  if (!user || !isStaff) {
    return <AccessDenied message="You need a staff account to access the admin dashboard." />;
  }

  const pendingPhotos = typeof pendingPhotoQ.data === 'object' ? pendingPhotoQ.data?.count ?? 0 : pendingPhotoQ.data ?? 0;
  const unreadContacts = (unreadContactsQ.data as any)?.count ?? unreadContactsQ.data ?? 0;
  const activeOrderCount = activeOrderCountQ.data ?? undefined;

  const isAdmin = user.role === "admin";
  const canManageInventory = user.role === "admin" || user.role === "warehouse";
  const canManageOrders = user.role === "admin" || user.role === "manager";

  // Role label for display
  const roleLabel: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    warehouse: "Warehouse",
    user: "User",
  };

  // All card configs for the favourites lookup
  const allCardConfigs: { label: string; description: string; icon: React.ReactNode; onClick: () => void; badge?: number; badgeColor?: "destructive" | "default" | "secondary" | "outline" }[] = [
    { label: "Warehouse Orders", description: "Active orders, returns, damage charges", icon: <Wrench className="w-4 h-4" />, onClick: () => setLocation("/warehouse/orders"), badge: activeOrderCount, badgeColor: "secondary" },
    { label: "Inventory", description: "Add, edit, manage equipment items", icon: <Package className="w-4 h-4" />, onClick: () => setLocation("/admin/inventory"), badge: statsQ.data?.totalItems, badgeColor: "secondary" },
    { label: "Categories", description: "Organise into categories & sub-categories", icon: <FolderOpen className="w-4 h-4" />, onClick: () => setLocation("/admin/categories"), badge: statsQ.data?.totalCategories, badgeColor: "secondary" },
    { label: "Bundles", description: "Create and manage rental bundles", icon: <PackageOpen className="w-4 h-4" />, onClick: () => setLocation("/admin/bundles"), badge: bundlesQ.data?.length, badgeColor: "secondary" },
    { label: "Consumables", description: "Manage consumable products for sale", icon: <Beaker className="w-4 h-4" />, onClick: () => setLocation("/admin/consumables"), badge: consumablesQ.data?.length, badgeColor: "secondary" },
    { label: "Photo Approval", description: "Review and approve scraped photos", icon: <Camera className="w-4 h-4" />, onClick: () => setLocation("/admin/photo-approval"), badge: pendingPhotos, badgeColor: "destructive" },
    { label: "Photo Source", description: "Source photos for items without images", icon: <ImageIcon className="w-4 h-4" />, onClick: () => setLocation("/admin/photo-source") },
    { label: "AI Auto-Fill", description: "Auto-generate descriptions & pricing", icon: <Sparkles className="w-4 h-4" />, onClick: () => setLocation("/admin/auto-fill") },
    { label: "Description AI", description: "Bulk regenerate item descriptions", icon: <FileText className="w-4 h-4" />, onClick: () => setLocation("/admin/regenerate-descriptions") },
    { label: "Rental Orders", description: "All bookings and payments", icon: <ShoppingBag className="w-4 h-4" />, onClick: () => setLocation("/admin/orders") },
    { label: "Members", description: "PAYG and Trade Pro members", icon: <Users className="w-4 h-4" />, onClick: () => setLocation("/admin/members") },
    { label: "Enquiries", description: "Customer contact submissions", icon: <Bell className="w-4 h-4" />, onClick: () => setLocation("/admin/notifications"), badge: unreadContacts, badgeColor: "destructive" },
    { label: "Enquiry Tracking", description: "Quote requests and WhatsApp leads", icon: <ClipboardList className="w-4 h-4" />, onClick: () => setLocation("/admin/enquiry-tracking") },
    { label: "Activity Log", description: "All admin changes and actions", icon: <ClipboardList className="w-4 h-4" />, onClick: () => setLocation("/admin/activity-log") },
    { label: "Export Data", description: "Download inventory as Excel", icon: <TrendingUp className="w-4 h-4" />, onClick: () => setLocation("/admin/export") },
    { label: "Team Management", description: "Invite staff, manage roles", icon: <UserCog className="w-4 h-4" />, onClick: () => setLocation("/admin/team") },
    { label: "Run Backup", description: "Back up database & code to Drive/GitHub", icon: <CloudUpload className="w-4 h-4" />, onClick: () => setLocation("/admin/regenerate-descriptions") },
  ];

  const pinnedCards = pinnedLabels.map(l => allCardConfigs.find(c => c.label === l)).filter(Boolean) as typeof allCardConfigs;

  return (
    <div className="min-h-screen bg-concrete pb-20 md:pb-0">
      {/* Top Bar */}
      <header className="bg-navy-deep text-cream sticky top-0 z-50 border-b border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={LOGO_URL} alt="Equip.HK" className="h-8 w-auto" />
            </button>
            <div className="h-6 w-px bg-white/20" />
            <h1 className="font-[Oswald] uppercase tracking-wider text-sm text-orange">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-cream/60">{user.name || user.email}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                user.role === 'admin' ? 'bg-orange/20 text-orange border-orange/40' :
                user.role === 'manager' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                user.role === 'warehouse' ? 'bg-green-500/20 text-green-300 border-green-500/40' :
                'bg-white/10 text-cream/60 border-white/20'
              }`}>{roleLabel[user.role] ?? user.role}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLocation("/")} className="border-white/20 text-cream hover:bg-white/10 text-xs">
              <ArrowLeft className="w-3 h-3 mr-1" />
              Site
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-8">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-[Oswald] uppercase text-navy-deep">
            Welcome back, {user.name?.split(" ")[0] || "Admin"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening with your inventory today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Items"
            value={statsQ.data?.totalItems ?? "—"}
            icon={<Package className="w-5 h-5" />}
            color="blue"
            onClick={() => setLocation("/admin/inventory")}
          />
          <StatCard
            label="Available"
            value={statsQ.data?.availableItems ?? "—"}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Rented Out"
            value={statsQ.data?.rentedItems ?? "—"}
            icon={<BarChart3 className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            label="Categories"
            value={statsQ.data?.totalCategories ?? "—"}
            icon={<FolderOpen className="w-5 h-5" />}
            color="orange"
          />
          <StatCard
            label="Consumables"
            value={consumablesQ.data?.length ?? "—"}
            icon={<Beaker className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Bundles"
            value={bundlesQ.data?.length ?? "—"}
            icon={<PackageOpen className="w-5 h-5" />}
            color="purple"
          />
        </div>

        {/* Alerts */}
        {(pendingPhotos > 0 || lowStockCount > 0 || unreadContacts > 0 || noPhotoCount > 0) && (
          <div className="space-y-3">
            <h3 className="font-[Oswald] uppercase tracking-wider text-sm text-navy-deep">
              Pending Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {pendingPhotos > 0 && (
                <button
                  onClick={() => setLocation("/admin/photo-approval")}
                  className="flex items-center gap-3 p-3 rounded-lg border border-yellow-500/30 bg-yellow-50 hover:bg-yellow-100 transition-colors text-left"
                >
                  <Camera className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">{pendingPhotos} photos pending</p>
                    <p className="text-xs text-yellow-600">Review and approve/reject</p>
                  </div>
                </button>
              )}
              {lowStockCount > 0 && (
                <button
                  onClick={() => setLocation("/admin/inventory")}
                  className="flex items-center gap-3 p-3 rounded-lg border border-red-500/30 bg-red-50 hover:bg-red-100 transition-colors text-left"
                >
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">{lowStockCount} items out of stock</p>
                    <p className="text-xs text-red-600">Available qty is 0</p>
                  </div>
                </button>
              )}
              {unreadContacts > 0 && (
                <button
                  onClick={() => setLocation("/admin/notifications")}
                  className="flex items-center gap-3 p-3 rounded-lg border border-blue-500/30 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                >
                  <Bell className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">{unreadContacts} unread enquiries</p>
                    <p className="text-xs text-blue-600">New contact submissions</p>
                  </div>
                </button>
              )}
              {noPhotoCount > 0 && (
                <button
                  onClick={() => setLocation("/admin/photo-source")}
                  className="flex items-center gap-3 p-3 rounded-lg border border-orange/30 bg-orange/5 hover:bg-orange/10 transition-colors text-left"
                >
                  <ImageIcon className="w-5 h-5 text-orange" />
                  <div>
                    <p className="text-sm font-semibold text-orange">{noPhotoCount} items need photos</p>
                    <p className="text-xs text-orange/70">Source images for these items</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Links — filtered by role, grouped by section */}
        <div className="space-y-4">
          <h3 className="font-[Oswald] uppercase tracking-wider text-sm text-navy-deep">Manage</h3>

          {/* ── Favourites Row ────────────────────────────── */}
          {pinnedCards.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-orange/70 px-0.5 flex items-center gap-1">
                <Pin className="w-3 h-3" /> Favourites
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {pinnedCards.map(card => (
                  <QuickLink
                    key={card.label}
                    {...card}
                    isPinned
                    onTogglePin={togglePin}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Warehouse ─────────────────────────────────── */}
          {(user.role === "admin" || user.role === "warehouse") && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-0.5">Warehouse</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <QuickLink
                  label="Warehouse Orders"
                  description="Active orders, returns, damage charges"
                  icon={<Wrench className="w-4 h-4" />}
                  onClick={() => setLocation("/warehouse/orders")}
                  badge={activeOrderCount}
                  badgeColor="secondary"
                  isPinned={pinnedLabels.includes("Warehouse Orders")}
                  onTogglePin={togglePin}
                />
              </div>
            </div>
          )}

          {/* ── Inventory ─────────────────────────────────── */}
          {canManageInventory && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-0.5">Inventory</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <QuickLink
                  label="Inventory"
                  description="Add, edit, manage equipment items"
                  icon={<Package className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/inventory")}
                  badge={statsQ.data?.totalItems}
                  badgeColor="secondary"
                  isPinned={pinnedLabels.includes("Inventory")}
                  onTogglePin={togglePin}
                />
                <QuickLink
                  label="Categories"
                  description="Organise into categories & sub-categories"
                  icon={<FolderOpen className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/categories")}
                  badge={statsQ.data?.totalCategories}
                  badgeColor="secondary"
                  isPinned={pinnedLabels.includes("Categories")}
                  onTogglePin={togglePin}
                />
                <QuickLink
                  label="Bundles"
                  description="Create and manage rental bundles"
                  icon={<PackageOpen className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/bundles")}
                  badge={bundlesQ.data?.length}
                  badgeColor="secondary"
                  isPinned={pinnedLabels.includes("Bundles")}
                  onTogglePin={togglePin}
                />
                <QuickLink
                  label="Consumables"
                  description="Manage consumable products for sale"
                  icon={<Beaker className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/consumables")}
                  badge={consumablesQ.data?.length}
                  badgeColor="secondary"
                  isPinned={pinnedLabels.includes("Consumables")}
                  onTogglePin={togglePin}
                />
                <QuickLink
                  label="Photo Approval"
                  description="Review and approve scraped photos"
                  icon={<Camera className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/photo-approval")}
                  badge={pendingPhotos}
                  badgeColor="destructive"
                  isPinned={pinnedLabels.includes("Photo Approval")}
                  onTogglePin={togglePin}
                />
                <QuickLink
                  label="Photo Source"
                  description="Source photos for items without images"
                  icon={<ImageIcon className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/photo-source")}
                  isPinned={pinnedLabels.includes("Photo Source")}
                  onTogglePin={togglePin}
                />
                <QuickLink
                  label="AI Auto-Fill"
                  description="Auto-generate descriptions & pricing"
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/auto-fill")}
                  isPinned={pinnedLabels.includes("AI Auto-Fill")}
                  onTogglePin={togglePin}
                />
                <QuickLink
                  label="Description AI"
                  description="Bulk regenerate item descriptions"
                  icon={<FileText className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/regenerate-descriptions")}
                  isPinned={pinnedLabels.includes("Description AI")}
                  onTogglePin={togglePin}
                />
              </div>
            </div>
          )}

          {/* ── Orders & Members ──────────────────────────── */}
          {canManageOrders && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-0.5">Orders &amp; Members</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <QuickLink
                  label="Rental Orders"
                  description="All bookings and payments"
                  icon={<ShoppingBag className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/orders")}
                  isPinned={pinnedLabels.includes("Rental Orders")}
                  onTogglePin={togglePin}
                />
                <QuickLink
                  label="Members"
                  description="PAYG and Trade Pro members"
                  icon={<Users className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/members")}
                  isPinned={pinnedLabels.includes("Members")}
                  onTogglePin={togglePin}
                />
                <QuickLink
                  label="Enquiries"
                  description="Customer contact submissions"
                  icon={<Bell className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/notifications")}
                  badge={unreadContacts}
                  badgeColor="destructive"
                  isPinned={pinnedLabels.includes("Enquiries")}
                  onTogglePin={togglePin}
                />
                <QuickLink
                  label="Enquiry Tracking"
                  description="Quote requests and WhatsApp leads"
                  icon={<ClipboardList className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/enquiry-tracking")}
                  isPinned={pinnedLabels.includes("Enquiry Tracking")}
                  onTogglePin={togglePin}
                />
              </div>
            </div>
          )}

          {/* ── Admin Tools ───────────────────────────────── */}
          {isAdmin && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-0.5">Admin Tools</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <QuickLink
                  label="Activity Log"
                  description="All admin changes and actions"
                  icon={<ClipboardList className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/activity-log")}
                  isPinned={pinnedLabels.includes("Activity Log")}
                  onTogglePin={togglePin}
                />
                <QuickLink
                  label="Export Data"
                  description="Download inventory as Excel"
                  icon={<TrendingUp className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/export")}
                  isPinned={pinnedLabels.includes("Export Data")}
                  onTogglePin={togglePin}
                />
                <QuickLink
                  label="Team Management"
                  description="Invite staff, manage roles"
                  icon={<UserCog className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/team")}
                  isPinned={pinnedLabels.includes("Team Management")}
                  onTogglePin={togglePin}
                />
                <QuickLink
                  label="Run Backup"
                  description="Back up database & code to Drive/GitHub"
                  icon={<CloudUpload className="w-4 h-4" />}
                  onClick={() => setLocation("/admin/regenerate-descriptions")}
                  isPinned={pinnedLabels.includes("Run Backup")}
                  onTogglePin={togglePin}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <AdminMobileNav
        pendingPhotos={pendingPhotos}
        unreadContacts={unreadContacts}
        noPhotoCount={noPhotoCount}
      />

      {/* PWA install banner */}
      <PWAInstallBanner />
    </div>
  );
}
