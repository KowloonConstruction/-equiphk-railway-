/**
 * Equip.HK Admin Bundle Management
 * Full CRUD for equipment bundles with item management
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  PackageOpen,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  Search,
  X,
  Star,
  Eye,
  EyeOff,
  Package,
  DollarSign,
  Percent,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-logo_22cf3871.png";

// ─── Bundle Form Dialog ─────────────────────────────────────────────
function BundleFormDialog({
  open,
  onOpenChange,
  editItem,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editItem?: any;
}) {
  const utils = trpc.useUtils();
  const createMut = trpc.bundles.create.useMutation({
    onSuccess: () => {
      utils.bundles.adminList.invalidate();
      onOpenChange(false);
      toast.success("Bundle created");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMut = trpc.bundles.update.useMutation({
    onSuccess: () => {
      utils.bundles.adminList.invalidate();
      utils.bundles.getById.invalidate();
      onOpenChange(false);
      toast.success("Bundle updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const [name, setName] = useState(editItem?.name ?? "");
  const [nameZh, setNameZh] = useState((editItem as any)?.nameZh ?? "");
  const [slug, setSlug] = useState(editItem?.slug ?? "");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [descriptionZh, setDescriptionZh] = useState((editItem as any)?.descriptionZh ?? "");
  const [imageUrl, setImageUrl] = useState(editItem?.imageUrl ?? "");
  const [dailyRate, setDailyRate] = useState(editItem?.dailyRate?.toString() ?? "");
  const [weeklyRate, setWeeklyRate] = useState(editItem?.weeklyRate?.toString() ?? "");
  const [monthlyRate, setMonthlyRate] = useState(editItem?.monthlyRate?.toString() ?? "");
  const [savingsPercent, setSavingsPercent] = useState(editItem?.savingsPercent?.toString() ?? "");
  const [categoryTag, setCategoryTag] = useState(editItem?.categoryTag ?? "");
  const [isActive, setIsActive] = useState(editItem?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(editItem?.isFeatured ?? false);
  const [sortOrder, setSortOrder] = useState(editItem?.sortOrder?.toString() ?? "0");

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editItem) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    const payload: any = {
      name,
      nameZh: nameZh || undefined,
      slug,
      description: description || undefined,
      descriptionZh: descriptionZh || undefined,
      imageUrl: imageUrl || undefined,
      dailyRate: dailyRate || undefined,
      weeklyRate: weeklyRate || undefined,
      monthlyRate: monthlyRate || undefined,
      savingsPercent: savingsPercent ? parseInt(savingsPercent) : undefined,
      categoryTag: categoryTag || undefined,
      isActive,
      isFeatured,
      sortOrder: parseInt(sortOrder) || 0,
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
            {editItem ? "Edit Bundle" : "Create Bundle"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Waterproofing Starter Kit" />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="waterproofing-starter-kit" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bundle description..." rows={3} />
          </div>
          {/* Chinese fields */}
          <div className="rounded-lg border border-orange/20 bg-orange/5 p-3 space-y-3">
            <p className="text-xs font-semibold text-orange uppercase tracking-wider">
              🇳 🇭 Chinese (Traditional) — Auto-generated on save
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Name (ZH) 名稱</Label>
              <Input value={nameZh} onChange={(e) => setNameZh(e.target.value)} placeholder="自動翻譯將在儲存時生成..." className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Description (ZH) 描述</Label>
              <Textarea value={descriptionZh} onChange={(e) => setDescriptionZh(e.target.value)} placeholder="自動翻譯將在儲存時生成..." rows={2} className="text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Daily Rate (HK$)</Label>
              <Input value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Weekly Rate (HK$)</Label>
              <Input value={weeklyRate} onChange={(e) => setWeeklyRate(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Monthly Rate (HK$)</Label>
              <Input value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Savings %</Label>
              <Input value={savingsPercent} onChange={(e) => setSavingsPercent(e.target.value)} placeholder="e.g. 15" type="number" />
            </div>
            <div className="space-y-2">
              <Label>Category Tag</Label>
              <Input value={categoryTag} onChange={(e) => setCategoryTag(e.target.value)} placeholder="e.g. waterproofing" />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" type="number" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              <Label>Featured</Label>
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

// ─── Bundle Items Dialog ────────────────────────────────────────────
function BundleItemsDialog({
  open,
  onOpenChange,
  bundle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bundle: any;
}) {
  const utils = trpc.useUtils();
  const bundleDetailQ = trpc.bundles.getById.useQuery(
    { id: bundle?.id },
    { enabled: !!bundle?.id }
  );
  const equipmentQ = trpc.equipment.list.useQuery();

  const addItemMut = trpc.bundles.addItem.useMutation({
    onSuccess: () => {
      utils.bundles.getById.invalidate({ id: bundle?.id });
      toast.success("Item added to bundle");
    },
    onError: (err) => toast.error(err.message),
  });
  const removeItemMut = trpc.bundles.removeItem.useMutation({
    onSuccess: () => {
      utils.bundles.getById.invalidate({ id: bundle?.id });
      toast.success("Item removed from bundle");
    },
    onError: (err) => toast.error(err.message),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [addNote, setAddNote] = useState("");

  const bundleItemIds = useMemo(() => {
    return new Set((bundleDetailQ.data?.items || []).map((i: any) => i.equipmentItemId));
  }, [bundleDetailQ.data]);

  const filteredEquipment = useMemo(() => {
    if (!equipmentQ.data || !searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return equipmentQ.data
      .filter((e: any) => !bundleItemIds.has(e.id))
      .filter((e: any) => {
        const name = (e.name || "").toLowerCase();
        const brand = (e.brand || "").toLowerCase();
        return name.includes(q) || brand.includes(q);
      })
      .slice(0, 10);
  }, [equipmentQ.data, searchTerm, bundleItemIds]);

  const handleAddItem = (equipmentItemId: number) => {
    addItemMut.mutate({
      bundleId: bundle.id,
      equipmentItemId,
      quantity: addQty,
      note: addNote || undefined,
    });
    setAddNote("");
    setAddQty(1);
    setSearchTerm("");
  };

  if (!bundle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Oswald] uppercase tracking-wider">
            Items in "{bundle.name}"
          </DialogTitle>
        </DialogHeader>

        {/* Current items */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Current Items ({bundleDetailQ.data?.items?.length || 0})
          </h4>
          {bundleDetailQ.isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-orange" />
            </div>
          ) : (bundleDetailQ.data?.items || []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No items in this bundle yet</p>
          ) : (
            <div className="space-y-1">
              {(bundleDetailQ.data?.items || []).map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-md border border-border bg-white">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="w-10 h-10 rounded object-contain bg-gray-50" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.brand} · Qty: {item.quantity}
                      {item.note && ` · ${item.note}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItemMut.mutate({ id: item.id })}
                    disabled={removeItemMut.isPending}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add items */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Add Equipment</h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search equipment to add..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
            <div className="w-20">
              <Label className="text-xs">Qty</Label>
              <Input
                type="number"
                min={1}
                value={addQty}
                onChange={(e) => setAddQty(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Note (optional)</Label>
              <Input
                value={addNote}
                onChange={(e) => setAddNote(e.target.value)}
                placeholder="e.g. Includes 2 batteries"
              />
            </div>
          </div>
          {filteredEquipment.length > 0 && (
            <div className="border rounded-md max-h-48 overflow-y-auto">
              {filteredEquipment.map((eq: any) => (
                <button
                  key={eq.id}
                  onClick={() => handleAddItem(eq.id)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-orange/5 border-b last:border-b-0 text-left transition-colors"
                >
                  {eq.imageUrl && (
                    <img src={eq.imageUrl} alt="" className="w-8 h-8 rounded object-contain bg-gray-50" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{eq.name}</p>
                    <p className="text-xs text-muted-foreground">{eq.brand}</p>
                  </div>
                  <Plus className="w-4 h-4 text-orange shrink-0" />
                </button>
              ))}
            </div>
          )}
          {searchTerm.trim() && filteredEquipment.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No matching equipment found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function AdminBundles() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const bundlesQ = trpc.bundles.adminList.useQuery();
  const deleteMut = trpc.bundles.delete.useMutation({
    onSuccess: () => {
      utils.bundles.adminList.invalidate();
      toast.success("Bundle deleted");
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [itemsTarget, setItemsTarget] = useState<any>(null);

  const filtered = useMemo(() => {
    if (!bundlesQ.data) return [];
    if (!searchQuery.trim()) return bundlesQ.data;
    const q = searchQuery.toLowerCase();
    return bundlesQ.data.filter((b: any) =>
      (b.name || "").toLowerCase().includes(q) ||
      (b.categoryTag || "").toLowerCase().includes(q)
    );
  }, [bundlesQ.data, searchQuery]);

  const toNum = (v: any) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") return parseFloat(v);
    if (v && typeof v === "object" && "d" in v) return parseFloat(v.d);
    return 0;
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
        <p className="text-muted-foreground">Only administrators can access this page.</p>
        <Button variant="outline" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-concrete">
      {/* Top Bar */}
      <header className="bg-navy-deep text-cream sticky top-0 z-50 border-b border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/admin")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={LOGO_URL} alt="Equip.HK" className="h-8 w-auto" />
            </button>
            <div className="h-6 w-px bg-white/20" />
            <h1 className="font-[Oswald] uppercase tracking-wider text-sm text-orange">
              Bundle Management
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin")} className="border-white/20 text-cream hover:bg-white/10 text-xs">
              <ArrowLeft className="w-3 h-3 mr-1" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Search + Create */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bundles..."
              className="pl-10"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button onClick={() => { setEditTarget(null); setShowForm(true); }} className="bg-orange hover:bg-orange-dark text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Bundle
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{bundlesQ.data?.length || 0} total bundles</span>
          <span>·</span>
          <span>{bundlesQ.data?.filter((b: any) => b.isActive).length || 0} active</span>
          <span>·</span>
          <span>{bundlesQ.data?.filter((b: any) => b.isFeatured).length || 0} featured</span>
        </div>

        {/* Bundle List */}
        {bundlesQ.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <PackageOpen className="w-12 h-12 mb-3 opacity-40" />
            <p>{searchQuery ? "No bundles match your search" : "No bundles yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((bundle: any) => (
              <div
                key={bundle.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-white hover:shadow-sm transition-shadow"
              >
                {/* Image */}
                <div className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 shrink-0 overflow-hidden">
                  {bundle.imageUrl ? (
                    <img src={bundle.imageUrl} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PackageOpen className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-navy-deep truncate">{bundle.name}</h3>
                    {!bundle.isActive && (
                      <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                    )}
                    {bundle.isFeatured && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-[10px]">
                        <Star className="w-3 h-3 mr-0.5" />Featured
                      </Badge>
                    )}
                    {bundle.categoryTag && (
                      <Badge variant="outline" className="text-[10px]">{bundle.categoryTag}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {bundle.description || "No description"}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    {bundle.dailyRate && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        HK${toNum(bundle.dailyRate).toLocaleString()}/day
                      </span>
                    )}
                    {bundle.savingsPercent && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Percent className="w-3 h-3" />
                        Save {bundle.savingsPercent}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setItemsTarget(bundle)}
                    className="text-blue-600 hover:bg-blue-50"
                    title="Manage items"
                  >
                    <Package className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditTarget(bundle); setShowForm(true); }}
                    className="text-orange hover:bg-orange/10"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(bundle)}
                    className="text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      {showForm && (
        <BundleFormDialog
          open={showForm}
          onOpenChange={(v) => { setShowForm(v); if (!v) setEditTarget(null); }}
          editItem={editTarget}
        />
      )}

      {/* Items Dialog */}
      {itemsTarget && (
        <BundleItemsDialog
          open={!!itemsTarget}
          onOpenChange={(v) => { if (!v) setItemsTarget(null); }}
          bundle={itemsTarget}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bundle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This will also remove all item links. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMut.mutate({ id: deleteTarget.id })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
