/**
 * RecentlyViewedSection — shows equipment cards the user has previously viewed
 * Renders a horizontal scrollable row of cards, newest first.
 * Only shown when there is at least one item in history.
 */
import { useLocation } from "wouter";
import { Clock, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { motion } from "framer-motion";
import { formatHKD } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RecentlyViewedSection() {
  const { items, clear } = useRecentlyViewed();
  const [, navigate] = useLocation();
  const { tk, t, pickLang } = useLanguage();

  if (items.length === 0) return null;

  return (
    <section className="py-12 bg-navy border-t border-white/5">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-orange" />
            <h2 className="text-2xl font-bold text-white font-[Oswald] uppercase tracking-wider">
              {t("Recently Viewed", "最近瀏覽")}
            </h2>
          </div>
          <button
            onClick={clear}
            className="flex items-center gap-1.5 text-cream/40 hover:text-cream/70 text-xs transition-colors"
            title={t("Clear history", "清除歷史記錄")}
          >
            <X className="w-3.5 h-3.5" />
            {t("Clear", "清除")}
          </button>
        </div>

        {/* Horizontal scroll row */}
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {items.map((item, index) => {
            const daily = typeof item.dailyRate === "string"
              ? parseFloat(item.dailyRate)
              : (item.dailyRate ?? null);

            const displayName = pickLang(item.name, (item as any).nameZh);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                onClick={() => navigate(`/equipment/${item.id}`)}
                className="group flex-shrink-0 w-44 bg-navy-light border border-white/10 hover:border-orange/40 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-orange/10"
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-white overflow-hidden flex items-center justify-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={displayName}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-navy-light flex items-center justify-center">
                      <span className="text-cream/20 text-xs font-[Oswald] uppercase">{t("No Image", "無圖片")}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  {item.brand && (
                    <p className="text-orange text-[10px] font-bold uppercase tracking-wider truncate mb-0.5">
                      {item.brand}
                    </p>
                  )}
                  <p className="text-white text-xs font-semibold font-[Oswald] leading-tight line-clamp-2 mb-2">
                    {displayName}
                  </p>

                  {/* Price */}
                  {daily !== null && daily > 0 ? (
                    <p className="text-orange text-xs font-bold">
                      {formatHKD(daily)}
                      <span className="text-cream/40 font-normal">{tk("per_day")}</span>
                    </p>
                  ) : (
                    <p className="text-cream/40 text-xs">{tk("poa")}</p>
                  )}

                  {/* Availability dot */}
                  <div className="flex items-center gap-1 mt-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.availableQty > 0 ? "bg-green-400" : "bg-red-400"}`} />
                    <span className={`text-[10px] ${item.availableQty > 0 ? "text-green-300" : "text-red-300"}`}>
                      {item.availableQty > 0 ? tk("available") : tk("out_of_stock")}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* View All Equipment CTA card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: items.length * 0.05 }}
            onClick={() => navigate("/equipment")}
            className="flex-shrink-0 w-44 border border-dashed border-white/15 hover:border-orange/30 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 hover:bg-orange/5 min-h-[160px]"
          >
            <ArrowRight className="w-6 h-6 text-cream/30" />
            <span className="text-cream/40 text-xs font-[Oswald] uppercase tracking-wider text-center px-3">
              {tk("cat_browse_all")}
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
