/**
 * EquipHK Delivery & Collection Info Page — Delivery Only
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Truck, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const DELIVERY_ZONES = [
  { zone: "Hong Kong Island", areas: "Central, Wan Chai, Causeway Bay, North Point, Quarry Bay, Chai Wan, Aberdeen, Stanley, Repulse Bay", fee: "HK$150", time: "Same day or next day" },
  { zone: "Kowloon", areas: "Tsim Sha Tsui, Mong Kok, Sham Shui Po, Kowloon City, Kwun Tong, Wong Tai Sin, Yau Tsim Mong", fee: "HK$150", time: "Same day or next day" },
  { zone: "New Territories (Urban)", areas: "Sha Tin, Tai Po, Tuen Mun, Yuen Long, Tsuen Wan, Kwai Chung, Tseung Kwan O", fee: "HK$150", time: "Same day or next day" },
  { zone: "New Territories (Remote)", areas: "Sai Kung, Clearwater Bay, Lantau Island, outlying islands, remote rural areas", fee: "HK$200–350", time: "1–2 business days (quote required)" },
];

export default function DeliveryInfo() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-navy-deep text-cream">
      <SEOHead
        title="Delivery Information"
        description="EquipHK delivers equipment directly to you across Hong Kong. View delivery zones, fees, time slots, and return instructions."
        zhDescription="EquipHK直接將設備送到您的地址，覆蓋全港。查看送貨區域、費用、時間窗口及歸還說明。"
        url="/delivery-info"
      />
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange/10 rounded-lg border border-orange/20">
                <Truck className="w-6 h-6 text-orange" />
              </div>
              <span className="text-orange font-[Oswald] uppercase tracking-wider text-sm">
                Logistics
              </span>
            </div>
            <h1 className="font-[Oswald] text-4xl font-bold text-cream mb-3">
              Delivery Information
            </h1>
            <p className="text-cream/60 text-sm max-w-2xl">
              Equipment can be delivered directly to your site across Hong Kong, or collected free of charge from our Shing Fung Industrial Park pick-up point in Sai Kung. Choose your preferred option at checkout.
            </p>
          </div>

          {/* Delivery highlights */}
          <div className="bg-navy-light/30 border border-orange/20 rounded-lg p-6 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-6 h-6 text-orange" />
              <h2 className="font-[Oswald] text-xl font-bold text-cream">How Delivery Works</h2>
            </div>
            <ul className="space-y-2 text-cream/70 text-sm">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-orange mt-0.5 shrink-0" />Equipment delivered directly to your site or address</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-orange mt-0.5 shrink-0" />Flat rate HK$150 across most of Hong Kong</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-orange mt-0.5 shrink-0" />Free delivery for Trade Pro members on orders over HK$500</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-orange mt-0.5 shrink-0" />Morning, afternoon, and evening slots available</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-orange mt-0.5 shrink-0" />Responsible adult must be present to sign on delivery</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-orange mt-0.5 shrink-0" />All equipment arrives inspected, tested, and certified</li>
            </ul>
          </div>

          {/* Delivery Zones */}
          <section className="mb-12">
            <h2 className="font-[Oswald] text-2xl font-bold text-cream mb-6">
              Delivery Zones & Fees
            </h2>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-light/40 border-b border-white/10">
                    <th className="text-left p-4 text-orange font-[Oswald] uppercase tracking-wider text-xs">Zone</th>
                    <th className="text-left p-4 text-orange font-[Oswald] uppercase tracking-wider text-xs">Areas Covered</th>
                    <th className="text-left p-4 text-orange font-[Oswald] uppercase tracking-wider text-xs">Fee</th>
                    <th className="text-left p-4 text-orange font-[Oswald] uppercase tracking-wider text-xs">Lead Time</th>
                  </tr>
                </thead>
                <tbody>
                  {DELIVERY_ZONES.map((zone, i) => (
                    <tr key={zone.zone} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-navy-light/10" : ""}`}>
                      <td className="p-4 text-cream font-medium">{zone.zone}</td>
                      <td className="p-4 text-cream/60">{zone.areas}</td>
                      <td className="p-4 text-orange font-[Oswald]">{zone.fee}</td>
                      <td className="p-4 text-cream/60">{zone.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-cream/40 text-xs mt-3">
              * Trade Pro members receive free delivery on orders over HK$500 to all standard zones. Remote area surcharges apply regardless of membership.
            </p>
          </section>

          {/* Delivery Slots */}
          <section className="mb-12">
            <h2 className="font-[Oswald] text-2xl font-bold text-cream mb-6">
              Delivery Time Slots
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Morning", time: "8:00am – 12:00pm", icon: "🌅" },
                { label: "Afternoon", time: "12:00pm – 5:00pm", icon: "☀️" },
                { label: "Evening", time: "5:00pm – 8:00pm", icon: "🌆" },
              ].map((slot) => (
                <div key={slot.label} className="bg-navy-light/20 border border-white/10 rounded-lg p-5 text-center">
                  <div className="text-2xl mb-2">{slot.icon}</div>
                  <div className="font-[Oswald] text-lg text-cream">{slot.label}</div>
                  <div className="text-cream/50 text-sm mt-1">{slot.time}</div>
                </div>
              ))}
            </div>
            <p className="text-cream/50 text-xs mt-3">
              Slot availability is confirmed at checkout. For urgent same-day delivery, contact us on WhatsApp before 10am.
            </p>
          </section>

          {/* Self-Collection */}
          <section className="mb-12">
            <h2 className="font-[Oswald] text-2xl font-bold text-cream mb-6">
              Self-Collection
            </h2>
            <div className="bg-navy-light/30 border border-orange/20 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange/10 rounded-lg border border-orange/20 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-orange" />
                </div>
                <div>
                  <p className="text-cream font-semibold mb-1">Pick-Up & Drop-Off Point</p>
                  <p className="text-cream/70 text-sm mb-2">Collect for free from our Sai Kung location. Select <strong className="text-orange">Self-Collect</strong> at checkout — no delivery fee applies.</p>
                  <p className="text-cream/90 text-sm font-medium">1-12 Shing Fung Industrial Park, 1 Hon Kin Road, Sai Kung, Hong Kong</p>
                  <a
                    href="https://maps.google.com/?q=1-12+Shing+Fung+Industrial+Park,+1+Hon+Kin+Road,+Sai+Kung,+Hong+Kong"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-[Oswald] uppercase tracking-wider text-orange hover:text-orange/80 transition-colors"
                  >
                    → Get Directions on Google Maps
                  </a>
                  <div className="flex items-center gap-2 mt-3 text-sm">
                    <Clock className="w-4 h-4 text-orange" />
                    <span className="text-cream/70">Mon–Sat: <strong className="text-orange">09:00 – 18:00</strong></span>
                  </div>
                  <p className="text-cream/50 text-xs mt-2">Please bring your booking confirmation and a valid photo ID.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Return */}
          <section className="mb-12">
            <h2 className="font-[Oswald] text-2xl font-bold text-cream mb-6">
              Equipment Returns
            </h2>
            <div className="bg-navy-light/30 border border-orange/20 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Truck className="w-6 h-6 text-orange mt-1 shrink-0" />
                <div>
                  <p className="text-cream font-semibold mb-1">We collect from you</p>
                  <p className="text-cream/70 text-sm">At the end of your rental period, our team will arrange collection from your site or address. Return collection details are confirmed in your booking.</p>
                  <p className="text-cream/50 text-xs mt-2">Depot: Y2 Shing Fung Film Studio, Ho Chung, Sai Kung, Hong Kong</p>
                  <div className="flex items-center gap-2 mt-4 text-sm">
                    <Clock className="w-4 h-4 text-orange" />
                    <span className="text-cream/70">Return deadline: <strong className="text-orange">15:00 HKT</strong> on the agreed return date</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-200/80 text-sm">
                <strong>Late returns are charged at the daily rate per day overdue.</strong> If you need more time, contact us before 15:00 on your return date — we can often arrange an extension if the equipment is available.
              </p>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={() => navigate("/equipment")}
              className="bg-orange hover:bg-orange/90 text-white font-[Oswald] uppercase tracking-wider px-8"
            >
              Browse Equipment
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
