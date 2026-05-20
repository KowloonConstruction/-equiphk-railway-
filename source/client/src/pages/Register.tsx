/**
 * EquipHK Membership Registration
 * 3-step flow: Plan Selection → Details + HKID → Review & Pay
 */
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Shield,
  Zap,
  Building2,
  Star,
  Loader2,
  Camera,
} from "lucide-react";

type Plan = "payg" | "trade_pro";

const PLANS = [
  {
    id: "payg" as Plan,
    name: "Pay-As-You-Go",
    price: "Free to join",
    priceNote: "Standard published rates apply",
    tagline: "Perfect for occasional renters & DIY projects",
    icon: Zap,
    color: "border-orange-500",
    badge: null,
    features: [
      "Standard published rates",
      "Access to full B2C tool catalog",
      "Online booking & real-time availability",
      "HKID verification + card hold deposit",
      "Delivery or self-collection options",
      "Standard equipment insurance included",
      "Email & phone support",
    ],
  },
  {
    id: "trade_pro" as Plan,
    name: "Trade Pro",
    price: "HK$499/month",
    priceNote: "Billed monthly via Stripe",
    tagline: "Frequent renters & small contractors",
    icon: Building2,
    color: "border-blue-500",
    badge: "Most Popular",
    features: [
      "Everything in Pay-As-You-Go, plus:",
      "10% off standard rentals (15% on monthly)",
      "Priority booking & equipment holds",
      "Waived deposits on tools under HK$5,000",
      "Monthly consolidated invoicing",
      "Dedicated support line",
      "Free delivery on orders over HK$500",
    ],
  },
];

