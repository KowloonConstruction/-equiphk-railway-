/**
 * Equip.HK Admin Enquiry/Lead Tracking
 * Enhanced: sort, delete, reply/follow-up from the lead tracking page
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ClipboardList,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Search,
  Phone,
  Mail,
  MessageCircle,
  ShoppingCart,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Building,
  Package,
  Clock,
  Trash2,
  Reply,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Send,
  History,
  StickyNote,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-logo_22cf3871.png";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  quote_request: { label: "Quote Request", icon: <FileText className="w-3.5 h-3.5" />, color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  whatsapp_click: { label: "WhatsApp", icon: <MessageCircle className="w-3.5 h-3.5" />, color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  phone_call: { label: "Phone", icon: <Phone className="w-3.5 h-3.5" />, color: "bg-purple-500/10 text-purple-700 border-purple-500/30" },
  email_click: { label: "Email", icon: <Mail className="w-3.5 h-3.5" />, color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  cart_enquiry: { label: "Cart Enquiry", icon: <ShoppingCart className="w-3.5 h-3.5" />, color: "bg-orange/10 text-orange border-orange/30" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  new: { label: "New", color: "bg-blue-500/10 text-blue-700 border-blue-500/30", bgColor: "bg-blue-50" },
  contacted: { label: "Contacted", color: "bg-amber-500/10 text-amber-700 border-amber-500/30", bgColor: "bg-amber-50" },
  quoted: { label: "Quoted", color: "bg-purple-500/10 text-purple-700 border-purple-500/30", bgColor: "bg-purple-50" },
  won: { label: "Won", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30", bgColor: "bg-emerald-50" },
  lost: { label: "Lost", color: "bg-red-500/10 text-red-700 border-red-500/30", bgColor: "bg-red-50" },
};

type SortField = "createdAt" | "customerName" | "type" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

// ─── Sort Header ────────────────────────────────────────────────────────────
function SortHeader({
  field,
  label,
  sortField,
  sortDir,
  onSort,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
}) {
  const active = sortField === field;
  return (
    <th
      className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground cursor-pointer select-none hover:text-navy-deep transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-40" />
        )}
      </span>
    </th>
  );
}

// ─── Reply Dialog ────────────────────────────────────────────────────────────
function ReplyDialog({
  lead,
  onClose,
}: {
  lead: any;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState(
    `Re: Your Enquiry${lead.equipmentName ? ` — ${lead.equipmentName}` : ""}`
  );
  const [body, setBody] = useState(
    `Hi ${lead.customerName || "there"},\n\nThank you for your enquiry${lead.equipmentName ? ` regarding ${lead.equipmentName}` : ""}.\n\n`
  );
  const utils = trpc.useUtils();

  const repliesQ = trpc.enquiryLeads.getReplies.useQuery({ leadId: lead.id });

  const replyMut = trpc.enquiryLeads.reply.useMutation({
    onSuccess: () => {
      toast.success("Reply sent and logged.");
      utils.enquiryLeads.list.invalidate();
      utils.enquiryLeads.statusCounts.invalidate();
      repliesQ.refetch();
      setBody("");
    },
    onError: (err) => toast.error(err.message),
  });

  const canSend = !!lead.customerEmail && subject.trim().length > 0 && body.trim().length > 0;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Oswald] uppercase tracking-wider flex items-center gap-2">
            <Reply className="w-4 h-4 text-orange" />
            Reply / Follow Up
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-navy-deep">{lead.customerName || "Anonymous"}</span>
            {lead.customerEmail && <> · <span>{lead.customerEmail}</span></>}
            {lead.company && <> · <span>{lead.company}</span></>}
          </div>
        </DialogHeader>

        {/* Lead summary */}
        <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
          <div className="flex flex-wrap gap-3">
            <span><strong>Type:</strong> {TYPE_CONFIG[lead.type]?.label ?? lead.type}</span>
            {lead.equipmentName && <span><strong>Equipment:</strong> {lead.equipmentName}</span>}
            <span><strong>Status:</strong> {STATUS_CONFIG[lead.status]?.label ?? lead.status}</span>
          </div>
          {lead.notes && (
            <p className="text-muted-foreground text-xs mt-1">
              <StickyNote className="w-3 h-3 inline mr-1" />
              {lead.notes}
            </p>
          )}
        </div>

        {/* Previous replies */}
        {repliesQ.data && repliesQ.data.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              Previous Replies ({repliesQ.data.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {repliesQ.data.map((r: any) => (
                <div key={r.id} className="rounded-lg border border-border bg-white p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-navy-deep">{r.subject}</span>
                    <span className="text-muted-foreground">
                      {r.sentAt ? new Date(r.sentAt).toLocaleString("en-HK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </span>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{r.body}</p>
                  <p className="text-muted-foreground/60 mt-1">Sent by {r.sentByName} → {r.toEmail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compose */}
        {!lead.customerEmail ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            No email address on file for this lead. You cannot send an email reply, but you can still update the status and add notes.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                To
              </label>
              <Input value={lead.customerEmail} disabled className="bg-muted/30 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Subject
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Message
              </label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your reply..."
                rows={6}
                className="text-sm resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {lead.customerEmail && (
            <Button
              onClick={() => replyMut.mutate({ leadId: lead.id, toEmail: lead.customerEmail, subject, body })}
              disabled={!canSend || replyMut.isPending}
              className="bg-orange hover:bg-orange-dark text-white"
            >
              {replyMut.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Send Reply
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function AdminEnquiryTracking() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Dialogs
  const [editLead, setEditLead] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [replyLead, setReplyLead] = useState<any>(null);
  const [deleteLead, setDeleteLead] = useState<any>(null);

  const leadsQ = trpc.enquiryLeads.list.useQuery({ limit: 500, offset: 0 });
  const statusCountsQ = trpc.enquiryLeads.statusCounts.useQuery();
  const utils = trpc.useUtils();

  const updateStatusMut = trpc.enquiryLeads.updateStatus.useMutation({
    onSuccess: () => {
      utils.enquiryLeads.list.invalidate();
      utils.enquiryLeads.statusCounts.invalidate();
      setEditLead(null);
      toast.success("Lead status updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteLeadMut = trpc.enquiryLeads.delete.useMutation({
    onSuccess: () => {
      utils.enquiryLeads.list.invalidate();
      utils.enquiryLeads.statusCounts.invalidate();
      setDeleteLead(null);
      toast.success("Lead deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // Sort handler
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(0);
  }

  const filteredLeads = useMemo(() => {
    if (!leadsQ.data) return [];
    let result = leadsQ.data.filter((lead: any) => {
      if (filterType !== "all" && lead.type !== filterType) return false;
      if (filterStatus !== "all" && lead.status !== filterStatus) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match =
          (lead.customerName || "").toLowerCase().includes(term) ||
          (lead.customerEmail || "").toLowerCase().includes(term) ||
          (lead.company || "").toLowerCase().includes(term) ||
          (lead.equipmentName || "").toLowerCase().includes(term) ||
          (lead.customerPhone || "").toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });

    // Sort
    result = [...result].sort((a: any, b: any) => {
      let av: any, bv: any;
      switch (sortField) {
        case "createdAt":
          av = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bv = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        case "customerName":
          av = (a.customerName || "").toLowerCase();
          bv = (b.customerName || "").toLowerCase();
          break;
        case "type":
          av = a.type || "";
          bv = b.type || "";
          break;
        case "status":
          av = a.status || "";
          bv = b.status || "";
          break;
        default:
          av = 0; bv = 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [leadsQ.data, filterType, filterStatus, searchTerm, sortField, sortDir]);

  const totalPages = Math.ceil(filteredLeads.length / PAGE_SIZE);
  const paginatedLeads = filteredLeads.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 };
    statusCountsQ.data?.forEach((item: any) => { counts[item.status] = item.count; });
    return counts;
  }, [statusCountsQ.data]);

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
            <h1 className="font-[Oswald] uppercase tracking-wider text-sm text-orange flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Lead Tracking
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { leadsQ.refetch(); statusCountsQ.refetch(); }}
              className="border-white/20 text-cream hover:bg-white/10 text-xs"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${leadsQ.isFetching ? "animate-spin" : ""}`} />
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
        <div>
          <h2 className="text-2xl font-[Oswald] uppercase text-navy-deep flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-orange" />
            Enquiry / Lead Tracking
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""} · Sort by any column · Reply directly from the table
          </p>
        </div>

        {/* Pipeline Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => { setFilterStatus(filterStatus === key ? "all" : key); setPage(0); }}
              className={`rounded-lg border p-3 text-left transition-all ${
                filterStatus === key ? "ring-2 ring-orange shadow-sm" : "hover:shadow-sm"
              } ${config.bgColor}`}
            >
              <p className="text-xs font-medium uppercase tracking-wider opacity-70">{config.label}</p>
              <p className="text-2xl font-[Oswald] font-bold mt-1">{statusCounts[key] ?? 0}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              placeholder="Search by name, email, company, equipment..."
              className="pl-9 bg-white"
            />
          </div>
          <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(0); }}>
            <SelectTrigger className="w-44 bg-white"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="quote_request">Quote Request</SelectItem>
              <SelectItem value="whatsapp_click">WhatsApp</SelectItem>
              <SelectItem value="phone_call">Phone</SelectItem>
              <SelectItem value="email_click">Email</SelectItem>
              <SelectItem value="cart_enquiry">Cart Enquiry</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(0); }}>
            <SelectTrigger className="w-36 bg-white"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads Table */}
        {leadsQ.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-orange" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground">
              {leadsQ.data?.length === 0
                ? "No enquiries tracked yet. Leads will appear here when customers interact with your site."
                : "No leads match your filters."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-navy-deep/5 border-b">
                  <tr>
                    <SortHeader field="createdAt" label="When" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader field="type" label="Type" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader field="customerName" label="Customer" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground hidden lg:table-cell">Equipment</th>
                    <SortHeader field="status" label="Status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="text-right px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeads.map((lead: any) => {
                    const typeConfig = TYPE_CONFIG[lead.type] ?? TYPE_CONFIG.quote_request;
                    const statusConfig = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
                    const timeStr = lead.createdAt
                      ? new Date(lead.createdAt).toLocaleString("en-HK", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })
                      : "—";

                    return (
                      <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{timeStr}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`gap-1 font-normal whitespace-nowrap ${typeConfig.color}`}>
                            {typeConfig.icon}
                            {typeConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {lead.customerName && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium text-navy-deep">{lead.customerName}</span>
                              </div>
                            )}
                            {lead.customerEmail && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground">{lead.customerEmail}</span>
                              </div>
                            )}
                            {lead.customerPhone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground">{lead.customerPhone}</span>
                              </div>
                            )}
                            {lead.company && (
                              <div className="flex items-center gap-1.5">
                                <Building className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground">{lead.company}</span>
                              </div>
                            )}
                            {!lead.customerName && !lead.customerEmail && !lead.company && (
                              <span className="text-xs text-muted-foreground italic">Anonymous</span>
                            )}
                            {lead.notes && (
                              <div className="flex items-start gap-1.5 mt-1">
                                <StickyNote className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                                <span className="text-xs text-muted-foreground/70 line-clamp-2">{lead.notes}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {lead.equipmentName ? (
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-xs text-navy-deep">{lead.equipmentName}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`font-normal capitalize whitespace-nowrap ${statusConfig.color}`}>
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reply */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReplyLead(lead)}
                              className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                              title="Reply / Follow Up"
                            >
                              <Reply className="w-3 h-3" />
                              Reply
                            </Button>
                            {/* Update Status */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditLead(lead);
                                setEditStatus(lead.status);
                                setEditNotes(lead.notes || "");
                              }}
                              className="h-7 text-xs"
                              title="Update Status"
                            >
                              Update
                            </Button>
                            {/* Delete */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteLead(lead)}
                              className="h-7 w-7 p-0 border-red-200 text-red-600 hover:bg-red-50"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages} ({filteredLeads.length} leads)
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} className="h-8">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="h-8">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Update Status Dialog */}
      <Dialog open={!!editLead} onOpenChange={(v) => !v && setEditLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[Oswald] uppercase tracking-wider">Update Lead Status</DialogTitle>
          </DialogHeader>
          {editLead && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                {editLead.customerName && <p><strong>Customer:</strong> {editLead.customerName}</p>}
                {editLead.customerEmail && <p><strong>Email:</strong> {editLead.customerEmail}</p>}
                {editLead.company && <p><strong>Company:</strong> {editLead.company}</p>}
                {editLead.equipmentName && <p><strong>Equipment:</strong> {editLead.equipmentName}</p>}
                <p><strong>Type:</strong> {TYPE_CONFIG[editLead.type]?.label ?? editLead.type}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLead(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editLead) {
                  updateStatusMut.mutate({ id: editLead.id, status: editStatus as any, notes: editNotes || undefined });
                }
              }}
              disabled={updateStatusMut.isPending}
              className="bg-orange hover:bg-orange-dark text-white"
            >
              {updateStatusMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      {replyLead && (
        <ReplyDialog lead={replyLead} onClose={() => setReplyLead(null)} />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLead} onOpenChange={(v) => !v && setDeleteLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-[Oswald] uppercase">Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the lead
              {deleteLead?.customerName ? ` from ${deleteLead.customerName}` : ""}
              {deleteLead?.equipmentName ? ` regarding ${deleteLead.equipmentName}` : ""} and all its reply history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLead && deleteLeadMut.mutate({ id: deleteLead.id })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLeadMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
