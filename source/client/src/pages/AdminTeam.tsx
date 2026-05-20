/**
 * Admin Team Management Page
 * Granular per-app checkbox permissions with info tooltips for each ability.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import AccessDenied from "@/components/AccessDenied";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  UserCog,
  Search,
  Loader2,
  ArrowLeft,
  Shield,
  Package,
  Users,
  Crown,
  RefreshCw,
  Info,
  Settings2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-logo_22cf3871.png";

type UserRole = "user" | "admin" | "manager" | "warehouse";

// ─── Permission Definitions ────────────────────────────────────────────────
// Each permission key maps to an admin page/feature the staff member can access.
export const PERMISSIONS: {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  group: string;
}[] = [
  // Orders & Customers
  {
    key: "orders",
    label: "Rental Orders",
    description: "View, update status, and manage all rental orders. Includes marking orders as active, completed, or cancelled.",
    icon: <Package className="w-3.5 h-3.5" />,
    group: "Operations",
  },
  {
    key: "members",
    label: "Member Verification",
    description: "View member accounts and verify HKID documents for Trade Pro applications. Cannot delete accounts.",
    icon: <Users className="w-3.5 h-3.5" />,
    group: "Operations",
  },
  {
    key: "enquiry_tracking",
    label: "Lead Tracking",
    description: "View, update status, reply to, and delete enquiry leads. Includes quote requests and cart enquiries.",
    icon: <Shield className="w-3.5 h-3.5" />,
    group: "Operations",
  },
  {
    key: "delivery_calendar",
    label: "Delivery Calendar",
    description: "View and manage the delivery schedule calendar. See upcoming deliveries and collections.",
    icon: <Shield className="w-3.5 h-3.5" />,
    group: "Operations",
  },
  {
    key: "rental_calendar",
    label: "Rental Calendar",
    description: "View the rental calendar showing all active and upcoming rentals by equipment item.",
    icon: <Shield className="w-3.5 h-3.5" />,
    group: "Operations",
  },
  // Inventory
  {
    key: "inventory",
    label: "Inventory Management",
    description: "Create, edit, and delete equipment items. Includes setting pricing, availability, and specifications.",
    icon: <Package className="w-3.5 h-3.5" />,
    group: "Inventory",
  },
  {
    key: "categories",
    label: "Categories & Sub-Categories",
    description: "Manage equipment categories and sub-categories. Add, rename, reorder, and delete category groups.",
    icon: <Package className="w-3.5 h-3.5" />,
    group: "Inventory",
  },
  {
    key: "bundles",
    label: "Bundles & Kits",
    description: "Create and manage equipment bundles (pre-packaged rental kits). Set bundle pricing and included items.",
    icon: <Package className="w-3.5 h-3.5" />,
    group: "Inventory",
  },
  {
    key: "consumables",
    label: "Consumables",
    description: "Manage consumable products for sale (e.g. resins, sealants). Add, edit pricing, and link to equipment.",
    icon: <Package className="w-3.5 h-3.5" />,
    group: "Inventory",
  },
  {
    key: "photo_approval",
    label: "Photo Approval",
    description: "Review and approve or reject AI-sourced equipment photos before they go live on the website.",
    icon: <Package className="w-3.5 h-3.5" />,
    group: "Inventory",
  },
  // Admin Tools
  {
    key: "notifications",
    label: "Notifications & Announcements",
    description: "Create and manage site-wide announcements and push notifications shown to customers.",
    icon: <Shield className="w-3.5 h-3.5" />,
    group: "Admin Tools",
  },
  {
    key: "activity_log",
    label: "Activity Log",
    description: "View the full audit trail of all admin actions across the system. Read-only access.",
    icon: <Shield className="w-3.5 h-3.5" />,
    group: "Admin Tools",
  },
  {
    key: "export",
    label: "Data Export",
    description: "Export inventory, orders, and customer data as CSV files for reporting or backup.",
    icon: <Shield className="w-3.5 h-3.5" />,
    group: "Admin Tools",
  },
  {
    key: "warehouse_orders",
    label: "Warehouse Orders",
    description: "Access the warehouse-specific order view for picking, packing, and dispatching rentals.",
    icon: <Package className="w-3.5 h-3.5" />,
    group: "Admin Tools",
  },
];

// Default permissions by role (used as starting point when editing)
const ROLE_DEFAULTS: Record<UserRole, string[]> = {
  admin: PERMISSIONS.map(p => p.key),
  manager: ["orders", "members", "enquiry_tracking", "delivery_calendar", "rental_calendar", "notifications"],
  warehouse: ["inventory", "categories", "bundles", "consumables", "photo_approval", "warehouse_orders"],
  user: [],
};

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  admin: {
    label: "Admin",
    color: "bg-orange/20 text-orange border-orange/40",
    icon: <Crown className="w-3 h-3" />,
    description: "Full access to everything",
  },
  manager: {
    label: "Manager",
    color: "bg-blue-500/20 text-blue-700 border-blue-500/40",
    icon: <Shield className="w-3 h-3" />,
    description: "Orders, members, HKID verification",
  },
  warehouse: {
    label: "Warehouse",
    color: "bg-green-500/20 text-green-700 border-green-500/40",
    icon: <Package className="w-3 h-3" />,
    description: "Inventory management only",
  },
  user: {
    label: "Customer",
    color: "bg-gray-200 text-gray-600 border-gray-300",
    icon: <Users className="w-3 h-3" />,
    description: "Regular customer account",
  },
};

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.user;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-HK", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Permission Checkbox with Info Tooltip ──────────────────────────────────
function PermissionCheckbox({
  permission,
  checked,
  onChange,
  disabled,
}: {
  permission: typeof PERMISSIONS[0];
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors ${checked ? "bg-orange/5" : "hover:bg-gray-50"}`}>
      <Checkbox
        id={`perm-${permission.key}`}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="data-[state=checked]:bg-orange data-[state=checked]:border-orange"
      />
      <label
        htmlFor={`perm-${permission.key}`}
        className={`text-xs font-medium cursor-pointer flex-1 ${disabled ? "opacity-50 cursor-not-allowed" : "text-navy-deep"}`}
      >
        {permission.label}
      </label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-muted-foreground hover:text-navy-deep transition-colors" type="button">
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs text-xs">
          {permission.description}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// ─── Permissions Editor Dialog ──────────────────────────────────────────────
function PermissionsDialog({
  user: targetUser,
  currentPermissions,
  onSave,
  onClose,
  isSaving,
}: {
  user: { id: number; name: string | null; email: string | null; role: string };
  currentPermissions: string[];
  onSave: (permissions: string[]) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentPermissions));
  const role = targetUser.role as UserRole;

  const isAdmin = role === "admin";

  function toggle(key: string, val: boolean) {
    setSelected(prev => {
      const next = new Set(prev);
      if (val) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function applyRoleDefaults() {
    setSelected(new Set(ROLE_DEFAULTS[role] ?? []));
  }

  function selectAll() {
    setSelected(new Set(PERMISSIONS.map(p => p.key)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  const groups = useMemo(() => {
    const g: Record<string, typeof PERMISSIONS> = {};
    PERMISSIONS.forEach(p => {
      if (!g[p.group]) g[p.group] = [];
      g[p.group].push(p);
    });
    return g;
  }, []);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Oswald] uppercase tracking-wider flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-orange" />
            Edit Permissions
          </DialogTitle>
          <div className="text-sm text-muted-foreground pt-1">
            <span className="font-semibold text-navy-deep">{targetUser.name || targetUser.email}</span>
            {" · "}
            <RoleBadge role={role} />
          </div>
        </DialogHeader>

        {isAdmin ? (
          <div className="py-4 text-center text-sm text-muted-foreground bg-orange/5 rounded-lg border border-orange/20">
            <Crown className="w-6 h-6 text-orange mx-auto mb-2" />
            Admins always have full access to everything. Permissions cannot be restricted for Admin accounts.
          </div>
        ) : (
          <>
            {/* Quick actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={applyRoleDefaults} className="text-xs h-7">
                Apply {ROLE_CONFIG[role]?.label ?? "Role"} Defaults
              </Button>
              <Button variant="outline" size="sm" onClick={selectAll} className="text-xs h-7">
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll} className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50">
                Clear All
              </Button>
            </div>

            {/* Permission groups */}
            <div className="space-y-4">
              {Object.entries(groups).map(([group, perms]) => (
                <div key={group}>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 px-2">{group}</h4>
                  <div className="rounded-lg border border-border overflow-hidden">
                    {perms.map(p => (
                      <PermissionCheckbox
                        key={p.key}
                        permission={p}
                        checked={selected.has(p.key)}
                        onChange={(val) => toggle(p.key, val)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground">
              <Info className="w-3 h-3 inline mr-1" />
              Hover the <Info className="w-3 h-3 inline" /> icon next to each permission to learn what it grants.
            </p>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {!isAdmin && (
            <Button
              onClick={() => onSave(Array.from(selected))}
              disabled={isSaving}
              className="bg-orange hover:bg-orange-dark text-white"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save Permissions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function AdminTeam() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [pendingRoleChanges, setPendingRoleChanges] = useState<Record<number, UserRole>>({});
  const [editingPermissionsFor, setEditingPermissionsFor] = useState<any>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());

  const { data: users, isLoading, refetch } = trpc.team.listAll.useQuery(
    { limit: 200, search: search.trim() || undefined },
    { enabled: user?.role === "admin" }
  );

  // Get staff user IDs for bulk permissions fetch
  const staffIds = useMemo(() =>
    (users ?? []).filter(u => u.role !== "user").map(u => u.id),
    [users]
  );

  const { data: permissionsData, refetch: refetchPermissions } = trpc.team.getPermissionsBulk.useQuery(
    { userIds: staffIds },
    { enabled: staffIds.length > 0 }
  );

  const permissionsMap = useMemo(() => {
    const map: Record<number, string[]> = {};
    (permissionsData ?? []).forEach(p => { map[p.userId] = p.permissions; });
    return map;
  }, [permissionsData]);

  const updateRoleMutation = trpc.team.updateRole.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Role updated to ${vars.role}.`);
      setPendingRoleChanges((prev) => {
        const next = { ...prev };
        delete next[vars.userId];
        return next;
      });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const setPermissionsMutation = trpc.team.setPermissions.useMutation({
    onSuccess: () => {
      toast.success("Permissions saved.");
      setEditingPermissionsFor(null);
      refetchPermissions();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-concrete">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return <AccessDenied requiredRole="Admin" message="Only Admins can manage team roles." />;
  }

  const filtered = (users ?? []).filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    return true;
  });

  const staffCount = (users ?? []).filter((u) => u.role !== "user").length;

  function handleRoleChange(userId: number, newRole: UserRole) {
    setPendingRoleChanges((prev) => ({ ...prev, [userId]: newRole }));
  }

  function handleSaveRole(userId: number) {
    const newRole = pendingRoleChanges[userId];
    if (!newRole) return;
    updateRoleMutation.mutate({ userId, role: newRole });
  }

  function toggleExpand(userId: number) {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-concrete">
      {/* Top Bar */}
      <header className="bg-navy-deep text-cream sticky top-0 z-50 border-b border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={LOGO_URL} alt="Equip.HK" className="h-8 w-auto" />
            </button>
            <div className="h-6 w-px bg-white/20" />
            <h1 className="font-[Oswald] uppercase tracking-wider text-sm text-orange flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Team Management
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin")}
              className="border-white/20 text-cream hover:bg-white/10 text-xs"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-[Oswald] uppercase text-navy-deep">Team Members</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage staff roles and granular app permissions.{" "}
              <span className="font-semibold text-navy-deep">{staffCount} staff</span> member{staffCount !== 1 ? "s" : ""} active.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { refetch(); refetchPermissions(); }}
            className="border-navy-deep/20 text-navy-deep hover:bg-navy-deep/5"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Role Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(["admin", "manager", "warehouse"] as UserRole[]).map((role) => {
            const cfg = ROLE_CONFIG[role];
            const defaults = ROLE_DEFAULTS[role];
            return (
              <div key={role} className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-center gap-2 mb-1">
                  <RoleBadge role={role} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{cfg.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {defaults.slice(0, 4).map(key => {
                    const p = PERMISSIONS.find(x => x.key === key);
                    return p ? (
                      <Tooltip key={key}>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 cursor-default">
                            {p.label}
                            <Info className="w-2.5 h-2.5 text-gray-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          {p.description}
                        </TooltipContent>
                      </Tooltip>
                    ) : null;
                  })}
                  {defaults.length > 4 && (
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5">+{defaults.length - 4} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-border"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as "all" | UserRole)}>
            <SelectTrigger className="w-full sm:w-48 bg-white border-border">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="warehouse">Warehouse</SelectItem>
              <SelectItem value="user">Customer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No users found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => {
              const currentRole = (pendingRoleChanges[u.id] ?? u.role) as UserRole;
              const hasPendingChange = pendingRoleChanges[u.id] !== undefined && pendingRoleChanges[u.id] !== u.role;
              const isSelf = u.id === user.id;
              const isStaff = u.role !== "user";
              const userPerms = permissionsMap[u.id] ?? ROLE_DEFAULTS[u.role as UserRole] ?? [];
              const isExpanded = expandedUsers.has(u.id);

              return (
                <div
                  key={u.id}
                  className={`rounded-lg border bg-white overflow-hidden ${
                    hasPendingChange ? "border-orange/40" : "border-border"
                  }`}
                >
                  {/* Main row */}
                  <div className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${hasPendingChange ? "bg-orange/5" : ""}`}>
                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-navy-deep text-sm truncate">
                          {u.name || u.email || `User #${u.id}`}
                        </span>
                        <RoleBadge role={u.role as UserRole} />
                        {isSelf && (
                          <span className="text-[10px] bg-orange/10 text-orange border border-orange/30 px-1.5 py-0.5 rounded-full font-bold uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{u.email || "No email"}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        Joined {formatDate(u.createdAt)} · Last seen {formatDate(u.lastSignedIn)}
                      </p>
                    </div>

                    {/* Role selector + Save */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isStaff && !isSelf && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPermissionsFor(u);
                            // Pre-load from map or role defaults
                          }}
                          className="h-8 text-xs border-navy-deep/20 text-navy-deep hover:bg-navy-deep/5"
                        >
                          <Settings2 className="w-3 h-3 mr-1" />
                          Permissions
                        </Button>
                      )}
                      <Select
                        value={currentRole}
                        onValueChange={(v) => handleRoleChange(u.id, v as UserRole)}
                        disabled={isSelf}
                      >
                        <SelectTrigger className={`w-36 text-xs h-8 ${isSelf ? "opacity-50 cursor-not-allowed" : ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Customer</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="warehouse">Warehouse</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => handleSaveRole(u.id)}
                        disabled={!hasPendingChange || updateRoleMutation.isPending || isSelf}
                        className={`h-8 text-xs ${
                          hasPendingChange
                            ? "bg-orange hover:bg-orange-dark text-white"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {updateRoleMutation.isPending && pendingRoleChanges[u.id] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                      {isStaff && (
                        <button
                          onClick={() => toggleExpand(u.id)}
                          className="text-muted-foreground hover:text-navy-deep transition-colors p-1"
                          title={isExpanded ? "Hide permissions" : "Show permissions"}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded permissions summary */}
                  {isExpanded && isStaff && (
                    <div className="border-t border-border bg-gray-50 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Current Permissions ({userPerms.length}/{PERMISSIONS.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {PERMISSIONS.map(p => {
                          const has = u.role === "admin" || userPerms.includes(p.key);
                          return (
                            <Tooltip key={p.key}>
                              <TooltipTrigger asChild>
                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border cursor-default ${
                                  has
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-gray-100 text-gray-400 border-gray-200 line-through"
                                }`}>
                                  {p.label}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs">
                                <p className="font-semibold mb-0.5">{p.label}</p>
                                {p.description}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* How to invite note */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="font-[Oswald] uppercase text-sm text-blue-800 mb-1">How to Add a New Team Member</h4>
          <p className="text-xs text-blue-700">
            Ask the new team member to sign in to EquipHK using the standard login flow. Once they have a customer account,
            search for their name or email above and change their role to <strong>Manager</strong> or <strong>Warehouse</strong>.
            Then click <strong>Permissions</strong> to customise exactly which apps they can access.
          </p>
        </div>
      </div>

      {/* Permissions Editor Dialog */}
      {editingPermissionsFor && (
        <PermissionsDialog
          user={editingPermissionsFor}
          currentPermissions={permissionsMap[editingPermissionsFor.id] ?? ROLE_DEFAULTS[editingPermissionsFor.role as UserRole] ?? []}
          onSave={(perms) => setPermissionsMutation.mutate({ userId: editingPermissionsFor.id, permissions: perms })}
          onClose={() => setEditingPermissionsFor(null)}
          isSaving={setPermissionsMutation.isPending}
        />
      )}
    </div>
  );
}
