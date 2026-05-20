/*
 * Bulk Import Dialog Component
 * Allows admins to upload Excel files and bulk import equipment with AI-generated images
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkImportDialog({ open, onOpenChange, onSuccess }: BulkImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    failed: number;
    errors: string[];
    message: string;
  } | null>(null);

  const bulkImportMutation = trpc.equipment.bulkImport.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Please select an Excel file (.xlsx or .xls)");
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setIsImporting(true);
    setProgress(0);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(",")[1];
          setProgress(30);

          // Call bulk import mutation
          const result = await bulkImportMutation.mutateAsync({
            excelBase64: base64,
            categoryId: 1,
          });

          setProgress(100);
          setImportResult(result);

          if (result.success) {
            toast.success(`✓ Imported ${result.imported} equipment items with AI-generated images!`);
            onSuccess?.();
            setTimeout(() => {
              onOpenChange(false);
              setSelectedFile(null);
              setImportResult(null);
            }, 2000);
          } else {
            toast.error(result.message);
          }
        } catch (error) {
          console.error("Import error:", error);
          toast.error("Import failed. Please try again.");
          setIsImporting(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Failed to read file");
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Import Equipment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!importResult ? (
            <>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 w-full"
                >
                  <Upload className="w-8 h-8 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">
                      {selectedFile ? selectedFile.name : "Click to select Excel file"}
                    </p>
                    <p className="text-sm text-slate-500">or drag and drop</p>
                  </div>
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                <p className="font-medium mb-1">What happens next:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Your Excel file will be parsed</li>
                  <li>AI will generate product images for each item</li>
                  <li>All items will be imported with images</li>
                  <li>Identical items will be stacked by quantity</li>
                </ul>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importing and generating images...</span>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              {importResult.success ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-medium text-emerald-900">{importResult.message}</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    {importResult.imported} items imported successfully
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">{importResult.message}</p>
                      {importResult.errors.length > 0 && (
                        <ul className="text-sm text-red-700 mt-2 space-y-1">
                          {importResult.errors.slice(0, 3).map((err, i) => (
                            <li key={i}>• {err}</li>
                          ))}
                          {importResult.errors.length > 3 && (
                            <li>• ... and {importResult.errors.length - 3} more errors</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {importResult ? "Close" : "Cancel"}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Equipment"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
