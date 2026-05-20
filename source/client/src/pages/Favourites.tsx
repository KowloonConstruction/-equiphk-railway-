/*
 * Equip.HK Favourites Page
 * Shows all items the logged-in user has saved with heart buttons
 */
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Heart, Package, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Favourites() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const favouritesQ = trpc.favourites.list.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const toggleMutation = trpc.favourites.toggle.useMutation({
    onSuccess: (data) => {
      utils.favourites.list.invalidate();
      utils.favourites.ids.invalidate();
      if (!data.requiresLogin) {
        toast.success(data.favourited ? "Added to favourites" : "Removed from favourites");
      }
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-concrete">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-orange" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-concrete">
        <Navbar />
        <div className="container py-24 text-center">
          <Heart className="w-16 h-16 text-steel/30 mx-auto mb-6" />
          <h1 className="text-3xl font-bold font-[Oswald] uppercase text-navy-deep mb-4">
            Your Favourites
          </h1>
          <p className="text-steel mb-8 max-w-md mx-auto">
            Sign in to save equipment items to your favourites list for quick access.
          </p>
          <Button
            className="bg-orange hover:bg-orange/90 text-white font-[Oswald] uppercase tracking-wide"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Sign In to View Favourites
          </Button>
        </div>
      </div>
    );
  }

  const items = favouritesQ.data ?? [];

  return (
    <div className="min-h-screen bg-concrete">
      <SEOHead title="My Favourites" description="Your saved equipment from EquipHK Hong Kong." url="/favourites" />
      <Navbar />
      <div className="container py-16">
        {/* Header */}
        <div className="relative mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <h1 className="text-3xl font-bold font-[Oswald] uppercase text-navy-deep tracking-wide">
              Your Favourites
            </h1>
          </div>
          <p className="text-steel">
            {items.length > 0
              ? `${items.length} saved item${items.length !== 1 ? "s" : ""}`
              : "No saved items yet"}
          </p>
        </div>

        {/* Loading */}
        {favouritesQ.isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-orange" />
          </div>
        )}

        {/* Empty state */}
        {!favouritesQ.isLoading && items.length === 0 && (
          <div className="text-center py-24">
            <Heart className="w-16 h-16 text-steel/20 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-navy-deep font-[Oswald] uppercase mb-3">
              Nothing saved yet
            </h2>
            <p className="text-steel mb-8 max-w-sm mx-auto">
              Browse our equipment catalogue and tap the heart icon on any item to save it here.
            </p>
            <Button
              className="bg-orange hover:bg-orange/90 text-white font-[Oswald] uppercase tracking-wide"
              onClick={() => navigate("/")}
            >
              Browse Equipment
            </Button>
          </div>
        )}

        {/* Grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item, idx) => {
              const rate = item.dailyRate ? `HK$${Math.round(parseFloat(String(item.dailyRate))).toLocaleString("en-HK")}` : "Negotiated";
              const period = item.dailyRate ? "/day" : "rates";
              const desc = [item.brand, item.model].filter(Boolean).join(" ") || "Available for rent";

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="group relative bg-white border border-border hover:border-orange/40 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  <div className="h-1 w-0 group-hover:w-full bg-orange transition-all duration-300" />
                  <div className="p-5 flex-grow flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      {item.imageUrl ? (
                        <div className="w-16 h-16 overflow-hidden bg-slate-50 rounded p-1">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-navy-deep/5 flex items-center justify-center rounded">
                          <Package className="w-7 h-7 text-navy-deep" />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {/* Heart remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMutation.mutate({ equipmentItemId: item.id });
                          }}
                          className="p-1 rounded transition-colors hover:bg-red-50"
                          aria-label="Remove from favourites"
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </button>
                        <ArrowUpRight className="w-4 h-4 text-steel opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-navy-deep mb-1 font-[Oswald] uppercase tracking-wide line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-sm text-steel mb-4 leading-relaxed line-clamp-2 flex-grow">
                      {desc}
                    </p>
                    <div className="flex items-baseline gap-1 pt-3 border-t border-border">
                      <span className="font-data text-xl font-bold text-orange">{rate}</span>
                      <span className="font-data text-xs text-steel">{period}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
