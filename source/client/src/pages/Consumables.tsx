/*
 * Consumables Browse Page — lists all consumable products for sale
 * Matches Equip.HK neo-brutalist industrial design
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Beaker,
  Search,
  ShoppingBag,
  Package,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

// Category tag display mapping — English labels (Chinese handled via t())
const CATEGORY_LABELS_EN: Record<string, string> = {
  waterproofing: "Waterproofing",
  surface_prep: "Surface Preparation",
  concrete: "Concrete & Formwork",
  general: "General",
};

const CATEGORY_LABELS_ZH: Record<string, string> = {
  waterproofing: "防水材料",
  surface_prep: "表面處理",
  concrete: "混凝土及模板",
  general: "一般用品",
};

export default function Consumables() {
  const [, navigate] = useLocation();
  const { tk, t, pickLang, lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data: allConsumables, isLoading } = trpc.consumables.list.useQuery({});

  const toNumber = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value);
    if (value && typeof value === "object" && "d" in value) return parseFloat(value.d);
    return 0;
  };

  // Get category label in current language
  const getCategoryLabel = (tag: string) => {
    if (lang === "zh") return CATEGORY_LABELS_ZH[tag] || tag;
    return CATEGORY_LABELS_EN[tag] || tag;
  };

  // Get unique category tags from data
  const categoryTags = useMemo(() => {
    if (!allConsumables) return [];
    const tags = new Set(allConsumables.map((c: any) => c.categoryTag).filter(Boolean));
    return Array.from(tags).sort();
  }, [allConsumables]);

  // Filter consumables by search and category
  const filteredConsumables = useMemo(() => {
    if (!allConsumables) return [];
    return allConsumables.filter((c: any) => {
      const matchesTag = !activeTag || c.categoryTag === activeTag;
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((c.nameZh || "").toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.brand && c.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTag && matchesSearch;
    });
  }, [allConsumables, activeTag, searchQuery]);

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col">
      <SEOHead
        title="Consumables & Supplies"
        description="Buy construction consumables and supplies from EquipHK Hong Kong. Blades, fixings, adhesives, PPE, and more. Fast delivery across HK. Order online or get a quote."
        zhDescription="在EquipHK購買建築耗材及輔助用品，包括切片、固定件、黏合劑及個人防護裝備等。全港即日送貨。"
        url="/consumables"
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
            {t("Back to Home", "返回主頁")}
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange/20 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-orange" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white font-[Oswald] uppercase tracking-wider">
                {t("Consumables", "耗材")}
              </h1>
              <p className="text-cream/50 text-sm mt-1">
                {t(
                  "Purchase supplies and materials to use with your rental equipment",
                  "購買配合租借設備使用的耗材及物料"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="container py-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" />
            <input
              type="text"
              placeholder={t("Search consumables...", "搜尋耗材...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-navy-light border border-white/10 rounded-lg text-cream text-sm placeholder:text-cream/30 focus:outline-none focus:border-orange/50 transition-colors"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-cream/40" />
            <button
              onClick={() => setActiveTag(null)}
              className={`px-3 py-1.5 rounded-md text-xs font-[Oswald] uppercase tracking-wider transition-all ${
                !activeTag
                  ? "bg-orange text-white"
                  : "bg-navy-light text-cream/60 hover:text-cream border border-white/10"
              }`}
            >
              {tk("common_all")} ({allConsumables?.length || 0})
            </button>
            {categoryTags.map((tag) => {
              const count = allConsumables?.filter((c: any) => c.categoryTag === tag).length || 0;
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
                  {getCategoryLabel(tag)} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="container pb-20 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin" />
              <p className="text-cream/70">{tk("common_loading")}</p>
            </div>
          </div>
        ) : filteredConsumables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Beaker className="w-16 h-16 text-cream/20 mb-4" />
            <h3 className="text-xl font-bold text-cream/60 font-[Oswald] mb-2">
              {t("No Consumables Found", "找不到耗材")}
            </h3>
            <p className="text-cream/40 text-sm mb-6">
              {searchQuery
                ? t("Try adjusting your search terms.", "請嘗試調整搜尋關鍵字。")
                : tk("consumables_empty")}
            </p>
            {(searchQuery || activeTag) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTag(null);
                }}
                className="border-orange/30 text-orange hover:bg-orange/10"
              >
                {tk("filter_clear_all")}
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-cream/40 text-xs mb-6">
              {t(
                `Showing ${filteredConsumables.length} product${filteredConsumables.length !== 1 ? "s" : ""}`,
                `顯示 ${filteredConsumables.length} 件產品`
              )}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredConsumables.map((consumable: any, index: number) => {
                const price = toNumber(consumable.price);
                const displayName = pickLang(consumable.name, consumable.nameZh);
                return (
                  <motion.div
                    key={consumable.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    onClick={() => navigate(`/consumable/${consumable.id}`)}
                    className="group bg-navy-light border border-white/10 hover:border-orange/50 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-orange/5"
                  >
                    {/* Image */}
                    <div className="aspect-square bg-white overflow-hidden flex items-center justify-center p-4 relative">
                      {consumable.imageUrl ? (
                        <img
                          src={consumable.imageUrl}
                          alt={displayName}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Beaker className="w-12 h-12 text-orange/20" />
                      )}
                      {/* For Sale badge */}
                      <span className="absolute top-2 left-2 bg-orange/90 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest font-[Oswald]">
                        {t("For Sale", "發售中")}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      {consumable.brand && (
                        <p className="text-[10px] text-cream/40 uppercase tracking-wider font-[Oswald] mb-1">
                          {consumable.brand}
                        </p>
                      )}
                      <h3 className="text-sm font-bold text-white font-[Oswald] mb-2 line-clamp-2 group-hover:text-orange transition-colors leading-tight">
                        {displayName}
                      </h3>

                      {/* Category tag */}
                      {consumable.categoryTag && (
                        <span className="inline-block bg-white/5 text-cream/40 text-[9px] px-2 py-0.5 rounded mb-3 uppercase tracking-wider font-[Oswald]">
                          {getCategoryLabel(consumable.categoryTag)}
                        </span>
                      )}

                      {/* Price */}
                      <div className="flex items-baseline justify-between mt-auto pt-2 border-t border-white/5">
                        <span className="text-orange font-bold text-base font-[Oswald]">
                          {price > 0 ? `HK$${Math.round(price).toLocaleString("en-HK")}` : tk("consumables_poa")}
                        </span>
                        <span className="text-cream/30 text-[10px]">
                          {t("per", "每")} {consumable.unit || t("unit", "件")}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
