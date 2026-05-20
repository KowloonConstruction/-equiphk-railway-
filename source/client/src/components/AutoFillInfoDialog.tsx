/*
 * AutoFillInfoDialog — AI-powered product info sourcing for admin equipment form
 * Uses brand + model to source description, specs, and recommended HKD rental pricing
 * Shows a preview panel with per-field accept/reject before applying to the form
 */
import { useState } from "react";
import { Sparkles, Check, X, Loader2, ChevronRight, DollarSign, FileText, Wrench, Tag } from "lucide-react";
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

interface AutoFillResult {
  description: string;
  specifications: string;
  suggestedDailyRate: number;
  suggestedWeeklyRate: number;
  suggestedMonthlyRate: number;
  categoryHint: string;
  keyFeatures: string[];
}

interface AutoFillInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: string;
  model: string;
  itemName?: string;
  onApply: (fields: Partial<{
    description: string;
    specs: string;
    dailyRate: string;
    weeklyRate: string;
    monthlyRate: string;
  }>) => void;
}

type FieldKey = "description" | "specs" | "dailyRate" | "weeklyRate" | "monthlyRate";

export default function AutoFillInfoDialog({
  open,
  onOpenChange,
  brand,
  model,
  itemName,
  onApply,
}: AutoFillInfoDialogProps) {
  const [result, setResult] = useState<AutoFillResult | null>(null);
  const [accepted, setAccepted] = useState<Record<FieldKey, boolean>>({
    description: true,
    specs: true,
    dailyRate: true,
    weeklyRate: true,
    monthlyRate: true,
  });

  const autoFillMut = trpc.equipment.autoFillInfo.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setResult(data.data as AutoFillResult);
        // Reset all to accepted by default
        setAccepted({ description: true, specs: true, dailyRate: true, weeklyRate: true, monthlyRate: true });
      } else {
        toast.error(`AI sourcing failed: ${(data as any).error ?? "Unknown error"}`);
      }
    },
    onError: (err) => {
      toast.error(`Failed: ${err.message}`);
    },
  });

  const handleSource = () => {
    if (!brand || !model) {
      toast.error("Brand and model number are required");
      return;
    }
    setResult(null);
    autoFillMut.mutate({ brand, model, itemName });
  };

  const handleApply = () => {
    if (!result) return;
    const fields: Partial<{ description: string; specs: string; dailyRate: string; weeklyRate: string; monthlyRate: string }> = {};
    if (accepted.description) fields.description = result.description;
    if (accepted.specs) fields.specs = result.specifications;
    if (accepted.dailyRate) fields.dailyRate = String(result.suggestedDailyRate);
    if (accepted.weeklyRate) fields.weeklyRate = String(result.suggestedWeeklyRate);
    if (accepted.monthlyRate) fields.monthlyRate = String(result.suggestedMonthlyRate);
    onApply(fields);
    toast.success("AI-sourced fields applied to the form");
    onOpenChange(false);
  };

  const toggleField = (key: FieldKey) => {
    setAccepted((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isLoading = autoFillMut.isPending;
  const acceptedCount = Object.values(accepted).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-navy-light border-white/10 text-cream max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Oswald] text-xl text-cream uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange" />
            AI Auto-Fill Product Info
          </DialogTitle>
          <DialogDescription className="text-cream/50 text-sm">
            {brand} {model}{itemName ? ` · ${itemName}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Source Button */}
        {!result && (
          <div className="space-y-4">
            <div className="bg-orange/5 border border-orange/20 rounded-lg p-4 text-sm text-cream/70">
              <p className="mb-1 font-semibold text-cream">What the AI will source:</p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-orange" /> Unique product description (HK construction/rental context)</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-orange" /> Technical specifications (power, weight, dimensions, capacity)</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-orange" /> Recommended HKD rental rates (daily / weekly / monthly)</li>
              </ul>
            </div>

            <Button
              onClick={handleSource}
              disabled={isLoading || !brand || !model}
              className="w-full bg-orange hover:bg-orange/90 text-navy font-bold rounded-none h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Researching {brand} {model}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Source Product Info with AI
                </>
              )}
            </Button>
          </div>
        )}

        {/* Results Preview */}
        {result && (
          <div className="space-y-3">
            <p className="text-xs text-cream/50 uppercase tracking-wider font-[Oswald]">
              Review & Select Fields to Apply
            </p>

            {/* Description */}
            <FieldCard
              icon={<FileText className="w-4 h-4" />}
              label="Description"
              value={result.description}
              accepted={accepted.description}
              onToggle={() => toggleField("description")}
            />

            {/* Specifications */}
            <FieldCard
              icon={<Wrench className="w-4 h-4" />}
              label="Specifications"
              value={result.specifications}
              accepted={accepted.specs}
              onToggle={() => toggleField("specs")}
            />

            {/* Key Features */}
            {result.keyFeatures?.length > 0 && (
              <div className="bg-navy-deep/40 border border-white/10 rounded-lg p-3">
                <p className="text-xs font-bold text-cream/50 uppercase tracking-wider mb-2 font-[Oswald]">Key Features (info only)</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.keyFeatures.map((f, i) => (
                    <span key={i} className="text-xs bg-orange/10 text-orange border border-orange/20 px-2 py-0.5 rounded">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className={`border rounded-lg p-3 transition-all ${accepted.dailyRate || accepted.weeklyRate || accepted.monthlyRate ? "border-orange/30 bg-orange/5" : "border-white/10 bg-navy-deep/40 opacity-60"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange" />
                  <p className="text-sm font-semibold text-cream">Recommended Rental Rates (HKD)</p>
                </div>
                <span className="text-xs text-cream/40">AI estimate · adjust as needed</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <PriceField label="Daily" value={result.suggestedDailyRate} accepted={accepted.dailyRate} onToggle={() => toggleField("dailyRate")} />
                <PriceField label="Weekly" value={result.suggestedWeeklyRate} accepted={accepted.weeklyRate} onToggle={() => toggleField("weeklyRate")} />
                <PriceField label="Monthly" value={result.suggestedMonthlyRate} accepted={accepted.monthlyRate} onToggle={() => toggleField("monthlyRate")} />
              </div>
            </div>

            {/* Category hint */}
            {result.categoryHint && (
              <div className="flex items-center gap-2 text-xs text-cream/40">
                <Tag className="w-3.5 h-3.5" />
                <span>Suggested category: <span className="text-orange">{result.categoryHint}</span> (apply manually if needed)</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setResult(null)}
                className="flex-1 border-white/20 text-cream hover:bg-white/10 rounded-none"
              >
                Re-source
              </Button>
              <Button
                onClick={handleApply}
                disabled={acceptedCount === 0}
                className="flex-1 bg-orange hover:bg-orange/90 text-navy font-bold rounded-none"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Apply {acceptedCount} Field{acceptedCount !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldCard({
  icon,
  label,
  value,
  accepted,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accepted: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all select-none ${
        accepted
          ? "border-orange/30 bg-orange/5"
          : "border-white/10 bg-navy-deep/40 opacity-60"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-orange">
          {icon}
          <span className="text-xs font-bold uppercase tracking-wider font-[Oswald] text-cream/70">{label}</span>
        </div>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${accepted ? "bg-orange text-navy" : "bg-white/10 text-cream/30"}`}>
          {accepted ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        </div>
      </div>
      <p className="text-cream/80 text-xs leading-relaxed line-clamp-3">{value}</p>
    </div>
  );
}

function PriceField({
  label,
  value,
  accepted,
  onToggle,
}: {
  label: string;
  value: number;
  accepted: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`border rounded p-2 text-center cursor-pointer transition-all select-none ${
        accepted ? "border-orange/40 bg-orange/10" : "border-white/10 opacity-50"
      }`}
      onClick={onToggle}
    >
      <p className="text-xs text-cream/50 mb-1">{label}</p>
      <p className="text-cream font-bold text-sm">HK${value.toLocaleString()}</p>
      <div className={`mt-1 mx-auto w-4 h-4 rounded-full flex items-center justify-center ${accepted ? "bg-orange text-navy" : "bg-white/10 text-cream/30"}`}>
        {accepted ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
      </div>
    </div>
  );
}
