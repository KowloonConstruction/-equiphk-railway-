/**
 * Bundle Detail Page — shows bundle info, included tools, and pricing
 */
import { useParams, useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  AlertCircle,
  Package,
  ChevronRight,
  Phone,
  Percent,
  Wrench,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";

const CATEGORY_LABELS: Record<string, string> = {
  waterproofing: "Waterproofing",
  surface_prep: "Surface Preparation",
  concrete: "Concrete & Formwork",
};

export default function BundleDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const bundleId = parseInt(id || "0");

  const { data: bundle, isLoading, error } = trpc.bundles.getById.useQuery(
    { id: bundleId },
    { enabled: bundleId > 0 }
  );

  const toNumber = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value);
    if (value && typeof value === "object" && "d" in value) return parseFloat(value.d);
    return 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-deep">
        <Navbar />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 72px)" }}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin" />
            <p className="text-cream/70">Loading bundle details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="min-h-screen bg-navy-deep">
        <Navbar />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 72px)" }}>
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-orange mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-cream mb-2">Bundle Not Found</h2>
            <p className="text-cream/70 mb-6">The bundle you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/bundles")} className="bg-orange hover:bg-orange-dark text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bundles
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const daily = toNumber(bundle.dailyRate);
  const weekly = toNumber(bundle.weeklyRate);
  const monthly = toNumber(bundle.monthlyRate);

  // Calculate what individual items would cost
  const individualDailyTotal = bundle.items?.reduce((sum: number, item: any) => {
    return sum + toNumber(item.dailyRate) * (item.quantity || 1);
  }, 0) || 0;

  const bundleSeoDesc = `Rent the ${bundle.name} bundle from EquipHK. Includes ${bundle.items?.length || "multiple"} items — save vs. renting individually. Available across Hong Kong. Get a quote online.`;

  return (
    <div className="min-h-screen bg-navy-deep">
      <SEOHead
        title={`${bundle.name} Bundle Hire`}
        description={bundleSeoDesc}
        url={`/bundles/${bundle.id}`}
        type="product"
      />
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-navy-light border-b border-white/10 pt-20">
        <div className="container py-3">
          <nav className="flex items-center gap-1 text-xs text-cream/50 font-[Oswald] uppercase tracking-wider flex-wrap">
            <button onClick={() => navigate("/")} className="hover:text-orange transition-colors">Home</button>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => navigate("/bundles")} className="hover:text-orange transition-colors">Bundles</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-cream/70 truncate max-w-xs">{bundle.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-10">
        <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">

          {/* LEFT — Bundle Info */}
          <div>
            {/* Title & Description */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="bg-orange/20 text-orange text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest font-[Oswald]">
                  Bundle Kit
                </span>
                {bundle.categoryTag && (
                  <span className="bg-white/5 text-cream/50 text-[10px] px-2 py-0.5 rounded uppercase tracking-widest font-[Oswald]">
                    {CATEGORY_LABELS[bundle.categoryTag] || bundle.categoryTag}
                  </span>
                )}
                {bundle.savingsPercent && bundle.savingsPercent > 0 && (
                  <span className="bg-green-600/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest font-[Oswald] flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    Save {bundle.savingsPercent}%
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white font-[Oswald] uppercase tracking-wider mb-4">
                {bundle.name}
              </h1>
              <p className="text-cream/70 leading-relaxed text-base">
                {bundle.description}
              </p>
            </div>

            {/* Included Tools */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white font-[Oswald] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange" />
                What's Included ({bundle.items?.length || 0} tools)
              </h3>
              <div className="space-y-3">
                {bundle.items?.map((item: any, index: number) => {
                  const itemRate = toNumber(item.dailyRate);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.08 }}
                      onClick={() => navigate(`/product/${item.equipmentItemId}`)}
                      className="flex items-center gap-4 bg-navy-light border border-white/10 hover:border-orange/30 rounded-lg p-4 cursor-pointer transition-all group"
                    >
                      {/* Image */}
                      <div className="w-16 h-16 bg-white rounded-md overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <Package className="w-6 h-6 text-orange/20" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          <h4 className="text-sm font-bold text-white font-[Oswald] group-hover:text-orange transition-colors truncate">
                            {item.name}
                          </h4>
                        </div>
                        {item.brand && (
                          <p className="text-xs text-cream/40 ml-6">{item.brand} {item.model || ""}</p>
                        )}
                        {item.note && (
                          <p className="text-xs text-cream/50 ml-6 mt-0.5 italic">{item.note}</p>
                        )}
                      </div>

                      {/* Qty & Price */}
                      <div className="text-right shrink-0">
                        {item.quantity > 1 && (
                          <span className="text-orange text-xs font-bold font-[Oswald]">x{item.quantity}</span>
                        )}
                        {itemRate > 0 && (
                          <p className="text-cream/30 text-xs line-through">
                            HK${Math.round(itemRate * (item.quantity || 1)).toLocaleString("en-HK")}/day
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Individual vs bundle price comparison */}
              {individualDailyTotal > 0 && daily > 0 && (
                <div className="mt-4 bg-green-900/20 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-cream/60">Individual rental total:</span>
                    <span className="text-cream/40 line-through">HK${Math.round(individualDailyTotal).toLocaleString("en-HK")}/day</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-green-400 font-bold">Bundle price:</span>
                    <span className="text-green-400 font-bold">HK${Math.round(daily).toLocaleString("en-HK")}/day</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1 pt-2 border-t border-green-500/10">
                    <span className="text-green-300 font-bold">You save:</span>
                    <span className="text-green-300 font-bold">
                      HK${Math.round(individualDailyTotal - daily).toLocaleString("en-HK")}/day
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Pricing & CTA */}
          <div className="lg:sticky lg:top-24">
            {/* Pricing Card */}
            <div className="bg-navy-light border border-orange/20 rounded-lg p-6 mb-5">
              <p className="text-cream/50 text-xs uppercase tracking-wider font-[Oswald] mb-4 text-center">Bundle Rental Rates</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-cream/60 text-sm">Daily</span>
                  <span className="text-orange font-bold text-2xl font-[Oswald]">
                    {daily > 0 ? `HK$${Math.round(daily).toLocaleString("en-HK")}` : "POA"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-cream/60 text-sm">Weekly</span>
                  <span className="text-white font-bold text-lg font-[Oswald]">
                    {weekly > 0 ? `HK$${Math.round(weekly).toLocaleString("en-HK")}` : "POA"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-cream/60 text-sm">Monthly</span>
                  <span className="text-white font-bold text-lg font-[Oswald]">
                    {monthly > 0 ? `HK$${Math.round(monthly).toLocaleString("en-HK")}` : "POA"}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <a
                  href={`https://wa.me/85298325789?text=${encodeURIComponent(`Hi, I'd like to rent the ${bundle.name} bundle kit.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider h-12 text-base rounded-md transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Enquire via WhatsApp
                </a>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/get-a-quote?equipment=${encodeURIComponent(bundle.name || '')}`)}
                  className="w-full border-cream/20 text-cream/70 hover:border-orange hover:text-orange font-[Oswald] uppercase tracking-wider h-10 text-sm gap-2 bg-transparent"
                >
                  <FileText className="w-4 h-4" />
                  Request a Quote for Long-Term Hire
                </Button>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-navy-light/50 border border-white/10 rounded-lg p-4">
              <h4 className="text-sm font-bold text-white font-[Oswald] uppercase tracking-wider mb-3">Why Rent a Bundle?</h4>
              <ul className="space-y-2">
                {[
                  "Save up to 25% vs renting individually",
                  "All tools tested & ready to go",
                  "Single delivery, single pickup",
                  "Expert advice on tool selection",
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-cream/60 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
