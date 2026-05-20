import { useParams, useLocation } from "wouter";
import { useMemo } from "react";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  AlertCircle,
  Package,
  ChevronRight,
  Phone,
  Beaker,
  ShoppingBag,
  Tag,
  Info,
  FileText,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";

export default function ConsumableDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const trackLead = trpc.enquiryLeads.track.useMutation();

  const consumableId = parseInt(id || "0");

  const { data: consumable, isLoading, error } = trpc.consumables.getById.useQuery(
    { id: consumableId },
    { enabled: consumableId > 0 }
  );

  const { data: relatedEquipment } = trpc.consumables.relatedEquipment.useQuery(
    { consumableId },
    { enabled: consumableId > 0 }
  );

  const toNumber = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value);
    if (value && typeof value === "object" && "d" in value) return parseFloat(value.d);
    return 0;
  };

  const price = consumable ? toNumber(consumable.price) : 0;

  // Parse specs into key-value pairs
  const specsEntries = useMemo(() => {
    if (!consumable?.specs) return [];
    const specsStr = typeof consumable.specs === "string" ? consumable.specs : "";
    if (!specsStr) return [];
    // Specs are stored as "Key: Value | Key: Value" format
    return specsStr.split("|").map((s: string) => {
      const parts = s.trim().split(":");
      if (parts.length >= 2) {
        return [parts[0].trim(), parts.slice(1).join(":").trim()];
      }
      return [s.trim(), ""];
    }).filter(([k]: string[]) => k.length > 0);
  }, [consumable?.specs]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-deep">
        <Navbar />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 72px)" }}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin" />
            <p className="text-cream/70">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error / not found state
  if (error || !consumable) {
    return (
      <div className="min-h-screen bg-navy-deep">
        <Navbar />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 72px)" }}>
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-orange mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-cream mb-2">Product Not Found</h2>
            <p className="text-cream/70 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/")} className="bg-orange hover:bg-orange-dark text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const consumableSeoDesc = (() => {
    const brand = consumable.brand || "";
    const model = consumable.model || "";
    const priceStr = price > 0 ? `from HK$${Math.round(price).toLocaleString("en-HK")} per ${consumable.unit || "unit"}` : "";
    const desc = consumable.description ? consumable.description.slice(0, 100) : "";
    return `Buy or order ${brand} ${model} ${priceStr}. ${desc}. Available from EquipHK Hong Kong. Fast delivery. Get a quote online.`.trim();
  })();

  return (
    <div className="min-h-screen bg-navy-deep">
      <SEOHead
        title={`${consumable.name}`}
        description={consumableSeoDesc}
        image={consumable.imageUrl || undefined}
        url={`/consumables/${consumable.id}`}
        type="product"
      />
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-navy-light border-b border-white/10 pt-20">
        <div className="container py-3">
          <nav className="flex items-center gap-1 text-xs text-cream/50 font-[Oswald] uppercase tracking-wider flex-wrap">
            <button onClick={() => navigate("/")} className="hover:text-orange transition-colors">
              Home
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-orange">Consumables</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-cream/70 truncate max-w-xs">{consumable.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="container py-10">
        <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">

          {/* LEFT — Image + Description */}
          <div>
            {/* Product Image */}
            <div className="bg-white rounded-lg overflow-hidden border border-orange/20 mb-8 aspect-[4/3] flex items-center justify-center p-4">
              {consumable.imageUrl ? (
                <img
                  src={consumable.imageUrl}
                  alt={consumable.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Beaker className="w-20 h-20 text-orange/20" />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white font-[Oswald] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-orange" />
                Product Description
              </h3>
              <p className="text-cream/80 leading-relaxed">
                {consumable.description || "No description available."}
              </p>
            </div>

            {/* Specifications */}
            {specsEntries.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white font-[Oswald] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-orange" />
                  Specifications
                </h3>
                <div className="bg-navy-light border border-white/10 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {specsEntries.map(([key, value]: string[], i: number) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                          <td className="px-4 py-3 text-cream/60 text-sm font-medium w-1/3 border-r border-white/5">
                            {key}
                          </td>
                          <td className="px-4 py-3 text-cream text-sm">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Pricing & Purchase Info */}
          <div className="lg:sticky lg:top-24">
            {/* Product Title */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-orange/20 text-orange text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest font-[Oswald]">
                  For Sale
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white font-[Oswald] leading-tight mb-2">
                {consumable.name}
              </h1>
              {consumable.brand && (
                <p className="text-cream/50 text-sm">{consumable.brand} — {consumable.model || "N/A"}</p>
              )}
            </div>

            {/* Pricing Card */}
            <div className="bg-navy-light border border-orange/20 rounded-lg p-6 mb-5">
              <div className="text-center mb-4">
                <p className="text-cream/50 text-xs uppercase tracking-wider font-[Oswald] mb-1">Purchase Price</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-orange font-[Oswald]">
                    {price > 0 ? `HK$${Math.round(price).toLocaleString("en-HK")}` : "POA"}
                  </span>
                  <span className="text-cream/50 text-sm">per {consumable.unit || "unit"}</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-cream/60 text-xs text-center mb-3">
                  This is a consumable product for one-time purchase, not a rental item.
                </p>
              </div>

              {/* CTA */}
              <div className="space-y-2">
                <a
                  href={`https://wa.me/85298325789?text=${encodeURIComponent(`Hi, I'd like to purchase: ${consumable.name} (${consumable.brand} ${consumable.model || ""})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider h-12 text-base rounded-md transition-colors"
                  onClick={() => trackLead.mutate({ type: "whatsapp_click", equipmentName: consumable.name, source: "consumable_detail_order" })}
                >
                  <ShoppingBag className="w-5 h-5" />
                  Order via WhatsApp
                </a>
                <Button
                  variant="outline"
                  onClick={() => {
                    trackLead.mutate({ type: "quote_request", equipmentName: consumable.name, notes: "Bulk/custom quote from consumable page", source: "consumable_detail" });
                    navigate(`/get-a-quote?equipment=${encodeURIComponent(consumable.name || '')}`);
                  }}
                  className="w-full border-cream/20 text-cream/70 hover:border-orange hover:text-orange font-[Oswald] uppercase tracking-wider h-10 text-sm gap-2 bg-transparent"
                >
                  <FileText className="w-4 h-4" />
                  Request a Bulk / Custom Quote
                </Button>
              </div>
            </div>

            {/* Bulk pricing note */}
            <div className="bg-navy-light/50 border border-orange/10 rounded-lg p-4 mb-5">
              <p className="text-cream/60 text-xs">
                <strong className="text-cream/80">Bulk orders?</strong> Contact us for volume discounts on large quantities.
              </p>
            </div>

            {/* Contact */}
            <div className="bg-navy-light border border-white/10 rounded-lg p-4 text-center">
              <p className="text-cream/60 text-xs mb-2">Need help? Call us</p>
              <a
                href="https://wa.me/85298325789"
                className="flex items-center justify-center gap-2 text-orange hover:text-orange-light transition-colors font-bold"
                onClick={() => trackLead.mutate({ type: "whatsapp_click", equipmentName: consumable?.name, source: "consumable_detail_sidebar" })}
              >
                <Phone className="w-4 h-4" />
                +852 9832 5789
              </a>
            </div>
          </div>
        </div>

        {/* Used With These Tools */}
        {relatedEquipment && relatedEquipment.length > 0 && (
          <div className="mt-20 pt-12 border-t border-white/10">
            <h2 className="text-3xl font-bold text-white font-[Oswald] mb-2">
              Used With These Tools
            </h2>
            <p className="text-cream/50 text-sm mb-8">
              Rent the equipment you need to use this consumable.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {relatedEquipment.map((item: any, index: number) => {
                const itemRate = toNumber(item.dailyRate);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                    onClick={() => navigate(`/product/${item.id}`)}
                    className="group bg-navy-light border border-white/10 hover:border-orange/50 rounded-lg overflow-hidden cursor-pointer transition-all duration-300"
                  >
                    <div className="aspect-square bg-white overflow-hidden flex items-center justify-center p-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-orange/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-white font-[Oswald] mb-1 line-clamp-2 group-hover:text-orange transition-colors">
                        {item.name}
                      </h3>
                      {item.brand && (
                        <p className="text-xs text-cream/50 mb-2">{item.brand}</p>
                      )}
                      {item.note && (
                        <p className="text-xs text-cream/40 italic mb-2 line-clamp-2">{item.note}</p>
                      )}
                      <div className="flex justify-between items-baseline">
                        <span className="text-orange font-bold text-sm">
                          {itemRate > 0 ? `HK$${Math.round(itemRate).toLocaleString("en-HK")}` : "POA"}
                        </span>
                        <span className="text-cream/40 text-xs">/day rental</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
