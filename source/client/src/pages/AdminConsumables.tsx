/**
 * Equip.HK Admin Consumables Management
 * Full CRUD for consumable products with equipment linking
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
  Beaker,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  Search,
  X,
  Link2,
  DollarSign,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-logo_22cf3871.png";

// ─── Consumable Form Dialog ─────────────────────────────────────────
function ConsumableFormDialog({
  open,
  onOpenChange,
  editItem,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editItem?: any;
}) {
  const utils = trpc.useUtils();
  const createMut = trpc.consumables.create.useMutation({
    onSuccess: () => {
      utils.consumables.adminList.invalidate();
      onOpenChange(false);
      toast.success("Consumable created");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMut = trpc.consumables.update.useMutation({
    onSuccess: () => {
      utils.consumables.adminList.invalidate();
      onOpenChange(false);
      toast.success("Consumable updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const [name, setName] = useState(editItem?.name ?? "");
  const [nameZh, setNameZh] = useState((editItem as any)?.nameZh ?? "");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [descriptionZh, setDescriptionZh] = useState((editItem as any)?.descriptionZh ?? "");
  const [brand, setBrand] = useState(editItem?.brand ?? "");
  const [model, setModel] = useState(editItem?.model ?? "");
  const [unit, setUnit] = useState(editItem?.unit ?? "each");
  const [price, setPrice] = useState(editItem?.price?.toString() ?? "");
  const [imageUrl, setImageUrl] = useState(editItem?.imageUrl ?? "");
  const [specs, setSpecs] = useState(editItem?.specs ?? "");
  const [categoryTag, setCategoryTag] = useState(editItem?.categoryTag ?? "");
  const [isActive, setIsActive] = useState(editItem?.isActive ?? true);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const payload: any = {
      name,
      nameZh: nameZh || undefined,
      description: description || undefined,
      descriptionZh: descriptionZh || undefined,
      brand: brand || undefined,
      model: model || undefined,
      unit,
      price: price || undefined,
      imageUrl: imageUrl || undefined,
      specs: specs || undefined,
      categoryTag: categoryTag || undefined,
      isActive,
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
            {editItem ? "Edit Consumable" : "Create Consumable"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SealBoss 1517 PU Injection Resin" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Product description..." rows={3} />
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. SealBoss" />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. 1517" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. kg, litre, set" />
            </div>
            <div className="space-y-2">
              <Label>Price (HK$)</Label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Category Tag</Label>
              <Input value={categoryTag} onChange={(e) => setCategoryTag(e.target.value)} placeholder="e.g. waterproofing" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Specs (JSON or text)</Label>
            <Textarea value={specs} onChange={(e) => setSpecs(e.target.value)} placeholder='e.g. {"Colour":"Amber","Viscosity":"Low"}' rows={3} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Active</Label>
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

// ─── Equipment Links Dialog ─────────────────────────────────────────
function EquipmentLinksDialog({
  open,
  onOpenChange,
  consumable,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  consumable: any;
}) {
  const utils = trpc.useUtils();
  const linksQ = trpc.consumables.getLinks.useQuery(
    { consumableId: consumable?.id },
    { enabled: !!consumable?.id }
  );
  const equipmentQ = trpc.equipment.list.useQuery();

  const linkMut = trpc.consumables.link.useMutation({
    onSuccess: () => {
      utils.consumables.getLinks.invalidate({ consumableId: consumable?.id });
      toast.success("Equipment linked");
    },
    onError: (err) => toast.error(err.message),
  });
  const unlinkMut = trpc.consumables.unlink.useMutation({
    onSuccess: () => {
      utils.consumables.getLinks.invalidate({ consumableId: consumable?.id });
      toast.success("Equipment unlinked");
    },
    onError: (err) => toast.error(err.message),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [linkNote, setLinkNote] = useState("");

  const linkedIds = useMemo(() => {
    return new Set((linksQ.data || []).map((l: any) => l.equipmentItemId));
  }, [linksQ.data]);

  const filteredEquipment = useMemo(() => {
    if (!equipmentQ.data || !searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return equipmentQ.data
      .filter((e: any) => !linkedIds.has(e.id))
      .filter((e: any) => {
        const name = (e.name || "").toLowerCase();
        const brand = (e.brand || "").toLowerCase();
        return name.includes(q) || brand.includes(q);
      })
      .slice(0, 10);
  }, [equipmentQ.data, searchTerm, linkedIds]);

  const handleLink = (equipmentItemId: number) => {
    linkMut.mutate({
      consumableId: consumable.id,
      equipmentItemId,
      note: linkNote || undefined,
    });
    setLinkNote("");
    setSearchTerm("");
  };

  if (!consumable) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Oswald] uppercase tracking-wider">
            Equipment Links for "{consumable.name}"
          </DialogTitle>
        </DialogHeader>

        {/* Current links */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Linked Equipment ({linksQ.data?.length || 0})
          </h4>
          {linksQ.isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-orange" />
            </div>
          ) : (linksQ.data || []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No equipment linked yet</p>
          ) : (
            <div className="space-y-1">
              {(linksQ.data || []).map((link: any) => (
                <div key={link.linkId} className="flex items-center gap-3 p-2 rounded-md border border-border bg-white">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{link.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {link.brand}
                      {link.note && ` · ${link.note}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unlinkMut.mutate({ id: link.linkId })}
                    disabled={unlinkMut.isPending}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add links */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Link Equipment</h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search equipment to link..."
              className="pl-10"
            />
          </div>
          <div>
            <Label className="text-xs">Note (optional)</Label>
            <Input
              value={linkNote}
              onChange={(e) => setLinkNote(e.target.value)}
              placeholder="e.g. Required for PU injection"
            />
          </div>
          {filteredEquipment.length > 0 && (
            <div className="border rounded-md max-h-48 overflow-y-auto">
              {filteredEquipment.map((eq: any) => (
                <button
                  key={eq.id}
                  onClick={() => handleLink(eq.id)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-orange/5 border-b last:border-b-0 text-left transition-colors"
                >
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
export default function AdminConsumables() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const consumablesQ = trpc.consumables.adminList.useQuery();
  const deleteMut = trpc.consumables.delete.useMutation({
    onSuccess: () => {
      utils.consumables.adminList.invalidate();
      toast.success("Consumable deleted");
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [linksTarget, setLinksTarget] = useState<any>(null);

  const toNum = (v: any) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") return parseFloat(v);
    if (v && typeof v === "object" && "d" in v) return parseFloat(v.d);
    return 0;
  };

  const filtered = useMemo(() => {
    if (!consumablesQ.data) return [];
    if (!searchQuery.trim()) return consumablesQ.data;
    const q = searchQuery.toLowerCase();
    return consumablesQ.data.filter((c: any) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.brand || "").toLowerCase().includes(q) ||
      (c.categoryTag || "").toLowerCase().includes(q)
    );
  }, [consumablesQ.data, searchQuery]);

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
              Consumables Management
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
              placeholder="Search consumables..."
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
            New Consumable
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{consumablesQ.data?.length || 0} total consumables</span>
          <span>·</span>
          <span>{consumablesQ.data?.filter((c: any) => c.isActive).length || 0} active</span>
        </div>

        {/* Consumable List */}
        {consumablesQ.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Beaker className="w-12 h-12 mb-3 opacity-40" />
            <p>{searchQuery ? "No consumables match your search" : "No consumables yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-white hover:shadow-sm transition-shadow"
              >
                {/* Image */}
                <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-100 shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Beaker className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-navy-deep truncate">{item.name}</h3>
                    {!item.isActive && (
                      <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                    )}
                    {item.categoryTag && (
                      <Badge variant="outline" className="text-[10px]">{item.categoryTag}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.brand || "No brand"} · {item.unit}
                  </p>
                  {item.price && (
                    <p className="text-xs font-medium text-green-700 mt-0.5">
                      HK${toNum(item.price).toLocaleString()} per {item.unit}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLinksTarget(item)}
                    className="text-blue-600 hover:bg-blue-50"
                    title="Manage equipment links"
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditTarget(item); setShowForm(true); }}
                    className="text-orange hover:bg-orange/10"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(item)}
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
        <ConsumableFormDialog
          open={showForm}
          onOpenChange={(v) => { setShowForm(v); if (!v) setEditTarget(null); }}
          editItem={editTarget}
        />
      )}

      {/* Links Dialog */}
      {linksTarget && (
        <EquipmentLinksDialog
          open={!!linksTarget}
          onOpenChange={(v) => { if (!v) setLinksTarget(null); }}
          consumable={linksTarget}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Consumable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This will also remove all equipment links. This action cannot be undone.
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
