/**
 * Admin Rental Orders Management Page
 * View all rental orders, update status, view details, bulk update, CSV export, deposit management
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AccessDenied from "@/components/AccessDenied";
import {
  Package,
  Search,
  Calendar,
  Truck,
  Loader2,
  ChevronLeft,
  ChevronDown,
  CreditCard,
  Download,
  CheckSquare,
  Square,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react";

// ─── Email Log Panel ─────────────────────────────────────────────────────────
function EmailLogPanel({ orderId }: { orderId: number }) {
  const { data: logs, isLoading } = trpc.membership.adminGetOrderEmailLogs.useQuery({ orderId });

  const statusColors: Record<string, string> = {
    confirmed: "text-green-400",
    active: "text-blue-400",
    completed: "text-purple-400",
    cancelled: "text-red-400",
  };

  return (
    <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-3.5 h-3.5 text-orange-400" />
        <p className="text-orange-400 text-xs uppercase tracking-wider font-bold">Email Notifications</p>
      </div>
      {isLoading ? (
        <p className="text-gray-500 text-xs">Loading...</p>
      ) : !logs || logs.length === 0 ? (
        <p className="text-gray-500 text-xs">No emails sent yet. Emails are sent automatically when status changes to Confirmed, Active, Completed, or Cancelled.</p>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2">
              {log.error ? (
                <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">
                  <span className={`font-semibold ${statusColors[log.status] ?? "text-gray-400"}`}>
                    {log.status.toUpperCase()}
                  </span>
                  {" "}&rarr; {log.customerEmail}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(log.sentAt).toLocaleString("en-HK")}
                  {log.error && <span className="text-red-400 ml-2">Error: {log.error}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-HK", { day: "numeric", month: "short", year: "numeric" });
}

function formatHKD(val: string | number | null | undefined) {
  if (!val) return "HK$0";
  return `HK$${Number(val).toLocaleString("en-HK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const STATUS_OPTIONS = [
  "pending_payment",
  "paid",
  "confirmed",
  "active",
  "completed",
  "cancelled",
  "refunded",
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  paid: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  confirmed: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  active: "bg-green-500/20 text-green-300 border-green-500/40",
  completed: "bg-gray-500/20 text-gray-300 border-gray-500/40",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/40",
  refunded: "bg-orange-500/20 text-orange-300 border-orange-500/40",
};

type OrderStatus = typeof STATUS_OPTIONS[number];

export default function AdminOrders() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("confirmed");
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  // Deposit pre-auth management state
  const [depositOrderId, setDepositOrderId] = useState<number | null>(null);
  const [depositAction, setDepositAction] = useState<"capture" | "partial_capture" | "release">("release");
  const [depositCaptureAmount, setDepositCaptureAmount] = useState("");
  const [depositReason, setDepositReason] = useState("");

  const canAccess = user?.role === "admin" || user?.role === "manager";

  const { data: orders, isLoading, refetch } = trpc.membership.adminListOrders.useQuery(
    { limit: 200, offset: 0 },
    { enabled: canAccess }
  );

  const updateStatusMutation = trpc.membership.adminUpdateOrderStatus.useMutation({
    onSuccess: () => {
      toast.success("Order status updated.");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkUpdateMutation = trpc.membership.adminBulkUpdateOrderStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.updated} orders updated to "${bulkStatus.replace(/_/g, " ")}".`);
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const settleDepositMutation = trpc.membership.adminSettleDeposit.useMutation({
    onSuccess: (data) => {
      const msg = (data as any).action === "released"
        ? "Card hold released — no charge to customer."
        : (data as any).action === "partially_captured"
        ? `Deposit partially captured (HK$${depositCaptureAmount}).`
        : "Deposit captured from customer card.";
      toast.success(msg);
      setDepositOrderId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const createHoldMutation = trpc.membership.adminCreateDepositHold.useMutation({
    onSuccess: (data) => {
      if ((data as any).success) {
        toast.success("Deposit hold created. Customer must confirm card via link.");
      } else {
        toast.info((data as any).reason ?? "Hold not created.");
      }
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: exportData, refetch: triggerExport } = trpc.membership.adminExportOrders.useQuery(
    undefined,
    { enabled: false }
  );

  const handleExportCsv = async () => {
    const result = await triggerExport();
    const rows = result.data ?? [];
    if (rows.length === 0) { toast.error("No orders to export."); return; }
    const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = ["Order ID","Customer","Email","Phone","Company","Plan","Status","Start Date","End Date","Days","Subtotal","Discount","Delivery Fee","Deposit","Total","Delivery Type","Delivery Address","Deposit Status","Created At"];
    const csvRows = rows.map((o: any) => [
      o.id, o.customerName, o.customerEmail, o.customerPhone, o.companyName ?? "",
      o.membershipPlan, o.status,
      formatDate(o.rentalStartDate), formatDate(o.rentalEndDate), o.rentalDays,
      o.subtotal, o.discountAmount, o.deliveryFee, o.depositAmount, o.totalAmount,
      o.deliveryType, o.deliveryAddress ?? "",
      o.depositStatus ?? "held",
      formatDate(o.createdAt),
    ].map(escape).join(","));
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `equiphk-orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} orders.`);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!filtered) return;
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((o: any) => o.id)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!canAccess) {
    return <AccessDenied requiredRole="Admin or Manager" message="Only Admins and Managers can access Rental Orders." />;
  }

  type Order = {
    id: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    companyName?: string | null;
    membershipPlan: string;
    status: string;
    rentalStartDate: Date | string;
    rentalEndDate: Date | string;
    rentalDays: number;
    subtotal: string;
    discountPercent: string;
    discountAmount: string;
    deliveryFee: string;
    depositAmount: string;
    depositWaived: boolean;
    totalAmount: string;
    deliveryType: string;
    deliveryAddress?: string | null;
    customerNotes?: string | null;
    hkidNumber?: string | null;
    hkidPhotoUrl?: string | null;
    createdAt: Date | string;
  };

  const filtered = (orders as Order[] | undefined)?.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      String(o.id).includes(q) ||
      (o.companyName ?? "").toLowerCase().includes(q) ||
      (o.hkidNumber ?? "").toLowerCase().includes(q)
    );
  });

  // ─── Compute expiring holds for the top banner ───────────────────────────
  const now = Date.now();
  const expiringHolds = (orders as any[] | undefined)?.filter((o: any) => {
    if (!o.depositHoldExpiresAt) return false;
    if (["released", "captured", "partially_captured"].includes(o.depositStatus)) return false;
    const msLeft = new Date(o.depositHoldExpiresAt).getTime() - now;
    return msLeft > 0 && msLeft <= 2 * 24 * 60 * 60 * 1000; // within 48 hours
  }) ?? [];

  const getHoldUrgency = (expiresAt: any): { label: string; color: string; bg: string; border: string } => {
    if (!expiresAt) return { label: "No expiry", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-600/30" };
    const msLeft = new Date(expiresAt).getTime() - now;
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    if (msLeft <= 0) return { label: "EXPIRED", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-600/40" };
    if (daysLeft <= 1) return { label: `Expires TODAY`, color: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/40" };
    if (daysLeft <= 2) return { label: `Expires in ${daysLeft}d`, color: "text-orange-300", bg: "bg-orange-500/10", border: "border-orange-500/40" };
    if (daysLeft <= 4) return { label: `Expires in ${daysLeft}d`, color: "text-yellow-300", bg: "bg-yellow-500/10", border: "border-yellow-500/40" };
    return { label: `Expires in ${daysLeft}d`, color: "text-green-300", bg: "bg-green-500/10", border: "border-green-500/40" };
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="bg-[#0d1220] border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Admin
            </Button>
            <span className="text-gray-600">/</span>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-400" />
              <h1 className="text-xl font-black">Rental Orders</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40">
              {filtered?.length ?? 0} orders
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCsv}
              className="border-green-600/40 text-green-400 hover:bg-green-600/10 gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Expiring Holds Alert Banner */}
      {expiringHolds.length > 0 && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-300 font-bold text-sm">
                  {expiringHolds.length} card hold{expiringHolds.length > 1 ? "s" : ""} expiring within 48 hours
                </p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {expiringHolds.map((o: any) => {
                    const msLeft = new Date(o.depositHoldExpiresAt).getTime() - now;
                    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
                    return (
                      <button
                        key={o.id}
                        onClick={() => setExpandedId(o.id)}
                        className="text-xs bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg px-2.5 py-1 hover:bg-red-500/30 transition-colors"
                      >
                        Order #{o.id} — {o.customerName}
                        {daysLeft <= 1 ? " ⚠️ TODAY" : ` — ${daysLeft}d left`}
                      </button>
                    );
                  })}
                </div>
                <p className="text-red-400/70 text-xs mt-1.5">Open each order and re-authorise or settle the hold before it lapses.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-orange-500/10 border-b border-orange-500/30 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
            <span className="text-orange-300 text-sm font-medium">{selectedIds.size} selected</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bg-white/10 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-gray-900">{s.replace(/_/g, " ").toUpperCase()}</option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={() => setShowBulkConfirm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Apply to {selectedIds.size} orders
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="text-gray-400 hover:text-white"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Confirm Dialog */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1220] border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold text-lg mb-2">Confirm Bulk Update</h3>
            <p className="text-gray-400 text-sm mb-4">
              Update <span className="text-white font-bold">{selectedIds.size}</span> orders to{" "}
              <span className="text-orange-400 font-bold">{bulkStatus.replace(/_/g, " ").toUpperCase()}</span>?
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => bulkUpdateMutation.mutate({ orderIds: Array.from(selectedIds), status: bulkStatus as any })}
                disabled={bulkUpdateMutation.isPending}
              >
                {bulkUpdateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </Button>
              <Button variant="outline" className="flex-1 border-gray-600 text-gray-300" onClick={() => setShowBulkConfirm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Search + Select All */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, order ID, HKID..."
              className="pl-9 bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          {filtered && filtered.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {selectedIds.size === filtered.length ? (
                <CheckSquare className="w-4 h-4 text-orange-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Select All
            </button>
          )}
        </div>

        {/* Orders */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="bg-white/5 border border-gray-700 rounded-2xl p-12 text-center">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <div key={order.id} className={`bg-white/5 border rounded-xl overflow-hidden transition-colors ${selectedIds.has(order.id) ? "border-orange-500/50 bg-orange-500/5" : "border-gray-700"}`}>
                {/* Order Row */}
                <div className="p-5">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <button onClick={() => toggleSelect(order.id)} className="text-gray-500 hover:text-orange-400 transition-colors">
                          {selectedIds.has(order.id) ? <CheckSquare className="w-4 h-4 text-orange-400" /> : <Square className="w-4 h-4" />}
                        </button>
                        <span className="text-white font-bold">Order #{order.id}</span>
                        <Badge className={`text-xs border ${STATUS_COLORS[order.status] ?? "bg-gray-500/20 text-gray-300"}`}>
                          {order.status.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                        <Badge className={`text-xs border ${order.membershipPlan === "trade_pro" ? "bg-blue-500/20 text-blue-300 border-blue-500/40" : "bg-orange-500/20 text-orange-300 border-orange-500/40"}`}>
                          {order.membershipPlan === "trade_pro" ? "Trade Pro" : "PAYG"}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm font-medium">{order.customerName}</p>
                      <p className="text-gray-500 text-xs">{order.customerEmail} · {order.customerPhone}</p>
                      {order.companyName && <p className="text-gray-600 text-xs">{order.companyName}</p>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.rentalStartDate)} → {formatDate(order.rentalEndDate)} ({order.rentalDays}d)
                        </span>
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {order.deliveryType === "delivery" ? "Delivery" : "Self-Collection"}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          Created {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-right">
                        <p className="text-xl font-black text-orange-400">{formatHKD(order.totalAmount)}</p>
                        {Number(order.discountAmount) > 0 && (
                          <p className="text-green-400 text-xs">−{formatHKD(order.discountAmount)} ({order.discountPercent}% off)</p>
                        )}
                        {order.depositWaived && (
                          <p className="text-blue-400 text-xs">Deposit waived</p>
                        )}
                      </div>

                      {/* Status Updater */}
                      <div className="relative">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateStatusMutation.mutate({
                              orderId: order.id,
                              status: e.target.value as OrderStatus,
                            })
                          }
                          className="appearance-none bg-white/10 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 pr-8 cursor-pointer hover:bg-white/15 transition-colors"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s} className="bg-gray-900">
                              {s.replace(/_/g, " ").toUpperCase()}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                        className="border-gray-600 text-gray-300 hover:bg-white/5"
                      >
                        {expandedId === order.id ? "Hide" : "Details"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === order.id && (
                  <div className="border-t border-gray-700 p-5 bg-white/3 space-y-4">
                    {/* Pricing & Delivery */}
                    <div className="grid sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Pricing</p>
                        <p className="text-gray-300">Subtotal: {formatHKD((order as any).subtotal)}</p>
                        <p className="text-gray-300">Delivery: {formatHKD((order as any).deliveryFee)}</p>
                        <p className="text-gray-300">Deposit: {(order as any).depositWaived ? "Waived" : formatHKD((order as any).depositAmount)}</p>
                        <p className="text-white font-bold">Total: {formatHKD((order as any).totalAmount)}</p>
                      </div>
                      {(order as any).deliveryAddress && (
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Delivery Address</p>
                          <p className="text-gray-300">{(order as any).deliveryAddress}</p>
                        </div>
                      )}
                      {(order as any).customerNotes && (
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Customer Notes</p>
                          <p className="text-gray-300">{(order as any).customerNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Delivery / Collection Slots */}
                    {((order as any).deliverySlotDate || (order as any).collectionSlotDate) && (
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-blue-400 text-xs uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Scheduling Preferences
                        </p>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          {(order as any).deliverySlotDate && (
                            <div>
                              <p className="text-gray-500 text-xs mb-0.5">{(order as any).deliveryType === "delivery" ? "Delivery" : "Collection"} Date</p>
                              <p className="text-white">{formatDate((order as any).deliverySlotDate)}</p>
                              {(order as any).deliverySlotTime && (
                                <p className="text-blue-300 text-xs capitalize">{(order as any).deliverySlotTime === "morning" ? "9am–1pm" : (order as any).deliverySlotTime === "afternoon" ? "1pm–6pm" : "6pm–9pm"}</p>
                              )}
                            </div>
                          )}
                          {(order as any).collectionSlotDate && (
                            <div>
                              <p className="text-gray-500 text-xs mb-0.5">Return / Collection Date</p>
                              <p className="text-white">{formatDate((order as any).collectionSlotDate)}</p>
                              {(order as any).collectionSlotTime && (
                                <p className="text-blue-300 text-xs capitalize">{(order as any).collectionSlotTime === "morning" ? "9am–1pm" : (order as any).collectionSlotTime === "afternoon" ? "1pm–6pm" : "6pm–9pm"}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deposit Pre-Auth Management */}
                    {!(order as any).depositWaived && Number((order as any).depositAmount) > 0 && (
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-purple-400 text-xs uppercase tracking-wider font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" /> Card Hold (Deposit)
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            (order as any).depositStatus === "released" ? "bg-green-500/20 text-green-300" :
                            (order as any).depositStatus === "captured" ? "bg-red-500/20 text-red-300" :
                            (order as any).depositStatus === "partially_captured" ? "bg-yellow-500/20 text-yellow-300" :
                            (order as any).depositStatus === "held" ? "bg-blue-500/20 text-blue-300" :
                            (order as any).depositStatus === "expired" ? "bg-gray-500/20 text-gray-400" :
                            "bg-purple-500/20 text-purple-300"
                          }`}>
                            {((order as any).depositStatus ?? "pending").replace(/_/g, " ").toUpperCase()}
                          </span>
                        </div>

                        <p className="text-gray-400 text-xs mb-1">Hold amount: <span className="text-white font-semibold">{formatHKD((order as any).depositAmount)}</span></p>
                        {(order as any).stripeDepositIntentId && (
                          <p className="text-gray-500 text-xs mb-1 font-mono">{(order as any).stripeDepositIntentId}</p>
                        )}
                        {(order as any).depositHoldExpiresAt && (() => {
                            const urgency = getHoldUrgency((order as any).depositHoldExpiresAt);
                            const expDate = new Date((order as any).depositHoldExpiresAt);
                            const msLeft = expDate.getTime() - now;
                            const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
                            return (
                              <div className={`flex items-center justify-between rounded-lg px-3 py-2 mb-2 border ${urgency.bg} ${urgency.border}`}>
                                <div className="flex items-center gap-2">
                                  <Clock className={`w-3.5 h-3.5 ${urgency.color}`} />
                                  <span className={`text-xs font-semibold ${urgency.color}`}>{urgency.label}</span>
                                  <span className="text-gray-500 text-xs">— {expDate.toLocaleDateString("en-HK", { day: "numeric", month: "short", year: "numeric" })}</span>
                                </div>
                                {msLeft <= 0 && (
                                  <span className="text-xs text-gray-500 italic">Hold lapsed — re-authorise needed</span>
                                )}
                                {msLeft > 0 && daysLeft <= 2 && (
                                  <span className="text-xs text-red-400 font-bold animate-pulse">ACTION REQUIRED</span>
                                )}
                              </div>
                            );
                          })()}
                        {(order as any).depositDeductionReason && (
                          <p className="text-gray-400 text-xs mb-2">Reason: {(order as any).depositDeductionReason}</p>
                        )}

                        {/* Actions — only show if not already settled */}
                        {!["released", "captured", "partially_captured"].includes((order as any).depositStatus) && (
                          depositOrderId === order.id ? (
                            <div className="space-y-2 mt-2">
                              <select
                                value={depositAction}
                                onChange={(e) => setDepositAction(e.target.value as any)}
                                className="w-full bg-white/10 border border-gray-600 text-white text-sm rounded-lg px-3 py-2"
                              >
                                <option value="release">✅ Release hold — equipment returned OK</option>
                                <option value="capture">⚠️ Capture full deposit — damage / loss</option>
                                <option value="partial_capture">🟡 Capture partial deposit — partial damage</option>
                              </select>
                              {depositAction === "partial_capture" && (
                                <Input
                                  type="number"
                                  placeholder={`Amount to charge (max HK$${(order as any).depositAmount})`}
                                  value={depositCaptureAmount}
                                  onChange={(e) => setDepositCaptureAmount(e.target.value)}
                                  className="bg-white/10 border-gray-600 text-white text-sm"
                                />
                              )}
                              {depositAction !== "release" && (
                                <Input
                                  placeholder="Reason for charge (required for damage/loss)"
                                  value={depositReason}
                                  onChange={(e) => setDepositReason(e.target.value)}
                                  className="bg-white/10 border-gray-600 text-white text-sm"
                                />
                              )}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className={depositAction === "release" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                                  onClick={() => settleDepositMutation.mutate({
                                    orderId: order.id,
                                    action: depositAction,
                                    captureAmount: depositAction === "partial_capture" && depositCaptureAmount ? Number(depositCaptureAmount) : undefined,
                                    depositDeductionReason: depositReason || undefined,
                                  })}
                                  disabled={settleDepositMutation.isPending || (depositAction === "partial_capture" && !depositCaptureAmount)}
                                >
                                  {settleDepositMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : depositAction === "release" ? "Release Hold" : "Capture Deposit"}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setDepositOrderId(null)} className="text-gray-400">Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 flex-wrap mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDepositOrderId(order.id);
                                  setDepositAction("release");
                                  setDepositCaptureAmount("");
                                  setDepositReason("");
                                }}
                                className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10 text-xs"
                              >
                                Manage Hold
                              </Button>
                              {!(order as any).stripeDepositIntentId && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => createHoldMutation.mutate({ orderId: order.id })}
                                  disabled={createHoldMutation.isPending}
                                  className="border-blue-500/40 text-blue-300 hover:bg-blue-500/10 text-xs"
                                >
                                  {createHoldMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Hold"}
                                </Button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* HKID Verification */}
                    {((order as any).hkidNumber || (order as any).hkidPhotoUrl) && (
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                        <p className="text-yellow-400 text-xs uppercase tracking-wider mb-2 font-bold">Identity Verification</p>
                        <div className="flex items-center gap-4 flex-wrap">
                          {(order as any).hkidNumber && (
                            <div>
                              <p className="text-gray-500 text-xs mb-0.5">HKID Number</p>
                              <p className="text-white font-mono font-bold">{(order as any).hkidNumber}</p>
                            </div>
                          )}
                          {(order as any).hkidPhotoUrl && (
                            <a
                              href={(order as any).hkidPhotoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              View HKID Photo
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Return Address</p>
                      <p className="text-gray-300 text-sm">Y2, Shing Fung Film Studio, Ho Chung, Sai Kung, Hong Kong</p>
                    </div>

                    {/* Email Notification Log */}
                    <EmailLogPanel orderId={order.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
