/*
 * Equip.HK Admin Inventory Management
 * Full CRUD for equipment items and categories
 * Includes bulk re-categorise with row checkboxes + floating toolbar
 * Navy + orange brand styling
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  ArrowLeft,
  FolderOpen,
  BarChart3,
  Layers,
  Tag,
  CheckCircle,
  AlertTriangle,
  Wrench,
  XCircle,
  ImageIcon,
  Upload,
  FileText,
  Sparkles,
  Camera,
  ClipboardCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import ManualUploadDialog from "@/components/ManualUploadDialog";
import AutoFillInfoDialog from "@/components/AutoFillInfoDialog";
import AccessDenied from "@/components/AccessDenied";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-logo_22cf3871.png";

// ─── Availability badge helper ───────────────────────────────────────
function AvailabilityBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    available: {
      label: "Available",
      className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    rented: {
      label: "Rented",
      className: "bg-blue-500/15 text-blue-700 border-blue-500/30",
      icon: <Package className="w-3 h-3" />,
    },
    maintenance: {
      label: "Maintenance",
      className: "bg-amber-500/15 text-amber-700 border-amber-500/30",
      icon: <Wrench className="w-3 h-3" />,
    },
    retired: {
      label: "Retired",
      className: "bg-red-500/15 text-red-700 border-red-500/30",
      icon: <XCircle className="w-3 h-3" />,
    },
  };
  const c = config[status] ?? config.available;
  return (
    <Badge variant="outline" className={`gap-1 font-normal ${c.className}`}>
      {c.icon}
      {c.label}
    </Badge>
  );
}

// ─── Condition badge helper ──────────────────────────────────────────
function ConditionBadge({ condition }: { condition: string }) {
  const colors: Record<string, string> = {
    new: "bg-emerald-500/10 text-emerald-700",
    excellent: "bg-blue-500/10 text-blue-700",
    good: "bg-amber-500/10 text-amber-700",
    fair: "bg-orange-500/10 text-orange-700",
  };
  return (
    <Badge variant="outline" className={`font-normal capitalize ${colors[condition] ?? ""}`}>
      {condition}
    </Badge>
  );
}

// ─── Stats Card ──────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border p-4 flex items-center gap-4">
      <div className="h-10 w-10 rounded-lg bg-orange/10 flex items-center justify-center text-orange shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold font-[Oswald] text-navy-deep">{value}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

// ─── Category Form Dialog ────────────────────────────────────────────
function CategoryFormDialog({
  open,
  onOpenChange,
  editCategory,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editCategory?: any;
}) {
  const utils = trpc.useUtils();
  const createMut = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      utils.equipment.stats.invalidate();
      onOpenChange(false);
      toast.success("Category created");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMut = trpc.categories.update.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      onOpenChange(false);
      toast.success("Category updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const [name, setName] = useState(editCategory?.name ?? "");
  const [description, setDescription] = useState(editCategory?.description ?? "");
  const [segment, setSegment] = useState(editCategory?.segment ?? "both");
  const [sortOrder, setSortOrder] = useState(editCategory?.sortOrder?.toString() ?? "0");

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (editCategory) {
      updateMut.mutate({
        id: editCategory.id,
        name,
        slug,
        description: description || undefined,
        segment: segment as any,
        sortOrder: parseInt(sortOrder) || 0,
      });
    } else {
      createMut.mutate({
        name,
        slug,
        description: description || undefined,
        segment: segment as any,
        sortOrder: parseInt(sortOrder) || 0,
      });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[Oswald] uppercase tracking-wider">
            {editCategory ? "Edit Category" : "Add Category"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Power Tools" />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} disabled className="bg-muted text-muted-foreground font-data text-sm" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Segment</Label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both B2C & B2B</SelectItem>
                  <SelectItem value="b2c">B2C Only</SelectItem>
                  <SelectItem value="b2b">B2B Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-orange hover:bg-orange-dark text-white">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editCategory ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Equipment Form Dialog ───────────────────────────────────────────
function EquipmentFormDialog({
  open,
  onOpenChange,
  categories,
  editItem,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: any[];
  editItem?: any;
}) {
  const utils = trpc.useUtils();

  // Fetch sub-categories — re-fetched whenever categoryId changes
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(
    editItem?.categoryId ?? (categories[0]?.id ?? null)
  );
  const subCategoriesQ = trpc.subCategories.adminListAll.useQuery(
    activeCategoryId ? { categoryId: activeCategoryId } : undefined,
    { enabled: !!activeCategoryId }
  );

  const createMut = trpc.equipment.create.useMutation({
    onSuccess: () => {
      utils.equipment.list.invalidate();
      utils.equipment.stats.invalidate();
      onOpenChange(false);
      toast.success("Equipment added");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMut = trpc.equipment.update.useMutation({
    onSuccess: () => {
      utils.equipment.list.invalidate();
      utils.equipment.stats.invalidate();
      onOpenChange(false);
      toast.success("Equipment updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    categoryId: editItem?.categoryId?.toString() ?? (categories[0]?.id?.toString() ?? ""),
    subCategoryId: editItem?.subCategoryId?.toString() ?? "",
    name: editItem?.name ?? "",
    nameZh: (editItem as any)?.nameZh ?? "",
    description: editItem?.description ?? "",
    descriptionZh: (editItem as any)?.descriptionZh ?? "",
    brand: editItem?.brand ?? "",
    model: editItem?.model ?? "",
    dailyRate: editItem?.dailyRate ?? "",
    weeklyRate: editItem?.weeklyRate ?? "",
    monthlyRate: editItem?.monthlyRate ?? "",
    pricingType: editItem?.pricingType ?? "fixed",
    imageUrl: editItem?.imageUrl ?? "",
    specs: editItem?.specs ?? "",
    condition: editItem?.condition ?? "good",
    availability: editItem?.availability ?? "available",
    quantity: editItem?.quantity?.toString() ?? "1",
    availableQty: editItem?.availableQty?.toString() ?? "1",
    location: editItem?.location ?? "",
    isActive: editItem?.isActive ?? true,
    isFeatured: editItem?.isFeatured ?? false,
    isReviewed: editItem?.isReviewed ?? false,
    includes: (editItem as any)?.includes ?? "",
    fuelType: (editItem as any)?.fuelType ?? "none",
  });

  const set = (key: string, val: any) => setForm((prev) => {
    const next = { ...prev, [key]: val };
    // Auto-fill includes for battery-powered tools when name or model changes
    if (key === 'name' || key === 'model') {
      const nameVal = (key === 'name' ? val : prev.name) || '';
      const modelVal = (key === 'model' ? val : prev.model) || '';
      const combined = nameVal.toLowerCase() + ' ' + modelVal.toLowerCase();
      const isBatteryOrCharger = nameVal.toLowerCase().includes('battery') || nameVal.toLowerCase().includes('charger');
      const isMainsPowered = /240[Vv]|380[Vv]/.test(combined);
      if (!isBatteryOrCharger && !isMainsPowered) {
        if (/36[Vv]|80[Vv]/.test(combined)) {
          next.includes = '2x Batteries, 1x Charger';
        } else if (/18[Vv]/.test(combined)) {
          next.includes = '1x 18V Battery, 1x Charger';
        } else if (/12[Vv]|14[Vv]|20[Vv]|40[Vv]|54[Vv]|56[Vv]/.test(combined)) {
          next.includes = '1x Battery, 1x Charger';
        } else if (nameVal.toLowerCase().includes('cordless')) {
          next.includes = '1x Battery, 1x Charger';
        } else if (!combined.trim()) {
          next.includes = '';
        }
      } else {
        next.includes = '';
      }
    }
    return next;
  });

  // When category changes, reset sub-category and update active category for query
  const handleCategoryChange = (v: string) => {
    set("categoryId", v);
    set("subCategoryId", "");
    setActiveCategoryId(parseInt(v) || null);
  };
  const [autoFillOpen, setAutoFillOpen] = useState(false);

  // Duplicate detection — check if similar items exist
  const equipmentQ = trpc.equipment.list.useQuery(undefined, { staleTime: 60_000 });
  const duplicateWarning = useMemo(() => {
    if (!form.name || form.name.length < 3 || !equipmentQ.data) return null;
    const nameLower = form.name.toLowerCase().trim();
    const matches = equipmentQ.data.filter((item: any) => {
      if (editItem && item.id === editItem.id) return false;
      const itemName = item.name.toLowerCase();
      // Exact match
      if (itemName === nameLower) return true;
      // Fuzzy: one contains the other
      if (itemName.includes(nameLower) || nameLower.includes(itemName)) return true;
      // Brand+model match
      if (form.brand && form.model && item.brand && item.model) {
        if (item.brand.toLowerCase() === form.brand.toLowerCase() && item.model.toLowerCase() === form.model.toLowerCase()) return true;
      }
      return false;
    });
    return matches.length > 0 ? matches.slice(0, 3) : null;
  }, [form.name, form.brand, form.model, equipmentQ.data, editItem]);

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Equipment name is required");
      return;
    }
    if (!form.categoryId) {
      toast.error("Please select a category");
      return;
    }

    // Strip commas from price strings (e.g. "10,000.00" → "10000.00")
    const cleanPrice = (v: string) => v ? v.replace(/,/g, '') : undefined;

    const payload = {
      categoryId: parseInt(form.categoryId),
      subCategoryId: form.subCategoryId ? parseInt(form.subCategoryId) : undefined,
      name: form.name,
      nameZh: (form as any).nameZh || undefined,
      description: form.description || undefined,
      descriptionZh: (form as any).descriptionZh || undefined,
      brand: form.brand || undefined,
      model: form.model || undefined,
      dailyRate: cleanPrice(form.dailyRate),
      weeklyRate: cleanPrice(form.weeklyRate),
      monthlyRate: cleanPrice(form.monthlyRate),
      pricingType: form.pricingType as "fixed" | "negotiated",
      imageUrl: form.imageUrl || undefined,
      specs: form.specs || undefined,
      condition: form.condition as any,
      availability: form.availability as any,
      quantity: parseInt(form.quantity) || 1,
      availableQty: parseInt(form.availableQty) || 1,
      location: form.location || undefined,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      isReviewed: form.isReviewed,
      includes: form.includes || undefined,
      fuelType: form.fuelType as "none" | "petrol" | "diesel",
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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Oswald] uppercase tracking-wider">
            {editItem ? "Edit Equipment" : "Add Equipment"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Basic Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Hilti TE 60" />
                {duplicateWarning && (
                  <div className="mt-1 p-2 rounded border border-amber-500/40 bg-amber-50 text-xs">
                    <p className="font-semibold text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Possible duplicate{duplicateWarning.length > 1 ? 's' : ''} found:
                    </p>
                    <ul className="mt-1 space-y-0.5 text-amber-700">
                      {duplicateWarning.map((d: any) => (
                        <li key={d.id}>• {d.name}{d.brand ? ` (${d.brand}${d.model ? ' ' + d.model : ''})` : ''} — ID #{d.id}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.categoryId} onValueChange={handleCategoryChange}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label>Sub-Category</Label>
                <Select
                  value={form.subCategoryId || "__none__"}
                  onValueChange={(v) => set("subCategoryId", v === "__none__" ? "" : v)}
                  disabled={!activeCategoryId || subCategoriesQ.isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={subCategoriesQ.isLoading ? "Loading..." : "Select sub-category"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {subCategoriesQ.data?.map((sub: any) => (
                      <SelectItem key={sub.id} value={sub.id.toString()}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Brand</Label>
                <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Hilti" />
              </div>
              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. TE 60-ATC-AVR" />
              </div>
            </div>
            {/* AI Auto-Fill button — appears when brand + model are filled */}
            {form.brand && form.model && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAutoFillOpen(true)}
                className="w-full border-orange/40 text-orange hover:bg-orange/10 hover:border-orange rounded-none font-[Oswald] uppercase tracking-wider text-xs h-9"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Auto-Fill Info with AI — {form.brand} {form.model}
              </Button>
            )}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief description of the equipment..." rows={2} />
            </div>
            {/* Chinese fields */}
            <div className="rounded-lg border border-orange/20 bg-orange/5 p-3 space-y-3">
              <p className="text-xs font-semibold text-orange uppercase tracking-wider flex items-center gap-1.5">
                🇳 🇭 Chinese (Traditional) — Auto-generated on save
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Name (ZH) 名稱</Label>
                <Input
                  value={(form as any).nameZh || ""}
                  onChange={(e) => set("nameZh", e.target.value)}
                  placeholder="自動翻譯將在儲存時生成..."
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Description (ZH) 描述</Label>
                <Textarea
                  value={(form as any).descriptionZh || ""}
                  onChange={(e) => set("descriptionZh", e.target.value)}
                  placeholder="自動翻譯將在儲存時生成..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pricing (HKD)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label>Pricing Type</Label>
                <Select value={form.pricingType} onValueChange={(v) => set("pricingType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Rate</SelectItem>
                    <SelectItem value="negotiated">Negotiated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Daily Rate</Label>
                <Input type="text" value={form.dailyRate} onChange={(e) => set("dailyRate", e.target.value)} placeholder="0.00" className="font-data" />
              </div>
              <div className="space-y-1.5">
                <Label>Weekly Rate</Label>
                <Input type="text" value={form.weeklyRate} onChange={(e) => set("weeklyRate", e.target.value)} placeholder="0.00" className="font-data" />
              </div>
              <div className="space-y-1.5">
                <Label>Monthly Rate</Label>
                <Input type="text" value={form.monthlyRate} onChange={(e) => set("monthlyRate", e.target.value)} placeholder="0.00" className="font-data" />
              </div>
            </div>
            {/* Pricing Calculator — auto-suggest weekly/monthly from daily */}
            {form.dailyRate && parseFloat(form.dailyRate.replace(/,/g, '')) > 0 && (!form.weeklyRate || !form.monthlyRate) && (
              <button
                type="button"
                onClick={() => {
                  const daily = parseFloat(form.dailyRate.replace(/,/g, ''));
                  if (!daily || daily <= 0) return;
                  if (!form.weeklyRate) set("weeklyRate", (daily * 5).toFixed(2));
                  if (!form.monthlyRate) set("monthlyRate", (daily * 20).toFixed(2));
                  toast.success("Suggested weekly (5x daily) and monthly (20x daily) rates applied");
                }}
                className="w-full text-xs text-orange hover:text-orange-dark border border-orange/30 rounded px-3 py-1.5 bg-orange/5 hover:bg-orange/10 transition-colors font-[Oswald] uppercase tracking-wider"
              >
                ⚡ Auto-suggest: Weekly = {Math.round(parseFloat(form.dailyRate.replace(/,/g, '')) * 5).toLocaleString("en-HK")} &middot; Monthly = {Math.round(parseFloat(form.dailyRate.replace(/,/g, '')) * 20).toLocaleString("en-HK")}
              </button>
            )}
          </div>

          {/* Status & Inventory */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Status & Inventory</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label>Condition</Label>
                <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Availability</Label>
                <Select value={form.availability} onValueChange={(v) => set("availability", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Total Qty</Label>
                <Input type="number" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} min="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Available Qty</Label>
                <Input type="number" value={form.availableQty} onChange={(e) => set("availableQty", e.target.value)} min="0" />
              </div>
            </div>
          </div>

          {/* Image & Location */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Image & Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Location / Depot</Label>
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Kwun Tong Depot" />
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="space-y-1.5">
            <Label>Specifications / Notes</Label>
            <Textarea value={form.specs} onChange={(e) => set("specs", e.target.value)} placeholder="Technical specs, notes, included accessories..." rows={3} />
          </div>

          {/* What's Included */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              What's Included
              <span className="text-xs text-muted-foreground font-normal">(auto-filled for cordless tools)</span>
            </Label>
            <Input
              value={form.includes}
              onChange={(e) => set("includes", e.target.value)}
              placeholder="e.g. 1x Battery, 1x Charger"
            />
            {(() => {
              const combined = ((form.name || '') + ' ' + (form.model || '')).toLowerCase();
              const isMains = /240[Vv]|380[Vv]/.test(combined);
              const isBattAcc = (form.name || '').toLowerCase().includes('battery') || (form.name || '').toLowerCase().includes('charger');
              if (isMains || isBattAcc) return null;
              if (/36[Vv]|80[Vv]/.test(combined)) return (
                <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />36V/80V detected — 2x batteries will be applied automatically</p>
              );
              if (/12[Vv]|14[Vv]|18[Vv]|20[Vv]|40[Vv]|54[Vv]|56[Vv]/.test(combined) || combined.includes('cordless')) return (
                <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Battery-powered tool detected — battery &amp; charger note will be applied automatically</p>
              );
              return null;
            })()}
          </div>

          {/* Fuel Type */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <span>⛽</span> Fuel Type
              <span className="text-xs text-muted-foreground font-normal">(set for petrol/diesel-powered equipment)</span>
            </Label>
            <div className="flex gap-2">
              {(["none", "petrol", "diesel"] as const).map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => set("fuelType", ft)}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                    form.fuelType === ft
                      ? ft === "none"
                        ? "bg-muted border-muted-foreground/40 text-foreground"
                        : "bg-orange border-orange text-white"
                      : "bg-transparent border-border text-muted-foreground hover:border-orange/50"
                  }`}
                >
                  {ft === "none" ? "No Fuel" : ft === "petrol" ? "⛽ Petrol" : "⛽ Diesel"}
                </button>
              ))}
            </div>
            {form.fuelType !== "none" && (
              <p className="text-xs text-orange/80">
                Customers will see a live {form.fuelType} pump price add-on (Consumer Council HK) when booking this item.
              </p>
            )}
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
              <Label className="font-normal">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isFeatured} onCheckedChange={(v) => set("isFeatured", v)} />
              <Label className="font-normal">Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isReviewed} onCheckedChange={(v) => set("isReviewed", v)} />
              <Label className="font-normal">Reviewed</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-orange hover:bg-orange-dark text-white">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editItem ? "Update" : "Add Equipment"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* AI Auto-Fill Info Dialog — rendered inside EquipmentFormDialog so it has access to form state */}
      <AutoFillInfoDialog
        open={autoFillOpen}
        onOpenChange={setAutoFillOpen}
        brand={form.brand ?? ""}
        model={form.model ?? ""}
        itemName={form.name}
        onApply={(fields) => {
          if (fields.description !== undefined) set("description", fields.description);
          if (fields.specs !== undefined) set("specs", fields.specs);
          if (fields.dailyRate !== undefined) set("dailyRate", fields.dailyRate);
          if (fields.weeklyRate !== undefined) set("weeklyRate", fields.weeklyRate);
          if (fields.monthlyRate !== undefined) set("monthlyRate", fields.monthlyRate);
        }}
      />
    </Dialog>
  );
}

// ─── Main Admin Inventory Page ───────────────────────────────────────
export default function AdminInventory() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // State
  const [tab, setTab] = useState<"equipment" | "categories">("equipment");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [filterReviewed, setFilterReviewed] = useState<string>("all");
  const [filterPhoto, setFilterPhoto] = useState<string>("all");
  const [filterStock, setFilterStock] = useState<string>("all");
  const [sortField, setSortField] = useState<"name" | "availability" | "isReviewed" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const toggleSort = useCallback((field: "name" | "availability" | "isReviewed") => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        // Third click clears sort
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField, sortDirection]);
  const [showEquipForm, setShowEquipForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editEquipItem, setEditEquipItem] = useState<any>(null);
  const [editCatItem, setEditCatItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "equipment" | "category"; id: number; name: string } | null>(null);
  const [manualTarget, setManualTarget] = useState<{ id: number; name: string; brand?: string; model?: string } | null>(null);


  // Queries
  const categoriesQ = trpc.categories.list.useQuery();
  const equipmentQ = trpc.equipment.list.useQuery(undefined);
  const statsQ = trpc.equipment.stats.useQuery(undefined, { retry: false });
  const pendingCountQ = trpc.admin.pendingImageCount.useQuery();
  const pendingPhotoCount = pendingCountQ.data?.count ?? 0;

  // Mutations
  const utils = trpc.useUtils();
  const toggleReviewedMut = trpc.equipment.toggleReviewed.useMutation({
    onMutate: async ({ id, isReviewed }) => {
      // Optimistic update
      await utils.equipment.list.cancel();
      const prev = utils.equipment.list.getData(undefined);
      utils.equipment.list.setData(undefined, (old) =>
        old?.map((item) => item.id === id ? { ...item, isReviewed } : item)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      utils.equipment.list.setData(undefined, ctx?.prev);
      toast.error("Failed to update reviewed status");
    },
    onSettled: () => {
      utils.equipment.list.invalidate();
    },
  });

  // ─── Multi-select state ─────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Clear selection whenever filters change
  useEffect(() => { setSelectedIds(new Set()); }, [search, filterCategory, filterAvailability, filterReviewed, filterPhoto, filterStock]);

  const toggleSelectItem = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const deleteEquipMut = trpc.equipment.delete.useMutation({
    onSuccess: () => {
      utils.equipment.list.invalidate();
      utils.equipment.stats.invalidate();
      setDeleteTarget(null);
      toast.success("Equipment deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkDeleteMut = trpc.equipment.bulkDelete.useMutation({
    onSuccess: (res) => {
      utils.equipment.list.invalidate();
      utils.equipment.stats.invalidate();
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      toast.success(`${res.deleted} item${res.deleted === 1 ? "" : "s"} deleted`);
    },
    onError: (err) => toast.error(err.message),
  });

  const [bulkStatusValue, setBulkStatusValue] = useState<"available" | "rented" | "maintenance" | "retired" | "">("");

  const bulkUpdateStatusMut = trpc.equipment.bulkUpdateStatus.useMutation({
    onSuccess: (res) => {
      utils.equipment.list.invalidate();
      utils.equipment.stats.invalidate();
      toast.success(`${res.updated} item${res.updated === 1 ? "" : "s"} updated`);
      setSelectedIds(new Set());
      setBulkStatusValue("");
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteCatMut = trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      utils.equipment.stats.invalidate();
      setDeleteTarget(null);
      toast.success("Category deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // Filtered + sorted equipment
  const filteredEquipment = useMemo(() => {
    if (!equipmentQ.data) return [];
    const filtered = equipmentQ.data.filter((item: any) => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !(item.brand || "").toLowerCase().includes(search.toLowerCase()) && !(item.model || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== "all" && item.categoryId !== parseInt(filterCategory)) return false;
      if (filterAvailability !== "all" && item.availability !== filterAvailability) return false;
      if (filterReviewed === "reviewed" && !item.isReviewed) return false;
      if (filterReviewed === "not_reviewed" && item.isReviewed) return false;
      if (filterPhoto === "no_photo" && item.imageUrl) return false;
      if (filterPhoto === "has_photo" && !item.imageUrl) return false;
      if (filterStock === "out_of_stock" && (item.availableQty ?? 0) > 0) return false;
      if (filterStock === "low_stock" && (item.availableQty ?? 0) > 2) return false;
      if (filterStock === "in_stock" && (item.availableQty ?? 0) === 0) return false;
      return true;
    });
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      if (sortField === "name") {
        return dir * a.name.localeCompare(b.name);
      }
      if (sortField === "availability") {
        return dir * a.availability.localeCompare(b.availability);
      }
      if (sortField === "isReviewed") {
        const aVal = a.isReviewed ? 1 : 0;
        const bVal = b.isReviewed ? 1 : 0;
        return dir * (aVal - bVal);
      }
      return 0;
    });
  }, [equipmentQ.data, search, filterCategory, filterAvailability, filterReviewed, filterPhoto, filterStock, sortField, sortDirection]);

  // Category lookup
  const categoryMap = useMemo(() => {
    const map: Record<number, string> = {};
    categoriesQ.data?.forEach((c) => (map[c.id] = c.name));
    return map;
  }, [categoriesQ.data]);

  // Derived selection state (must come after filteredEquipment)
  const allSelected = filteredEquipment.length > 0 && filteredEquipment.every((item) => selectedIds.has(item.id));
  const someSelected = !allSelected && filteredEquipment.some((item) => selectedIds.has(item.id));

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEquipment.map((i) => i.id)));
    }
  }, [allSelected, filteredEquipment]);

  // Auth gate
  if (authLoading) {
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
          <p className="text-muted-foreground">You need to sign in to access inventory management.</p>
          <Button onClick={() => (window.location.href = getLoginUrl())} className="bg-orange hover:bg-orange-dark text-white">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin" && user.role !== "warehouse") {
    return <AccessDenied requiredRole="Admin or Warehouse" message="Only Admins and Warehouse staff can manage inventory." />;
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
              Inventory Manager
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-cream/60">{user.name || user.email}</span>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/sub-categories")} className="border-white/20 text-cream hover:bg-white/10 text-xs">
              Sub-Categories
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/auto-fill")} className="border-orange/40 text-orange hover:bg-orange/10 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Auto-Fill
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/photo-approval")} className="border-orange/40 text-orange hover:bg-orange/10 text-xs relative">
              <Camera className="w-3 h-3 mr-1" />
              Photo Approval
              {pendingPhotoCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                  {pendingPhotoCount > 99 ? "99+" : pendingPhotoCount}
                </span>
              )}
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Items" value={statsQ.data?.totalItems ?? "—"} icon={<Package className="w-5 h-5" />} />
          <StatCard label="Categories" value={statsQ.data?.totalCategories ?? "—"} icon={<FolderOpen className="w-5 h-5" />} />
          <StatCard label="Available" value={statsQ.data?.availableItems ?? "—"} icon={<CheckCircle className="w-5 h-5" />} />
          <StatCard label="Rented Out" value={statsQ.data?.rentedItems ?? "—"} icon={<BarChart3 className="w-5 h-5" />} />
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b">
          <button
            onClick={() => setTab("equipment")}
            className={`px-4 py-2.5 text-sm font-[Oswald] uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              tab === "equipment" ? "border-orange text-navy-deep" : "border-transparent text-muted-foreground hover:text-navy-deep"
            }`}
          >
            <Package className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Equipment ({equipmentQ.data?.length ?? 0})
          </button>
          <button
            onClick={() => setTab("categories")}
            className={`px-4 py-2.5 text-sm font-[Oswald] uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              tab === "categories" ? "border-orange text-navy-deep" : "border-transparent text-muted-foreground hover:text-navy-deep"
            }`}
          >
            <Tag className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Categories ({categoriesQ.data?.length ?? 0})
          </button>
          <button
            onClick={() => setLocation("/admin/sub-categories")}
            className="ml-auto px-4 py-2.5 text-sm font-[Oswald] uppercase tracking-wider transition-colors border-b-2 border-transparent text-muted-foreground hover:text-navy-deep -mb-px"
          >
            <Layers className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Sub-Categories
          </button>
        </div>

        {/* Equipment Tab */}
        {tab === "equipment" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search equipment..."
                    className="pl-9 w-56"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoriesQ.data?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterReviewed} onValueChange={setFilterReviewed}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Reviewed" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="reviewed">✓ Reviewed</SelectItem>
                    <SelectItem value="not_reviewed">Not Reviewed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPhoto} onValueChange={setFilterPhoto}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Photos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Photos</SelectItem>
                    <SelectItem value="has_photo">Has Photo</SelectItem>
                    <SelectItem value="no_photo">No Photo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStock} onValueChange={setFilterStock}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Stock" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock (≤2)</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowBulkImport(true)}
                  variant="outline"
                  className="border-orange text-orange hover:bg-orange/10 font-[Oswald] uppercase tracking-wider"
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  Bulk Import
                </Button>
                <Button
                  onClick={() => { setEditEquipItem(null); setShowEquipForm(true); }}
                  className="bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Equipment
                </Button>
              </div>
            </div>

            {/* Bulk Action Toolbar — appears when items are selected */}
            {selectedIds.size > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-navy-deep/5 border border-navy-deep/20 rounded-lg px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Left: selection info */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={allSelected}
                    data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                  <span className="text-sm font-medium text-navy-deep">
                    {selectedIds.size} item{selectedIds.size === 1 ? "" : "s"} selected
                  </span>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-muted-foreground hover:text-navy-deep underline underline-offset-2"
                  >
                    Clear
                  </button>
                </div>

                {/* Right: bulk actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Change Status */}
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={bulkStatusValue}
                      onValueChange={(v) => setBulkStatusValue(v as typeof bulkStatusValue)}
                    >
                      <SelectTrigger className="h-8 w-44 text-xs border-navy-deep/30">
                        <SelectValue placeholder="Change Status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">✅ Available</SelectItem>
                        <SelectItem value="rented">🔄 Rented</SelectItem>
                        <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                        <SelectItem value="retired">🚫 Retired</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={!bulkStatusValue || bulkUpdateStatusMut.isPending}
                      onClick={() => {
                        if (!bulkStatusValue) return;
                        bulkUpdateStatusMut.mutate({
                          ids: Array.from(selectedIds),
                          availability: bulkStatusValue as "available" | "rented" | "maintenance" | "retired",
                        });
                      }}
                      className="h-8 bg-navy-deep hover:bg-navy-deep/90 text-white font-[Oswald] uppercase tracking-wider text-xs px-3"
                    >
                      {bulkUpdateStatusMut.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>

                  <div className="h-5 w-px bg-border hidden sm:block" />

                  {/* Delete */}
                  <Button
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    variant="destructive"
                    size="sm"
                    className="h-8 font-[Oswald] uppercase tracking-wider text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Delete ({selectedIds.size})
                  </Button>
                </div>
              </div>
            )}

            {/* Equipment List */}
            {equipmentQ.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-orange" />
              </div>
            ) : filteredEquipment.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Package className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground">
                  {equipmentQ.data?.length === 0
                    ? "No equipment yet. Add your first item to get started."
                    : "No equipment matches your filters."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 w-10">
                          <Checkbox
                            checked={allSelected}
                            data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all"
                          />
                        </th>
                        <th
                          onClick={() => toggleSort("name")}
                          className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground cursor-pointer select-none hover:text-navy-deep transition-colors"
                        >
                          <span className="inline-flex items-center gap-1">
                            Item
                            {sortField === "name" ? (
                              sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-orange" /> : <ArrowDown className="w-3 h-3 text-orange" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </span>
                        </th>
                        <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground hidden md:table-cell">Category</th>
                        <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground hidden xl:table-cell">Sub-Category</th>
                        <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground hidden lg:table-cell">Daily Rate</th>
                        <th
                          onClick={() => toggleSort("availability")}
                          className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground cursor-pointer select-none hover:text-navy-deep transition-colors"
                        >
                          <span className="inline-flex items-center gap-1">
                            Status
                            {sortField === "availability" ? (
                              sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-orange" /> : <ArrowDown className="w-3 h-3 text-orange" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </span>
                        </th>
                        <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground hidden lg:table-cell">Condition</th>
                        <th className="text-left px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground hidden sm:table-cell">Qty</th>
                        <th
                          onClick={() => toggleSort("isReviewed")}
                          className="text-center px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground cursor-pointer select-none hover:text-navy-deep transition-colors"
                        >
                          <span className="inline-flex items-center gap-1 justify-center">
                            Reviewed
                            {sortField === "isReviewed" ? (
                              sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-orange" /> : <ArrowDown className="w-3 h-3 text-orange" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </span>
                        </th>
                        <th className="text-right px-4 py-3 font-[Oswald] uppercase tracking-wider text-xs text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEquipment.map((item) => {
                        const isSelected = selectedIds.has(item.id);
                        return (
                          <tr
                            key={item.id}
                            className={`border-b last:border-0 transition-colors ${
                              isSelected
                                ? 'bg-orange/5 hover:bg-orange/10'
                                : (item.availableQty === 0 && item.isActive)
                                  ? 'bg-red-50/50 hover:bg-red-50'
                                  : 'hover:bg-muted/30'
                            }`}
                          >
                            <td className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelectItem(item.id)}
                                aria-label={`Select ${item.name}`}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {item.imageUrl ? (
                                  <div className="w-10 h-10 rounded bg-white overflow-hidden p-0.5 shrink-0">
                                    <img src={item.imageUrl} alt="" className="w-full h-full object-contain" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-navy-deep">{item.name}</p>
                                  {item.brand && (
                                    <p className="text-xs text-muted-foreground">{item.brand} {item.model ?? ""}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="text-xs text-muted-foreground">{categoryMap[item.categoryId] ?? "—"}</span>
                            </td>
                            <td className="px-4 py-3 hidden xl:table-cell">
                              {(item as any).subCategoryName ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  {(item as any).subCategoryName}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              {item.dailyRate ? (
                                <span className="font-data text-xs">HK${item.dailyRate}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Negotiated</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <AvailabilityBadge status={item.availability} />
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <ConditionBadge condition={item.condition} />
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className={`font-data text-xs ${item.availableQty === 0 ? 'text-red-600 font-semibold' : (item.availableQty ?? 0) <= 2 ? 'text-amber-600 font-medium' : ''}`}>
                                {item.availableQty}/{item.quantity}
                                {item.availableQty === 0 && item.isActive && (
                                  <AlertTriangle className="w-3 h-3 inline ml-1 text-red-500" />
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => toggleReviewedMut.mutate({ id: item.id, isReviewed: !item.isReviewed })}
                                disabled={toggleReviewedMut.isPending && toggleReviewedMut.variables?.id === item.id}
                                title={item.isReviewed ? "Mark as not reviewed" : "Mark as reviewed"}
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                                  item.isReviewed
                                    ? "bg-emerald-500/15 text-emerald-700 hover:bg-red-500/10 hover:text-red-600"
                                    : "bg-muted text-muted-foreground hover:bg-emerald-500/15 hover:text-emerald-700"
                                }`}
                              >
                                {toggleReviewedMut.isPending && toggleReviewedMut.variables?.id === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <ClipboardCheck className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setManualTarget({ id: item.id, name: item.name, brand: item.brand ?? undefined, model: item.model ?? undefined })}
                                  className="h-8 w-8 p-0 text-orange/70 hover:text-orange"
                                  title="Manage operation manuals"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setEditEquipItem(item); setShowEquipForm(true); }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteTarget({ type: "equipment", id: item.id, name: item.name })}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {tab === "categories" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Manage equipment categories for organizing your inventory.</p>
              <Button
                onClick={() => { setEditCatItem(null); setShowCatForm(true); }}
                className="bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Category
              </Button>
            </div>

            {categoriesQ.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-orange" />
              </div>
            ) : categoriesQ.data?.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <FolderOpen className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground">No categories yet. Create your first category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriesQ.data?.map((cat) => (
                  <div key={cat.id} className="bg-white rounded-lg border p-4 space-y-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-navy-deep">{cat.name}</h3>
                        <p className="text-xs text-muted-foreground font-data mt-0.5">/{cat.slug}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditCatItem(cat); setShowCatForm(true); }}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget({ type: "category", id: cat.id, name: cat.name })}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{cat.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{cat.segment}</Badge>
                      {!cat.isActive && <Badge variant="outline" className="text-xs text-destructive border-destructive/30">Inactive</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>


      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        onSuccess={() => equipmentQ.refetch()}
      />

      {/* Equipment Form Dialog */}
      {showEquipForm && (
        <EquipmentFormDialog
          open={showEquipForm}
          onOpenChange={(v) => { setShowEquipForm(v); if (!v) setEditEquipItem(null); }}
          categories={categoriesQ.data ?? []}
          editItem={editEquipItem}
        />
      )}

      {/* Category Form Dialog */}
      {showCatForm && (
        <CategoryFormDialog
          open={showCatForm}
          onOpenChange={(v) => { setShowCatForm(v); if (!v) setEditCatItem(null); }}
          editCategory={editCatItem}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === "equipment" ? "Equipment" : "Category"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === "equipment") {
                  deleteEquipMut.mutate({ id: deleteTarget.id });
                } else {
                  deleteCatMut.mutate({ id: deleteTarget.id });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {(deleteEquipMut.isPending || deleteCatMut.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual Upload Dialog */}
      {manualTarget && (
        <ManualUploadDialog
          open={!!manualTarget}
          onOpenChange={(v) => !v && setManualTarget(null)}
          equipmentItemId={manualTarget.id}
          equipmentName={manualTarget.name}
          brand={manualTarget.brand}
          model={manualTarget.model}
        />
      )}

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={(v) => !v && setShowBulkDeleteConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete {selectedIds.size} Item{selectedIds.size === 1 ? "" : "s"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete{" "}
              <strong>{selectedIds.size} equipment item{selectedIds.size === 1 ? "" : "s"}</strong>.
              This cannot be undone. All associated data (manuals, images, rental history references) will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMut.mutate({ ids: Array.from(selectedIds) })}
              disabled={bulkDeleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete {selectedIds.size} Item{selectedIds.size === 1 ? "" : "s"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
