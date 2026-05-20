/**
 * Equip.HK Admin Export
 * Enhanced CSV export with column selection, filters, and multi-type support
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Package,
  CheckCircle,
  ShoppingBag,
  Layers,
  Filter,
  Columns,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-logo_22cf3871.png";

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCSV(rows: Record<string, any>[], columns: string[], filename: string) {
  const headerLabels: Record<string, string> = {
    id: "ID", name: "Name", brand: "Brand", model: "Model",
    category: "Category", subCategory: "Sub-Category",
    dailyRate: "Daily Rate (HKD)", weeklyRate: "Weekly Rate (HKD)", monthlyRate: "Monthly Rate (HKD)",
    availability: "Availability", condition: "Condition",
    quantity: "Quantity", availableQty: "Available Qty",
    includes: "What's Included", description: "Description", specs: "Specifications",
    isActive: "Active", isReviewed: "Reviewed", imageUrl: "Image URL",
    // Bundles
    categoryTag: "Category Tag", isFeatured: "Featured",
    // Consumables
    unitPrice: "Unit Price (HKD)", unit: "Unit", stockQty: "Stock Qty",
  };

  const headers = columns.map(c => headerLabels[c] ?? c);
  const csvRows = rows.map(row => columns.map(col => escapeCSV(row[col])).join(","));
  const csv = [headers.map(escapeCSV).join(","), ...csvRows].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Column definitions per export type ─────────────────────────────────────

const EQUIPMENT_COLUMNS: { key: string; label: string; default: boolean }[] = [
  { key: "id", label: "ID", default: false },
  { key: "name", label: "Name", default: true },
  { key: "brand", label: "Brand", default: true },
  { key: "model", label: "Model", default: true },
  { key: "category", label: "Category", default: true },
  { key: "subCategory", label: "Sub-Category", default: true },
  { key: "dailyRate", label: "Daily Rate (HKD)", default: true },
  { key: "weeklyRate", label: "Weekly Rate (HKD)", default: true },
  { key: "monthlyRate", label: "Monthly Rate (HKD)", default: false },
  { key: "availability", label: "Availability", default: true },
  { key: "condition", label: "Condition", default: true },
  { key: "quantity", label: "Quantity", default: true },
  { key: "availableQty", label: "Available Qty", default: true },
  { key: "includes", label: "What's Included", default: true },
  { key: "description", label: "Description", default: false },
  { key: "specs", label: "Specifications", default: false },
  { key: "isActive", label: "Active", default: true },
  { key: "isReviewed", label: "Reviewed", default: false },
  { key: "imageUrl", label: "Image URL", default: false },
];

const BUNDLE_COLUMNS: { key: string; label: string; default: boolean }[] = [
  { key: "id", label: "ID", default: false },
  { key: "name", label: "Name", default: true },
  { key: "description", label: "Description", default: false },
  { key: "dailyRate", label: "Daily Rate (HKD)", default: true },
  { key: "weeklyRate", label: "Weekly Rate (HKD)", default: true },
  { key: "monthlyRate", label: "Monthly Rate (HKD)", default: true },
  { key: "categoryTag", label: "Category Tag", default: true },
  { key: "isActive", label: "Active", default: true },
  { key: "isFeatured", label: "Featured", default: true },
  { key: "imageUrl", label: "Image URL", default: false },
];

const CONSUMABLE_COLUMNS: { key: string; label: string; default: boolean }[] = [
  { key: "id", label: "ID", default: false },
  { key: "name", label: "Name", default: true },
  { key: "brand", label: "Brand", default: true },
  { key: "description", label: "Description", default: false },
  { key: "unitPrice", label: "Unit Price (HKD)", default: true },
  { key: "unit", label: "Unit", default: true },
  { key: "categoryTag", label: "Category Tag", default: true },
  { key: "stockQty", label: "Stock Qty", default: true },
  { key: "isActive", label: "Active", default: true },
  { key: "imageUrl", label: "Image URL", default: false },
];

type ExportType = "equipment" | "bundles" | "consumables";

export default function AdminExport() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Export type
  const [exportType, setExportType] = useState<ExportType>("equipment");

  // Equipment filters
  const [activeOnly, setActiveOnly] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");

  // Column selection
  const [showColumns, setShowColumns] = useState(false);
  const [selectedCols, setSelectedCols] = useState<Record<string, Record<string, boolean>>>({
    equipment: Object.fromEntries(EQUIPMENT_COLUMNS.map(c => [c.key, c.default])),
    bundles: Object.fromEntries(BUNDLE_COLUMNS.map(c => [c.key, c.default])),
    consumables: Object.fromEntries(CONSUMABLE_COLUMNS.map(c => [c.key, c.default])),
  });

  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  // Queries
  const categoriesQ = trpc.subCategories.listWithCategories.useQuery();
  const inventoryQ = trpc.export.inventory.useQuery(
    { activeOnly, categoryId, availabilityFilter },
    { enabled: false }
  );
  const bundlesQ = trpc.export.bundles.useQuery(undefined, { enabled: false });
  const consumablesQ = trpc.export.consumables.useQuery(undefined, { enabled: false });

  const categories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);

  const currentCols = exportType === "equipment"
    ? EQUIPMENT_COLUMNS
    : exportType === "bundles"
    ? BUNDLE_COLUMNS
    : CONSUMABLE_COLUMNS;

  const activeCols = currentCols.filter(c => selectedCols[exportType][c.key]);

  const toggleCol = (key: string) => {
    setSelectedCols(prev => ({
      ...prev,
      [exportType]: { ...prev[exportType], [key]: !prev[exportType][key] },
    }));
  };

  const selectAll = () => {
    setSelectedCols(prev => ({
      ...prev,
      [exportType]: Object.fromEntries(currentCols.map(c => [c.key, true])),
    }));
  };

  const selectDefault = () => {
    setSelectedCols(prev => ({
      ...prev,
      [exportType]: Object.fromEntries(currentCols.map(c => [c.key, c.default])),
    }));
  };

  const handleExport = async () => {
    setExporting(true);
    setExported(false);
    try {
      let data: any[] = [];
      if (exportType === "equipment") {
        const result = await inventoryQ.refetch();
        data = result.data ?? [];
      } else if (exportType === "bundles") {
        const result = await bundlesQ.refetch();
        data = result.data ?? [];
      } else {
        const result = await consumablesQ.refetch();
        data = result.data ?? [];
      }

      if (data.length === 0) {
        toast.error("No data to export with current filters");
        return;
      }

      const cols = activeCols.map(c => c.key);
      const date = new Date().toISOString().slice(0, 10);
      const filename = `equiphk-${exportType}-${date}.csv`;
      downloadCSV(data, cols, filename);

      setExported(true);
      toast.success(`Exported ${data.length} ${exportType} to ${filename}`);
    } catch (err: any) {
      toast.error("Export failed: " + (err.message ?? "Unknown error"));
    } finally {
      setExporting(false);
    }
  };

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
    <div className="min-h-screen bg-concrete pb-24 md:pb-8">
      {/* Top Bar */}
      <header className="bg-navy-deep text-cream sticky top-0 z-50 border-b border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/admin")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={LOGO_URL} alt="Equip.HK" className="h-8 w-auto" />
            </button>
            <div className="h-6 w-px bg-white/20" />
            <h1 className="font-[Oswald] uppercase tracking-wider text-sm text-orange">
              Export Data
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin")} className="border-white/20 text-cream hover:bg-white/10 text-xs">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Dashboard
          </Button>
        </div>
      </header>

      <div className="container py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-orange/10 rounded-2xl p-3">
            <FileSpreadsheet className="w-8 h-8 text-orange" />
          </div>
          <div>
            <h2 className="text-2xl font-[Oswald] uppercase text-navy-deep">Export Inventory</h2>
            <p className="text-sm text-muted-foreground">Download data as CSV — opens in Excel, Google Sheets, or Numbers.</p>
          </div>
        </div>

        {/* Export Type Tabs */}
        <div className="bg-white rounded-xl border mb-4 overflow-hidden">
          <div className="grid grid-cols-3 divide-x">
            {([
              { key: "equipment", label: "Equipment", icon: Package, count: null },
              { key: "bundles", label: "Bundles", icon: Layers, count: null },
              { key: "consumables", label: "Consumables", icon: ShoppingBag, count: null },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setExportType(key); setExported(false); }}
                className={`flex flex-col items-center gap-1 py-4 px-2 text-sm font-medium transition-colors ${
                  exportType === key
                    ? "bg-navy-deep text-cream"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-[Oswald] uppercase tracking-wider text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters — Equipment only */}
        {exportType === "equipment" && (
          <div className="bg-white rounded-xl border mb-4 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-navy-deep">
              <Filter className="w-4 h-4 text-orange" />
              Filters
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
              <select
                value={categoryId ?? ""}
                onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange/30"
              >
                <option value="">All Categories</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Availability</label>
              <div className="flex gap-2">
                {(["all", "available", "unavailable"] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setAvailabilityFilter(opt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                      availabilityFilter === opt
                        ? "bg-navy-deep text-cream border-navy-deep"
                        : "border-border text-muted-foreground hover:border-navy-deep/40"
                    }`}
                  >
                    {opt === "all" ? "All" : opt === "available" ? "Available" : "Unavailable"}
                  </button>
                ))}
              </div>
            </div>

            {/* Active only toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setActiveOnly(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${activeOnly ? "bg-orange" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${activeOnly ? "translate-x-5" : ""}`} />
              </div>
              <span className="text-sm text-navy-deep">Active items only</span>
            </label>
          </div>
        )}

        {/* Column Selection */}
        <div className="bg-white rounded-xl border mb-4 overflow-hidden">
          <button
            onClick={() => setShowColumns(v => !v)}
            className="w-full flex items-center justify-between p-4 text-sm font-medium text-navy-deep hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Columns className="w-4 h-4 text-orange" />
              <span>Columns to Export</span>
              <Badge variant="secondary" className="text-xs">{activeCols.length} selected</Badge>
            </div>
            {showColumns ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showColumns && (
            <div className="border-t p-4 space-y-3">
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-orange hover:underline">Select all</button>
                <span className="text-muted-foreground text-xs">·</span>
                <button onClick={selectDefault} className="text-xs text-orange hover:underline">Reset to default</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {currentCols.map(col => (
                  <label key={col.key} className="flex items-center gap-2 cursor-pointer select-none group">
                    <div
                      onClick={() => toggleCol(col.key)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedCols[exportType][col.key]
                          ? "bg-orange border-orange"
                          : "border-border group-hover:border-orange/50"
                      }`}
                    >
                      {selectedCols[exportType][col.key] && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-start gap-3">
            {exportType === "equipment" ? (
              <Package className="w-5 h-5 text-orange shrink-0 mt-0.5" />
            ) : exportType === "bundles" ? (
              <Layers className="w-5 h-5 text-orange shrink-0 mt-0.5" />
            ) : (
              <ShoppingBag className="w-5 h-5 text-orange shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium text-navy-deep capitalize">{exportType} Export</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeCols.length} column{activeCols.length !== 1 ? "s" : ""} selected
                {exportType === "equipment" && (
                  <>
                    {activeOnly ? " · Active items only" : ""}
                    {categoryId ? ` · Filtered by category` : ""}
                    {availabilityFilter !== "all" ? ` · ${availabilityFilter} only` : ""}
                  </>
                )}
              </p>
            </div>
          </div>

          <Button
            onClick={handleExport}
            disabled={exporting || activeCols.length === 0}
            className="w-full bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider"
            size="lg"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : exported ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Download Again
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </>
            )}
          </Button>

          {activeCols.length === 0 && (
            <p className="text-xs text-destructive text-center">Select at least one column to export.</p>
          )}

          {exported && (
            <p className="text-xs text-emerald-600 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Export complete! Check your downloads folder.
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Tip: Open the CSV in Excel and save as .xlsx for full spreadsheet features.
        </p>
      </div>
    </div>
  );
}
