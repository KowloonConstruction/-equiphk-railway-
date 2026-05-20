/**
 * Equipment Bundles / Kits Browse Page
 * Matches Equip.HK neo-brutalist industrial design
 * Includes search, category filter, and sort functionality
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Package,
  ArrowLeft,
  Filter,
  Percent,
  ChevronRight,
  Wrench,
  Search,
  X,
  ArrowUpDown,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_LABELS: Record<string, string> = {
  waterproofing: "Waterproofing",
  surface_prep: "Surface Preparation",
  concrete: "Concrete & Formwork",
};

type SortOption = "name_asc" | "name_desc" | "price_asc" | "price_desc" | "savings_desc" | "items_desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "savings_desc", label: "Biggest Savings" },
  { value: "items_desc", label: "Most Items" },
];

export default function Bundles() {
  const [, navigate] = useLocation();
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("savings_desc");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { data: allBundles, isLoading } = trpc.bundles.list.useQuery({});

  const toNumber = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value);
    if (value && typeof value === "object" && "d" in value) return parseFloat(value.d);
    return 0;
  };

  const categoryTags = useMemo(() => {
    if (!allBundles) return [];
    const tags = new Set(allBundles.map((b: any) => b.categoryTag).filter(Boolean));
    return Array.from(tags).sort();
  }, [allBundles]);

  const filteredAndSortedBundles = useMemo(() => {
    if (!allBundles) return [];

    let results = [...allBundles];

    // Filter by category
    if (activeTag) {
      results = results.filter((b: any) => b.categoryTag === activeTag);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter((b: any) => {
        const name = (b.name || "").toLowerCase();
        const desc = (b.description || "").toLowerCase();
        const cat = (CATEGORY_LABELS[b.categoryTag] || b.categoryTag || "").toLowerCase();
        return name.includes(q) || desc.includes(q) || cat.includes(q);
      });
    }

    // Sort
    results.sort((a: any, b: any) => {
      switch (sortBy) {
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name_desc":
          return (b.name || "").localeCompare(a.name || "");
        case "price_asc":
          return toNumber(a.dailyRate) - toNumber(b.dailyRate);
        case "price_desc":
          return toNumber(b.dailyRate) - toNumber(a.dailyRate);
        case "savings_desc":
          return (b.savingsPercent || 0) - (a.savingsPercent || 0);
        case "items_desc":
          return (b.itemCount || 0) - (a.itemCount || 0);
        default:
          return 0;
      }
    });

    return results;
  }, [allBundles, activeTag, searchQuery, sortBy]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort";
  const hasActiveFilters = !!activeTag || !!searchQuery.trim();

  const clearAllFilters = () => {
    setActiveTag(null);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col">
      <SEOHead
        title="Equipment Bundle Hire"
        description="Save on equipment rental with EquipHK's ready-made bundles. Pre-matched tool kits for construction, renovation, and specialist projects across Hong Kong. Get a quote online."
        zhDescription="以EquipHK的專屬套装笍省器材租賃費用。適合建築、裝修及專準工程的預配套装工具組，全港即日送貨。"
        url="/bundles"
      />
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-navy-light border-b border-white/10 pt-20">
        <div className="container py-10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-cream/50 hover:text-orange text-xs font-[Oswald] uppercase tracking-wider mb-6 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Home
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange/20 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-orange" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white font-[Oswald] uppercase tracking-wider">
                Equipment Bundles
              </h1>
              <p className="text-cream/50 text-sm mt-1">
                Pre-packaged rental kits — everything you need for the job, at a discounted bundle price
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filters + Sort Bar */}
      <div className="container py-6 space-y-4">
        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bundles by name, description, or category..."
              className="w-full pl-10 pr-10 py-2.5 bg-navy-light border border-white/10 rounded-lg text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-orange/50 focus:ring-1 focus:ring-orange/20 transition-all font-[Source_Sans_3]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-4 py-2.5 bg-navy-light border border-white/10 rounded-lg text-sm text-cream/70 hover:text-cream hover:border-orange/30 transition-all font-[Source_Sans_3] whitespace-nowrap"
            >
              <ArrowUpDown className="w-4 h-4 text-cream/40" />
              {currentSortLabel}
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-30 bg-navy-light border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[200px]"
                >
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-[Source_Sans_3] transition-colors ${
                        sortBy === option.value
                          ? "bg-orange/20 text-orange"
                          : "text-cream/70 hover:bg-white/5 hover:text-cream"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Category filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-cream/40 shrink-0" />
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1.5 rounded-md text-xs font-[Oswald] uppercase tracking-wider transition-all ${
              !activeTag
                ? "bg-orange text-white"
                : "bg-navy-light text-cream/60 hover:text-cream border border-white/10"
            }`}
          >
            All ({allBundles?.length || 0})
          </button>
          {categoryTags.map((tag) => {
            const count = allBundles?.filter((b: any) => b.categoryTag === tag).length || 0;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-md text-xs font-[Oswald] uppercase tracking-wider transition-all ${
                  activeTag === tag
                    ? "bg-orange text-white"
                    : "bg-navy-light text-cream/60 hover:text-cream border border-white/10"
                }`}
              >
                {CATEGORY_LABELS[tag] || tag} ({count})
              </button>
            );
          })}
        </div>

        {/* Results count + clear filters */}
        <div className="flex items-center justify-between">
          <p className="text-cream/40 text-xs font-[Source_Sans_3]">
            {filteredAndSortedBundles.length === allBundles?.length
              ? `Showing all ${filteredAndSortedBundles.length} bundles`
              : `Showing ${filteredAndSortedBundles.length} of ${allBundles?.length || 0} bundles`}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-orange/70 hover:text-orange font-[Source_Sans_3] flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Bundle Grid */}
      <div className="container pb-20 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin" />
              <p className="text-cream/70">Loading bundles...</p>
            </div>
          </div>
        ) : filteredAndSortedBundles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="w-16 h-16 text-cream/20 mb-4" />
            <h3 className="text-xl font-bold text-cream/60 font-[Oswald] mb-2">No Bundles Found</h3>
            <p className="text-cream/40 text-sm mb-6">
              {searchQuery
                ? `No bundles match "${searchQuery}"`
                : "No bundles available in this category yet."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="border-orange/30 text-orange hover:bg-orange/10"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedBundles.map((bundle: any, index: number) => {
              const daily = toNumber(bundle.dailyRate);
              const weekly = toNumber(bundle.weeklyRate);
              return (
                <motion.div
                  key={bundle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  onClick={() => navigate(`/bundle/${bundle.id}`)}
                  className="group bg-navy-light border border-white/10 hover:border-orange/50 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-orange/5 relative"
                >
                  {/* Savings badge */}
                  {bundle.savingsPercent > 0 && (
                    <div className="absolute top-3 right-3 z-10 bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 font-[Oswald] uppercase tracking-wider">
                      <Percent className="w-3 h-3" />
                      Save {bundle.savingsPercent}%
                    </div>
                  )}

                  {/* Image / Icon area */}
                  <div className="aspect-[16/9] bg-gradient-to-br from-navy-deep to-navy-light flex items-center justify-center p-6 relative overflow-hidden">
                    {bundle.imageUrl ? (
                      <img
                        src={bundle.imageUrl}
                        alt={bundle.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Package className="w-16 h-16 text-orange/30 group-hover:text-orange/50 transition-colors" />
                        <span className="text-cream/20 text-xs font-[Oswald] uppercase tracking-widest">Bundle Kit</span>
                      </div>
                    )}
                    {/* Category tag */}
                    {bundle.categoryTag && (
                      <span className="absolute bottom-3 left-3 bg-black/50 text-cream/70 text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-[Oswald] backdrop-blur-sm">
                        {CATEGORY_LABELS[bundle.categoryTag] || bundle.categoryTag}
                      </span>
                    )}
                    {/* Item count badge */}
                    {bundle.itemCount > 0 && (
                      <span className="absolute top-3 left-3 bg-navy-deep/80 text-cream/70 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-[Oswald] backdrop-blur-sm">
                        <Wrench className="w-2.5 h-2.5" />
                        {bundle.itemCount} tools
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white font-[Oswald] uppercase tracking-wider mb-2 group-hover:text-orange transition-colors leading-tight">
                      {bundle.name}
                    </h3>
                    <p className="text-cream/50 text-sm line-clamp-3 mb-4 leading-relaxed">
                      {bundle.description}
                    </p>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-3 mb-4 pt-3 border-t border-white/5">
                      <div>
                        <span className="text-orange font-bold text-xl font-[Oswald]">
                          {daily > 0 ? `HK$${Math.round(daily).toLocaleString("en-HK")}` : "POA"}
                        </span>
                        <span className="text-cream/40 text-xs ml-1">/day</span>
                      </div>
                      {weekly > 0 && (
                        <div className="text-cream/40 text-xs">
                          HK${Math.round(weekly).toLocaleString("en-HK")}/week
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between">
                      <span className="text-cream/40 text-xs flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        View included tools
                      </span>
                      <ChevronRight className="w-4 h-4 text-orange/50 group-hover:text-orange group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
