/**
 * EquipHK Booking Confirmation Page
 * Shown after successful Stripe checkout for a rental order
 */
import { useSearch, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Package,
  Truck,
  Calendar,
  MapPin,
  Loader2,
  ChevronRight,
  Phone,
  Mail,
} from "lucide-react";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-HK", { day: "numeric", month: "short", year: "numeric" });
}

function formatHKD(val: string | number | null | undefined) {
  if (!val) return "HK$0";
  return `HK$${Number(val).toLocaleString("en-HK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function BookingConfirmation() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderId = Number(params.get("orderId"));

  const { data: order, isLoading } = trpc.membership.getOrder.useQuery(
    { orderId },
    { enabled: !!orderId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        <Navbar />
        <main className="pt-32 pb-20 px-4 text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-3">Order Not Found</h1>
          <p className="text-gray-400 mb-8">We couldn't find this order. Please check your account for details.</p>
          <Button onClick={() => navigate("/account")} className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
            Go to Account
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const orderData = order as Record<string, unknown>;
  const items = (orderData.items as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <Navbar />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Success Header */}
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-4xl font-black mb-2">Booking Confirmed!</h1>
            <p className="text-gray-400 text-lg">
              Order <span className="text-orange-400 font-bold">#{orderData.id as number}</span> has been received.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              A confirmation has been sent to <span className="text-white">{orderData.customerEmail as string}</span>
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-white/5 border border-gray-700 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-black uppercase tracking-wide">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-gray-700/50 last:border-0">
                  <div>
                    <p className="text-white font-medium">{String(item.equipmentName ?? "")}</p>
                    {item.equipmentBrand ? (
                      <p className="text-gray-500 text-xs">{String(item.equipmentBrand)}</p>
                    ) : null}
                    <p className="text-gray-400 text-sm">{item.rentalDays as number} day{(item.rentalDays as number) > 1 ? "s" : ""} @ {formatHKD(item.dailyRate as string)}/day</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{formatHKD(item.discountedTotal as string)}</p>
                    {Number(item.discountedTotal) < Number(item.lineTotal) && (
                      <p className="text-gray-500 text-xs line-through">{formatHKD(item.lineTotal as string)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{formatHKD(orderData.subtotal as string)}</span>
              </div>
              {Number(orderData.discountAmount) > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount ({orderData.discountPercent as string}%)</span>
                  <span>−{formatHKD(orderData.discountAmount as string)}</span>
                </div>
              )}
              {Number(orderData.deliveryFee) > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Delivery Fee</span>
                  <span>{formatHKD(orderData.deliveryFee as string)}</span>
                </div>
              )}
              {(orderData.depositWaived as boolean) ? (
                <div className="flex justify-between text-green-400">
                  <span>Security Deposit</span>
                  <span>Waived ✓</span>
                </div>
              ) : Number(orderData.depositAmount) > 0 ? (
                <div className="flex justify-between text-purple-300">
                  <span className="flex items-center gap-1.5">
                    Card Hold (not charged)
                    <a href="/deposit-info" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-200 text-xs underline underline-offset-2">What's this?</a>
                  </span>
                  <span>{formatHKD(orderData.depositAmount as string)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-white font-black text-lg pt-2 border-t border-gray-700">
                <span>Total Charged</span>
                <span className="text-orange-400">{formatHKD(orderData.totalAmount as string)}</span>
              </div>
            </div>
          </div>

          {/* Card Hold Explainer — only show if deposit is not waived */}
          {!orderData.depositWaived && Number(orderData.depositAmount) > 0 && (
            <div className="bg-purple-500/5 border border-purple-500/25 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-purple-400 text-base">💳</span>
                </div>
                <div>
                  <p className="font-bold text-white mb-1">About your {formatHKD(orderData.depositAmount as string)} card hold</p>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    This amount is <strong className="text-purple-300">not charged</strong> — it's a temporary hold on your card as a security guarantee.
                    Once your equipment is returned in good condition, the hold is released and no money leaves your account.
                  </p>
                  <a
                    href="/deposit-info"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm font-medium mt-2 transition-colors"
                  >
                    Learn how card holds work →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Rental Details */}
          <div className="bg-white/5 border border-gray-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-black uppercase tracking-wide">Rental Details</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400">Rental Period</p>
                  <p className="text-white font-medium">
                    {formatDate(orderData.rentalStartDate as string)} → {formatDate(orderData.rentalEndDate as string)}
                  </p>
                  <p className="text-gray-500 text-xs">{orderData.rentalDays as number} days</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400">Delivery Method</p>
                  <p className="text-white font-medium">
                    {String(orderData.deliveryType) === "delivery" ? "Delivery" : "Self-Collection"}
                  </p>
                  {orderData.deliveryAddress ? (
                    <p className="text-gray-500 text-xs">{String(orderData.deliveryAddress)}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400">Return Address</p>
                  <p className="text-white font-medium">Y2, Shing Fung Film Studio, Ho Chung, Sai Kung, Hong Kong</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6">
            <h2 className="text-lg font-black uppercase tracking-wide mb-3">Need Help?</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <a href="tel:+85298325789" className="flex items-center gap-2 text-orange-300 hover:text-orange-200">
                <Phone className="w-4 h-4" /> +852 9832 5789
              </a>
              <a href="mailto:Bookings@Equip.hk" className="flex items-center gap-2 text-orange-300 hover:text-orange-200">
                <Mail className="w-4 h-4" /> Bookings@Equip.hk
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/equipment")}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-white/5"
            >
              <Package className="w-4 h-4 mr-2" /> Browse More Equipment
            </Button>
            <Button
              onClick={() => navigate("/account")}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold"
            >
              View Account <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
