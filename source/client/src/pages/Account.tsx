/**
 * EquipHK Account Dashboard
 * Shows membership tier, status, rental history, and upgrade options
 */
import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle2,
  Clock,
  Package,
  Star,
  Loader2,
  ChevronRight,
  AlertCircle,
  Zap,
  Building2,
  Calendar,
  Truck,
  CreditCard,
  Bookmark,
  Gift,
} from "lucide-react";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-HK", { day: "numeric", month: "short", year: "numeric" });
}

function formatHKD(val: string | number | null | undefined) {
  if (!val) return "HK$0";
  return `HK$${Number(val).toLocaleString("en-HK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  paid: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  confirmed: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  active: "bg-green-500/20 text-green-300 border-green-500/40",
  completed: "bg-gray-500/20 text-gray-300 border-gray-500/40",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/40",
  refunded: "bg-orange-500/20 text-orange-300 border-orange-500/40",
};

export default function Account() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const { data: membership, isLoading: membershipLoading } = trpc.membership.getMyMembership.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: orders, isLoading: ordersLoading } = trpc.membership.getMyOrders.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const upgradeMutation = trpc.membership.upgradeToPro.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info("Redirecting to Stripe for Trade Pro payment...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (params.get("upgrade") === "success") {
      toast.success("🎉 Trade Pro activated! Your benefits are now live.");
    } else if (params.get("upgrade") === "cancelled") {
      toast.info("Upgrade cancelled. You can upgrade anytime from your account.");
    }
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        <Navbar />
        <main className="pt-32 pb-20 px-4 text-center">
          <Shield className="w-16 h-16 text-orange-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-3">Sign In Required</h1>
          <p className="text-gray-400 mb-8">Please log in to view your account.</p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3"
          >
            Log In
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!membership && !membershipLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        <Navbar />
        <main className="pt-32 pb-20 px-4 text-center max-w-lg mx-auto">
          <Package className="w-16 h-16 text-orange-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-3">No Membership Yet</h1>
          <p className="text-gray-400 mb-8">
            Join EquipHK to start renting equipment. Choose Pay-As-You-Go for free access or Trade Pro for exclusive discounts.
          </p>
          <Button
            onClick={() => navigate("/register")}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3"
          >
            Join EquipHK <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isPro = membership?.plan === "trade_pro";

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <Navbar />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black">
                Welcome back, {membership?.fullName?.split(" ")[0] ?? user?.name ?? "there"}!
              </h1>
              <p className="text-gray-400 mt-1">{membership?.email}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/equipment")}
              className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
            >
              Browse Equipment <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Membership Card */}
          {membershipLoading ? (
            <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
          ) : membership ? (
            <div
              className={`rounded-2xl p-6 border-2 ${
                isPro
                  ? "bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-500"
                  : "bg-gradient-to-br from-orange-900/20 to-gray-900/20 border-orange-500/50"
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isPro ? "bg-blue-500/20" : "bg-orange-500/20"}`}>
                    {isPro ? (
                      <Building2 className="w-8 h-8 text-blue-400" />
                    ) : (
                      <Zap className="w-8 h-8 text-orange-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black">
                        {isPro ? "Trade Pro" : "Pay-As-You-Go"}
                      </h2>
                      <Badge
                        className={`text-xs font-bold ${
                          membership.status === "active"
                            ? "bg-green-500/20 text-green-300 border-green-500/40"
                            : "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                        }`}
                      >
                        {membership.status === "active" ? "Active" : membership.status}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      Member since {formatDate(membership.createdAt)}
                    </p>
                  </div>
                </div>

                {/* HKID Verification Status */}
                <div className="flex items-center gap-2">
                  {membership.hkidVerified ? (
                    <span className="flex items-center gap-1 text-green-400 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" /> HKID Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                      <Clock className="w-4 h-4" /> HKID Pending Review
                    </span>
                  )}
                </div>
              </div>

              {/* Pro Benefits */}
              {isPro && (
                <div className="mt-5 pt-5 border-t border-blue-500/30 grid sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-blue-300">10–15%</p>
                    <p className="text-gray-400 text-xs">Discount on all rentals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-blue-300">HK$0</p>
                    <p className="text-gray-400 text-xs">Deposits on tools under HK$5k</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-blue-300">Free</p>
                    <p className="text-gray-400 text-xs">Delivery on orders over HK$500</p>
                  </div>
                </div>
              )}

              {/* Upgrade CTA for PAYG */}
              {!isPro && (
                <div className="mt-5 pt-5 border-t border-orange-500/20 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm text-gray-400">Want 10–15% off every rental?</p>
                    <p className="text-white font-bold">Upgrade to Trade Pro — HK$499/month</p>
                  </div>
                  <Button
                    onClick={() => upgradeMutation.mutate({ origin: window.location.origin })}
                    disabled={upgradeMutation.isPending}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
                  >
                    {upgradeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-2" /> Upgrade Now
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : null}

          {/* Return Address */}
          <div className="bg-white/5 border border-gray-700 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-1">Equipment Return Address</p>
                <p className="text-gray-300 text-sm">Y2, Shing Fung Film Studio, Ho Chung, Sai Kung, Hong Kong</p>
                <p className="text-gray-500 text-xs mt-1">All rentals must be returned to this address unless delivery/collection was arranged.</p>
              </div>
            </div>
          </div>

          {/* Quick Account Links */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/account/saved-carts")}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-orange-500/50 rounded-xl p-4 transition-all text-left"
            >
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Bookmark className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Saved Job Kits</p>
                <p className="text-gray-500 text-xs">Re-hire saved equipment sets</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 ml-auto" />
            </button>
            <button
              onClick={() => navigate("/account/referral")}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-orange-500/50 rounded-xl p-4 transition-all text-left"
            >
              <div className="p-2 rounded-lg bg-green-500/10">
                <Gift className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Refer &amp; Earn</p>
                <p className="text-gray-500 text-xs">HK$250 credit per referral</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 ml-auto" />
            </button>
          </div>

          {/* Rental Orders */}
          <div>
            <h2 className="text-xl font-black uppercase tracking-wide mb-4">Rental Orders</h2>

            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="bg-white/5 border border-gray-700 rounded-2xl p-10 text-center">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No rental orders yet</p>
                <p className="text-gray-600 text-sm mt-1">
                  Browse our catalogue and add items to your cart to get started.
                </p>
                <Button
                  onClick={() => navigate("/equipment")}
                  className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold"
                >
                  Browse Equipment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {(orders as Array<Record<string, unknown>>).map((order) => (
                  <div
                    key={order.id as number}
                    className="bg-white/5 border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-bold">Order #{order.id as number}</span>
                          <Badge
                            className={`text-xs border ${
                              STATUS_COLORS[(order.status as string) ?? "pending_payment"] ??
                              "bg-gray-500/20 text-gray-300"
                            }`}
                          >
                            {(order.status as string)?.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(order.rentalStartDate as string)} → {formatDate(order.rentalEndDate as string)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {(order.deliveryType as string) === "delivery" ? "Delivery" : "Self-Collection"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-orange-400">
                          {formatHKD(order.totalAmount as string)}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {(order.membershipPlan as string) === "trade_pro" ? "Trade Pro rate" : "Standard rate"}
                        </p>
                      </div>
                    </div>

                    {/* Pending payment CTA */}
                    {order.status === "pending_payment" && (
                      <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-300 text-sm">Payment not completed.</span>
                        <Button
                          size="sm"
                          className="ml-auto bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
                          onClick={() => navigate("/cart")}
                        >
                          <CreditCard className="w-3 h-3 mr-1" /> Complete Payment
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
