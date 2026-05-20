/*
 * ManualUploadDialog — Admin component for uploading operation manuals per equipment item
 * Supports manual PDF upload AND AI auto-sourcing by brand + model number
 */
import { useRef, useState } from "react";
import { FileText, Upload, Trash2, Loader2, ExternalLink, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ManualUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentItemId: number;
  equipmentName: string;
  brand?: string;
  model?: string;
}

export default function ManualUploadDialog({
  open,
  onOpenChange,
  equipmentItemId,
  equipmentName,
  brand,
  model,
}: ManualUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoSourceResult, setAutoSourceResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const utils = trpc.useUtils();

  const { data: manuals, isLoading } = trpc.manuals.getByItem.useQuery(
    { equipmentItemId },
    { enabled: open && equipmentItemId > 0 }
  );

  const uploadMut = trpc.manuals.upload.useMutation({
    onSuccess: () => {
      utils.manuals.getByItem.invalidate({ equipmentItemId });
      toast.success("Manual uploaded successfully");
      setUploading(false);
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err.message}`);
      setUploading(false);
    },
  });

  const deleteMut = trpc.manuals.delete.useMutation({
    onSuccess: () => {
      utils.manuals.getByItem.invalidate({ equipmentItemId });
      toast.success("Manual deleted");
    },
    onError: (err) => {
      toast.error(`Delete failed: ${err.message}`);
    },
  });

  const autoSourceMut = trpc.manuals.autoSource.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        utils.manuals.getByItem.invalidate({ equipmentItemId });
        setAutoSourceResult({ success: true, message: `Manual found and saved: ${data.fileName}` });
        toast.success("Manual auto-sourced successfully!");
      } else {
        setAutoSourceResult({ success: false, message: data.reason ?? "Manual not found" });
        toast.error(`Auto-source: ${data.reason ?? "Manual not found"}`);
      }
    },
    onError: (err) => {
      setAutoSourceResult({ success: false, message: err.message });
      toast.error(`Auto-source failed: ${err.message}`);
    },
  });

  const handleAutoSource = () => {
    if (!brand || !model) {
      toast.error("Brand and model number are required for auto-sourcing");
      return;
    }
    setAutoSourceResult(null);
    autoSourceMut.mutate({ equipmentItemId, brand, model, itemName: equipmentName });
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.includes("pdf")) {
      toast.error("Only PDF files are supported");
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      toast.error("File must be under 16 MB");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadMut.mutate({
        equipmentItemId,
        fileName: file.name,
        fileBase64: base64,
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const canAutoSource = !!(brand && model);
  const isAutoSourcing = autoSourceMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-navy-light border-white/10 text-cream">
        <DialogHeader>
          <DialogTitle className="font-[Oswald] text-xl text-cream uppercase tracking-wide">
            Operation Manuals
          </DialogTitle>
          <DialogDescription className="text-cream/50 text-sm">
            {equipmentName}
            {brand && model && (
              <span className="ml-2 text-orange/70">· {brand} {model}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* AI Auto-Source Section */}
        <div className="border border-orange/20 rounded-lg p-4 bg-orange/5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-orange shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-cream text-sm font-semibold mb-1">AI Auto-Source Manual</p>
              <p className="text-cream/50 text-xs mb-3">
                {canAutoSource
                  ? `Searches for the official ${brand} ${model} PDF manual and uploads it automatically.`
                  : "Set a brand and model number on this item to enable AI auto-sourcing."}
              </p>

              {autoSourceResult && (
                <div className={`flex items-start gap-2 text-xs mb-3 p-2 rounded ${
                  autoSourceResult.success
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {autoSourceResult.success
                    ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    : <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                  <span>{autoSourceResult.message}</span>
                </div>
              )}

              <Button
                size="sm"
                onClick={handleAutoSource}
                disabled={!canAutoSource || isAutoSourcing}
                className="bg-orange hover:bg-orange/90 text-navy font-bold rounded-none text-xs h-8"
              >
                {isAutoSourcing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Auto-Source Manual
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Manual Upload Zone */}
        <div>
          <p className="text-xs font-bold text-cream/50 uppercase tracking-wider mb-2 font-[Oswald]">
            Or Upload Manually
          </p>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-orange bg-orange/10"
                : "border-white/20 hover:border-orange/50 hover:bg-white/5"
            } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleInputChange}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 text-orange animate-spin" />
                <p className="text-cream/70 text-sm">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-7 h-7 text-orange/60" />
                <p className="text-cream/80 text-sm font-medium">Drop PDF here or click to browse</p>
                <p className="text-cream/40 text-xs">PDF only · Max 16 MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Existing Manuals */}
        <div>
          <p className="text-xs font-bold text-cream/50 uppercase tracking-wider mb-3 font-[Oswald]">
            Attached Manuals ({manuals?.length ?? 0})
          </p>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-orange animate-spin" />
            </div>
          ) : manuals && manuals.length > 0 ? (
            <div className="space-y-2">
              {manuals.map((manual: any) => (
                <div
                  key={manual.id}
                  className="flex items-center gap-3 bg-navy-deep/50 border border-white/10 rounded-lg px-4 py-3"
                >
                  <FileText className="w-5 h-5 text-orange shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-cream text-sm truncate">{manual.fileName}</p>
                    {manual.fileSize && (
                      <p className="text-cream/40 text-xs">
                        {(manual.fileSize / 1024 / 1024).toFixed(1)} MB
                      </p>
                    )}
                  </div>
                  <a
                    href={manual.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cream/40 hover:text-orange transition-colors"
                    title="Open PDF"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${manual.fileName}"?`)) {
                        deleteMut.mutate({ id: manual.id });
                      }
                    }}
                    className="text-cream/40 hover:text-red-400 transition-colors"
                    title="Delete manual"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cream/40 text-sm text-center py-4">
              No manuals attached yet.
            </p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/20 text-cream hover:bg-white/10 rounded-none"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
