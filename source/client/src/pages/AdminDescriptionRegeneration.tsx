import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2, CheckCircle, Languages, RefreshCw, HardDrive, Github, CloudUpload } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AdminDescriptionRegeneration() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Backup state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupTarget, setBackupTarget] = useState<"both" | "drive" | "github">("both");
  const [backupResult, setBackupResult] = useState<any>(null);

  // Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateResult, setTranslateResult] = useState<any>(null);
  const [translateTarget, setTranslateTarget] = useState<"all" | "equipment" | "consumables" | "bundles">("all");
  const [overwrite, setOverwrite] = useState(false);
  const [batchSize, setBatchSize] = useState(5);
  const [offset, setOffset] = useState(0);

  const backupMutation = trpc.admin.runBackupNow.useMutation({
    onSuccess: (data) => {
      setBackupResult(data);
      setIsBackingUp(false);
      if (data.success) {
        toast.success("Backup completed successfully!");
      } else {
        toast.error("Backup completed with errors — check results below.");
      }
    },
    onError: (error) => {
      setIsBackingUp(false);
      toast.error(`Backup failed: ${error.message}`);
    },
  });

  const handleRunBackup = () => {
    setIsBackingUp(true);
    setBackupResult(null);
    backupMutation.mutate({ target: backupTarget });
  };

  const regenerateMutation = trpc.admin.regenerateDescriptions.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setIsRunning(false);
      if (data.success) {
        toast.success(`Successfully updated ${data.updated} descriptions!`);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      setIsRunning(false);
      toast.error(`Error: ${error.message}`);
    },
  });

  const translateMutation = trpc.admin.translateAll.useMutation({
    onSuccess: (data) => {
      setTranslateResult(data);
      setIsTranslating(false);
      if (data.succeeded > 0) {
        toast.success(`Translated ${data.succeeded} item(s) to Chinese!`);
        // Auto-advance offset for next batch
        if (data.batchCount === batchSize && data.totalToFill > offset + batchSize) {
          setOffset((prev) => prev + batchSize);
        }
      } else {
        toast.info("No items needed translation in this batch.");
      }
    },
    onError: (error) => {
      setIsTranslating(false);
      toast.error(`Translation error: ${error.message}`);
    },
  });

  const handleRegenerate = () => {
    if (window.confirm("This will regenerate descriptions for all equipment items. Continue?")) {
      setIsRunning(true);
      setResult(null);
      regenerateMutation.mutate();
    }
  };

  const handleTranslateAll = () => {
    setIsTranslating(true);
    setTranslateResult(null);
    translateMutation.mutate({
      target: translateTarget,
      overwrite,
      batchSize,
      offset,
    });
  };

  const handleTranslateNext = () => {
    setIsTranslating(true);
    translateMutation.mutate({
      target: translateTarget,
      overwrite,
      batchSize,
      offset,
    });
  };

  return (
    <div className="min-h-screen bg-navy-deep pt-24 pb-16">
      <div className="container max-w-2xl space-y-8">

        {/* ── Section 1: Translate to Chinese ── */}
        <div>
          <h1 className="text-4xl font-bold text-white font-[Oswald] mb-2 flex items-center gap-3">
            <Languages className="w-8 h-8 text-orange" />
            Translate to Chinese (繁體中文)
          </h1>
          <p className="text-cream/70 mb-6">
            Auto-generate Traditional Chinese (zh-HK) names and descriptions for all equipment, consumables, and bundles using AI. Only items without existing Chinese text are translated by default.
          </p>

          <Card className="bg-navy-light border-orange/20 p-6 mb-4">
            <div className="space-y-5">
              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-cream/60 uppercase tracking-wider">Target</Label>
                  <Select value={translateTarget} onValueChange={(v: any) => { setTranslateTarget(v); setOffset(0); setTranslateResult(null); }}>
                    <SelectTrigger className="bg-navy-deep border-white/10 text-cream">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (Equipment + Consumables + Bundles)</SelectItem>
                      <SelectItem value="equipment">Equipment Only</SelectItem>
                      <SelectItem value="consumables">Consumables Only</SelectItem>
                      <SelectItem value="bundles">Bundles Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-cream/60 uppercase tracking-wider">Batch Size (per run)</Label>
                  <Select value={batchSize.toString()} onValueChange={(v) => setBatchSize(parseInt(v))}>
                    <SelectTrigger className="bg-navy-deep border-white/10 text-cream">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 items</SelectItem>
                      <SelectItem value="5">5 items</SelectItem>
                      <SelectItem value="10">10 items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={overwrite} onCheckedChange={(v) => { setOverwrite(v); setOffset(0); setTranslateResult(null); }} />
                <div>
                  <Label className="text-sm text-cream">Overwrite existing translations</Label>
                  <p className="text-xs text-cream/40">Off = only translate items missing Chinese text (recommended)</p>
                </div>
              </div>

              {/* Status */}
              {isTranslating && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-blue-300">Translating...</h3>
                    <p className="text-blue-200/80 text-sm">
                      Sending items to AI for Traditional Chinese translation. This may take 10–30 seconds per batch.
                    </p>
                  </div>
                </div>
              )}

              {/* Results */}
              {translateResult && (
                <div className="rounded-lg p-4 border bg-green-500/10 border-green-500/30 space-y-3">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-green-300 mb-1">Batch Complete</h3>
                      <div className="text-sm space-y-0.5 text-cream/70">
                        <p><span className="text-green-300 font-semibold">{translateResult.succeeded}</span> translated successfully</p>
                        {translateResult.failed > 0 && <p><span className="text-red-300 font-semibold">{translateResult.failed}</span> failed</p>}
                        <p>Items still needing translation: <span className="text-orange font-semibold">{Math.max(0, translateResult.totalToFill - offset - translateResult.batchCount)}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Sample results */}
                  {translateResult.results?.length > 0 && (
                    <div className="bg-navy-deep rounded-lg p-3 border border-white/10 max-h-48 overflow-y-auto space-y-2">
                      {translateResult.results.map((r: any) => (
                        <div key={`${r.table}-${r.id}`} className={`text-xs pb-2 border-b border-white/5 last:border-0 ${r.status === "error" ? "text-red-300" : "text-cream/70"}`}>
                          <span className="font-semibold text-cream">{r.name}</span>
                          {r.nameZh && <span className="ml-2 text-orange">→ {r.nameZh}</span>}
                          {r.error && <span className="ml-2 text-red-400">Error: {r.error}</span>}
                          <span className="ml-2 text-cream/30 capitalize">[{r.table}]</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleTranslateAll}
                  disabled={isTranslating}
                  className="flex-1 bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider h-11 gap-2"
                >
                  {isTranslating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Translating...</>
                  ) : (
                    <><Languages className="w-4 h-4" /> Translate Batch (offset: {offset})</>
                  )}
                </Button>
                {translateResult && translateResult.totalToFill > offset + batchSize && (
                  <Button
                    onClick={handleTranslateNext}
                    disabled={isTranslating}
                    variant="outline"
                    className="border-orange/40 text-orange hover:bg-orange/10 font-[Oswald] uppercase tracking-wider h-11 gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Next Batch
                  </Button>
                )}
                {offset > 0 && (
                  <Button
                    onClick={() => { setOffset(0); setTranslateResult(null); }}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-cream/50 hover:text-cream h-11"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-navy-light border-orange/20 p-5">
            <h3 className="font-bold text-orange mb-3 text-sm">How translation works:</h3>
            <ul className="space-y-1.5 text-cream/70 text-sm">
              <li>✓ AI translates each item name and description to Traditional Chinese (zh-HK)</li>
              <li>✓ New items added via admin forms are auto-translated immediately on save</li>
              <li>✓ Use this tool to backfill existing inventory in batches</li>
              <li>✓ Chinese text appears on the site when users switch to 中文 mode</li>
              <li>✓ You can manually edit Chinese fields in any item's edit form</li>
            </ul>
          </Card>
        </div>

        {/* ── Section 3: Run Backup Now ── */}
        <div>
          <h2 className="text-3xl font-bold text-white font-[Oswald] mb-2 flex items-center gap-3">
            <CloudUpload className="w-7 h-7 text-orange" />
            Run Backup Now
          </h2>
          <p className="text-cream/70 mb-6">
            Manually trigger a backup of the EquipHK codebase and database. Backups run automatically every Sunday (Google Drive) and on the 1st of each month (GitHub), but you can run one on demand here.
          </p>

          <Card className="bg-navy-light border-orange/20 p-6 mb-4">
            <div className="space-y-5">
              {/* Target selector */}
              <div className="space-y-1.5">
                <Label className="text-xs text-cream/60 uppercase tracking-wider">Backup Destination</Label>
                <Select value={backupTarget} onValueChange={(v: any) => { setBackupTarget(v); setBackupResult(null); }}>
                  <SelectTrigger className="bg-navy-deep border-white/10 text-cream">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both (Google Drive + GitHub)</SelectItem>
                    <SelectItem value="drive">Google Drive Only</SelectItem>
                    <SelectItem value="github">GitHub Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Destination info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-navy-deep rounded-lg p-3 border border-white/10 flex items-start gap-2">
                  <HardDrive className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-cream">Google Drive</p>
                    <p className="text-xs text-cream/50">EquipHK Backups folder — code ZIP + DB dump</p>
                  </div>
                </div>
                <div className="bg-navy-deep rounded-lg p-3 border border-white/10 flex items-start gap-2">
                  <Github className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-cream">GitHub</p>
                    <p className="text-xs text-cream/50">EquipHK/Equip-HK---backup- — code + DB commit</p>
                  </div>
                </div>
              </div>

              {/* Running state */}
              {isBackingUp && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-blue-300">Backup in progress...</h3>
                    <p className="text-blue-200/80 text-sm">Exporting database and zipping code. This may take 1–2 minutes.</p>
                  </div>
                </div>
              )}

              {/* Results */}
              {backupResult && (
                <div className={`rounded-lg p-4 border ${backupResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                  <div className="flex gap-3">
                    <CheckCircle className={`w-5 h-5 ${backupResult.success ? 'text-green-400' : 'text-yellow-400'} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 space-y-2">
                      <h3 className={`font-bold ${backupResult.success ? 'text-green-300' : 'text-yellow-300'}`}>
                        {backupResult.success ? 'Backup Complete' : 'Backup Completed with Errors'}
                      </h3>
                      {backupResult.results?.drive && (
                        <div className="text-sm">
                          <span className="text-cream/50">Google Drive: </span>
                          {backupResult.results.drive.success
                            ? <span className="text-green-300">✓ Uploaded successfully</span>
                            : <span className="text-red-300">✗ {backupResult.results.drive.error}</span>}
                        </div>
                      )}
                      {backupResult.results?.github && (
                        <div className="text-sm">
                          <span className="text-cream/50">GitHub: </span>
                          {backupResult.results.github.success
                            ? <span className="text-green-300">✓ Pushed commit {backupResult.results.github.commitSha?.slice(0, 7)}</span>
                            : <span className="text-red-300">✗ {backupResult.results.github.error}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action button */}
              <Button
                onClick={handleRunBackup}
                disabled={isBackingUp}
                className="w-full bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider h-12 text-lg gap-2"
              >
                {isBackingUp ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Backing Up...</>
                ) : (
                  <><CloudUpload className="w-5 h-5" /> Run Backup Now</>
                )}
              </Button>
            </div>
          </Card>

          <Card className="bg-navy-light border-orange/20 p-5">
            <h3 className="font-bold text-orange mb-3 text-sm">Backup schedule:</h3>
            <ul className="space-y-1.5 text-cream/70 text-sm">
              <li>✓ Google Drive — every Sunday at 02:00 HKT (code ZIP + DB dump)</li>
              <li>✓ GitHub — 1st of each month at 03:00 HKT (code ZIP + DB dump)</li>
              <li>✓ Manus checkpoints — on demand via the Management UI</li>
              <li>✓ Last 6 months of Drive backups are kept automatically</li>
            </ul>
          </Card>
        </div>

        {/* ── Section 2: Regenerate English Descriptions ── */}
        <div>
          <h2 className="text-3xl font-bold text-white font-[Oswald] mb-2">
            Regenerate English Descriptions
          </h2>
          <p className="text-cream/70 mb-6">
            Regenerate unique, AI-powered descriptions for all equipment items with mixed tone (technical for B2B, casual for DIY).
          </p>

          <Card className="bg-navy-light border-orange/20 p-8 mb-8">
            <div className="space-y-6">
              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-yellow-300 mb-1">Important</h3>
                  <p className="text-yellow-200/80 text-sm">
                    This process will replace all current descriptions with AI-generated unique ones. This may take 1-2 minutes depending on the number of items.
                  </p>
                </div>
              </div>

              {/* Status */}
              {isRunning && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-blue-300">Processing...</h3>
                    <p className="text-blue-200/80 text-sm">
                      Generating unique descriptions for all equipment items. This may take a few minutes.
                    </p>
                  </div>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className={`rounded-lg p-4 border ${result.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex gap-3">
                    <CheckCircle className={`w-5 h-5 ${result.success ? 'text-green-400' : 'text-red-400'} flex-shrink-0 mt-0.5`} />
                    <div>
                      <h3 className={`font-bold ${result.success ? 'text-green-300' : 'text-red-300'} mb-1`}>
                        {result.success ? 'Success!' : 'Error'}
                      </h3>
                      <p className={`${result.success ? 'text-green-200/80' : 'text-red-200/80'} text-sm mb-3`}>
                        {result.message}
                      </p>
                      {result.updated !== undefined && (
                        <div className="text-sm space-y-1">
                          <p className="text-cream/70">
                            <span className="font-semibold text-green-300">{result.updated}</span> items updated
                          </p>
                          {result.failed > 0 && (
                            <p className="text-cream/70">
                              <span className="font-semibold text-yellow-300">{result.failed}</span> items failed
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sample Results */}
              {result?.results && result.results.length > 0 && (
                <div className="bg-navy-deep rounded-lg p-4 border border-orange/20">
                  <h3 className="font-bold text-orange mb-4">Sample Updated Descriptions:</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {result.results.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="pb-4 border-b border-cream/10 last:border-b-0">
                        <p className="font-semibold text-cream mb-2">{item.name}</p>
                        <p className="text-cream/70 text-sm italic">"{item.description}"</p>
                      </div>
                    ))}
                  </div>
                  {result.results.length > 5 && (
                    <p className="text-cream/50 text-xs mt-3">
                      ... and {result.results.length - 5} more items
                    </p>
                  )}
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={handleRegenerate}
                disabled={isRunning}
                className="w-full bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider h-12 text-lg gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Regenerate All Descriptions'
                )}
              </Button>
            </div>
          </Card>

          {/* Info */}
          <Card className="bg-navy-light border-orange/20 p-6">
            <h3 className="font-bold text-orange mb-3">How it works:</h3>
            <ul className="space-y-2 text-cream/70 text-sm">
              <li>✓ Analyzes each equipment type and category</li>
              <li>✓ Generates unique descriptions with mixed tone</li>
              <li>✓ Technical focus for B2B equipment (scaffolding, hydraulics, etc.)</li>
              <li>✓ Casual/friendly tone for DIY equipment (power tools, etc.)</li>
              <li>✓ Includes practical benefits and use cases</li>
              <li>✓ Avoids generic/repetitive phrases</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
