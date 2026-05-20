/*
 * Equip.HK Equipment Catalogue Page — /equipment
 * Full catalogue with search, category tabs, sub-category chips, brand filter,
 * and a Recently Viewed section at the bottom.
 */
import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RecentlyViewedSection from "@/components/RecentlyViewedSection";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Search,
  X,
  Heart,
  Tag,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useComparison } from "@/contexts/ComparisonContext";
import ComparisonModal from "@/components/ComparisonModal";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Equipment Card ────────────────────────────────────────────────────────
function EquipmentCard({ item, index, favouriteIds, onToggleFavourite }: {
  item: any;
  index: number;
  favouriteIds: number[];
  onToggleFavourite: (id: number) => void;
}) {
  const [, navigate] = useLocation();
  const { addItem, isInComparison } = useComparison();
  const { tk, pickLang } = useLanguage();
  const isFav = favouriteIds.includes(item.id);
  const inComparison = isInComparison(item.id);

  const dailyRate = item.dailyRate ? parseFloat(String(item.dailyRate)) : null;
  const isAvailable = (item.availableQty ?? item.quantity ?? 0) > 0;

  const displayName = pickLang(item.name, item.nameZh);

  const handleAddToComparison = () => {
    addItem({
      id: item.id,
      name: item.name,
      brand: item.brand,
      dailyRate: item.dailyRate,
      weeklyRate: item.weeklyRate,
      monthlyRate: item.monthlyRate,
      imageUrl: item.imageUrl,
      description: item.description,
      specs: item.specs,
      condition: item.condition,
      availability: item.availability,
      quantity: item.quantity,
    });
    toast.success(`${displayName} ${tk("compare_added")}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group relative bg-navy-light border border-white/10 hover:border-orange/40 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-orange/10"
      onClick={() => navigate(`/equipment/${item.id}`)}
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-0 group-hover:w-full bg-orange transition-all duration-300" />

      {/* Image */}
      <div className="aspect-[4/3] bg-white overflow-hidden flex items-center justify-center relative">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={displayName}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-navy-light flex items-center justify-center">
            <Package className="w-10 h-10 text-cream/20" />
          </div>
        )}

        {/* Availability badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
          isAvailable ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
        }`}>
          {isAvailable ? tk("available") : tk("out_of_stock")}
        </div>

        {/* Favourite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavourite(item.id); }}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            isFav ? "bg-orange text-white" : "bg-navy/80 text-cream/50 hover:text-orange"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        {item.brand && (
          <p className="text-orange text-[10px] font-bold uppercase tracking-wider truncate mb-0.5">
            {item.brand}
          </p>
        )}
        <h3 className="text-white text-sm font-semibold font-[Oswald] uppercase tracking-wide leading-tight line-clamp-2 mb-3">
          {displayName}
        </h3>

        {/* Rate */}
        <div className="flex items-baseline gap-1 pt-3 border-t border-white/10">
          {dailyRate && dailyRate > 0 ? (
            <>
              <span className="text-orange font-bold text-lg">HK${Math.round(dailyRate).toLocaleString("en-HK")}</span>
              <span className="text-cream/40 text-xs">{tk("per_day")}</span>
            </>
          ) : (
            <span className="text-cream/40 text-sm">{tk("poa")}</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleAddToComparison(); }}
            className={`ml-auto text-[10px] px-2 py-0.5 rounded border transition-colors ${
              inComparison
                ? "border-orange text-orange bg-orange/10"
                : "border-white/20 text-cream/40 hover:border-orange/40 hover:text-orange/60"
            }`}
          >
            {inComparison ? tk("compare_in") : tk("compare_add")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function EquipmentCatalogue() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { tk, t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [activeSubSlug, setActiveSubSlug] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available">("all");
  const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc">("name");
  const [showFilters, setShowFilters] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [powerFilter, setPowerFilter] = useState<string | null>(null);

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const catParam = params.get("category");
    const subParam = params.get("sub");
    const brandParam = params.get("brand");
    const searchParam = params.get("q");
    setActiveCategorySlug(catParam ?? null);
    setActiveSubSlug(subParam ?? null);
    if (brandParam) setActiveBrand(brandParam);
    if (searchParam) setSearchQuery(searchParam);
  }, [searchString]);

  // Data queries
  const equipmentQ = trpc.equipment.list.useQuery({ activeOnly: true }, { retry: false });
  const categoriesQ = trpc.subCategories.listWithCategories.useQuery(undefined, { retry: false });
  const brandsQ = trpc.equipment.brands.useQuery(undefined, { retry: false });
  const favouriteIdsQ = trpc.favourites.ids.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();

  const toggleFavMutation = trpc.favourites.toggle.useMutation({
    onMutate: async ({ equipmentItemId }) => {
      await utils.favourites.ids.cancel();
      const prev = utils.favourites.ids.getData();
      utils.favourites.ids.setData(undefined, (old) => {
        if (!old) return old;
        return old.includes(equipmentItemId)
          ? old.filter((id) => id !== equipmentItemId)
          : [...old, equipmentItemId];
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.favourites.ids.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.favourites.ids.invalidate(),
    onSuccess: (data) => {
      if (data.requiresLogin) toast.info(tk("fav_sign_in"));
      else toast.success(data.favourited ? tk("fav_added") : tk("fav_removed"));
    },
  });

  const favouriteIds = favouriteIdsQ.data ?? [];
  const handleToggleFavourite = (id: number) => toggleFavMutation.mutate({ equipmentItemId: id });

  // Power supply detection helper
  const detectPower = (item: any): string | null => {
    const haystack = `${item.name} ${item.model || ""} ${item.specs || ""} ${item.description || ""}`.toLowerCase();
    if (/380\s*v/.test(haystack)) return "380V";
    if (/220\s*v/.test(haystack)) return "220V";
    if (/240\s*v/.test(haystack)) return "220V";
    if (/110\s*v/.test(haystack)) return "110V";
    if (/80\s*v/.test(haystack)) return "80V";
    if (/40\s*v/.test(haystack)) return "40V";
    if (/36\s*v/.test(haystack)) return "36V";
    if (/20\s*v/.test(haystack)) return "18V";
    if (/18\s*v/.test(haystack)) return "18V";
    if (/12\s*v/.test(haystack)) return "18V";
    if (/cordless/.test(haystack)) return "18V";
    return null;
  };

  // Active category/sub objects
  const activeCategory = useMemo(() =>
    activeCategorySlug ? categoriesQ.data?.find(c => c.slug === activeCategorySlug) ?? null : null,
    [activeCategorySlug, categoriesQ.data]
  );

  const activeSubCategory = useMemo(() =>
    activeSubSlug && activeCategory
      ? (activeCategory as any).subCategories?.find((s: any) => s.slug === activeSubSlug) ?? null
      : null,
    [activeSubSlug, activeCategory]
  );

  // Filtered + sorted items
  const filteredItems = useMemo(() => {
    if (!equipmentQ.data) return [];
    let items = [...equipmentQ.data];

    // Search (check both English and Chinese names)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        ((i as any).nameZh || "").toLowerCase().includes(q) ||
        (i.brand || "").toLowerCase().includes(q) ||
        (i.model || "").toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q)
      );
    }

    // Category
    if (activeCategory) items = items.filter(i => i.categoryId === activeCategory.id);

    // Sub-category
    if (activeSubCategory) items = items.filter(i => i.subCategoryId === activeSubCategory.id);

    // Brand
    if (activeBrand) items = items.filter(i => i.brand === activeBrand);

    // Availability
    if (availabilityFilter === "available") {
      items = items.filter(i => (i.availableQty ?? i.quantity ?? 0) > 0);
    }

    // Power supply filter
    if (powerFilter) {
      items = items.filter(i => detectPower(i) === powerFilter);
    }

    // Sort
    if (sortBy === "price_asc") {
      items.sort((a, b) => (parseFloat(String(a.dailyRate || 0)) - parseFloat(String(b.dailyRate || 0))));
    } else if (sortBy === "price_desc") {
      items.sort((a, b) => (parseFloat(String(b.dailyRate || 0)) - parseFloat(String(a.dailyRate || 0))));
    } else {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [equipmentQ.data, searchQuery, activeCategory, activeSubCategory, activeBrand, availabilityFilter, sortBy, powerFilter]);

  // Power supply counts for filter chips
  const powerCounts = useMemo(() => {
    if (!equipmentQ.data) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    for (const item of equipmentQ.data) {
      const p = detectPower(item);
      if (p) counts[p] = (counts[p] || 0) + 1;
    }
    return counts;
  }, [equipmentQ.data]);

  const POWER_OPTIONS = ["18V", "36V", "40V", "80V", "110V", "220V", "380V"];

  const hasFilter = !!(activeCategorySlug || activeBrand || searchQuery || availabilityFilter !== "all" || powerFilter);

  const clearFilters = () => {
    setActiveCategorySlug(null);
    setActiveSubSlug(null);
    setActiveBrand(null);
    setSearchQuery("");
    setAvailabilityFilter("all");
    setPowerFilter(null);
  };

  const isLoading = equipmentQ.isLoading || categoriesQ.isLoading;

  const activeCatName = activeCategory?.name || "";
  const seoTitle = activeCatName ? `${activeCatName} Hire` : "Equipment Hire";
  const seoDesc = activeCatName
    ? `Rent ${activeCatName} in Hong Kong from EquipHK. Competitive daily rates, fast delivery, and inspection-ready equipment for DIY to Tier-1 contractors.`
    : "Browse Hong Kong's largest equipment rental catalogue. Power tools, construction plant, and specialist equipment from HK$85/day. Fast delivery across HK.";

  const itemCountText = (count: number) =>
    t(
      `${count} item${count !== 1 ? "s" : ""} available for hire`,
      `${count} 件設備可供租借`
    );

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        zhDescription="瀏覽EquipHK全部器材租賃存貨，包括電動工具、重型機械、發電機、高空作業平台及安全設備。全港即日送貨。"
        url="/equipment"
      />
      <Navbar />

      <main className="flex-1">
        {/* Page Header */}
        <div className="bg-navy-deep border-b border-white/10 py-10">
          <div className="container">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-cream/40 text-xs mb-4 font-[Oswald] uppercase tracking-wider">
              <span className="cursor-pointer hover:text-orange transition-colors" onClick={() => navigate("/")}>{tk("breadcrumb_home")}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-cream/70">{tk("breadcrumb_equipment")}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
              <div>
                {activeCategory ? (
                  <>
                    <div className="flex items-center gap-3 mb-1">
                      <button
                        onClick={() => { setActiveCategorySlug(null); setActiveSubSlug(null); }}
                        className="text-xs text-cream/40 hover:text-orange font-[Oswald] uppercase tracking-wider transition-colors"
                      >
                        ← {tk("cat_all_equipment")}
                      </button>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white font-[Oswald] uppercase tracking-wider">
                      {activeSubCategory
                        ? <>{activeCategory.name} <span className="text-orange">{(activeSubCategory as any).name}</span></>
                        : <>{activeCategory.name.split(" ").slice(0, -1).join(" ") || activeCategory.name}{" "}<span className="text-orange">{activeCategory.name.split(" ").slice(-1)[0]}</span></>
                      }
                    </h1>
                    <p className="text-cream/50 mt-2 text-sm font-[Source_Sans_3]">
                      {isLoading
                        ? tk("common_loading")
                        : filteredItems.length === 0
                          ? t("No items found — try clearing filters", "找不到項目——請嘗試清除篩選條件")
                          : itemCountText(filteredItems.length)
                      }
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-4xl md:text-5xl font-bold text-white font-[Oswald] uppercase tracking-wider">
                      {t("Equipment", "設備")} <span className="text-orange">{t("Catalogue", "目錄")}</span>
                    </h1>
                    <p className="text-cream/50 mt-2 text-sm font-[Source_Sans_3]">
                      {isLoading ? tk("common_loading") : itemCountText(filteredItems.length)}
                    </p>
                  </>
                )}
              </div>

              {/* Search bar */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" />
                <input
                  type="text"
                  placeholder={tk("cat_search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-navy border border-white/15 focus:border-orange/50 rounded-md pl-10 pr-4 py-2.5 text-white placeholder:text-cream/30 text-sm outline-none transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream/70">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8">
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3 items-center mb-6">
            {/* Category tabs */}
            <div className="flex gap-2 flex-wrap flex-1">
              <button
                onClick={() => { setActiveCategorySlug(null); setActiveSubSlug(null); }}
                className={`px-3 py-1.5 text-xs font-[Oswald] uppercase tracking-wider rounded transition-all ${
                  !activeCategorySlug
                    ? "bg-orange text-white"
                    : "bg-white/5 text-cream/60 hover:bg-white/10 hover:text-cream"
                }`}
              >
                {tk("common_all")}
              </button>
              {categoriesQ.data?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategorySlug(cat.slug); setActiveSubSlug(null); }}
                  className={`px-3 py-1.5 text-xs font-[Oswald] uppercase tracking-wider rounded transition-all ${
                    activeCategorySlug === cat.slug
                      ? "bg-orange text-white"
                      : "bg-white/5 text-cream/60 hover:bg-white/10 hover:text-cream"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-[Oswald] uppercase tracking-wider rounded border transition-all ${
                showFilters ? "border-orange text-orange bg-orange/10" : "border-white/15 text-cream/50 hover:border-white/30"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {tk("common_filter")}
            </button>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-36 h-8 text-xs bg-white/5 border-white/15 text-cream/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{tk("sort_name_az")}</SelectItem>
                <SelectItem value="price_asc">{tk("sort_price_low")}</SelectItem>
                <SelectItem value="price_desc">{tk("sort_price_high")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-navy-light border border-white/10 rounded-lg p-4 mb-6 flex flex-wrap gap-4">
                  {/* Brand filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-cream/40 text-[10px] uppercase tracking-wider font-[Oswald]">{tk("filter_brand")}</label>
                    <Select value={activeBrand || "__all__"} onValueChange={(v) => setActiveBrand(v === "__all__" ? null : v)}>
                      <SelectTrigger className="w-44 h-8 text-xs bg-navy border-white/15 text-cream/70">
                        <SelectValue placeholder={tk("filter_all_brands")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{tk("filter_all_brands")}</SelectItem>
                        {(brandsQ.data ?? []).map((b: string) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Availability filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-cream/40 text-[10px] uppercase tracking-wider font-[Oswald]">{tk("filter_availability")}</label>
                    <Select value={availabilityFilter} onValueChange={(v) => setAvailabilityFilter(v as any)}>
                      <SelectTrigger className="w-44 h-8 text-xs bg-navy border-white/15 text-cream/70">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{tk("filter_all_items")}</SelectItem>
                        <SelectItem value="available">{tk("filter_available_now")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Power supply filter */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-cream/40 text-[10px] uppercase tracking-wider font-[Oswald] flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {tk("filter_power_supply")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {POWER_OPTIONS.filter(p => (powerCounts[p] || 0) > 0).map(p => (
                        <button
                          key={p}
                          onClick={() => setPowerFilter(powerFilter === p ? null : p)}
                          className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full border transition-all ${
                            powerFilter === p
                              ? "border-orange bg-orange/20 text-orange font-bold"
                              : "border-white/15 text-cream/50 hover:border-orange/40 hover:text-cream"
                          }`}
                        >
                          <Zap className="w-2.5 h-2.5" />
                          {p}
                          <span className="text-[10px] opacity-60">({powerCounts[p]})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sub-category chips (when a category is selected) */}
          {activeCategory && (activeCategory as any).subCategories?.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              <button
                onClick={() => setActiveSubSlug(null)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  !activeSubSlug
                    ? "border-orange bg-orange/10 text-orange"
                    : "border-white/15 text-cream/50 hover:border-white/30"
                }`}
              >
                {t("All", "全部")} {activeCategory.name}
              </button>
              {(activeCategory as any).subCategories.map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubSlug(sub.slug)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    activeSubSlug === sub.slug
                      ? "border-orange bg-orange/10 text-orange"
                      : "border-white/15 text-cream/50 hover:border-white/30"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          {/* Active filter badges */}
          {hasFilter && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-cream/40 text-xs">{tk("filter_active_label")}</span>
              {activeCategorySlug && (
                <span className="flex items-center gap-1 bg-orange/10 border border-orange/30 text-orange text-xs px-2 py-0.5 rounded-full">
                  <Tag className="w-3 h-3" />
                  {activeCategory?.name}
                  <button onClick={() => { setActiveCategorySlug(null); setActiveSubSlug(null); }}>
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
              {activeBrand && (
                <span className="flex items-center gap-1 bg-orange/10 border border-orange/30 text-orange text-xs px-2 py-0.5 rounded-full">
                  {activeBrand}
                  <button onClick={() => setActiveBrand(null)}>
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="flex items-center gap-1 bg-orange/10 border border-orange/30 text-orange text-xs px-2 py-0.5 rounded-full">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery("")}>
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
              {powerFilter && (
                <span className="flex items-center gap-1 bg-orange/10 border border-orange/30 text-orange text-xs px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3" />
                  {powerFilter}
                  <button onClick={() => setPowerFilter(null)}>
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
              <button onClick={clearFilters} className="text-cream/40 hover:text-cream/70 text-xs underline">
                {tk("filter_clear_all")}
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-navy-light border border-white/10 rounded-lg overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-white/5" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredItems.length === 0 && (
            <div className="flex justify-center py-16">
              <div className="bg-navy-light border border-white/10 rounded-lg p-10 max-w-md w-full text-center shadow-lg">
                <div className="w-16 h-16 rounded-full bg-orange/10 border border-orange/20 flex items-center justify-center mx-auto mb-5">
                  <Package className="w-8 h-8 text-orange/60" />
                </div>

                <h3 className="text-white font-[Oswald] text-2xl uppercase tracking-wider mb-2">
                  {tk("empty_no_items")}
                </h3>

                <p className="text-cream/50 text-sm font-[Source_Sans_3] mb-6 leading-relaxed">
                  {hasFilter
                    ? t("Nothing matches your current filters. Try broadening your search or browse the full catalogue.", "沒有符合您目前篩選條件的項目。請嘗試擴大搜尋範圍或瀏覽完整目錄。")
                    : t("No equipment is currently listed. Check back soon.", "目前沒有列出任何設備，請稍後再查看。")}
                </p>

                {hasFilter && (
                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {activeCategorySlug && (
                      <span className="px-2.5 py-1 bg-orange/10 border border-orange/20 rounded text-xs text-orange font-[Oswald] uppercase tracking-wider">
                        {activeCategory?.name ?? activeCategorySlug}
                      </span>
                    )}
                    {activeSubSlug && (
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-xs text-cream/60 font-[Source_Sans_3]">
                        {(activeSubCategory as any)?.name ?? activeSubSlug}
                      </span>
                    )}
                    {searchQuery && (
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-xs text-cream/60 font-[Source_Sans_3]">
                        "{searchQuery}"
                      </span>
                    )}
                    {activeBrand && (
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-xs text-cream/60 font-[Source_Sans_3]">
                        {activeBrand}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={clearFilters}
                    className="bg-orange hover:bg-orange/90 text-white font-[Oswald] uppercase tracking-wider px-6"
                  >
                    {tk("cat_browse_all")}
                  </Button>
                  {hasFilter && (
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="border-white/20 text-cream/60 hover:text-cream hover:border-white/40 font-[Source_Sans_3]"
                    >
                      {tk("filter_clear_all")}
                    </Button>
                  )}
                </div>

                <div className="mt-5 pt-5 border-t border-white/10">
                  <p className="text-cream/40 text-xs font-[Source_Sans_3] mb-2">
                    {t("Can't find what you need?", "找不到所需設備？")}
                  </p>
                  <a
                    href={`mailto:info@equip.hk?subject=${encodeURIComponent(
                      searchQuery
                        ? `Equipment Request: ${searchQuery}`
                        : activeCategory
                          ? `Equipment Request: ${activeCategory.name}${(activeSubCategory as any)?.name ? ` — ${(activeSubCategory as any).name}` : ""}`
                          : "Equipment Request"
                    )}&body=${encodeURIComponent(
                      `Hi EquipHK,\n\nI was looking for the following equipment but couldn't find it on your website:\n\n` +
                      (searchQuery ? `Item: ${searchQuery}\n` : "") +
                      (activeCategory ? `Category: ${activeCategory.name}\n` : "") +
                      ((activeSubCategory as any)?.name ? `Sub-category: ${(activeSubCategory as any).name}\n` : "") +
                      (activeBrand ? `Brand: ${activeBrand}\n` : "") +
                      `\nCould you let me know if this is available or when it might be in stock?\n\nThanks`
                    )}`}
                    className="inline-flex items-center gap-1.5 text-sm text-orange hover:text-orange/80 font-[Oswald] uppercase tracking-wider transition-colors group"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {t("Request This Item", "申請此設備")}
                    <span className="text-cream/30 group-hover:text-orange/60 transition-colors normal-case font-[Source_Sans_3] tracking-normal text-xs">
                      info@equip.hk
                    </span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Equipment grid */}
          {!isLoading && filteredItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredItems.map((item, index) => (
                <EquipmentCard
                  key={item.id}
                  item={item}
                  index={index}
                  favouriteIds={favouriteIds}
                  onToggleFavourite={handleToggleFavourite}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recently Viewed */}
        <RecentlyViewedSection />

        {/* CTA Banner */}
        <div className="bg-orange py-12">
          <div className="container text-center">
            <h2 className="text-3xl font-bold text-white font-[Oswald] uppercase tracking-wider mb-2">
              {t("Can't find what you need?", "找不到所需設備？")}
            </h2>
            <p className="text-white/80 mb-6 text-sm">
              {t(
                "We source specialist equipment for Tier-1 contractors. Get in touch for a custom quote.",
                "我們為一級承建商採購專業設備，歡迎聯絡我們索取度身訂造的報價。"
              )}
            </p>
            <Button
              onClick={() => navigate("/get-a-quote")}
              className="bg-white text-orange hover:bg-cream font-[Oswald] uppercase tracking-wider px-8 h-12"
            >
              {tk("hero_cta_quote")}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
      <ComparisonModal isOpen={showComparison} onClose={() => setShowComparison(false)} />
    </div>
  );
}
