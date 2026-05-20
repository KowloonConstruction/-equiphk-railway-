/**
 * Saved Carts (Job Kits) — Repeat Hire feature
 * Customers can save cart configurations and re-hire with one click
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCart, CartItem } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bookmark,
  Trash2,
  ShoppingCart,
  Pencil,
  Check,
  X,
  Package,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { getLoginUrl } from "@/const";

type SavedCartItem = {
  equipmentItemId: number;
  equipmentName: string;
  dailyRate: number;
  rentalDays: number;
  imageUrl?: string;
};

export default function SavedCarts() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const { addToCart, clearCart } = useCart();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: savedCarts = [], isLoading, refetch } = trpc.savedCarts.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.savedCarts.delete.useMutation({
    onSuccess: () => {
      toast.success("Job Kit deleted.");
      setDeletingId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const renameMutation = trpc.savedCarts.rename.useMutation({
    onSuccess: () => {
      toast.success("Job Kit renamed.");
      setEditingId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleLoadCart = (cart: { id: number; name: string; items: string }) => {
    try {
      const items: SavedCartItem[] = JSON.parse(cart.items);
      clearCart();
      items.forEach((item) => {
        addToCart({
          equipmentId: item.equipmentItemId,
          name: item.equipmentName,
          dailyRate: item.dailyRate,
          rentalDays: item.rentalDays,
          startDate: new Date().toISOString().split('T')[0],
          totalPrice: item.dailyRate * item.rentalDays,
          imageUrl: item.imageUrl ?? '',
        } as CartItem);
      });
      toast.success(`"${cart.name}" loaded into your cart!`);
      navigate("/cart");
    } catch {
      toast.error("Failed to load Job Kit.");
    }
  };

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f1e]">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Bookmark className="w-16 h-16 text-cream/20 mb-4" />
          <h2 className="text-white font-[Oswald] text-2xl uppercase mb-2">Sign In Required</h2>
          <p className="text-cream/50 mb-6">You need to be signed in to access your saved Job Kits.</p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="bg-orange hover:bg-orange/90 text-white">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/account")} className="text-cream/50 hover:text-cream transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-[Oswald] text-3xl uppercase tracking-wider">
              Saved Job Kits
            </h1>
            <p className="text-cream/50 text-sm mt-1">
              Save your frequently-used equipment sets and re-hire with one click.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange" />
          </div>
        ) : savedCarts.length === 0 ? (
          <Card className="bg-navy-light border-cream/10 p-12 text-center">
            <Bookmark className="w-12 h-12 text-cream/20 mx-auto mb-4" />
            <h3 className="text-white font-[Oswald] text-xl uppercase mb-2">No Job Kits Yet</h3>
            <p className="text-cream/50 text-sm mb-6">
              Fill your cart with equipment, then click "Save as Job Kit" at checkout to save it here for future re-hire.
            </p>
            <Button onClick={() => navigate("/equipment")} className="bg-orange hover:bg-orange/90 text-white">
              Browse Equipment
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
              {savedCarts.map((cart: any) => {
              let items: SavedCartItem[] = [];
              try { items = JSON.parse(cart.items); } catch {}
              const totalDaily = items.reduce((sum, i) => sum + (i.dailyRate * i.rentalDays), 0);

              return (
                <Card key={cart.id} className="bg-navy-light border-cream/10 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {editingId === cart.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="bg-navy-deep border-cream/20 text-white text-sm h-8 max-w-xs"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") renameMutation.mutate({ id: cart.id, name: editName });
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => renameMutation.mutate({ id: cart.id, name: editName })}
                              className="text-green-400 hover:text-green-300"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-cream/50 hover:text-cream">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-[Oswald] text-lg uppercase truncate">{cart.name}</h3>
                            <button
                              onClick={() => { setEditingId(cart.id); setEditName(cart.name); }}
                              className="text-cream/30 hover:text-cream/70 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <Badge className="bg-orange/20 text-orange border-orange/30 text-xs">
                            {items.length} item{items.length !== 1 ? "s" : ""}
                          </Badge>
                          <span className="text-cream/40 text-xs">
                            Saved {new Date(cart.createdAt).toLocaleDateString("en-HK", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {deletingId === cart.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-red-400 text-xs">Delete?</span>
                            <button
                              onClick={() => deleteMutation.mutate({ id: cart.id })}
                              className="text-red-400 hover:text-red-300 text-xs font-medium"
                            >
                              Yes
                            </button>
                            <button onClick={() => setDeletingId(null)} className="text-cream/50 hover:text-cream text-xs">No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(cart.id)}
                            className="text-cream/30 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleLoadCart(cart)}
                          className="bg-orange hover:bg-orange/90 text-white gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Load to Cart
                        </Button>
                      </div>
                    </div>

                    {/* Items preview */}
                    {items.length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        {items.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Package className="w-3.5 h-3.5 text-cream/30 flex-shrink-0" />
                              <span className="text-cream/70 truncate max-w-[280px]">{item.equipmentName}</span>
                            </div>
                            <span className="text-cream/40 text-xs flex-shrink-0">
                              {item.rentalDays}d × HK${Number(item.dailyRate).toLocaleString()}/day
                            </span>
                          </div>
                        ))}
                        {items.length > 4 && (
                          <p className="text-cream/30 text-xs">+{items.length - 4} more items</p>
                        )}
                        <div className="pt-2 border-t border-cream/10 flex justify-between text-sm">
                          <span className="text-cream/50">Estimated total</span>
                          <span className="text-orange font-bold">
                            HK${totalDaily.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
