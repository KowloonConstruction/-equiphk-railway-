/*
 * Equip.HK Admin — Sub-Category Management
 * Create, rename, reorder (drag-and-drop), toggle active, and delete sub-categories
 * Grouped by main category in an accordion layout
 */
import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Layers,
  FolderOpen,
  ChevronRight,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-logo_22cf3871.png";

// ─── Sortable Sub-Category Row ─────────────────────────────────────────────
function SortableSubCategoryRow({
  sub,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  sub: any;
  onEdit: (sub: any) => void;
  onDelete: (sub: any) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sub.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 bg-white border border-border rounded-md group hover:border-orange/30 transition-colors ${
        isDragging ? "shadow-lg" : ""
      } ${!sub.isActive ? "opacity-60" : ""}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-navy-deep transition-colors touch-none shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Sort order badge */}
      <span className="text-xs font-data text-muted-foreground w-5 text-center shrink-0">
        {sub.sortOrder}
      </span>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-navy-deep font-[Oswald] uppercase tracking-wide">
          {sub.name}
        </span>
        <span className="ml-2 text-xs text-muted-foreground font-mono">{sub.slug}</span>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <Switch
          checked={!!sub.isActive}
          onCheckedChange={(checked) => onToggleActive(sub.id, checked)}
          className="data-[state=checked]:bg-orange"
        />
        <span className="text-xs text-muted-foreground w-14">
          {sub.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(sub)}
          className="h-7 w-7 p-0 hover:bg-navy-deep/5"
          title="Rename"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(sub)}
          className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Category Accordion Panel ──────────────────────────────────────────────
