import { useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2, ShoppingBag, MessageCircle, Send, Loader2, CreditCard, Truck, Package, Star, Bookmark } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";

export default function RentalCart() {
  const [, navigate] = useLocation();
  const { items, removeFromCart, clearCart, getTotalPrice } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? "");
  const [company, setCompany] = useState("");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "self_collection">("self_collection");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [sending, setSending] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hkidNumber, setHkidNumber] = useState("");
  const [hkidFile, setHkidFile] = useState<File | null>(null);
  const [hkidUploading, setHkidUploading] = useState(false);
  const [hkidUrl, setHkidUrl] = useState("");
  // Save as Job Kit
  const [showSaveKit, setShowSaveKit] = useState(false);
  const [kitName, setKitName] = useState("");
  const saveCartMutation = trpc.savedCarts.save.useMutation({
    onSuccess: () => {
      toast.success(`Job Kit "${kitName}" saved! Find it in Account → Saved Job Kits.`);
      setShowSaveKit(false);
      setKitName("");
    },
    onError: (err) => toast.error(err.message),
  });
  const handleSaveKit = () => {
    if (!kitName.trim()) { toast.error("Please enter a name for your Job Kit."); return; }
    const kitItems = items.map(item => ({
      equipmentItemId: item.equipmentId,
      equipmentName: item.name,
      dailyRate: item.dailyRate,
      rentalDays: item.rentalDays,
      imageUrl: item.imageUrl,
    }));
    saveCartMutation.mutate({ name: kitName.trim(), items: JSON.stringify(kitItems) });
  };
  // Delivery / collection scheduling
  const [deliverySlotDate, setDeliverySlotDate] = useState("");
  const [deliverySlotTime, setDeliverySlotTime] = useState<"morning" | "afternoon" | "evening" | "">("");
  const [collectionSlotDate, setCollectionSlotDate] = useState("");
  const [collectionSlotTime, setCollectionSlotTime] = useState<"morning" | "afternoon" | "evening" | "">("");

  const trackLead = trpc.enquiryLeads.track.useMutation();
  const submitContact = trpc.contact.submit.useMutation();

  const { data: membership } = trpc.membership.getMyMembership.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const plan = membership?.plan ?? "payg";
  const isPro = plan === "trade_pro";

  // Pricing calculation
  const maxRentalDays = items.length > 0 ? Math.max(...items.map((i) => i.rentalDays)) : 0;
  const discountPct = isPro ? (maxRentalDays >= 28 ? 15 : 10) : 0;
  const subtotal = getTotalPrice();
  const discountAmount = subtotal * (discountPct / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const allUnderThreshold = items.every((i) => i.totalPrice < 5000);
  const depositWaived = isPro && allUnderThreshold;
  const depositAmount = depositWaived ? 0 : subtotal * 0.2;
  const deliveryFee = deliveryType === "delivery" ? (isPro && discountedSubtotal >= 500 ? 0 : 200) : 0;
  const totalAmount = discountedSubtotal + deliveryFee + depositAmount;

  const createOrderMutation = trpc.membership.createOrder.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        // Use location.href (same tab) to avoid popup blockers on async callbacks
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (err) => toast.error(err.message || "Checkout failed. Please try again."),
  });

  const handleHkidUpload = async (file: File) => {
    setHkidUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-hkid", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setHkidUrl(data.url);
      toast.success("HKID uploaded successfully");
    } catch {
      toast.error("HKID upload failed — please try again");
    } finally {
      setHkidUploading(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      toast.error("Please fill in your name, email, and phone number");
      return;
    }
    if (!hkidNumber.trim()) {
      toast.error("HKID number is required for all rentals");
      return;
    }
    if (!hkidUrl) {
      toast.error("Please upload a photo of your HKID before proceeding");
      return;
    }
    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      toast.error("Please enter your delivery address");
      return;
    }

    const rentalStartDate = items[0]?.startDate
      ? new Date(items[0].startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    const rentalEndDate = new Date(
      new Date(rentalStartDate).getTime() + maxRentalDays * 86400000
    ).toISOString().split("T")[0];

    await createOrderMutation.mutateAsync({
      items: items.map((item) => ({
        equipmentItemId: item.equipmentId,
        name: item.name,
        brand: undefined,
        dailyRate: item.dailyRate,
        rentalDays: item.rentalDays,
      })),
      rentalStartDate,
      rentalEndDate,
      deliveryType,
      deliveryAddress: deliveryType === "delivery" ? deliveryAddress : undefined,
      customerName,
      customerEmail,
      customerPhone,
      companyName: company || undefined,
      hkidNumber: hkidNumber || undefined,
      hkidPhotoUrl: hkidUrl || undefined,
      deliverySlotDate: deliverySlotDate || undefined,
      deliverySlotTime: (deliverySlotTime as "morning" | "afternoon" | "evening") || undefined,
      collectionSlotDate: collectionSlotDate || undefined,
      collectionSlotTime: (collectionSlotTime as "morning" | "afternoon" | "evening") || undefined,
      // Fuel add-on: aggregate from cart items
      ...((() => {
        const fuelItems = items.filter(i => i.fuelType && i.fuelType !== "none" && (i.fuelLitres ?? 0) > 0);
        if (fuelItems.length === 0) return {};
        const totalFuelCost = fuelItems.reduce((sum, i) => sum + (i.fuelCost ?? 0), 0);
        const totalFuelLitres = fuelItems.reduce((sum, i) => sum + (i.fuelLitres ?? 0), 0);
        const firstFuelItem = fuelItems[0];
        return {
          fuelType: firstFuelItem?.fuelType as "petrol" | "diesel",
          fuelLitres: totalFuelLitres,
          fuelPricePerLitre: firstFuelItem?.fuelPricePerLitre ?? 0,
          fuelCost: totalFuelCost,
        };
      })()),
      origin: window.location.origin,
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-navy-deep">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="container">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-orange hover:text-orange-light mb-8 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-[Oswald] uppercase tracking-wider">Back</span>
            </button>

            <div className="text-center py-16">
              <ShoppingBag className="w-16 h-16 text-orange/30 mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-white font-[Oswald] mb-4">
                Your Rental Cart is Empty
              </h1>
              <p className="text-cream/70 text-lg mb-8">
                Start adding equipment to begin your rental order.
              </p>
              <Button
                onClick={() => navigate("/#equipment")}
                className="bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider"
              >
                Browse Equipment
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = getTotalPrice();

  // Build WhatsApp message with cart details
  const buildWhatsAppMessage = () => {
    let msg = `Hi Equip.HK! I'd like to enquire about renting:\n\n`;
    items.forEach((item) => {
      msg += `• ${item.name}\n`;
      msg += `  Start: ${new Date(item.startDate).toLocaleDateString()}\n`;
      msg += `  Duration: ${item.rentalDays} day${item.rentalDays !== 1 ? "s" : ""}\n`;
      msg += `  Rate: HK$${Math.round(item.dailyRate).toLocaleString("en-HK")}/day\n\n`;
    });
    msg += `Estimated Total: HK$${Math.round(totalPrice).toLocaleString("en-HK")}\n\n`;
    if (customerName) msg += `Name: ${customerName}\n`;
    if (company) msg += `Company: ${company}\n`;
    if (customerPhone) msg += `Phone: ${customerPhone}\n`;
    if (customerEmail) msg += `Email: ${customerEmail}\n`;
    return msg;
  };

  const handleWhatsAppEnquiry = () => {
    // Track each item as a lead
    items.forEach((item) => {
      trackLead.mutate({
        type: "cart_enquiry",
        equipmentItemId: item.equipmentId,
        equipmentName: item.name,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        company: company || undefined,
          notes: `Cart enquiry: ${item.rentalDays} days from ${new Date(item.startDate).toLocaleDateString()}, HK$${Math.round(item.totalPrice).toLocaleString("en-HK")}`,
        source: "cart_page",
      });
    });

    const msg = buildWhatsAppMessage();
    window.open(`https://wa.me/85298325789?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success("Opening WhatsApp — we'll get back to you shortly!");
  };

  const handleEmailEnquiry = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error("Please enter your name and email to send an enquiry");
      return;
    }

    setSending(true);
    try {
      // Track leads
      items.forEach((item) => {
        trackLead.mutate({
          type: "quote_request",
          equipmentItemId: item.equipmentId,
          equipmentName: item.name,
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined,
          company: company || undefined,
          notes: `Quote request: ${item.rentalDays} days from ${new Date(item.startDate).toLocaleDateString()}, HK$${Math.round(item.totalPrice).toLocaleString("en-HK")}`,
          source: "cart_page",
        });
      });

      // Submit as contact form
      const itemList = items.map((item) =>
        `${item.name} — ${item.rentalDays} days from ${new Date(item.startDate).toLocaleDateString()} (HK$${Math.round(item.totalPrice).toLocaleString("en-HK")})`
      ).join("\n");

      await submitContact.mutateAsync({
        name: customerName,
        email: customerEmail,
        phone: customerPhone || undefined,
        company: company || undefined,
        subject: `Rental Quote Request — ${items.length} item${items.length !== 1 ? "s" : ""} (HK$${Math.round(totalPrice).toLocaleString("en-HK")})`,
        message: `I'd like a quote for the following equipment:\n\n${itemList}\n\nEstimated Total: HK$${Math.round(totalPrice).toLocaleString("en-HK")}`,
        formType: "quote",
      });

      toast.success("Quote request sent! We'll email you within 24 hours.");
    } catch (err: any) {
      toast.error("Failed to send — please try WhatsApp instead");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-deep">
      <SEOHead title="Rental Cart" description="Review your EquipHK equipment rental selections and request a quote." url="/cart" />
      <Navbar />
      <div className="pt-24 pb-16">
      <div className="container">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-orange hover:text-orange-light mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-[Oswald] uppercase tracking-wider">Back</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold text-white font-[Oswald] mb-8">
              Rental Cart ({items.length} item{items.length !== 1 ? "s" : ""})
            </h1>

            <div className="space-y-4">
              {items.map((item) => (
                <Card
                  key={item.equipmentId}
                  className="bg-navy-light border-orange/20 p-6 flex gap-6"
                >
                  {/* Image */}
                  <div className="w-24 h-24 bg-white rounded overflow-hidden flex-shrink-0 p-1.5">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "";
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.classList.add("flex", "items-center", "justify-center", "bg-gray-100");
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {item.name}
                    </h3>
                    <div className="space-y-1 text-cream/70 text-sm mb-4">
                      <p>
                        <span className="text-cream/50">Start Date:</span>{" "}
                        {new Date(item.startDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="text-cream/50">Duration:</span>{" "}
                        {item.rentalDays} day{item.rentalDays !== 1 ? "s" : ""}
                      </p>
                      <p>
                        <span className="text-cream/50">Daily Rate:</span> HK$
                        {Math.round(item.dailyRate).toLocaleString("en-HK")}
                      </p>
                      {item.fuelType && item.fuelType !== "none" && item.fuelLitres && item.fuelLitres > 0 && (
                        <p className="text-orange/80">
                          <span className="text-cream/50">⛽ Fuel ({item.fuelType === "petrol" ? "Petrol" : "Diesel"}):</span>{" "}
                          {item.fuelLitres}L × HK${item.fuelPricePerLitre?.toFixed(2)}/L
                          {" = "}
                          <span className="text-orange font-semibold">HK${item.fuelCost?.toFixed(2)}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                      <p className="text-cream/70 text-sm mb-1">Total</p>
                      <p className="text-2xl font-bold text-orange">
                        HK${Math.round(item.totalPrice).toLocaleString("en-HK")}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        removeFromCart(item.equipmentId);
                        toast.success(`${item.name} removed from cart`);
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Clear Cart Button */}
            <button
              onClick={() => {
                clearCart();
                toast.success("Cart cleared");
              }}
              className="mt-6 text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary & Checkout */}
          <div className="space-y-4">
            <Card className="bg-navy-light border-orange/20 p-6 sticky top-24 space-y-5">
              <h2 className="text-xl font-bold text-white font-[Oswald]">Order Summary</h2>

              {/* Trade Pro badge */}
              {isPro && (
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
                  <Star className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-300 text-sm font-medium">
                    Trade Pro — {discountPct}% discount applied
                  </span>
                </div>
              )}

              {/* Trade Pro Upgrade Prompt — show for PAYG users with cart >= HK$2,000 */}
              {!isPro && subtotal >= 2000 && (
                <div className="bg-gradient-to-r from-orange/10 to-yellow-500/10 border border-orange/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-orange mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold mb-1">
                        Upgrade to Trade Pro &amp; save HK${Math.round(subtotal * 0.1).toLocaleString("en-HK")} on this order
                      </p>
                      <p className="text-cream/50 text-xs mb-3">
                        Trade Pro members get 10% off all rentals, free delivery on orders over HK$500, and deposit waived on items under HK$5,000.
                      </p>
                      <button
                        onClick={() => navigate("/register")}
                        className="text-orange text-xs font-semibold hover:text-orange/80 underline underline-offset-2 transition-colors"
                      >
                        Upgrade to Trade Pro →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-cream/70">
                  <span>Subtotal</span>
                  <span>HK${Math.round(subtotal).toLocaleString("en-HK")}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount ({discountPct}%)</span>
                    <span>−HK${Math.round(discountAmount).toLocaleString("en-HK")}</span>
                  </div>
                )}
                <div className="flex justify-between text-cream/70">
                  <span>Delivery</span>
                  <span>{deliveryFee === 0 ? (deliveryType === "delivery" ? "Free (Pro benefit)" : "N/A") : `HK$${deliveryFee}`}</span>
                </div>
                {depositWaived ? (
                  <div className="flex justify-between text-green-400">
                    <span>Security Deposit</span>
                    <span>Waived (Pro benefit)</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-cream/70">
                    <span>Security Deposit (refundable)</span>
                    <span>HK${Math.round(depositAmount).toLocaleString("en-HK")}</span>
                  </div>
                )}
                <div className="border-t border-cream/10 pt-3 flex justify-between">
                  <span className="text-white font-bold">Total Due Now</span>
                  <span className="text-2xl font-bold text-orange">
                    HK${Math.round(totalAmount).toLocaleString("en-HK")}
                  </span>
                </div>
              </div>

              {/* Delivery Method */}
              <div>
                <p className="text-xs text-cream/50 uppercase tracking-wider font-[Oswald] mb-2">Delivery Method</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDeliveryType("self_collection")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      deliveryType === "self_collection"
                        ? "border-orange bg-orange/10 text-orange"
                        : "border-cream/20 text-cream/60 hover:border-cream/40"
                    }`}
                  >
                    <Package className="w-4 h-4" /> Self-Collect
                  </button>
                  <button
                    onClick={() => setDeliveryType("delivery")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      deliveryType === "delivery"
                        ? "border-orange bg-orange/10 text-orange"
                        : "border-cream/20 text-cream/60 hover:border-cream/40"
                    }`}
                  >
                    <Truck className="w-4 h-4" /> Delivery
                  </button>
                </div>
                {deliveryType === "self_collection" && (
                  <p className="text-xs text-cream/40 mt-2">1-12 Shing Fung Industrial Park, 1 Hon Kin Road, Sai Kung, Hong Kong</p>
                )}
                {deliveryType === "delivery" && (
                  <Input
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Delivery address"
                    className="mt-2 bg-navy-deep border-cream/20 text-cream placeholder:text-cream/30 text-sm"
                  />
                )}
              </div>

              {/* Delivery & Collection Scheduling */}
              <div className="space-y-3">
                <p className="text-xs text-cream/50 uppercase tracking-wider font-[Oswald]">Scheduling (Optional)</p>
                <div>
                  <p className="text-xs text-cream/40 mb-1">{deliveryType === "delivery" ? "Preferred Delivery Date" : "Preferred Collection Date"}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={deliverySlotDate}
                      onChange={(e) => setDeliverySlotDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="bg-navy-deep border-cream/20 text-cream text-sm"
                    />
                    <select
                      value={deliverySlotTime}
                      onChange={(e) => setDeliverySlotTime(e.target.value as any)}
                      className="bg-navy-deep border border-cream/20 text-cream text-sm rounded-md px-3 py-2"
                    >
                      <option value="">Any time</option>
                      <option value="morning">Morning (9am–1pm)</option>
                      <option value="afternoon">Afternoon (1pm–6pm)</option>
                      <option value="evening">Evening (6pm–9pm)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-cream/40 mb-1">Preferred Return / Collection Date</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={collectionSlotDate}
                      onChange={(e) => setCollectionSlotDate(e.target.value)}
                      min={deliverySlotDate || new Date().toISOString().split("T")[0]}
                      className="bg-navy-deep border-cream/20 text-cream text-sm"
                    />
                    <select
                      value={collectionSlotTime}
                      onChange={(e) => setCollectionSlotTime(e.target.value as any)}
                      className="bg-navy-deep border border-cream/20 text-cream text-sm rounded-md px-3 py-2"
                    >
                      <option value="">Any time</option>
                      <option value="morning">Morning (9am–1pm)</option>
                      <option value="afternoon">Afternoon (1pm–6pm)</option>
                      <option value="evening">Evening (6pm–9pm)</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-cream/30">Scheduling is a preference — our team will confirm availability.</p>
              </div>

              {/* Customer Details */}
              <div className="space-y-3">
                <p className="text-xs text-cream/50 uppercase tracking-wider font-[Oswald]">Your Details</p>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full Name *"
                  className="bg-navy-deep border-cream/20 text-cream placeholder:text-cream/30"
                />
                <Input
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email Address *"
                  type="email"
                  className="bg-navy-deep border-cream/20 text-cream placeholder:text-cream/30"
                />
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number *"
                  type="tel"
                  className="bg-navy-deep border-cream/20 text-cream placeholder:text-cream/30"
                />
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company (optional)"
                  className="bg-navy-deep border-cream/20 text-cream placeholder:text-cream/30"
                />
              </div>

              {/* HKID Verification */}
              <div className="space-y-3">
                <p className="text-xs text-cream/50 uppercase tracking-wider font-[Oswald]">Identity Verification (Required)</p>
                <Input
                  value={hkidNumber}
                  onChange={(e) => setHkidNumber(e.target.value.toUpperCase())}
                  placeholder="HKID Number * (e.g. A123456(7))"
                  className="bg-navy-deep border-cream/20 text-cream placeholder:text-cream/30 font-mono"
                />
                <div
                  className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                    hkidUrl
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-cream/20 hover:border-orange/50 bg-navy-deep"
                  }`}
                  onClick={() => document.getElementById("hkid-upload-cart")?.click()}
                >
                  <input
                    id="hkid-upload-cart"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setHkidFile(file);
                        handleHkidUpload(file);
                      }
                    }}
                  />
                  {hkidUploading ? (
                    <div className="flex items-center justify-center gap-2 text-orange">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  ) : hkidUrl ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span className="text-sm font-medium">HKID uploaded — tap to replace</span>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-6 h-6 text-cream/30 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <p className="text-xs text-cream/50">Upload HKID photo *</p>
                      <p className="text-xs text-cream/30 mt-0.5">JPG, PNG or PDF — max 10MB</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-cream/30">Your HKID is stored securely and used only for identity verification per PDPO (Cap. 486).</p>
              </div>

              {/* T&C Acceptance */}
              <div className="bg-white/5 border border-cream/10 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        termsAccepted
                          ? "bg-orange border-orange"
                          : "border-cream/30 group-hover:border-orange/60"
                      }`}
                    >
                      {termsAccepted && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-cream/60 leading-relaxed">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange underline hover:text-orange-light font-semibold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      EquipHK Terms &amp; Conditions
                    </a>
                    , including late return charges (full daily rate, discounts void) and the 15:00 HKT return deadline. This is a legally binding rental agreement under Hong Kong SAR law.
                  </span>
                </label>
                {!termsAccepted && (
                  <p className="text-yellow-400/80 text-xs mt-2 ml-8">
                    Required before payment.
                  </p>
                )}
              </div>

              {/* Primary CTA — Stripe Pay */}
              <Button
                onClick={handleStripeCheckout}
                disabled={createOrderMutation.isPending || !termsAccepted}
                className="w-full bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createOrderMutation.isPending ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5 mr-2" />
                )}
                Pay Now — HK${Math.round(totalAmount).toLocaleString("en-HK")}
              </Button>

              {/* Secondary — WhatsApp */}
              <Button
                onClick={handleWhatsAppEnquiry}
                variant="outline"
                className="w-full border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/10 font-[Oswald] uppercase tracking-wider h-10 text-sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Enquire via WhatsApp
              </Button>

              {/* Save as Job Kit */}
              {isAuthenticated && (
                <div className="border-t border-cream/10 pt-3">
                  {!showSaveKit ? (
                    <button
                      onClick={() => setShowSaveKit(true)}
                      className="w-full flex items-center justify-center gap-2 text-cream/50 hover:text-cream/80 text-xs py-2 transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      Save as Job Kit for future re-hire
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-cream/60 text-xs">Name your Job Kit:</p>
                      <div className="flex gap-2">
                        <Input
                          value={kitName}
                          onChange={(e) => setKitName(e.target.value)}
                          placeholder="e.g. Waterproofing Kit"
                          className="bg-navy-deep border-cream/20 text-white text-sm h-8 flex-1"
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveKit()}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveKit}
                          disabled={saveCartMutation.isPending}
                          className="bg-orange hover:bg-orange/90 text-white h-8 px-3 text-xs"
                        >
                          {saveCartMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                        </Button>
                        <button onClick={() => setShowSaveKit(false)} className="text-cream/40 hover:text-cream/70 text-xs px-1">✕</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => navigate("/#equipment")}
                className="w-full bg-navy-deep hover:bg-navy-deep/80 text-cream/70 hover:text-cream border border-cream/10 hover:border-cream/30 font-[Oswald] uppercase tracking-wider h-10 rounded transition-colors text-sm"
              >
                Continue Shopping
              </button>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
