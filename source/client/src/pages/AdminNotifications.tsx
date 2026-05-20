/*
 * Equip.HK Admin Notifications Management
 * Three tabs: Contact Submissions, Announcements, Site Notifications
 * Admin-only page with full CRUD
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  Inbox,
  Megaphone,
  Bell,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Edit,
  Eye,
  Mail,
  MailOpen,
  AlertTriangle,
  Package,
  ExternalLink,
  Tag,
  RefreshCw,
  Info,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-logo_22cf3871.png";

// ─── Announcement Form Dialog ───────────────────────────────────────
function AnnouncementFormDialog({
  open,
  onOpenChange,
  editItem,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editItem?: any;
}) {
  const utils = trpc.useUtils();
  const createMut = trpc.announcements.create.useMutation({
    onSuccess: () => {
      utils.announcements.list.invalidate();
      onOpenChange(false);
      toast.success("Announcement created");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMut = trpc.announcements.update.useMutation({
    onSuccess: () => {
      utils.announcements.list.invalidate();
      onOpenChange(false);
      toast.success("Announcement updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const [title, setTitle] = useState(editItem?.title ?? "");
  const [message, setMessage] = useState(editItem?.message ?? "");
  const [type, setType] = useState(editItem?.type ?? "info");
  const [linkText, setLinkText] = useState(editItem?.linkText ?? "");
  const [linkUrl, setLinkUrl] = useState(editItem?.linkUrl ?? "");
  const [isActive, setIsActive] = useState(editItem?.isActive ?? true);

  const handleSubmit = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    const payload = {
      title,
      message,
      type: type as "info" | "warning" | "success" | "promo",
      linkText: linkText || undefined,
      linkUrl: linkUrl || undefined,
      isActive,
    };
    if (editItem) {
      updateMut.mutate({ id: editItem.id, ...payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[Oswald] uppercase tracking-wider">
            {editItem ? "Edit Announcement" : "Create Announcement"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Holiday Hours Notice" />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Announcement details..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="promo">Promo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end gap-3 pb-1">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Link Text (optional)</Label>
              <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="e.g. Learn More" />
            </div>
            <div className="space-y-2">
              <Label>Link URL (optional)</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-orange hover:bg-orange-dark text-white">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editItem ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Site Notification Form Dialog ──────────────────────────────────
function NotificationFormDialog({
  open,
  onOpenChange,
  editItem,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editItem?: any;
}) {
  const utils = trpc.useUtils();
  const createMut = trpc.notifications.create.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      onOpenChange(false);
      toast.success("Notification created");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMut = trpc.notifications.update.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      onOpenChange(false);
      toast.success("Notification updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const [title, setTitle] = useState(editItem?.title ?? "");
  const [message, setMessage] = useState(editItem?.message ?? "");
  const [type, setType] = useState(editItem?.type ?? "update");
  const [linkUrl, setLinkUrl] = useState(editItem?.linkUrl ?? "");
  const [isActive, setIsActive] = useState(editItem?.isActive ?? true);

  const handleSubmit = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    const payload = {
      title,
      message,
      type: type as "new_equipment" | "deal" | "update" | "announcement",
      linkUrl: linkUrl || undefined,
      isActive,
    };
    if (editItem) {
      updateMut.mutate({ id: editItem.id, ...payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[Oswald] uppercase tracking-wider">
            {editItem ? "Edit Notification" : "Create Notification"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New Excavators Available" />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Notification details..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_equipment">New Equipment</SelectItem>
                  <SelectItem value="deal">Deal / Promotion</SelectItem>
                  <SelectItem value="update">General Update</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end gap-3 pb-1">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Link URL (optional)</Label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-orange hover:bg-orange-dark text-white">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editItem ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Submission Detail Dialog ───────────────────────────────────────
function SubmissionDetailDialog({
  open,
  onOpenChange,
  submission,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  submission: any;
}) {
  if (!submission) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[Oswald] uppercase tracking-wider">
            {submission.subject}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Name</p>
              <p className="text-sm font-medium text-navy-deep">{submission.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</p>
              <a href={`mailto:${submission.email}`} className="text-sm text-orange hover:underline">{submission.email}</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Phone</p>
              <p className="text-sm">{submission.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Company</p>
              <p className="text-sm">{submission.company || "—"}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Type</p>
            <Badge variant="outline" className="capitalize">{submission.formType}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Message</p>
            <div className="bg-muted/50 rounded p-3 text-sm whitespace-pre-wrap">{submission.message}</div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Submitted {new Date(submission.createdAt).toLocaleString("en-HK")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Type badge helpers ─────────────────────────────────────────────
const announcementTypeConfig: Record<string, { label: string; className: string }> = {
  info: { label: "Info", className: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  warning: { label: "Warning", className: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  success: { label: "Success", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  promo: { label: "Promo", className: "bg-orange/15 text-orange border-orange/30" },
};

const notifTypeConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  new_equipment: { label: "New Equipment", icon: <Package className="w-3 h-3" />, className: "bg-blue-500/15 text-blue-700" },
  deal: { label: "Deal", icon: <Tag className="w-3 h-3" />, className: "bg-emerald-500/15 text-emerald-700" },
  update: { label: "Update", icon: <RefreshCw className="w-3 h-3" />, className: "bg-orange/15 text-orange" },
  announcement: { label: "Announcement", icon: <Megaphone className="w-3 h-3" />, className: "bg-purple-500/15 text-purple-700" },
};

// ─── Main Page ──────────────────────────────────────────────────────
export default function AdminNotifications() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"submissions" | "announcements" | "notifications">("submissions");

  // Submissions
  const submissionsQ = trpc.contact.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const unreadQ = trpc.contact.unreadCount.useQuery(undefined, { enabled: user?.role === "admin" });
  const markReadMut = trpc.contact.markRead.useMutation({
    onSuccess: () => {
      trpc.useUtils().contact.list.invalidate();
      trpc.useUtils().contact.unreadCount.invalidate();
    },
  });
  const deleteSubMut = trpc.contact.delete.useMutation({
    onSuccess: () => {
      trpc.useUtils().contact.list.invalidate();
      trpc.useUtils().contact.unreadCount.invalidate();
      toast.success("Submission deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // Announcements
  const announcementsQ = trpc.announcements.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const deleteAnnMut = trpc.announcements.delete.useMutation({
    onSuccess: () => {
      trpc.useUtils().announcements.list.invalidate();
      toast.success("Announcement deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // Site Notifications
  const notifsQ = trpc.notifications.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const deleteNotifMut = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      trpc.useUtils().notifications.list.invalidate();
      toast.success("Notification deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // UI state
  const [viewSubmission, setViewSubmission] = useState<any>(null);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [editAnnItem, setEditAnnItem] = useState<any>(null);
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [editNotifItem, setEditNotifItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number; name: string } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-concrete flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-concrete flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-[Oswald] uppercase text-navy-deep">Sign In Required</h1>
          <p className="text-muted-foreground">You need to sign in to access notifications management.</p>
          <Button onClick={() => (window.location.href = getLoginUrl())} className="bg-orange hover:bg-orange-dark text-white">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-concrete flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <AlertTriangle className="w-12 h-12 text-orange mx-auto" />
          <h1 className="text-2xl font-[Oswald] uppercase text-navy-deep">Access Denied</h1>
          <p className="text-muted-foreground">Only administrators can manage notifications.</p>
          <Button variant="outline" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
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
            <h1 className="font-[Oswald] uppercase tracking-wider text-sm text-orange">
              Notifications Manager
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/inventory")} className="border-white/20 text-cream hover:bg-white/10 text-xs">
              <Package className="w-3 h-3 mr-1" />
              Inventory
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/")} className="border-white/20 text-cream hover:bg-white/10 text-xs">
              <ArrowLeft className="w-3 h-3 mr-1" />
              Site
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-[Oswald] text-navy-deep">
                {submissionsQ.data?.length ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Submissions {(unreadQ.data ?? 0) > 0 && <span className="text-orange">({unreadQ.data} unread)</span>}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-orange/10 flex items-center justify-center text-orange shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-[Oswald] text-navy-deep">
                {announcementsQ.data?.length ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Announcements</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-[Oswald] text-navy-deep">
                {notifsQ.data?.length ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Notifications</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b">
          <button
            onClick={() => setTab("submissions")}
            className={`px-4 py-2.5 text-sm font-[Oswald] uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              tab === "submissions" ? "border-orange text-navy-deep" : "border-transparent text-muted-foreground hover:text-navy-deep"
            }`}
          >
            <Inbox className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Submissions
            {(unreadQ.data ?? 0) > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange text-white text-[10px] font-bold">
                {unreadQ.data}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("announcements")}
            className={`px-4 py-2.5 text-sm font-[Oswald] uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              tab === "announcements" ? "border-orange text-navy-deep" : "border-transparent text-muted-foreground hover:text-navy-deep"
            }`}
          >
            <Megaphone className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Announcements ({announcementsQ.data?.length ?? 0})
          </button>
          <button
            onClick={() => setTab("notifications")}
            className={`px-4 py-2.5 text-sm font-[Oswald] uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              tab === "notifications" ? "border-orange text-navy-deep" : "border-transparent text-muted-foreground hover:text-navy-deep"
            }`}
          >
            <Bell className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Notifications ({notifsQ.data?.length ?? 0})
          </button>
        </div>

        {/* ─── Submissions Tab ─────────────────────────────────────── */}
        {tab === "submissions" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Contact form and quote request submissions from the website. You'll also receive push notifications for new submissions.
            </p>

            {submissionsQ.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-orange" />
              </div>
            ) : submissionsQ.data?.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Inbox className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground">No submissions yet. They'll appear here when visitors fill out the contact form.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground">From</th>
                        <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground hidden md:table-cell">Subject</th>
                        <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground hidden lg:table-cell">Type</th>
                        <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground hidden sm:table-cell">Date</th>
                        <th className="text-right px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissionsQ.data?.map((sub) => (
                        <tr key={sub.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${!sub.isRead ? "bg-orange/5" : ""}`}>
                          <td className="px-4 py-3">
                            {sub.isRead ? (
                              <MailOpen className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Mail className="w-4 h-4 text-orange" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className={`font-medium ${!sub.isRead ? "text-navy-deep" : "text-muted-foreground"}`}>{sub.name}</p>
                            <p className="text-xs text-muted-foreground">{sub.email}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-sm truncate max-w-xs">{sub.subject}</p>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <Badge variant="outline" className="capitalize text-xs">{sub.formType}</Badge>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs font-data text-muted-foreground">
                              {new Date(sub.createdAt).toLocaleDateString("en-HK", { day: "numeric", month: "short" })}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setViewSubmission(sub);
                                  if (!sub.isRead) {
                                    markReadMut.mutate({ id: sub.id });
                                  }
                                }}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget({ type: "submission", id: sub.id, name: sub.subject })}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Announcements Tab ───────────────────────────────────── */}
        {tab === "announcements" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Create banners that appear at the top of the website for all visitors.
              </p>
              <Button
                onClick={() => { setEditAnnItem(null); setShowAnnForm(true); }}
                className="bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Announcement
              </Button>
            </div>

            {announcementsQ.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-orange" />
              </div>
            ) : announcementsQ.data?.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Megaphone className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground">No announcements yet. Create one to display a banner on the site.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcementsQ.data?.map((ann) => {
                  const tc = announcementTypeConfig[ann.type] ?? announcementTypeConfig.info;
                  return (
                    <div key={ann.id} className="bg-white rounded-lg border p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-xs ${tc.className}`}>{tc.label}</Badge>
                          {ann.isActive ? (
                            <Badge variant="outline" className="text-xs bg-emerald-500/15 text-emerald-700 border-emerald-500/30">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-navy-deep">{ann.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{ann.message}</p>
                        {ann.linkUrl && (
                          <p className="text-xs text-orange mt-1 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {ann.linkText || ann.linkUrl}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 font-data">
                          Created {new Date(ann.createdAt).toLocaleDateString("en-HK")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => { setEditAnnItem(ann); setShowAnnForm(true); }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget({ type: "announcement", id: ann.id, name: ann.title })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Notifications Tab ───────────────────────────────────── */}
        {tab === "notifications" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Create notifications that appear in the bell icon on the public site.
              </p>
              <Button
                onClick={() => { setEditNotifItem(null); setShowNotifForm(true); }}
                className="bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Notification
              </Button>
            </div>

            {notifsQ.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-orange" />
              </div>
            ) : notifsQ.data?.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Bell className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground">No notifications yet. Create one to alert visitors about new equipment or deals.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifsQ.data?.map((notif) => {
                  const nc = notifTypeConfig[notif.type] ?? notifTypeConfig.update;
                  return (
                    <div key={notif.id} className="bg-white rounded-lg border p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-xs gap-1 ${nc.className}`}>
                            {nc.icon}
                            {nc.label}
                          </Badge>
                          {notif.isActive ? (
                            <Badge variant="outline" className="text-xs bg-emerald-500/15 text-emerald-700 border-emerald-500/30">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-navy-deep">{notif.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        {notif.linkUrl && (
                          <p className="text-xs text-orange mt-1 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {notif.linkUrl}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 font-data">
                          Created {new Date(notif.createdAt).toLocaleDateString("en-HK")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => { setEditNotifItem(notif); setShowNotifForm(true); }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget({ type: "notification", id: notif.id, name: notif.title })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission Detail */}
      <SubmissionDetailDialog
        open={!!viewSubmission}
        onOpenChange={(v) => !v && setViewSubmission(null)}
        submission={viewSubmission}
      />

      {/* Announcement Form */}
      {showAnnForm && (
        <AnnouncementFormDialog
          open={showAnnForm}
          onOpenChange={(v) => { setShowAnnForm(v); if (!v) setEditAnnItem(null); }}
          editItem={editAnnItem}
        />
      )}

      {/* Notification Form */}
      {showNotifForm && (
        <NotificationFormDialog
          open={showNotifForm}
          onOpenChange={(v) => { setShowNotifForm(v); if (!v) setEditNotifItem(null); }}
          editItem={editNotifItem}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === "submission") {
                  deleteSubMut.mutate({ id: deleteTarget.id });
                } else if (deleteTarget.type === "announcement") {
                  deleteAnnMut.mutate({ id: deleteTarget.id });
                } else {
                  deleteNotifMut.mutate({ id: deleteTarget.id });
                }
                setDeleteTarget(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
