/**
 * AdminPhotoApproval.tsx
 *
 * Photo approval queue — shows all auto-sourced images awaiting review.
 * Admin can approve (goes live) or reject (discarded) each image.
 * Supports multi-select for bulk approve/reject.
 * Shows current image vs pending image side-by-side for comparison.
 *
 * A second "Rejected" section shows previously rejected items with a
 * "Re-source Photo" button to trigger a fresh manufacturer-targeted search.
 */

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  ImageOff,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Clock,
  RefreshCcw,
  AlertCircle,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo, useCallback } from "react";

export default function AdminPhotoApproval() {
  const utils = trpc.useUtils();

  const { data: pendingItems, isLoading, refetch } = trpc.admin.listPendingImages.useQuery();
  const { data: rejectedItems, isLoading: isLoadingRejected, refetch: refetchRejected } =
    trpc.admin.listRejectedImages.useQuery();
  const { data: countData } = trpc.admin.pendingImageCount.useQuery();

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const approveMutation = trpc.admin.approveImage.useMutation({
    onSuccess: () => {
      toast.success("Image approved — the photo is now live on the product page.");
      utils.admin.listPendingImages.invalidate();
      utils.admin.pendingImageCount.invalidate();
    },
    onError: (err) => {
      toast.error(`Approval failed: ${err.message}`);
    },
  });

  const rejectMutation = trpc.admin.rejectImage.useMutation({
    onSuccess: () => {
      toast.success("Image rejected — automatically searching for a different photo.");
      utils.admin.listPendingImages.invalidate();
      utils.admin.listRejectedImages.invalidate();
      utils.admin.pendingImageCount.invalidate();
      setTimeout(() => {
        utils.admin.listPendingImages.invalidate();
        utils.admin.listRejectedImages.invalidate();
        utils.admin.pendingImageCount.invalidate();
      }, 15000);
    },
    onError: (err) => {
      toast.error(`Rejection failed: ${err.message}`);
    },
  });

  const bulkApproveMut = trpc.admin.bulkApproveImages.useMutation({
    onSuccess: (data) => {
      toast.success(`Approved ${data.approved} of ${data.total} photos`);
      setSelectedIds(new Set());
      utils.admin.listPendingImages.invalidate();
      utils.admin.pendingImageCount.invalidate();
    },
    onError: (err) => toast.error(`Bulk approve failed: ${err.message}`),
  });

  const bulkRejectMut = trpc.admin.bulkRejectImages.useMutation({
    onSuccess: (data) => {
      toast.success(`Rejected ${data.rejected} of ${data.total} photos`);
      setSelectedIds(new Set());
      utils.admin.listPendingImages.invalidate();
      utils.admin.listRejectedImages.invalidate();
      utils.admin.pendingImageCount.invalidate();
    },
    onError: (err) => toast.error(`Bulk reject failed: ${err.message}`),
  });

  const reSourceMutation = trpc.admin.reSourceImage.useMutation({
    onSuccess: () => {
      toast.success("New photo found — moved back to the Pending queue for your review.");
      utils.admin.listRejectedImages.invalidate();
      utils.admin.listPendingImages.invalidate();
      utils.admin.pendingImageCount.invalidate();
    },
    onError: (err) => {
      toast.error(`Re-source failed: ${err.message}`);
    },
  });

  const handleApprove = (id: number) => approveMutation.mutate({ id });
  const handleReject = (id: number) => rejectMutation.mutate({ id });
  const handleReSource = (id: number) => reSourceMutation.mutate({ id });

  const isActingOnPending = (id: number) =>
    (approveMutation.isPending && approveMutation.variables?.id === id) ||
    (rejectMutation.isPending && rejectMutation.variables?.id === id);

  const isReSourceing = (id: number) =>
    reSourceMutation.isPending && reSourceMutation.variables?.id === id;

  // Selection helpers
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!pendingItems) return;
    setSelectedIds(new Set(pendingItems.map((item) => item.id)));
  }, [pendingItems]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const allSelected = useMemo(() => {
    if (!pendingItems || pendingItems.length === 0) return false;
    return pendingItems.every((item) => selectedIds.has(item.id));
  }, [pendingItems, selectedIds]);

  const someSelected = selectedIds.size > 0;
  const isBulkPending = bulkApproveMut.isPending || bulkRejectMut.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Photo Approval Queue</h1>
              <p className="text-sm text-muted-foreground">
                Review auto-sourced images before they go live
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {countData && countData.count > 0 && (
              <Badge variant="secondary" className="gap-1.5 text-sm px-3 py-1">
                <Clock className="w-3.5 h-3.5" />
                {countData.count} pending
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { refetch(); refetchRejected(); }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">

        {/* ── Pending section ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Review
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Approve to make the photo live, or reject to discard it. Use checkboxes for bulk actions.
          </p>

          {/* Bulk action bar */}
          {pendingItems && pendingItems.length > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border bg-card">
              <button
                onClick={allSelected ? deselectAll : selectAll}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {allSelected ? (
                  <CheckSquare className="w-5 h-5 text-orange-500" />
                ) : someSelected ? (
                  <MinusSquare className="w-5 h-5 text-orange-500" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                {allSelected ? "Deselect All" : `Select All (${pendingItems.length})`}
              </button>

              {someSelected && (
                <>
                  <div className="h-5 w-px bg-border" />
                  <span className="text-sm font-medium text-orange-600">
                    {selectedIds.size} selected
                  </span>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => bulkRejectMut.mutate({ ids: Array.from(selectedIds) })}
                    disabled={isBulkPending}
                  >
                    {bulkRejectMut.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    Reject Selected
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => bulkApproveMut.mutate({ ids: Array.from(selectedIds) })}
                    disabled={isBulkPending}
                  >
                    {bulkApproveMut.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    Approve Selected
                  </Button>
                </>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading pending images…</p>
            </div>
          ) : !pendingItems || pendingItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border rounded-xl bg-card">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="font-medium">All caught up — no images waiting for review.</p>
              <Link href="/admin/photo-source">
                <Button variant="outline" size="sm" className="mt-1">
                  Run Photo Source to queue more
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {pendingItems.length} image{pendingItems.length !== 1 ? "s" : ""} waiting.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pendingItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <Card
                      key={item.id}
                      className={`overflow-hidden border-2 transition-colors ${
                        isSelected
                          ? "border-orange-400 bg-orange-50/30"
                          : "border-border hover:border-amber-300"
                      }`}
                    >
                      <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <button
                              onClick={() => toggleSelect(item.id)}
                              className="mt-0.5 shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-orange-500" />
                              ) : (
                                <Square className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <CardTitle className="text-base leading-tight truncate">
                                {item.name}
                              </CardTitle>
                              {(item.brand || item.model) && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {[item.brand, item.model].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="shrink-0 text-xs border-amber-400 text-amber-600 bg-amber-50"
                          >
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="px-4 pb-4 space-y-3">
                        {/* Side-by-side image comparison */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Current
                            </p>
                            <div className="aspect-square rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                              {item.currentImageUrl ? (
                                <img
                                  src={item.currentImageUrl}
                                  alt="Current"
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                  <ImageOff className="w-6 h-6" />
                                  <span className="text-xs">No photo</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                              New (pending)
                            </p>
                            <div className="aspect-square rounded-md border-2 border-amber-300 bg-muted overflow-hidden flex items-center justify-center">
                              {item.pendingImageUrl ? (
                                <img
                                  src={item.pendingImageUrl}
                                  alt="Pending"
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                  <ImageOff className="w-6 h-6" />
                                  <span className="text-xs">Load failed</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            onClick={() => handleReject(item.id)}
                            disabled={isActingOnPending(item.id)}
                          >
                            {rejectMutation.isPending && rejectMutation.variables?.id === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(item.id)}
                            disabled={isActingOnPending(item.id)}
                          >
                            {approveMutation.isPending &&
                            approveMutation.variables?.id === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            Approve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* ── Rejected section ────────────────────────────────────────────── */}
        {(rejectedItems && rejectedItems.length > 0) && (
          <section>
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Rejected — Try Again
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              These photos were rejected. Click <strong>Re-source Photo</strong> to search for a
              better manufacturer image — it will go back into the Pending queue for your review.
            </p>

            {isLoadingRejected ? (
              <div className="flex items-center gap-3 py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading rejected items…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {rejectedItems.map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden border-2 border-red-200 hover:border-red-300 transition-colors"
                  >
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base leading-tight truncate">
                            {item.name}
                          </CardTitle>
                          {(item.brand || item.model) && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {[item.brand, item.model].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs border-red-400 text-red-600 bg-red-50"
                        >
                          Rejected
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="px-4 pb-4 space-y-3">
                      {/* Current live image */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Current live photo
                        </p>
                        <div className="aspect-video rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                          {item.currentImageUrl ? (
                            <img
                              src={item.currentImageUrl}
                              alt="Current"
                              className="w-full h-full object-contain p-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-muted-foreground">
                              <ImageOff className="w-6 h-6" />
                              <span className="text-xs">No photo</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Re-source button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-2 border-orange-400 text-orange-600 hover:bg-orange-50 hover:border-orange-500"
                        onClick={() => handleReSource(item.id)}
                        disabled={isReSourceing(item.id)}
                      >
                        {isReSourceing(item.id) ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Searching manufacturer sites…
                          </>
                        ) : (
                          <>
                            <RefreshCcw className="w-3.5 h-3.5" />
                            Re-source Photo
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
