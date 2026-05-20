/*
 * Equip.HK New Arrivals Section — Homepage
 * Shows the 8 most recently added equipment items with a CTA to the full catalogue.
 * Keeps the homepage focused and drives traffic to /equipment for browsing.
 */
import { useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Package,
  Heart,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatHKD } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const NEW_ARRIVALS_LIMIT = 8;

// ─── New Arrival Card ──────────────────────────────────────────────────────
function NewArrivalCard({ item, index, favouriteIds, onToggleFavourite }: {
  item: any;
  index: number;
  favouriteIds: number[];
  onToggleFavourite: (id: number) => void;
}) {
  const [, navigate] = useLocation();
  const { tk, pickLang } = useLanguage();
  const isFav = favouriteIds.includes(item.id);
  const rate = item.dailyRate ? formatHKD(item.dailyRate) : null;
  const isAvailable = (item.availableQty ?? item.quantity ?? 0) > 0;

  // Use Chinese name/description if available
  const displayName = pickLang(item.name, item.nameZh);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="group relative bg-white border border-border hover:border-orange/40 transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={() => navigate(`/equipment/${item.id}`)}
    >
      {/* Top accent bar */}
      <div className="h-1 w-0 group-hover:w-full bg-orange transition-all duration-300" />

      {/* Image */}
      <div className="aspect-[4/3] bg-concrete overflow-hidden flex items-center justify-center relative">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={displayName}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-concrete flex items-center justify-center">
            <Package className="w-10 h-10 text-steel/30" />
          </div>
        )}

        {/* NEW badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-orange text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-2.5 h-2.5" />
          {tk("badge_new")}
        </div>

        {/* Availability dot */}
        <div
          className={`absolute top-2 right-8 w-2 h-2 rounded-full ${isAvailable ? "bg-green-500" : "bg-red-500"}`}
          title={isAvailable ? tk("available") : tk("out_of_stock")}
        />

        {/* Favourite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavourite(item.id); }}
          className={`absolute top-1.5 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            isFav ? "bg-orange text-white" : "bg-white/80 text-steel hover:text-orange"
          }`}
        >
          <Heart className={`w-3 h-3 ${isFav ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        {item.brand && (
          <p className="text-orange text-[10px] font-bold uppercase tracking-wider truncate mb-0.5">
            {item.brand}
          </p>
        )}
        <h3 className="text-navy-deep text-sm font-semibold font-[Oswald] uppercase tracking-wide leading-tight line-clamp-2 mb-3">
          {displayName}
        </h3>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          {rate ? (
            <div className="flex items-baseline gap-1">
              <span className="text-orange font-bold text-base font-data">{rate}</span>
              <span className="text-steel text-xs">{tk("per_day")}</span>
            </div>
          ) : (
            <span className="text-steel text-sm">{tk("poa")}</span>
          )}
          <ArrowUpRight className="w-4 h-4 text-steel opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Section ──────────────────────────────────────────────────────────
export default function EquipmentSection() {
  const [, navigate] = useLocation();
  const { tk, t } = useLanguage();

  const equipmentQ = trpc.equipment.list.useQuery({ activeOnly: true }, { retry: false });
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

  // Sort by createdAt descending and take the latest N
  const newArrivals = useMemo(() => {
    if (!equipmentQ.data) return [];
    return [...equipmentQ.data]
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, NEW_ARRIVALS_LIMIT);
  }, [equipmentQ.data]);

  const totalCount = equipmentQ.data?.length ?? 0;

  return (
    <section id="equipment" className="py-20 lg:py-28 bg-concrete">
      <div className="container">
        {/* Section Header */}
        <div className="relative mb-10">
          <span className="section-number">01</span>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-orange" />
              <span className="text-orange font-data text-xs uppercase tracking-[0.2em]">
                {tk("equip_new_arrivals")}
              </span>
            </div>
            <div>
              <h2 className="text-3xl lg:text-5xl text-navy-deep leading-tight">
                {t("Just Added to", "最新加入")}
                <span className="text-orange"> {t("Our Fleet", "我們的車隊")}</span>
              </h2>
              <p className="mt-4 text-steel max-w-2xl text-lg">
                {t(
                  "Fresh stock, ready to hire. Browse our latest additions — from power tools to specialist plant.",
                  "全新存貨，即刻可租。瀏覽我們的最新添置——從電動工具到專業設備。"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {equipmentQ.isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: NEW_ARRIVALS_LIMIT }).map((_, i) => (
              <div key={i} className="bg-white border border-border rounded overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-concrete" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-border rounded w-1/2" />
                  <div className="h-4 bg-border rounded w-3/4" />
                  <div className="h-3 bg-border rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New arrivals grid */}
        {!equipmentQ.isLoading && newArrivals.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {newArrivals.map((item, idx) => (
              <NewArrivalCard
                key={item.id}
                item={item}
                index={idx}
                favouriteIds={favouriteIds}
                onToggleFavourite={handleToggleFavourite}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-steel mb-4 text-sm">
            {t(
              `Showing ${newArrivals.length} of ${totalCount} items in our catalogue`,
              `顯示目錄中 ${totalCount} 件商品中的 ${newArrivals.length} 件`
            )}
          </p>
          <Button
            onClick={() => navigate("/equipment")}
            variant="outline"
            className="font-[Oswald] uppercase tracking-wider border-navy-deep text-navy-deep hover:bg-navy-deep hover:text-white px-8 h-12"
          >
            {tk("equip_browse_full")}
            <ArrowUpRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
