/**
 * AdminAutoFill — Bulk AI Auto-Fill for All Products
 * Calls the server in sequential batches of 10 items to avoid gateway timeouts.
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
  Sparkles,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const BATCH_SIZE = 10;

type ItemResult = {
  id: number;
  name: string;
  status: "ok" | "skip" | "error";
  error?: string;
};

type RunState = {
  totalToFill: number;
  processedSoFar: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: string[];
  results: ItemResult[];
  done: boolean;
};

export default function AdminAutoFill() {
  const [overwrite, setOverwrite] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runState, setRunState] = useState<RunState | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const cancelRef = useRef(false);

  const fillMutation = trpc.admin.bulkAutoFillInfo.useMutation();

  const handleStart = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setIsRunning(true);
    setRunState(null);
    setConfirmed(false);
    cancelRef.current = false;

    let offset = 0;
    let totalToFill = 0;
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    const allErrors: string[] = [];
    const allResults: ItemResult[] = [];

    try {
      while (true) {
        if (cancelRef.current) break;

        const data = await fillMutation.mutateAsync({
          overwrite,
          offset,
          batchSize: BATCH_SIZE,
        });

        // First batch tells us the total
        if (offset === 0) {
          totalToFill = data.totalToFill;
        }

        succeeded += data.succeeded;
        failed += data.failed;
        skipped += data.skipped;
        allErrors.push(...data.errors);
        allResults.push(...data.results);

        const processedSoFar = offset + data.batchCount;

        setRunState({
          totalToFill,
          processedSoFar,
          succeeded,
          failed,
          skipped,
          errors: allErrors.slice(0, 20),
          results: [...allResults],
          done: false,
        });

        // If this batch returned fewer items than batchSize, we're done
        if (data.batchCount < BATCH_SIZE || processedSoFar >= totalToFill) {
          break;
        }

        offset += BATCH_SIZE;
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message ?? "Unknown error"}`);
    }

    setIsRunning(false);
    cancelRef.current = false;

    setRunState((prev) => {
      if (!prev) return null;
      const finalState = { ...prev, done: true };
      if (finalState.failed === 0) {
        toast.success(`AI fill complete — ${finalState.succeeded} items updated, ${finalState.skipped} skipped.`);
      } else {
        toast.warning(`AI fill done — ${finalState.succeeded} updated, ${finalState.failed} failed, ${finalState.skipped} skipped.`);
      }
      return finalState;
    });
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setIsRunning(false);
    toast.info("Cancelling after current batch completes…");
  };

  const handleReset = () => {
    setRunState(null);
    setConfirmed(false);
    setIsRunning(false);
    cancelRef.current = false;
  };

  const progressPct = runState && runState.totalToFill > 0
    ? Math.round((runState.processedSoFar / runState.totalToFill) * 100)
    : 0;

  const successRate = runState && runState.processedSoFar > 0
    ? Math.round((runState.succeeded / runState.processedSoFar) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0f1e] pt-24 pb-16">
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-orange-400" />
          <h1 className="text-4xl font-bold text-white font-[Oswald]">
            AI Auto-Fill All Products
          </h1>
        </div>
        <p className="text-white/60 mb-8 ml-11">
          Automatically fills in missing descriptions, technical specs, and rental pricing
          for all products using AI. Processes items in small batches to stay fast and reliable.
        </p>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-[#111827] border-white/10 p-4 text-center">
            <div className="text-3xl font-bold text-white font-[Oswald]">272</div>
            <div className="text-white/50 text-sm mt-1">Total Products</div>
          </Card>
          <Card className="bg-[#111827] border-white/10 p-4 text-center">
            <div className="text-3xl font-bold text-orange-400 font-[Oswald]">~266</div>
            <div className="text-white/50 text-sm mt-1">Need Filling</div>
          </Card>
          <Card className="bg-[#111827] border-white/10 p-4 text-center">
            <div className="text-3xl font-bold text-green-400 font-[Oswald]">10</div>
            <div className="text-white/50 text-sm mt-1">Items per Batch</div>
          </Card>
        </div>

        {/* Control panel */}
        <Card className="bg-[#111827] border-orange-500/20 p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            Run Settings
          </h2>

          {/* Overwrite toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg mb-4">
            <div>
              <Label className="text-white font-medium">Overwrite existing data</Label>
              <p className="text-white/50 text-sm mt-0.5">
                When off (default), only fills items missing description, specs, or pricing.
                When on, re-fills every item including those already complete.
              </p>
            </div>
            <Switch
              checked={overwrite}
              onCheckedChange={setOverwrite}
              disabled={isRunning}
              className="ml-4 flex-shrink-0"
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-200/90 text-sm">
                {overwrite
                  ? "Overwrite mode is ON — all 272 products will be re-filled. This will replace existing descriptions and pricing."
                  : "This will fill the ~266 products missing descriptions, specs, or pricing. Existing data will not be touched."}
                {" "}Runs in batches of 10 — keep this tab open until complete.
              </p>
            </div>
          </div>

          {/* Confirm / Start button */}
          {!isRunning && !runState && (
            <div className="flex gap-3">
              {confirmed ? (
                <>
                  <Button
                    onClick={handleStart}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Yes, Start AI Fill
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmed(false)}
                    className="border-white/20 text-white/70 hover:text-white"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleStart}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {overwrite ? "Re-Fill All 272 Products" : "Fill ~266 Products"}
                </Button>
              )}
            </div>
          )}

          {/* Running state with live progress */}
          {isRunning && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-blue-300 font-medium">
                    AI is working — batch {runState ? Math.ceil(runState.processedSoFar / BATCH_SIZE) : 1} of {runState ? Math.ceil(runState.totalToFill / BATCH_SIZE) : "…"}
                  </p>
                  <p className="text-blue-200/60 text-sm mt-0.5">
                    {runState ? `${runState.processedSoFar} / ${runState.totalToFill} items processed` : "Starting first batch…"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-shrink-0"
                >
                  Stop
                </Button>
              </div>

              {/* Live progress bar */}
              {runState && (
                <div>
                  <div className="flex justify-between text-xs text-white/50 mb-1">
                    <span>{progressPct}% complete</span>
                    <span>{runState.succeeded} updated · {runState.failed} failed · {runState.skipped} skipped</span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Results */}
        {runState && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-3">
              <Card className="bg-[#111827] border-white/10 p-4 text-center">
                <div className="text-2xl font-bold text-white font-[Oswald]">{runState.processedSoFar}</div>
                <div className="text-white/50 text-xs mt-1">Processed</div>
              </Card>
              <Card className="bg-[#111827] border-green-500/20 p-4 text-center">
                <div className="text-2xl font-bold text-green-400 font-[Oswald]">{runState.succeeded}</div>
                <div className="text-white/50 text-xs mt-1">Updated</div>
              </Card>
              <Card className="bg-[#111827] border-yellow-500/20 p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400 font-[Oswald]">{runState.skipped}</div>
                <div className="text-white/50 text-xs mt-1">Skipped</div>
              </Card>
              <Card className="bg-[#111827] border-red-500/20 p-4 text-center">
                <div className="text-2xl font-bold text-red-400 font-[Oswald]">{runState.failed}</div>
                <div className="text-white/50 text-xs mt-1">Failed</div>
              </Card>
            </div>

            {/* Success rate bar */}
            {runState.processedSoFar > 0 && (
              <Card className="bg-[#111827] border-white/10 p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/70">Success rate</span>
                  <span className="text-white font-bold">{successRate}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all"
                    style={{ width: `${successRate}%` }}
                  />
                </div>
              </Card>
            )}

            {/* Error list */}
            {runState.errors.length > 0 && (
              <Card className="bg-[#111827] border-red-500/20 p-4">
                <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Errors ({runState.errors.length})
                </h3>
                <ul className="space-y-1">
                  {runState.errors.map((err, i) => (
                    <li key={i} className="text-red-300/80 text-sm font-mono bg-red-500/5 px-3 py-1.5 rounded">
                      {err}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Item log */}
            <Card className="bg-[#111827] border-white/10 p-4">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Item Log ({runState.results.length} items{isRunning ? ", live…" : ""})
              </h3>
              <div className="max-h-96 overflow-y-auto space-y-1 pr-1">
                {runState.results.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                      item.status === "ok"
                        ? "bg-green-500/5 border border-green-500/10"
                        : item.status === "error"
                        ? "bg-red-500/5 border border-red-500/10"
                        : "bg-white/3 border border-white/5"
                    }`}
                  >
                    {item.status === "ok" && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                    {item.status === "error" && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                    {item.status === "skip" && <SkipForward className="w-3.5 h-3.5 text-yellow-400/60 flex-shrink-0" />}
                    <span className={`flex-1 truncate ${item.status === "ok" ? "text-white/80" : item.status === "error" ? "text-red-300/80" : "text-white/40"}`}>
                      {item.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs flex-shrink-0 ${
                        item.status === "ok"
                          ? "border-green-500/30 text-green-400"
                          : item.status === "error"
                          ? "border-red-500/30 text-red-400"
                          : "border-white/10 text-white/30"
                      }`}
                    >
                      {item.status === "ok" ? "Updated" : item.status === "skip" ? "No brand/model" : "Error"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Run again button (only when done) */}
            {!isRunning && (
              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-white/20 text-white/70 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Again
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
