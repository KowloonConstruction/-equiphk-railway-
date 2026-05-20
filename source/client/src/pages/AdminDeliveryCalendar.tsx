import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AccessDenied from "@/components/AccessDenied";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Truck, Package, Calendar } from "lucide-react";

const SLOT_LABELS = {
  morning: "AM",
  afternoon: "PM",
  evening: "Eve",
};

const SLOT_COLORS = {
  morning: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  afternoon: "bg-orange/20 text-orange border-orange/30",
  evening: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-500/20 text-yellow-300",
  paid: "bg-blue-500/20 text-blue-300",
  confirmed: "bg-green-500/20 text-green-300",
  active: "bg-orange/20 text-orange",
  completed: "bg-gray-500/20 text-gray-300",
  cancelled: "bg-red-500/20 text-red-300",
  refunded: "bg-purple-500/20 text-purple-300",
};

export default function AdminDeliveryCalendar() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: orders = [], isLoading } = trpc.membership.adminDeliveryCalendar.useQuery(
    { year, month },
    { enabled: !loading && !!user && ["admin", "manager"].includes(user.role ?? "") }
  );

  if (loading) return null;
  if (!user || !["admin", "manager"].includes(user.role ?? "")) {
    return <AccessDenied requiredRole="manager" />;
  }

  const monthName = currentDate.toLocaleString("en-HK", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun

  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month, 1));

  // Build a map: day -> orders with delivery or collection on that day
  const dayMap = useMemo(() => {
    const map: Record<number, { deliveries: typeof orders; collections: typeof orders }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      map[d] = { deliveries: [], collections: [] };
    }
    orders.forEach((order) => {
      if (order.deliverySlotDate) {
        const d = new Date(order.deliverySlotDate).getDate();
        if (d >= 1 && d <= daysInMonth) map[d].deliveries.push(order);
      }
      if (order.collectionSlotDate) {
        const d = new Date(order.collectionSlotDate).getDate();
        if (d >= 1 && d <= daysInMonth) map[d].collections.push(order);
      }
      // Also show rental start/end if no slot set
      if (!order.deliverySlotDate && order.deliveryType === "delivery") {
        const d = new Date(order.rentalStartDate).getDate();
        if (d >= 1 && d <= daysInMonth) map[d].deliveries.push(order);
      }
    });
    return map;
  }, [orders, daysInMonth]);

  const selectedOrders = selectedDay ? dayMap[selectedDay] : null;
  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <div className="border-b border-cream/10 bg-navy-light px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="text-cream/50 hover:text-cream transition-colors text-sm">
            ← Admin
          </button>
          <span className="text-cream/30">/</span>
          <h1 className="text-white font-[Oswald] text-xl uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange" />
            Delivery Calendar
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth} className="border-cream/20 text-cream/70 hover:text-cream">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-white font-[Oswald] text-lg min-w-[180px] text-center">{monthName}</span>
          <Button variant="outline" size="sm" onClick={nextMonth} className="border-cream/20 text-cream/70 hover:text-cream">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-cream/60">
          <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-orange" /> Delivery</span>
          <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-blue-400" /> Collection</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange/40 inline-block" /> AM</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500/40 inline-block" /> PM</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500/40 inline-block" /> Eve</span>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs text-cream/40 font-[Oswald] uppercase py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for first week */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 rounded-lg bg-navy-light/20" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayData = dayMap[day];
            const hasEvents = dayData.deliveries.length > 0 || dayData.collections.length > 0;
            const isSelected = selectedDay === day;

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`h-24 rounded-lg p-2 cursor-pointer transition-all border ${
                  isSelected
                    ? "border-orange bg-orange/10"
                    : isToday(day)
                    ? "border-cream/30 bg-navy-light"
                    : "border-cream/5 bg-navy-light/40 hover:border-cream/20"
                }`}
              >
                <div className={`text-sm font-bold mb-1 ${isToday(day) ? "text-orange" : "text-cream/70"}`}>{day}</div>
                <div className="space-y-0.5 overflow-hidden">
                  {dayData.deliveries.slice(0, 2).map((o) => (
                    <div key={`d-${o.id}`} className="flex items-center gap-1">
                      <Truck className="w-2.5 h-2.5 text-orange flex-shrink-0" />
                      <span className="text-[10px] text-cream/60 truncate">{o.customerName.split(" ")[0]}</span>
                      {o.deliverySlotTime && (
                        <span className={`text-[9px] px-1 rounded border ${SLOT_COLORS[o.deliverySlotTime as keyof typeof SLOT_COLORS]}`}>
                          {SLOT_LABELS[o.deliverySlotTime as keyof typeof SLOT_LABELS]}
                        </span>
                      )}
                    </div>
                  ))}
                  {dayData.collections.slice(0, 2).map((o) => (
                    <div key={`c-${o.id}`} className="flex items-center gap-1">
                      <Package className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                      <span className="text-[10px] text-cream/60 truncate">{o.customerName.split(" ")[0]}</span>
                      {o.collectionSlotTime && (
                        <span className={`text-[9px] px-1 rounded border ${SLOT_COLORS[o.collectionSlotTime as keyof typeof SLOT_COLORS]}`}>
                          {SLOT_LABELS[o.collectionSlotTime as keyof typeof SLOT_LABELS]}
                        </span>
                      )}
                    </div>
                  ))}
                  {(dayData.deliveries.length + dayData.collections.length) > 4 && (
                    <div className="text-[10px] text-cream/40">+{dayData.deliveries.length + dayData.collections.length - 4} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Day Detail Panel */}
        {selectedDay && selectedOrders && (
          <Card className="mt-6 bg-navy-light border-orange/20 p-6">
            <h2 className="text-white font-[Oswald] text-lg mb-4">
              {new Date(year, month - 1, selectedDay).toLocaleDateString("en-HK", { weekday: "long", day: "numeric", month: "long" })}
            </h2>

            {selectedOrders.deliveries.length === 0 && selectedOrders.collections.length === 0 ? (
              <p className="text-cream/40 text-sm">No deliveries or collections scheduled.</p>
            ) : (
              <div className="space-y-4">
                {selectedOrders.deliveries.length > 0 && (
                  <div>
                    <p className="text-xs text-orange uppercase tracking-wider font-[Oswald] mb-2 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" /> Deliveries ({selectedOrders.deliveries.length})
                    </p>
                    <div className="space-y-2">
                      {selectedOrders.deliveries.map((o) => (
                        <div key={o.id} className="flex items-center justify-between bg-navy-deep rounded-lg px-4 py-3">
                          <div>
                            <p className="text-white text-sm font-medium">#{o.id} — {o.customerName}</p>
                            <p className="text-cream/50 text-xs">{o.deliveryAddress || "Self-collection"}</p>
                            <p className="text-cream/40 text-xs">{o.customerPhone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {o.deliverySlotTime && (
                              <span className={`text-xs px-2 py-0.5 rounded border ${SLOT_COLORS[o.deliverySlotTime as keyof typeof SLOT_COLORS]}`}>
                                {o.deliverySlotTime === "morning" ? "9am–1pm" : o.deliverySlotTime === "afternoon" ? "1pm–6pm" : "6pm–9pm"}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[o.status] ?? "bg-gray-500/20 text-gray-300"}`}>
                              {o.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOrders.collections.length > 0 && (
                  <div>
                    <p className="text-xs text-blue-400 uppercase tracking-wider font-[Oswald] mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> Collections ({selectedOrders.collections.length})
                    </p>
                    <div className="space-y-2">
                      {selectedOrders.collections.map((o) => (
                        <div key={o.id} className="flex items-center justify-between bg-navy-deep rounded-lg px-4 py-3">
                          <div>
                            <p className="text-white text-sm font-medium">#{o.id} — {o.customerName}</p>
                            <p className="text-cream/50 text-xs">{o.returnAddress || "Return to depot"}</p>
                            <p className="text-cream/40 text-xs">{o.customerPhone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {o.collectionSlotTime && (
                              <span className={`text-xs px-2 py-0.5 rounded border ${SLOT_COLORS[o.collectionSlotTime as keyof typeof SLOT_COLORS]}`}>
                                {o.collectionSlotTime === "morning" ? "9am–1pm" : o.collectionSlotTime === "afternoon" ? "1pm–6pm" : "6pm–9pm"}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[o.status] ?? "bg-gray-500/20 text-gray-300"}`}>
                              {o.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {isLoading && (
          <div className="text-center py-12 text-cream/40">Loading calendar...</div>
        )}
      </div>
    </div>
  );
}
