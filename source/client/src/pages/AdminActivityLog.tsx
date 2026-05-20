/**
 * Equip.HK Admin Activity Log
 * View all admin actions with timestamps, filtering, and pagination
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Search,
  Package,
  FolderOpen,
  Camera,
  Layers,
  Beaker,
  PackageOpen,
  Trash2,
  Edit,
  Plus,
  Check,
  X,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-logo_22cf3871.png";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="w-3.5 h-3.5" />,
  update: <Edit className="w-3.5 h-3.5" />,
  delete: <Trash2 className="w-3.5 h-3.5" />,
  approve: <Check className="w-3.5 h-3.5" />,
  reject: <X className="w-3.5 h-3.5" />,
  import: <Upload className="w-3.5 h-3.5" />,
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  update: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  delete: "bg-red-500/10 text-red-700 border-red-500/30",
  approve: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  reject: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  import: "bg-purple-500/10 text-purple-700 border-purple-500/30",
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  equipment: <Package className="w-4 h-4" />,
  category: <FolderOpen className="w-4 h-4" />,
  sub_category: <Layers className="w-4 h-4" />,
  photo: <Camera className="w-4 h-4" />,
  bundle: <PackageOpen className="w-4 h-4" />,
  consumable: <Beaker className="w-4 h-4" />,
};

const PAGE_SIZE = 50;

export default function AdminActivityLog() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");

  const logQ = trpc.activityLog.list.useQuery({
    limit: 500,
    offset: 0,
  });

  const filteredEntries = useMemo(() => {
    if (!logQ.data) return [];
    return logQ.data.filter((entry: any) => {
      if (filterAction !== "all" && entry.action !== filterAction) return false;
      if (filterEntity !== "all" && entry.entityType !== filterEntity) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = (entry.entityName || "").toLowerCase().includes(term);
        const matchUser = (entry.userName || "").toLowerCase().includes(term);
        const matchDetails = (entry.details || "").toLowerCase().includes(term);
        if (!matchName && !matchUser && !matchDetails) return false;
      }
      return true;
    });
  }, [logQ.data, filterAction, filterEntity, searchTerm]);

  const totalPages = Math.ceil(filteredEntries.length / PAGE_SIZE);
  const paginatedEntries = filteredEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-concrete">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-concrete gap-4">
        <AlertTriangle className="w-12 h-12 text-orange" />
        <h1 className="text-2xl font-[Oswald] uppercase text-navy-deep">Access Denied</h1>
        <p className="text-muted-foreground">Only administrators can view the activity log.</p>
        <Button variant="outline" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-concrete">
      {/* Top Bar */}
      <header className="bg-navy-deep text-cream sticky top-0 z-50 border-b border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/admin")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={LOGO_URL} alt="Equip.HK" className="h-8 w-auto" />
            </button>
            <div className="h-6 w-px bg-white/20" />
            <h1 className="font-[Oswald] uppercase tracking-wider text-sm text-orange">
              Activity Log
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => logQ.refetch()}
              className="border-white/20 text-cream hover:bg-white/10 text-xs"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${logQ.isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin")} className="border-white/20 text-cream hover:bg-white/10 text-xs">
              <ArrowLeft className="w-3 h-3 mr-1" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-[Oswald] uppercase text-navy-deep flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-orange" />
              Activity Log
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track all admin changes and actions ({filteredEntries.length} entries)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              placeholder="Search by name, user, or details..."
              className="pl-9 w-64"
            />
          </div>
          <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(0); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="approve">Approve</SelectItem>
              <SelectItem value="reject">Reject</SelectItem>
              <SelectItem value="import">Import</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterEntity} onValueChange={(v) => { setFilterEntity(v); setPage(0); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Entity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="sub_category">Sub-Category</SelectItem>
              <SelectItem value="bundle">Bundle</SelectItem>
              <SelectItem value="consumable">Consumable</SelectItem>
              <SelectItem value="photo">Photo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log Entries */}
        {logQ.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-orange" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground">
              {logQ.data?.length === 0
                ? "No activity logged yet. Actions will appear here as you manage inventory."
                : "No entries match your filters."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground w-44">When</th>
                    <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground w-28">User</th>
                    <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground w-24">Action</th>
                    <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground w-28">Type</th>
                    <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground">Item</th>
                    <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground hidden lg:table-cell">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEntries.map((entry: any) => {
                    const actionColor = ACTION_COLORS[entry.action] ?? "bg-gray-500/10 text-gray-700 border-gray-500/30";
                    const actionIcon = ACTION_ICONS[entry.action] ?? <Edit className="w-3.5 h-3.5" />;
                    const entityIcon = ENTITY_ICONS[entry.entityType] ?? <Package className="w-4 h-4" />;
                    const timeStr = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—";

                    return (
                      <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground font-data">{timeStr}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-navy-deep">{entry.userName || "System"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`gap-1 font-normal capitalize ${actionColor}`}>
                            {actionIcon}
                            {entry.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {entityIcon}
                            <span className="capitalize">{entry.entityType.replace(/_/g, " ")}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-navy-deep">{entry.entityName || "—"}</span>
                          {entry.entityId && (
                            <span className="text-xs text-muted-foreground ml-1">#{entry.entityId}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {entry.details ? (
                            <span className="text-xs text-muted-foreground line-clamp-2 max-w-xs">
                              {entry.details.length > 100 ? entry.details.slice(0, 100) + "..." : entry.details}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                <span className="text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    className="h-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                    className="h-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