function CategoryPanel({
  category,
  onEdit,
  onDelete,
  onToggleActive,
  onAddNew,
  onReorder,
}: {
  category: any;
  onEdit: (sub: any) => void;
  onDelete: (sub: any) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  onAddNew: (categoryId: number) => void;
  onReorder: (categoryId: number, newOrder: any[]) => void;
}) {
  const subs: any[] = category.subCategories ?? [];
  const activeCount = subs.filter((s) => s.isActive).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = subs.findIndex((s) => s.id === active.id);
    const newIndex = subs.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(subs, oldIndex, newIndex);
    onReorder(category.id, reordered);
  };

  return (
    <AccordionItem value={`cat-${category.id}`} className="border border-border rounded-lg overflow-hidden">
      <AccordionTrigger className="px-4 py-3 hover:bg-navy-deep/3 hover:no-underline [&[data-state=open]]:bg-navy-deep/5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded bg-orange/10 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-orange" />
          </div>
          <div className="text-left min-w-0">
            <div className="font-[Oswald] uppercase tracking-wider text-navy-deep text-sm">
              {category.name}
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">
              {category.slug}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto mr-4 shrink-0">
            <Badge variant="outline" className="text-xs font-normal">
              {subs.length} sub-categories
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs font-normal ${
                activeCount > 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              {activeCount} active
            </Badge>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4 pt-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={subs.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 mb-3">
              {subs.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground border border-dashed rounded-md">
                  No sub-categories yet. Add one below.
                </div>
              ) : (
                subs.map((sub) => (
                  <SortableSubCategoryRow
                    key={sub.id}
                    sub={sub}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleActive={onToggleActive}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add new sub-category button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddNew(category.id)}
          className="w-full border-dashed border-orange/40 text-orange hover:bg-orange/5 hover:border-orange font-[Oswald] uppercase tracking-wider text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Sub-Category to {category.name}
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

// ─── Edit / Create Dialog ──────────────────────────────────────────────────
function SubCategoryFormDialog({
  open,
  onOpenChange,
  editSub,
  defaultCategoryId,
  categories,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editSub?: any;
  defaultCategoryId?: number;
  categories: any[];
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(editSub?.name ?? "");
  const [description, setDescription] = useState(editSub?.description ?? "");
  const [categoryId, setCategoryId] = useState<number>(
    editSub?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? 0
  );

  // Reset form when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setName(editSub?.name ?? "");
      setDescription(editSub?.description ?? "");
      setCategoryId(editSub?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? 0);
    }
    onOpenChange(v);
  };

  const autoSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const createMut = trpc.subCategories.create.useMutation({
    onSuccess: () => {
      utils.subCategories.adminListWithCategories.invalidate();
      utils.subCategories.listWithCategories.invalidate();
      onOpenChange(false);
      toast.success("Sub-category created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMut = trpc.subCategories.update.useMutation({
    onSuccess: () => {
      utils.subCategories.adminListWithCategories.invalidate();
      utils.subCategories.listWithCategories.invalidate();
      onOpenChange(false);
      toast.success("Sub-category updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (editSub) {
      updateMut.mutate({ id: editSub.id, name: name.trim(), description: description || undefined });
    } else {
      createMut.mutate({
        categoryId,
        name: name.trim(),
        description: description || undefined,
        sortOrder: 99,
      });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[Oswald] uppercase tracking-wider text-navy-deep">
            {editSub ? "Rename Sub-Category" : "New Sub-Category"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Category selector (only for new) */}
          {!editSub && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Parent Category
              </Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange/30"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Angle Grinders"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
            {name && (
              <p className="text-xs text-muted-foreground font-mono">
                Slug: <span className="text-navy-deep">{autoSlug}</span>
              </p>
            )}
          </div>

          {/* Description (optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Description <span className="normal-case">(optional)</span>
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name.trim()}
            className="bg-orange hover:bg-orange/90 text-white"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editSub ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function AdminSubCategories() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const [editSub, setEditSub] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [defaultCatId, setDefaultCatId] = useState<number | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);

  // Fetch all categories with their sub-categories (admin version — includes inactive)
  const catsQ = trpc.subCategories.adminListWithCategories.useQuery(undefined, {
    staleTime: 0,
  });

  const toggleActiveMut = trpc.subCategories.update.useMutation({
    onMutate: async ({ id, isActive }) => {
      // Optimistic update
      await utils.subCategories.adminListWithCategories.cancel();
      const prev = utils.subCategories.adminListWithCategories.getData();
      utils.subCategories.adminListWithCategories.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((cat) => ({
          ...cat,
          subCategories: (cat as any).subCategories?.map((s: any) =>
            s.id === id ? { ...s, isActive } : s
          ),
        }));
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.subCategories.adminListWithCategories.setData(undefined, ctx.prev);
      toast.error("Failed to update status");
    },
    onSettled: () => {
      utils.subCategories.adminListWithCategories.invalidate();
      utils.subCategories.listWithCategories.invalidate();
    },
  });

  const deleteMut = trpc.subCategories.delete.useMutation({
    onSuccess: () => {
      utils.subCategories.adminListWithCategories.invalidate();
      utils.subCategories.listWithCategories.invalidate();
      setDeleteTarget(null);
      toast.success("Sub-category deleted. Affected items unassigned.");
    },
    onError: (err) => toast.error(err.message),
  });

  const reorderMut = trpc.subCategories.reorder.useMutation({
    onMutate: async (updates) => {
      await utils.subCategories.adminListWithCategories.cancel();
      const prev = utils.subCategories.adminListWithCategories.getData();
      utils.subCategories.adminListWithCategories.setData(undefined, (old) => {
        if (!old) return old;
        const orderMap: Record<number, number> = {};
        updates.forEach(({ id, sortOrder }) => (orderMap[id] = sortOrder));
        return old.map((cat) => ({
          ...cat,
          subCategories: [...((cat as any).subCategories ?? [])].sort(
            (a: any, b: any) => (orderMap[a.id] ?? a.sortOrder) - (orderMap[b.id] ?? b.sortOrder)
          ),
        }));
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.subCategories.adminListWithCategories.setData(undefined, ctx.prev);
      toast.error("Reorder failed");
    },
    onSettled: () => {
      utils.subCategories.adminListWithCategories.invalidate();
      utils.subCategories.listWithCategories.invalidate();
    },
  });

  const handleReorder = useCallback(
    (categoryId: number, newOrder: any[]) => {
      const updates = newOrder.map((sub, idx) => ({ id: sub.id, sortOrder: idx + 1 }));
      reorderMut.mutate(updates);
    },
    [reorderMut]
  );

  const handleAddNew = (catId: number) => {
    setEditSub(null);
    setDefaultCatId(catId);
    setFormOpen(true);
  };

  const handleEdit = (sub: any) => {
    setEditSub(sub);
    setDefaultCatId(sub.categoryId);
    setFormOpen(true);
  };

  // ─── Auth gates ────────────────────────────────────────────────────
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
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-orange hover:bg-orange-dark text-white"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-concrete flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <AlertTriangle className="w-12 h-12 text-orange mx-auto" />
          <h1 className="text-2xl font-[Oswald] uppercase text-navy-deep">Access Denied</h1>
          <Button variant="outline" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const categories = catsQ.data ?? [];
  const totalSubs = categories.reduce((sum, c) => sum + ((c as any).subCategories?.length ?? 0), 0);
  const activeSubs = categories.reduce(
    (sum, c) => sum + ((c as any).subCategories?.filter((s: any) => s.isActive).length ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-concrete">
      {/* Top Bar */}
      <header className="bg-navy-deep text-cream sticky top-0 z-50 border-b border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src={LOGO_URL} alt="Equip.HK" className="h-8 w-auto" />
            </button>
            <div className="h-6 w-px bg-white/20" />
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setLocation("/admin/inventory")}
                className="text-cream/60 hover:text-cream transition-colors font-[Oswald] uppercase tracking-wider text-xs"
              >
                Admin
              </button>
              <ChevronRight className="w-3 h-3 text-cream/40" />
              <span className="text-orange font-[Oswald] uppercase tracking-wider text-xs">
                Sub-Categories
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-cream/60 hidden sm:block">{user.name || user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/inventory")}
              className="border-white/20 text-cream hover:bg-white/10 text-xs"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Inventory
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/")}
              className="border-white/20 text-cream hover:bg-white/10 text-xs"
            >
              Site
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6 max-w-4xl">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-[Oswald] uppercase tracking-wider text-navy-deep flex items-center gap-2">
              <Layers className="w-6 h-6 text-orange" />
              Sub-Category Manager
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organise equipment into sub-categories. Drag rows to reorder within each category.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditSub(null);
              setDefaultCatId(categories[0]?.id);
              setFormOpen(true);
            }}
            className="bg-orange hover:bg-orange/90 text-white font-[Oswald] uppercase tracking-wider shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Sub-Category
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Main Categories", value: categories.length, icon: <FolderOpen className="w-5 h-5" /> },
            { label: "Total Sub-Categories", value: totalSubs, icon: <Layers className="w-5 h-5" /> },
            { label: "Active", value: activeSubs, icon: <Layers className="w-5 h-5 text-emerald-600" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-lg border p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-orange/10 flex items-center justify-center text-orange shrink-0">
                {icon}
              </div>
              <div>
                <p className="text-xl font-bold font-[Oswald] text-navy-deep">{value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Expand/Collapse all */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Click a category to expand. Drag the <GripVertical className="w-3 h-3 inline" /> handle to reorder sub-categories.
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-navy-deep"
              onClick={() => setOpenAccordions(categories.map((c) => `cat-${c.id}`))}
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-navy-deep"
              onClick={() => setOpenAccordions([])}
            >
              Collapse All
            </Button>
          </div>
        </div>

        {/* Category accordion */}
        {catsQ.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-orange" />
          </div>
        ) : (
          <Accordion
            type="multiple"
            value={openAccordions}
            onValueChange={setOpenAccordions}
            className="space-y-3"
          >
            {categories.map((cat) => (
              <CategoryPanel
                key={cat.id}
                category={cat}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onToggleActive={(id, isActive) => toggleActiveMut.mutate({ id, isActive })}
                onAddNew={handleAddNew}
                onReorder={handleReorder}
              />
            ))}
          </Accordion>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <SubCategoryFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditSub(null);
        }}
        editSub={editSub}
        defaultCategoryId={defaultCatId}
        categories={categories}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-[Oswald] uppercase tracking-wider text-navy-deep">
              Delete Sub-Category?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be permanently deleted. Any equipment items
              currently assigned to this sub-category will be unassigned (but not deleted).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMut.mutate({ id: deleteTarget.id })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMut.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