export default function Register() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("payg");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    businessRegNo: "",
    monthlyBudget: "",
    hkidNumber: "",
    customerNotes: "",
  });

  // HKID photo state
  const [hkidPhoto, setHkidPhoto] = useState<{
    base64: string;
    mime: string;
    preview: string;
    fileName: string;
  } | null>(null);

  const registerMutation = trpc.membership.register.useMutation({
    onSuccess: (data) => {
      toast.success("Registration successful! Welcome to EquipHK.");
      if (data.plan === "payg") {
        navigate("/account");
      } else {
        // Trade Pro — redirect handled by upgradeToPro
        navigate("/account");
      }
    },
    onError: (err) => {
      if (err.message.includes("already have a membership")) {
        toast.error("You already have an EquipHK membership. Visit your account to manage it.");
        navigate("/account");
      } else {
        toast.error(err.message || "Registration failed. Please try again.");
      }
    },
  });

  const upgradeProMutation = trpc.membership.upgradeToPro.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info("Redirecting to Stripe for Trade Pro payment...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Upgrade failed. Please try again.");
    },
  });

  // Pre-fill email from auth user
  const effectiveEmail = form.email || user?.email || "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      setHkidPhoto({
        base64,
        mime: file.type,
        preview: dataUrl,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    const payload = {
      plan: selectedPlan,
      fullName: form.fullName,
      email: effectiveEmail,
      phone: form.phone,
      companyName: form.companyName || undefined,
      businessRegNo: form.businessRegNo || undefined,
      monthlyBudget: form.monthlyBudget || undefined,
      hkidNumber: form.hkidNumber || undefined,
      hkidPhotoBase64: hkidPhoto?.base64,
      hkidPhotoMime: hkidPhoto?.mime,
      customerNotes: form.customerNotes || undefined,
      origin: window.location.origin,
    };

    const result = await registerMutation.mutateAsync(payload);

    // If Trade Pro, immediately launch Stripe upgrade
    if (selectedPlan === "trade_pro" && result.success) {
      await upgradeProMutation.mutateAsync({ origin: window.location.origin });
    }
  };

  const isStep2Valid =
    form.fullName.trim().length >= 2 &&
    effectiveEmail.includes("@") &&
    form.phone.trim().length >= 8;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <Navbar />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black uppercase tracking-tight mb-3">
              Join <span className="text-orange-500">EquipHK</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Choose your plan and start renting in minutes
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    step > s
                      ? "bg-orange-500 border-orange-500 text-white"
                      : step === s
                      ? "border-orange-500 text-orange-500"
                      : "border-gray-600 text-gray-600"
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    step >= s ? "text-white" : "text-gray-600"
                  }`}
                >
                  {s === 1 ? "Choose Plan" : s === 2 ? "Your Details" : "Review & Pay"}
                </span>
                {s < 3 && <ChevronRight className="w-4 h-4 text-gray-600" />}
              </div>
            ))}
          </div>

          {/* ─── Step 1: Plan Selection ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {PLANS.map((plan) => {
                  const Icon = plan.icon;
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? `${plan.color} bg-white/5`
                          : "border-gray-700 hover:border-gray-500 bg-white/2"
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-3 left-6 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {plan.badge}
                        </span>
                      )}
                      <div className="flex items-start gap-4 mb-4">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected ? "bg-orange-500/20" : "bg-gray-800"
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 ${
                              isSelected ? "text-orange-400" : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-black">{plan.name}</h3>
                          <p className="text-gray-400 text-sm">{plan.tagline}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <span className="text-2xl font-black text-white">{plan.price}</span>
                        <p className="text-gray-500 text-xs mt-1">{plan.priceNote}</p>
                      </div>

                      <ul className="space-y-2">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2
                              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                i === 0 && plan.id === "trade_pro"
                                  ? "text-gray-500"
                                  : "text-orange-400"
                              }`}
                            />
                            <span
                              className={
                                i === 0 && plan.id === "trade_pro"
                                  ? "text-gray-500 italic"
                                  : "text-gray-300"
                              }
                            >
                              {f}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-orange-500/30">
                          <span className="text-orange-400 text-sm font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Selected
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 text-lg rounded-xl"
              >
                Continue with {selectedPlan === "trade_pro" ? "Trade Pro" : "Pay-As-You-Go"}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* ─── Step 2: Details + HKID ─────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-gray-700 rounded-2xl p-6 space-y-5">
                <h2 className="text-xl font-black uppercase tracking-wide">
                  Your Details
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 mb-1 block">Full Name *</Label>
                    <Input
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="As on your HKID"
                      className="bg-white/5 border-gray-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-1 block">Email *</Label>
                    <Input
                      value={effectiveEmail}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                      type="email"
                      className="bg-white/5 border-gray-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-1 block">Phone Number *</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+852 9XXX XXXX"
                      className="bg-white/5 border-gray-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                  {selectedPlan === "trade_pro" && (
                    <>
                      <div>
                        <Label className="text-gray-300 mb-1 block">Company Name</Label>
                        <Input
                          value={form.companyName}
                          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                          placeholder="Your company (optional)"
                          className="bg-white/5 border-gray-600 text-white placeholder:text-gray-500"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300 mb-1 block">Business Reg. No.</Label>
                        <Input
                          value={form.businessRegNo}
                          onChange={(e) => setForm({ ...form, businessRegNo: e.target.value })}
                          placeholder="BR number (optional)"
                          className="bg-white/5 border-gray-600 text-white placeholder:text-gray-500"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300 mb-1 block">Est. Monthly Budget</Label>
                        <Input
                          value={form.monthlyBudget}
                          onChange={(e) => setForm({ ...form, monthlyBudget: e.target.value })}
                          placeholder="e.g. HK$5,000"
                          className="bg-white/5 border-gray-600 text-white placeholder:text-gray-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* HKID Section */}
                <div className="border-t border-gray-700 pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-orange-400" />
                    <h3 className="font-bold text-white">HKID Verification</h3>
                    <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">
                      Required
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    Your HKID is required for identity verification. Your photo is securely stored and reviewed by our team within 24 hours.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 mb-1 block">HKID Number</Label>
                      <Input
                        value={form.hkidNumber}
                        onChange={(e) => setForm({ ...form, hkidNumber: e.target.value })}
                        placeholder="e.g. A123456(7)"
                        className="bg-white/5 border-gray-600 text-white placeholder:text-gray-500 font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 mb-1 block">Upload HKID Photo</Label>
                      {hkidPhoto ? (
                        <div className="relative">
                          <img
                            src={hkidPhoto.preview}
                            alt="HKID preview"
                            className="w-full h-24 object-cover rounded-lg border border-green-500/50"
                          />
                          <button
                            onClick={() => setHkidPhoto(null)}
                            className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                          <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {hkidPhoto.fileName}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-24 border-2 border-dashed border-gray-600 hover:border-orange-500 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors"
                        >
                          <Camera className="w-6 h-6 text-gray-500" />
                          <span className="text-gray-500 text-xs">Click to upload (JPG/PNG, max 5MB)</span>
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300 mb-1 block">Additional Notes</Label>
                  <Textarea
                    value={form.customerNotes}
                    onChange={(e) => setForm({ ...form, customerNotes: e.target.value })}
                    placeholder="Any special requirements or notes..."
                    className="bg-white/5 border-gray-600 text-white placeholder:text-gray-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-white/5"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!isStep2Valid}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold"
                >
                  Review Order <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Review & Pay ────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-gray-700 rounded-2xl p-6 space-y-5">
                <h2 className="text-xl font-black uppercase tracking-wide">Review Your Order</h2>

                {/* Plan Summary */}
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Selected Plan</p>
                      <p className="text-xl font-black text-white">
                        {selectedPlan === "trade_pro" ? "Trade Pro" : "Pay-As-You-Go"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Membership Fee</p>
                      <p className="text-xl font-black text-orange-400">
                        {selectedPlan === "trade_pro" ? "HK$499/mo" : "Free"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Summary */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Your Details</h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>{" "}
                      <span className="text-white font-medium">{form.fullName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>{" "}
                      <span className="text-white font-medium">{effectiveEmail}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>{" "}
                      <span className="text-white font-medium">{form.phone}</span>
                    </div>
                    {form.companyName && (
                      <div>
                        <span className="text-gray-500">Company:</span>{" "}
                        <span className="text-white font-medium">{form.companyName}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">HKID:</span>{" "}
                      <span className={form.hkidNumber ? "text-green-400 font-medium" : "text-yellow-400"}>
                        {form.hkidNumber || "Not provided"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">HKID Photo:</span>{" "}
                      <span className={hkidPhoto ? "text-green-400 font-medium" : "text-yellow-400"}>
                        {hkidPhoto ? "✅ Uploaded" : "Not uploaded"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Return Address */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Equipment Return Address</p>
                  <p className="text-white font-medium text-sm">
                    Y2, Shing Fung Film Studio, Ho Chung, Sai Kung, Hong Kong
                  </p>
                </div>

                {/* Trade Pro notice */}
                {selectedPlan === "trade_pro" && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Star className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-blue-300 font-bold text-sm">Trade Pro Activation</p>
                        <p className="text-gray-400 text-sm mt-1">
                          After confirming your details, you'll be redirected to Stripe to complete your HK$499/month subscription. Your discounts and benefits activate immediately on payment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms & Conditions Acknowledgement */}
                <div className="bg-white/5 border border-gray-700 rounded-xl p-4">
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
                            ? "bg-orange-500 border-orange-500"
                            : "border-gray-500 group-hover:border-orange-400"
                        }`}
                      >
                        {termsAccepted && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-300 leading-relaxed">
                      I have read, understood, and agree to the{" "}
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 underline hover:text-orange-300 font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        EquipHK Equipment Rental Terms &amp; Conditions
                      </a>
                      , including the late return charges, liability exclusions, and indemnity provisions. I understand this constitutes a legally binding contract under the laws of Hong Kong SAR.
                    </span>
                  </label>
                  {!termsAccepted && (
                    <p className="text-yellow-400 text-xs mt-2 ml-8">
                      You must accept the Terms &amp; Conditions to proceed.
                    </p>
                  )}
                </div>

                {/* Login notice */}
                {!isAuthenticated && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-yellow-300 text-sm">
                      You need to be logged in to complete registration.{" "}
                      <a
                        href={getLoginUrl()}
                        className="underline font-bold hover:text-yellow-200"
                      >
                        Log in now
                      </a>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-white/5"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    registerMutation.isPending ||
                    upgradeProMutation.isPending ||
                    !isAuthenticated ||
                    !termsAccepted
                  }
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4"
                >
                  {registerMutation.isPending || upgradeProMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : selectedPlan === "trade_pro" ? (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Register & Pay HK$499/mo
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Complete Registration
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
