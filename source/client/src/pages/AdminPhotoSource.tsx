/**
 * AdminPhotoSource — Bulk Photo Sourcing for All Products
 * Uses web scraping (DuckDuckGo + Bing) to find real manufacturer photos.
 * Processes items in batches of 5 to avoid 504 gateway timeouts.
 * Shows a live progress bar, item-by-item log, and final summary.
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  SkipForward,
  Camera,
  BarChart3,
  RefreshCw,
  StopCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const BATCH_SIZE = 5;

type ItemResult = {
  id: number;
  name: string;
  status: "ok" | "skip" | "error";
  imageUrl?: string;
  error?: string;
};

type RunState = {
  totalToSource: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: ItemResult[];
};

export default function AdminPhotoSource() {
  const [, setLocation] = useLocation();
  const [overwrite, setOverwrite] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [runState, setRunState] = useState<RunState | null>(null);
  const [isDone, setIsDone] = useState(false);
  const stopRef = useRef(false);

  const sourceMutation = trpc.admin.bulkSourceImages.useMutation();

  const handleStart = () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setConfirmed(false);
    setIsDone(false);
    setRunState(null);
    stopRef.current = false;
    setIsRunning(true);
    runBatches(0, { totalToSource: 0, processed: 0, succeeded: 0, failed: 0, skipped: 0, results: [] });
  };

  const handleStop = () => {
    stopRef.current = true;
  };

  const handleReset = () => {
    setRunState(null);
    setIsDone(false);
    setConfirmed(false);
  };

  const runBatches = async (offset: number, accumulated: RunState) => {
    if (stopRef.current) {
      setIsRunning(false);
      setIsDone(true);
      toast.info("Stopped after current batch.");
      return;
    }

    try {
      const data = await sourceMutation.mutateAsync({ overwrite, offset, batchSize: BATCH_SIZE });

      const newResults = [...accumulated.results, ...data.results];
      const newState: RunState = {
        totalToSource: data.totalToSource,
        processed: offset + data.batchCount,
        succeeded: accumulated.succeeded + data.succeeded,
        failed: accumulated.failed + data.failed,
        skipped: accumulated.skipped + data.skipped,
        results: newResults,
      };
      setRunState(newState);

      const nextOffset = offset + data.batchCount;
      const hasMore = data.batchCount === BATCH_SIZE && nextOffset < data.totalToSource;

      if (hasMore && !stopRef.current) {
        // Continue to next batch
        await runBatches(nextOffset, newState);
      } else {
        // All done
        setIsRunning(false);
        setIsDone(true);
        if (newState.failed === 0) {
          toast.success(
            `Photo sourcing complete — ${newState.succeeded} photos queued for approval, ${newState.skipped} skipped.`
          );
        } else {
          toast.warning(
            `Photo sourcing done — ${newState.succeeded} queued, ${newState.failed} failed, ${newState.skipped} skipped.`
          );
        }
      }
    } catch (err: any) {
      setIsRunning(false);
      setIsDone(true);
      toast.error(`Error on batch at offset ${offset}: ${err?.message ?? "Unknown error"}`);
    }
  };

  const progressPct = runState && runState.totalToSource > 0
    ? Math.round((runState.processed / runState.totalToSource) * 100)
    : 0;

  const successRate = runState && runState.processed > 0
    ? Math.round((runState.succeeded / runState.processed) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d1f3c]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/admin/inventory")}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-orange/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-orange" />
            </div>
            <div>
              <h1 className="font-[Oswald] text-lg uppercase tracking-wider text-white">
                Photo Sourcing
              </h1>
              <p className="text-xs text-white/50">
                Scrapes real manufacturer photos for all items — batched to avoid timeouts
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* How it works */}
        <Card className="bg-[#0d1f3c] border-white/10 p-5">
          <h2 className="font-[Oswald] uppercase tracking-wider text-sm text-white/70 mb-3">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Reads DB", desc: "Fetches items missing a product photo" },
              { step: "2", title: "Web Scrape", desc: "Searches DuckDuckGo + Bing for brand & model" },
              { step: "3", title: "Uploads to S3", desc: "Downloads best result and stores it" },
              { step: "4", title: "Pending Queue", desc: "Photo waits for your approval before going live" },
            ].map((s) => (
              <div key={s.step} className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-orange/20 text-orange flex items-center justify-center text-xs font-bold shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{s.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Controls */}
        <Card className="bg-[#0d1f3c] border-white/10 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Switch
                id="overwrite"
                checked={overwrite}
                onCheckedChange={setOverwrite}
                disabled={isRunning}
              />
              <Label htmlFor="overwrite" className="text-white/80 cursor-pointer">
                <span className="font-medium">Re-source items that already have photos</span>
                <span className="block text-xs text-white/40 mt-0.5">
                  By default, only items without a photo are processed
                </span>
              </Label>
            </div>

            <div className="flex gap-2">
              {isDone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="border-white/20 text-white/70 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
              {isRunning ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStop}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop After Batch
                </Button>
              ) : (
                <Button
                  onClick={handleStart}
                  disabled={isDone && !runState}
                  className={
                    confirmed
                      ? "bg-orange hover:bg-orange-dark text-white animate-pulse"
                      : "bg-orange hover:bg-orange-dark text-white"
                  }
                >
                  {confirmed ? (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Confirm — Start Now
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      {isDone ? "Run Again" : "Source All Photos"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {confirmed && !isRunning && (
            <div className="mt-4 flex items-start gap-2 text-amber-400 bg-amber-400/10 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">
                This will scrape real manufacturer photos for{" "}
                <strong>{overwrite ? "all items" : "items without photos"}</strong>. Photos go into
                the approval queue — nothing goes live until you approve. Processed in batches of{" "}
                {BATCH_SIZE}. Click <strong>Confirm</strong> to start.
              </p>
            </div>
          )}

          {/* Live progress bar */}
          {isRunning && runState && runState.totalToSource > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>
                  Batch {Math.ceil(runState.processed / BATCH_SIZE)} of{" "}
                  {Math.ceil(runState.totalToSource / BATCH_SIZE)} — {runState.processed} /{" "}
                  {runState.totalToSource} items
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {isRunning && (!runState || runState.totalToSource === 0) && (
            <div className="mt-4 flex items-center gap-3 text-white/60 bg-white/5 rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin text-orange shrink-0" />
              <p className="text-sm">Starting first batch…</p>
            </div>
          )}
        </Card>

        {/* Results */}
        {runState && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total", value: runState.totalToSource, color: "text-white" },
                { label: "Queued", value: runState.succeeded, color: "text-emerald-400" },
                { label: "Failed", value: runState.failed, color: "text-red-400" },
                { label: "Skipped", value: runState.skipped, color: "text-amber-400" },
              ].map((s) => (
                <Card key={s.label} className="bg-[#0d1f3c] border-white/10 p-4 text-center">
                  <p className={`text-2xl font-bold font-[Oswald] ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-white/40 uppercase tracking-wider mt-1">{s.label}</p>
                </Card>
              ))}
            </div>

            {/* Success rate bar */}
            {isDone && (
              <Card className="bg-[#0d1f3c] border-white/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-orange" />
                    <span className="text-sm font-medium text-white">Success Rate</span>
                  </div>
                  <span className="text-sm font-bold text-white">{successRate}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange rounded-full transition-all duration-700"
                    style={{ width: `${successRate}%` }}
                  />
                </div>
                {runState.succeeded > 0 && (
                  <p className="text-xs text-white/40 mt-2">
                    {runState.succeeded} photo{runState.succeeded !== 1 ? "s" : ""} queued for
                    approval — go to{" "}
                    <button
                      onClick={() => setLocation("/admin/photo-approval")}
                      className="text-orange underline hover:no-underline"
                    >
                      Photo Approval
                    </button>{" "}
                    to review them.
                  </p>
                )}
              </Card>
            )}

            {/* Item log */}
            <Card className="bg-[#0d1f3c] border-white/10">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-[Oswald] uppercase tracking-wider text-sm text-white/70">
                  Item Log
                </h3>
                <span className="text-xs text-white/40">{runState.results.length} items</span>
              </div>
              <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
                {runState.results.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex items-center gap-3 px-4 py-2.5">
                    {item.status === "ok" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : item.status === "error" ? (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    ) : (
                      <SkipForward className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-sm text-white/80 flex-1 truncate">{item.name}</span>
                    {item.status === "ok" && (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                        Queued
                      </Badge>
                    )}
                    {item.status === "skip" && (
                      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs">
                        Skipped
                      </Badge>
                    )}
                    {item.status === "error" && (
                      <span className="text-xs text-red-400 truncate max-w-[200px]">
                        {item.error}
                      </span>
                    )}
                  </div>
                ))}
                {isRunning && (
                  <div className="flex items-center gap-3 px-4 py-3 text-white/40">
                    <Loader2 className="w-4 h-4 animate-spin text-orange shrink-0" />
                    <span className="text-sm">Processing next batch…</span>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
