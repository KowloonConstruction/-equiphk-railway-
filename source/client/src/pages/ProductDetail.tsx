import { useParams, useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import { useState, useMemo, useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import RecentlyViewedSection from "@/components/RecentlyViewedSection";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ShoppingCart,
  Calendar,
  AlertCircle,
  Package,
  CheckCircle,
  HardHat,
  Eye,
  Shield,
  ChevronRight,
  Phone,
  FileText,
  Download,
  Heart,
  Beaker,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

const DEFAULT_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-og-image-gbsgsY4eLL2e6p4Dos2cHG.png";

// Lead tracking helper for WhatsApp clicks on product pages
function useTrackLead() {
  return trpc.enquiryLeads.track.useMutation();
}

type Tab = "overview" | "specifications" | "safety";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const trackLead = useTrackLead();
  const [, navigate] = useLocation();
  const [rentalDays, setRentalDays] = useState(1);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { addToCart } = useCart();
  const { addItem: addToComparison, removeItem: removeFromComparison, isInComparison } = useComparison();
  const utils = trpc.useUtils();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = equipment?.name ?? "EquipHK Equipment";
    const text = `Check out ${title} available for hire on EquipHK — Hong Kong's equipment rental platform.`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // user cancelled — no-op
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const equipmentId = parseInt(id || "0");

  // Fuel add-on state
  const [fuelLitres, setFuelLitres] = useState(0);
  const fuelPricesQ = trpc.fuel.getLivePrices.useQuery(undefined, { staleTime: 60 * 60 * 1000 }); // cache 1hr
  const fuelTypeQ = trpc.fuel.getItemFuelType.useQuery(
    { itemId: equipmentId },
    { enabled: equipmentId > 0 }
  );
  const fuelType = fuelTypeQ.data?.fuelType ?? "none";
  const fuelPricePerLitre =
    fuelType === "petrol"
      ? (fuelPricesQ.data?.petrolPumpPrice ?? 0)
      : fuelType === "diesel"
      ? (fuelPricesQ.data?.dieselPumpPrice ?? 0)
      : 0;
  const fuelCost = fuelType !== "none" ? Math.round(fuelLitres * fuelPricePerLitre * 100) / 100 : 0;

  const favCheckQ = trpc.favourites.check.useQuery(
    { equipmentItemId: equipmentId },
    { enabled: equipmentId > 0, retry: false }
  );
  const isFav = favCheckQ.data?.favourited ?? false;
  const toggleFavMutation = trpc.favourites.toggle.useMutation({
    onMutate: async () => {
      await utils.favourites.check.cancel({ equipmentItemId: equipmentId });
      const prev = utils.favourites.check.getData({ equipmentItemId: equipmentId });
      utils.favourites.check.setData({ equipmentItemId: equipmentId }, (old) =>
        old ? { favourited: !old.favourited } : { favourited: true }
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.favourites.check.setData({ equipmentItemId: equipmentId }, ctx.prev);
    },
    onSettled: () => {
      utils.favourites.check.invalidate({ equipmentItemId: equipmentId });
      utils.favourites.ids.invalidate();
    },
    onSuccess: (data) => {
      if ((data as any).requiresLogin) {
        toast.info("Sign in to save favourites");
      } else {
        toast.success((data as any).favourited ? "Added to favourites" : "Removed from favourites");
      }
    },
  });

  // Recently viewed tracking
  const { track: trackRecentlyViewed } = useRecentlyViewed();

  // All hooks at top level — no conditional calls
  const { data: equipment, isLoading, error } = trpc.equipment.getById.useQuery(
    { id: equipmentId },
    { enabled: equipmentId > 0 }
  );

  // Track this item as viewed once data loads
  useEffect(() => {
    if (!equipment) return;
    trackRecentlyViewed({
      id: equipment.id,
      name: equipment.name,
      brand: equipment.brand || "",
      category: String(equipment.categoryId || ""),
      imageUrl: equipment.imageUrl || null,
      dailyRate: equipment.dailyRate ? parseFloat(String(equipment.dailyRate)) : null,
      weeklyRate: equipment.weeklyRate ? parseFloat(String(equipment.weeklyRate)) : null,
      availableQty: equipment.availableQty ?? 0,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipment?.id]);

  const { data: allEquipment } = trpc.equipment.list.useQuery(
    { categoryId: equipment?.categoryId || 0, activeOnly: true },
    { enabled: !!equipment?.categoryId }
  );

  const { data: categories } = trpc.categories.list.useQuery();

  // Fetch operation manuals for this item
  const { data: manuals } = trpc.manuals.getByItem.useQuery(
    { equipmentItemId: equipmentId },
    { enabled: equipmentId > 0 }
  );

  // Fetch related consumables for this item
  const { data: relatedConsumables } = trpc.consumables.forEquipment.useQuery(
    { equipmentItemId: equipmentId },
    { enabled: equipmentId > 0 }
  );

  // Helper to safely convert decimal to number
  const toNumber = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value);
    if (value && typeof value === "object" && "d" in value) {
      return parseFloat(value.d);
    }
    return 0;
  };

  const dailyRateNum = equipment ? toNumber(equipment.dailyRate) : 0;
  const weeklyRateNum = equipment ? toNumber(equipment.weeklyRate) : 0;
  const monthlyRateNum = equipment ? toNumber(equipment.monthlyRate) : 0;

  // Pricing logic:
  // Days 1-6:  daily rate × days
  // Days 7-29: weekly rate × number of weeks (rounded up)
  // Days 30+:  monthly rate (flat)
  const calculateRentalPrice = (days: number) => {
    if (days <= 0) return 0;
    
    // Days 1-6: charge daily rate × number of days
    if (days <= 6) {
      return dailyRateNum * days;
    }
    
    // Days 30+: charge monthly rate (flat)
    if (days >= 30) {
      if (monthlyRateNum > 0) return monthlyRateNum;
      // Fallback: weekly rate × weeks
      if (weeklyRateNum > 0) return weeklyRateNum * Math.ceil(days / 7);
      return dailyRateNum * days;
    }
    
    // Days 7-29: weekly rate × number of weeks (rounded up)
    if (weeklyRateNum > 0) {
      const weeks = Math.ceil(days / 7);
      return weeklyRateNum * weeks;
    }
    // Fallback if no weekly rate
    return dailyRateNum * days;
  };

  const totalPrice = calculateRentalPrice(rentalDays);

  const relatedEquipment = useMemo(() => {
    if (!allEquipment || !equipment) return [];
    return allEquipment.filter((item: any) => item.id !== equipment.id).slice(0, 4);
  }, [allEquipment, equipment?.id]);

  const categoryName = useMemo(() => {
    if (!categories || !equipment) return "Equipment";
    const cat = categories.find((c: any) => c.id === equipment.categoryId);
    return cat?.name || "Equipment";
  }, [categories, equipment?.categoryId]);

  const activeCategorySlug = useMemo(() => {
    if (!categories || !equipment) return "";
    const cat = categories.find((c: any) => c.id === equipment.categoryId);
    return cat?.slug || cat?.name?.toLowerCase().replace(/\s+/g, "-") || "";
  }, [categories, equipment?.categoryId]);

  // Parse specs into key-value pairs
  const specsEntries = useMemo(() => {
    if (!equipment?.specs) return [];
    if (typeof equipment.specs === "string") {
      try {
        const parsed = JSON.parse(equipment.specs);
        return Object.entries(parsed);
      } catch {
        return [["Specifications", equipment.specs]];
      }
    }
    if (typeof equipment.specs === "object") {
      return Object.entries(equipment.specs as Record<string, string>);
    }
    return [];
  }, [equipment?.specs]);

  // Extract top 3 key specs for above-the-fold display
  const keySpecs = useMemo(() => {
    const specs: string[] = [];
    if (equipment?.brand) specs.push(`Brand: ${equipment.brand}`);
    if (equipment?.model) specs.push(`Model: ${equipment.model}`);
    if (equipment?.condition) specs.push(`Condition: ${equipment.condition.charAt(0).toUpperCase() + equipment.condition.slice(1)}`);
    if (specsEntries.length > 0 && specs.length < 3) {
      const firstSpec = specsEntries[0];
      if (firstSpec) {
        const key = String(firstSpec[0]).replace(/_/g, " ");
        specs.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${firstSpec[1]}`);
      }
    }
    return specs.slice(0, 3);
  }, [equipment, specsEntries]);

  const handleAddToCart = () => {
    if (!equipment) return;
    addToCart({
      equipmentId: equipment.id,
      name: equipment.name,
      dailyRate: dailyRateNum,
      rentalDays,
      startDate,
      totalPrice: totalPrice + fuelCost,
      imageUrl: equipment.imageUrl ?? "",
      ...(fuelType !== "none" && fuelLitres > 0 ? {
        fuelType,
        fuelLitres,
        fuelPricePerLitre,
        fuelCost,
      } : {}),
    });
    toast.success(`${equipment.name} added to rental cart!`);
    navigate("/cart");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-deep">
        <Navbar />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 72px)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin" />
          <p className="text-cream/70">Loading equipment details...</p>
        </div>
        </div>
      </div>
    );
  }

  // Error / not found state
  if (error || !equipment) {
    return (
      <div className="min-h-screen bg-navy-deep">
        <Navbar />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 72px)' }}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-cream mb-2">Equipment Not Found</h2>
          <p className="text-cream/70 mb-6">The equipment you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/")} className="bg-orange hover:bg-orange-dark text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
        </div>
      </div>
    );
  }

  const isAvailable = equipment.availability === "available";

  const seoDescription = (() => {
    const brand = equipment.brand || "";
    const model = equipment.model || "";
    const price = dailyRateNum ? `from HK$${dailyRateNum.toLocaleString()}/day` : "";
    const incl = (equipment as any).includes ? `. Includes ${(equipment as any).includes}` : "";
    const desc = equipment.description ? equipment.description.slice(0, 100) : "";
    return `Rent the ${brand} ${model} ${price}${incl}. ${desc}. Available across Hong Kong. Fast delivery. Get a quote online.`.trim();
  })();

  const seoDescriptionZh = (() => {
    const brand = equipment.brand || "";
    const model = equipment.model || "";
    const price = dailyRateNum ? `每日低至港幣${dailyRateNum.toLocaleString()}元` : "";
    return `租用${brand} ${model}${price ? '，' + price : ''}。全港即日送貨，歡迎網上報價。`.trim();
  })();

  return (
    <div className="min-h-screen bg-navy-deep">
      <SEOHead
        title={`${equipment.name} Hire`}
        description={seoDescription}
        zhDescription={seoDescriptionZh}
        image={(equipment as any).imageUrl || DEFAULT_IMAGE}
        imageAlt={`${equipment.name} available for hire in Hong Kong`}
        url={`/equipment/${equipment.id}`}
        type="product"
        price={dailyRateNum || undefined}
        availability={equipment.availability === 'available' ? 'InStock' : 'OutOfStock'}
        brand={equipment.brand || undefined}
        keywords={`${equipment.name} hire Hong Kong, ${equipment.brand || ''} rental HK, ${categoryName} hire, equipment rental Hong Kong, ${equipment.name}租賃香港`.replace(/,\s*,/g, ',')}
      />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: equipment.name,
        description: seoDescription,
        image: (equipment as any).imageUrl || DEFAULT_IMAGE,
        brand: equipment.brand ? { "@type": "Brand", name: equipment.brand } : undefined,
        sku: `EQUIPHK-${equipment.id}`,
        offers: {
          "@type": "Offer",
          url: `https://www.equip.hk/equipment/${equipment.id}`,
          priceCurrency: "HKD",
          price: dailyRateNum || undefined,
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: dailyRateNum || undefined,
            priceCurrency: "HKD",
            unitText: "DAY",
          },
          availability: equipment.availability === 'available'
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: "EquipHK" },
          areaServed: { "@type": "AdministrativeArea", name: "Hong Kong" },
        },
        category: categoryName,
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.equip.hk" },
          { "@type": "ListItem", position: 2, name: "Equipment", item: "https://www.equip.hk/equipment" },
          ...(categoryName ? [{ "@type": "ListItem", position: 3, name: categoryName, item: `https://www.equip.hk/equipment?category=${activeCategorySlug ?? ''}` }] : []),
          { "@type": "ListItem", position: categoryName ? 4 : 3, name: equipment.name, item: `https://www.equip.hk/equipment/${equipment.id}` },
        ],
      }} />
      {/* Shared Navbar — logo + search bar + cart */}
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-navy-light border-b border-white/10 pt-20">
        <div className="container py-3">
          <nav className="flex items-center gap-1 text-xs text-cream/50 font-[Oswald] uppercase tracking-wider flex-wrap">
            <button onClick={() => navigate("/")} className="hover:text-orange transition-colors">
              Home
            </button>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => { navigate("/"); setTimeout(() => { document.querySelector("#equipment")?.scrollIntoView({ behavior: "smooth" }); }, 100); }} className="hover:text-orange transition-colors">
              Equipment
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-orange">{categoryName}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-cream/70 truncate max-w-xs">{equipment.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="container py-10">
        <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">

          {/* LEFT — Image + Tabs */}
          <div>
            {/* Product Image */}
            <div className="bg-white rounded-lg overflow-hidden border border-orange/20 mb-8 aspect-[4/3] flex items-center justify-center p-4">
              {equipment.imageUrl ? (
                <img
                  src={equipment.imageUrl}
                  alt={equipment.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-20 h-20 text-orange/20" />
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-white/10 mb-8">
              <div className="flex gap-0">
                {(["overview", "specifications", "safety"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 font-[Oswald] uppercase tracking-wider text-sm transition-all border-b-2 ${
                      activeTab === tab
                        ? "border-orange text-orange"
                        : "border-transparent text-cream/60 hover:text-cream"
                    }`}
                  >
                    {tab === "overview" ? "Overview" : tab === "specifications" ? "Specifications" : "Safety Info"}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-white font-[Oswald] mb-4">Overview</h2>
                <p className="text-cream/80 leading-relaxed mb-8 text-base">
                  {equipment.description}
                </p>

                {/* Key Features */}
                <h3 className="text-lg font-bold text-orange font-[Oswald] uppercase tracking-wider mb-4">
                  Key Features
                </h3>
                <ul className="space-y-3">
                  {keySpecs.map((spec, i) => (
                    <li key={i} className="flex items-start gap-3 text-cream/80">
                      <CheckCircle className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
                      <span>{spec}</span>
                    </li>
                  ))}
                  {equipment.brand && (
                    <li className="flex items-start gap-3 text-cream/80">
                      <CheckCircle className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
                      <span>Professional-grade {equipment.brand} equipment</span>
                    </li>
                  )}
                  <li className="flex items-start gap-3 text-cream/80">
                    <CheckCircle className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
                    <span>Inspection-ready, certified for professional use</span>
                  </li>
                  <li className="flex items-start gap-3 text-cream/80">
                    <CheckCircle className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
                    <span>Available for daily, weekly, and monthly rental</span>
                  </li>
                  <li className="flex items-start gap-3 text-cream/80">
                    <CheckCircle className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
                    <span>Delivery and pickup available</span>
                  </li>
                </ul>
              </motion.div>
            )}

            {activeTab === "specifications" && (
              <motion.div
                key="specifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-white font-[Oswald] mb-2">Specifications</h2>
                <p className="text-cream/50 text-sm mb-6">Products are subject to availability.</p>

                <div className="rounded-lg overflow-hidden border border-white/10">
                  <table className="w-full text-sm">
                    <tbody>
                      {equipment.brand && (
                        <tr className="border-b border-white/10 even:bg-navy-light/50">
                          <td className="py-3 px-5 text-cream/60 font-medium w-1/3">Make / Brand</td>
                          <td className="py-3 px-5 text-cream">{equipment.brand}</td>
                        </tr>
                      )}
                      {equipment.model && (
                        <tr className="border-b border-white/10 even:bg-navy-light/50">
                          <td className="py-3 px-5 text-cream/60 font-medium">Model</td>
                          <td className="py-3 px-5 text-cream">{equipment.model}</td>
                        </tr>
                      )}
                      {equipment.condition && (
                        <tr className="border-b border-white/10 even:bg-navy-light/50">
                          <td className="py-3 px-5 text-cream/60 font-medium">Condition</td>
                          <td className="py-3 px-5 text-cream capitalize">{equipment.condition}</td>
                        </tr>
                      )}
                      {(equipment as any).includes && (
                        <tr className="border-b border-white/10 even:bg-navy-light/50">
                          <td className="py-3 px-5 text-cream/60 font-medium">What's Included</td>
                          <td className="py-3 px-5 text-green-400 font-medium">{(equipment as any).includes}</td>
                        </tr>
                      )}
                      <tr className="border-b border-white/10 even:bg-navy-light/50">
                        <td className="py-3 px-5 text-cream/60 font-medium">Category</td>
                        <td className="py-3 px-5 text-cream">{categoryName}</td>
                      </tr>
                      <tr className="border-b border-white/10 even:bg-navy-light/50">
                        <td className="py-3 px-5 text-cream/60 font-medium">Availability</td>
                        <td className="py-3 px-5">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${isAvailable ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {isAvailable ? `In Stock (${equipment.availableQty} units)` : "Out of Stock"}
                          </span>
                        </td>
                      </tr>
                      {specsEntries.map(([key, value]) => (
                        <tr key={String(key)} className="border-b border-white/10 even:bg-navy-light/50">
                          <td className="py-3 px-5 text-cream/60 font-medium capitalize">
                            {String(key).replace(/_/g, " ")}
                          </td>
                          <td className="py-3 px-5 text-cream">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "safety" && (
              <motion.div
                key="safety"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-white font-[Oswald] mb-4">Safety Information</h2>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-5 mb-8">
                  <p className="text-yellow-200/90 leading-relaxed text-sm">
                    It is very important that you are properly trained when using this equipment. You are required to wear all the manufacturer's recommended safety equipment, review all safe operation manuals and decals, and observe all safety precautions when utilising tools and operating equipment. Operator/User assumes all responsibility for the use, care, and inspection of this equipment and your Personal Protective Equipment.
                  </p>
                </div>

                <h3 className="text-lg font-bold text-orange font-[Oswald] uppercase tracking-wider mb-5">
                  Required PPE
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { icon: Eye, label: "Eye Protection" },
                    { icon: HardHat, label: "Hard Hat" },
                    { icon: Shield, label: "Gloves" },
                    { icon: Shield, label: "Safety Boots" },
                    { icon: Shield, label: "Hi-Vis Vest" },
                    { icon: Shield, label: "Ear Protection" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="bg-navy-light border border-white/10 rounded-lg p-4 flex flex-col items-center gap-2 text-center">
                      <Icon className="w-8 h-8 text-orange" />
                      <span className="text-cream/80 text-sm font-medium">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-navy-light border border-orange/20 rounded-lg p-5">
                  <h4 className="font-bold text-cream mb-3 font-[Oswald] uppercase tracking-wider text-sm">
                    Need Training or Assistance?
                  </h4>
                  <p className="text-cream/70 text-sm mb-4">
                    Equip.HK offers equipment orientation and safety briefings for all rental customers. Contact our team to arrange a demonstration.
                  </p>
                  <a
                    href="https://wa.me/85298325789"
                    className="flex items-center gap-2 text-orange hover:text-orange-light transition-colors text-sm font-bold"
                    onClick={() => trackLead.mutate({ type: "whatsapp_click", equipmentItemId: equipment?.id, equipmentName: equipment?.name, source: "product_detail_safety" })}
                  >
                    <Phone className="w-4 h-4" />
                    +852 9832 5789
                  </a>
                </div>

                {/* Operation Manuals */}
                {manuals && manuals.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-orange font-[Oswald] uppercase tracking-wider mb-4">
                      Operation Manuals
                    </h3>
                    <div className="space-y-3">
                      {manuals.map((manual: any) => (
                        <a
                          key={manual.id}
                          href={manual.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-navy-light border border-white/10 hover:border-orange/40 rounded-lg p-4 transition-colors group"
                        >
                          <div className="w-10 h-10 bg-orange/10 rounded flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-orange" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-cream text-sm font-medium truncate">{manual.fileName}</p>
                            {manual.fileSize && (
                              <p className="text-cream/40 text-xs mt-0.5">
                                {(manual.fileSize / 1024 / 1024).toFixed(1)} MB · PDF
                              </p>
                            )}
                          </div>
                          <Download className="w-4 h-4 text-orange/60 group-hover:text-orange transition-colors shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* RIGHT — Sticky Pricing Panel */}
          <div className="lg:sticky lg:top-24">
            {/* Product Title */}
            <div className="mb-5">
              {equipment.brand && (
                <p className="text-orange font-[Oswald] uppercase tracking-wider text-xs mb-1">
                  {equipment.brand}
                </p>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold text-white font-[Oswald] leading-tight">
                {equipment.name}
              </h1>
              {equipment.model && (
                <p className="text-cream/50 text-sm mt-1">Model: {equipment.model}</p>
              )}
            </div>

            {/* Key Specs (above pricing) */}
            {keySpecs.length > 0 && (
              <div className="bg-navy-light border border-white/10 rounded-lg p-4 mb-5">
                <p className="text-xs font-bold text-cream/50 uppercase tracking-wider mb-3 font-[Oswald]">
                  Key Specs
                </p>
                <ul className="space-y-2">
                  {keySpecs.map((spec, i) => (
                    <li key={i} className="flex items-center gap-2 text-cream/80 text-sm">
                      <CheckCircle className="w-4 h-4 text-orange flex-shrink-0" />
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What's Included badge */}
            {(equipment as any).includes && (
              <div className="flex items-center gap-3 bg-green-900/30 border border-green-500/30 rounded-lg px-4 py-3 mb-5">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-green-400 uppercase tracking-wider font-[Oswald] mb-0.5">What's Included</p>
                  <p className="text-cream/90 text-sm">{(equipment as any).includes}</p>
                </div>
              </div>
            )}

            {/* Pricing Panel */}
            <div className="bg-navy-light border border-orange/30 rounded-lg overflow-hidden mb-5">
              {/* 3-column pricing header */}
              <div className="grid grid-cols-3 border-b border-white/10">
                {[
                  { label: "1 DAY", price: dailyRateNum > 0 ? `HK$${Math.round(dailyRateNum).toLocaleString("en-HK")}` : "—" },
                  { label: "1 WEEK", price: weeklyRateNum > 0 ? `HK$${Math.round(weeklyRateNum).toLocaleString("en-HK")}` : (dailyRateNum > 0 ? `HK$${Math.round(dailyRateNum * 7).toLocaleString("en-HK")}` : "—") },
                  { label: "4 WEEK", price: monthlyRateNum > 0 ? `HK$${Math.round(monthlyRateNum).toLocaleString("en-HK")}` : (dailyRateNum > 0 ? `HK$${Math.round(dailyRateNum * 28).toLocaleString("en-HK")}` : "—") },
                ].map(({ label, price }) => (
                  <div key={label} className="flex flex-col items-center py-4 px-2 border-r border-white/10 last:border-r-0">
                    <span className="text-xs text-cream/50 font-[Oswald] uppercase tracking-wider mb-1">{label}</span>
                    <span className="text-lg font-bold text-orange font-[Oswald]">{price}</span>
                  </div>
                ))}
              </div>

              {/* Duration selector */}
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-cream/60 text-xs uppercase tracking-wider font-[Oswald] mb-2 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-navy-deep border border-white/20 rounded px-3 py-2 text-cream text-sm focus:outline-none focus:border-orange"
                  />
                </div>

                <div>
                  <label className="block text-cream/60 text-xs uppercase tracking-wider font-[Oswald] mb-2">
                    Duration:{" "}
                    {rentalDays <= 30
                      ? <span className="text-orange">{rentalDays} day{rentalDays !== 1 ? "s" : ""}</span>
                      : <span className="text-orange">31+ days</span>
                    }
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="31"
                    value={rentalDays}
                    onChange={(e) => setRentalDays(parseInt(e.target.value))}
                    className="w-full accent-orange"
                  />
                  <div className="flex justify-between text-xs text-cream/40 mt-1">
                    <span>1 day</span>
                    <span>7 days</span>
                    <span>30 days</span>
                    <span>31+</span>
                  </div>
                </div>

                {/* Fuel Add-On — only shown for petrol/diesel equipment */}
                {fuelType !== "none" && rentalDays <= 30 && (
                  <div className="p-4 rounded-lg border border-orange/30 bg-orange/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⛽</span>
                      <span className="text-cream font-[Oswald] uppercase tracking-wider text-sm font-bold">
                        Fuel Add-On ({fuelType === "petrol" ? "Petrol" : "Diesel"})
                      </span>
                      {fuelPricesQ.data && (
                        <span className="ml-auto text-xs text-orange font-mono">
                          HK${fuelPricePerLitre.toFixed(2)}/L
                          {fuelPricesQ.data.source === "fallback" && " (est.)"}
                        </span>
                      )}
                    </div>
                    <p className="text-cream/50 text-xs">
                      Live pump price from Consumer Council HK.
                      {fuelPricesQ.data?.updatedAt && (
                        <> Updated {new Date(fuelPricesQ.data.updatedAt).toLocaleDateString("en-HK", { day: "numeric", month: "short" })}.</>
                      )}
                    </p>
                    <div className="flex items-center gap-3">
                      <label className="text-cream/60 text-xs uppercase tracking-wider font-[Oswald] whitespace-nowrap">
                        Litres needed
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        step="1"
                        value={fuelLitres}
                        onChange={(e) => setFuelLitres(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-24 bg-navy-deep border border-white/20 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-orange text-center"
                      />
                      <span className="text-cream/40 text-xs">L</span>
                    </div>
                    {fuelLitres > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-orange/20">
                        <span className="text-cream/60 text-xs">{fuelLitres}L × HK${fuelPricePerLitre.toFixed(2)}</span>
                        <span className="text-orange font-bold font-[Oswald]">+HK${fuelCost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Total or Quote prompt */}
                {rentalDays <= 30 ? (
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="text-cream/70 text-sm">Total Estimate</span>
                    <span className="text-2xl font-bold text-white font-[Oswald]">
                      HK${Math.round(totalPrice + fuelCost).toLocaleString("en-HK")}
                    </span>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-orange/30 bg-orange/5 rounded-lg px-4 py-3">
                    <p className="text-orange font-[Oswald] font-bold text-base uppercase tracking-wider">Long-term hire rates available</p>
                    <p className="text-cream/60 text-xs mt-1">Contact us for pricing</p>
                  </div>
                )}

                {/* CTA */}
                {rentalDays <= 30 ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddToCart}
                        disabled={!isAvailable}
                        className="flex-1 bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider h-12 text-base gap-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Add to Rental Cart
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toggleFavMutation.mutate({ equipmentItemId: equipmentId })}
                        disabled={toggleFavMutation.isPending}
                        className={`h-12 w-12 p-0 border-white/20 hover:border-red-400 transition-colors ${
                          isFav ? "bg-red-500/20 border-red-400" : "bg-transparent"
                        }`}
                        title={isFav ? "Remove from favourites" : "Add to favourites"}
                      >
                        <Heart
                          className={`w-5 h-5 transition-colors ${
                            isFav ? "fill-red-400 text-red-400" : "text-cream/70"
                          }`}
                        />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShare}
                        className="h-12 w-12 p-0 border-white/20 hover:border-orange/50 bg-transparent transition-colors"
                        title="Share this item"
                      >
                        {copied
                          ? <Check className="w-5 h-5 text-green-400" />
                          : <Share2 className="w-5 h-5 text-cream/70" />
                        }
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        trackLead.mutate({ type: "quote_request", equipmentItemId: equipment?.id, equipmentName: equipment?.name, notes: "Request a Quote from product page", source: "product_detail" });
                        navigate(`/get-a-quote?equipment=${encodeURIComponent(equipment?.name || '')}`);
                      }}
                      className="w-full border-cream/20 text-cream/70 hover:border-orange hover:text-orange font-[Oswald] uppercase tracking-wider h-10 text-sm gap-2 bg-transparent"
                    >
                      <FileText className="w-4 h-4" />
                      Request a Quote for Long-Term Hire
                    </Button>
                    {/* Compare button */}
                    {equipment && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (isInComparison(equipment.id)) {
                            removeFromComparison(equipment.id);
                            toast.info(`${equipment.name} removed from comparison`);
                          } else {
                            addToComparison({
                              id: equipment.id,
                              name: equipment.name,
                              brand: equipment.brand || undefined,
                              dailyRate: equipment.dailyRate || undefined,
                              weeklyRate: equipment.weeklyRate || undefined,
                              monthlyRate: equipment.monthlyRate || undefined,
                              imageUrl: equipment.imageUrl || undefined,
                              description: equipment.description || undefined,
                              specs: equipment.specs || undefined,
                              condition: equipment.condition || undefined,
                              availability: equipment.availability || undefined,
                              quantity: equipment.availableQty ?? undefined,
                            });
                            toast.success(`${equipment.name} added to comparison`);
                          }
                        }}
                        className={`w-full font-[Oswald] uppercase tracking-wider h-10 text-sm gap-2 bg-transparent transition-colors ${
                          isInComparison(equipment.id)
                            ? "border-orange text-orange"
                            : "border-cream/20 text-cream/50 hover:border-cream/40 hover:text-cream/80"
                        }`}
                      >
                        {isInComparison(equipment.id) ? "✓ In Comparison" : "+ Add to Compare"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        trackLead.mutate({ type: "quote_request", equipmentItemId: equipment?.id, equipmentName: equipment?.name, notes: "31+ day long-term hire quote request", source: "product_detail_long_hire" });
                        navigate(`/get-a-quote?equipment=${encodeURIComponent(equipment?.name || '')}`);
                      }}
                      className="flex-1 bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider h-12 text-base gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      Request a Quote
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toggleFavMutation.mutate({ equipmentItemId: equipmentId })}
                      disabled={toggleFavMutation.isPending}
                      className={`h-12 w-12 p-0 border-white/20 hover:border-red-400 transition-colors ${
                        isFav ? "bg-red-500/20 border-red-400" : "bg-transparent"
                      }`}
                      title={isFav ? "Remove from favourites" : "Add to favourites"}
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          isFav ? "fill-red-400 text-red-400" : "text-cream/70"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleShare}
                      className="h-12 w-12 p-0 border-white/20 hover:border-orange/50 bg-transparent transition-colors"
                      title="Share this item"
                    >
                      {copied
                        ? <Check className="w-5 h-5 text-green-400" />
                        : <Share2 className="w-5 h-5 text-cream/70" />
                      }
                    </Button>
                  </div>
                )}

                {!isAvailable && rentalDays <= 30 && (
                  <div className="flex items-start gap-2 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Currently unavailable — contact us for alternatives.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Availability badge */}
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-5 ${isAvailable ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
              <div className={`w-2 h-2 rounded-full ${isAvailable ? "bg-green-400" : "bg-red-400"}`} />
              <span className={isAvailable ? "text-green-300" : "text-red-300"}>
                {isAvailable
                  ? `${equipment.availableQty} unit${equipment.availableQty !== 1 ? "s" : ""} available`
                  : "Currently out of stock"}
              </span>
            </div>

            {/* Contact */}
            <div className="bg-navy-light border border-white/10 rounded-lg p-4 text-center">
              <p className="text-cream/60 text-xs mb-2">Need help? Call us</p>
              <a
                href="https://wa.me/85298325789"
                className="flex items-center justify-center gap-2 text-orange hover:text-orange-light transition-colors font-bold"
                onClick={() => trackLead.mutate({ type: "whatsapp_click", equipmentItemId: equipment?.id, equipmentName: equipment?.name, source: "product_detail_sidebar" })}
              >
                <Phone className="w-4 h-4" />
                +852 9832 5789
              </a>
            </div>
          </div>
        </div>

        {/* Recently Viewed */}
        <RecentlyViewedSection />

        {/* Related Consumables */}
        {relatedConsumables && relatedConsumables.length > 0 && (
          <div className="mt-20 pt-12 border-t border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Beaker className="w-7 h-7 text-orange" />
              <h2 className="text-3xl font-bold text-white font-[Oswald]">
                Related Consumables
              </h2>
            </div>
            <p className="text-cream/50 text-sm mb-8 ml-10">
              Materials and supplies you'll need for this equipment — available for purchase.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {relatedConsumables.map((item: any, index: number) => {
                const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price ?? 0);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.06 }}
                    onClick={() => navigate(`/consumable/${item.id}`)}
                    className="group bg-navy-light border border-white/10 hover:border-orange/40 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer"
                  >
                    <div className="aspect-[4/3] bg-white overflow-hidden flex items-center justify-center p-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Beaker className="w-10 h-10 text-orange/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-white font-[Oswald] mb-1 line-clamp-2 group-hover:text-orange transition-colors">
                        {item.name}
                      </h3>
                      {item.brand && (
                        <p className="text-xs text-cream/50 mb-1">{item.brand}</p>
                      )}
                      {item.note && (
                        <p className="text-xs text-cream/40 italic mb-2 line-clamp-2">{item.note}</p>
                      )}
                      <div className="flex justify-between items-baseline mt-auto pt-2 border-t border-white/5">
                        <span className="text-orange font-bold text-sm">
                          {price > 0 ? `HK$${Math.round(price).toLocaleString("en-HK")}` : 'POA'}
                        </span>
                        <span className="text-cream/40 text-xs">per {item.unit || 'unit'}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-6 bg-navy-light/50 border border-orange/10 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-cream/70 text-sm">
                  Consumables are sold separately. Contact us to add these to your rental order or for bulk pricing.
                </p>
                <a
                  href="https://wa.me/85298325789"
                  className="text-orange hover:text-orange-light text-sm font-bold mt-1 inline-flex items-center gap-1 transition-colors"
                  onClick={() => trackLead.mutate({ type: "whatsapp_click", equipmentItemId: equipment?.id, equipmentName: equipment?.name, source: "product_detail_consumables" })}
                >
                  <Phone className="w-3.5 h-3.5" />
                  WhatsApp us for pricing
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Related Equipment */}
        {relatedEquipment.length > 0 && (
          <div className="mt-20 pt-12 border-t border-white/10">
            <h2 className="text-3xl font-bold text-white font-[Oswald] mb-8">
              Related Equipment
            </h2>
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
                      <div className="flex justify-between items-baseline">
                        <span className="text-orange font-bold text-sm">
                          {itemRate > 0 ? `HK$${Math.round(itemRate).toLocaleString("en-HK")}` : "POA"}
                        </span>
                        <span className="text-cream/40 text-xs">/day</span>
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
