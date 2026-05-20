/*
 * Equip.HK — Get a Quote Page
 * Dedicated quote request form for customized or long-term rentals
 * Neo-Brutalist Industrial Design — dark navy + orange + cream
 */
import { useState } from "react";
import { useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ArrowLeft, MessageCircle, Phone, Mail, Clock, Shield, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const WHATSAPP_NUMBER = "85291234567";

const equipmentCategories = [
  "Power Tools",
  "Hand Tools",
  "Lifting & Rigging",
  "Concrete & Masonry",
  "Compaction & Earthworks",
  "Generators & Power",
  "Pumps & Water",
  "Scaffolding & Access",
  "Welding & Cutting",
  "Safety Equipment",
  "Marine & Diving",
  "Multiple Categories",
  "Other / Not Sure",
];

const durationOptions = [
  { value: "1-6 days", label: "1–6 Days (Daily rate)" },
  { value: "1-4 weeks", label: "1–4 Weeks (Weekly rate)" },
  { value: "1-3 months", label: "1–3 Months (Monthly rate)" },
  { value: "3-6 months", label: "3–6 Months (Long-term)" },
  { value: "6+ months", label: "6+ Months (Project-based)" },
  { value: "ongoing", label: "Ongoing / Open-ended" },
];

const siteTypes = [
  "Construction Site",
  "Marine / Offshore",
  "Industrial Facility",
  "Commercial Building",
  "Residential",
  "Event / Temporary",
  "Workshop / Yard",
  "Other",
];

export default function GetAQuote() {
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill equipment details from URL query param (e.g. /get-a-quote?equipment=Kito+Chain+Block)
  const prefilledEquipment = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("equipment") || ""
    : "";

  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    equipmentCategory: "",
    equipmentDetails: prefilledEquipment,
    duration: "",
    siteType: "",
    deliveryLocation: "",
    startDate: "",
    message: "",
  });

  const submitMutation = trpc.contact.submit.useMutation();
  const trackLead = trpc.enquiryLeads.track.useMutation();

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email || !form.equipmentDetails) {
      toast.error("Please fill in all required fields");
      return;
    }

    const messageBody = `
QUOTE REQUEST — Equip.HK

Contact: ${form.name}${form.company ? ` (${form.company})` : ""}
Phone: ${form.phone}
Email: ${form.email}

Equipment Needed: ${form.equipmentDetails}
Category: ${form.equipmentCategory || "Not specified"}
Hire Duration: ${form.duration || "Not specified"}
Site Type: ${form.siteType || "Not specified"}
Delivery Location: ${form.deliveryLocation || "Not specified"}
Preferred Start Date: ${form.startDate || "Flexible"}

Additional Notes:
${form.message || "None"}
    `.trim();

    try {
      await submitMutation.mutateAsync({
        name: form.name,
        email: form.email,
        subject: `Quote Request — ${form.equipmentCategory || form.equipmentDetails.substring(0, 50)}`,
        company: form.company || undefined,
        phone: form.phone || undefined,
        message: messageBody,
        formType: "quote",
      });

      await trackLead.mutateAsync({
        type: "quote_request",
        source: "quote_page",
        equipmentName: form.equipmentDetails.substring(0, 100),
        customerName: form.name,
        customerPhone: form.phone,
        customerEmail: form.email,
        notes: `Duration: ${form.duration} | Site: ${form.siteType} | Location: ${form.deliveryLocation}`,
      });

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Failed to send your quote request. Please try WhatsApp instead.");
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hi Equip.HK! I'd like to request a quote.\n\nName: ${form.name || "(not filled)"}\nEquipment: ${form.equipmentDetails || "(not filled)"}\nDuration: ${form.duration || "TBD"}\nLocation: ${form.deliveryLocation || "TBD"}`
    );
    trackLead.mutate({
      type: "whatsapp_click",
      source: "quote_page",
      equipmentName: form.equipmentDetails.substring(0, 100) || "General enquiry",
      customerName: form.name || "Unknown",
      customerPhone: form.phone || "",
      notes: "WhatsApp click from Get a Quote page",
    });
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-concrete flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-navy-deep border border-orange/30 rounded-lg p-10 max-w-lg w-full text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-orange mx-auto mb-6" />
            <h2 className="font-[Oswald] text-3xl font-bold text-white uppercase tracking-wider mb-3">
              Quote Request Sent!
            </h2>
            <p className="text-cream/70 mb-6 leading-relaxed">
              Thanks, <strong className="text-cream">{form.name}</strong>. We've received your request and will get back to you within <strong className="text-orange">2 business hours</strong>.
            </p>
            <p className="text-cream/50 text-sm mb-8">
              Need it faster? WhatsApp us directly for an immediate response.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white font-[Oswald] uppercase tracking-wider gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Us Now
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="border-cream/30 text-cream hover:bg-cream/10 font-[Oswald] uppercase tracking-wider"
              >
                Back to Home
              </Button>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-concrete flex flex-col">
      <SEOHead
        title="Get a Quote"
        description="Request a custom equipment rental quote from EquipHK Hong Kong. Competitive rates for short and long-term hire. Serving DIY to Tier-1 contractors. Fast response guaranteed."
        zhDescription="向EquipHK申請器材租賃報價。短期及長期租賃均有競爭力價格，服務DIY到一級承建商，江港有限。"
        url="/get-a-quote"
      />
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-navy-deep pt-24 pb-12 border-b border-white/10">
        <div className="container">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-cream/50 hover:text-orange transition-colors text-sm mb-6 font-[Oswald] uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-10 bg-orange" />
            <span className="text-orange text-xs font-data uppercase tracking-[0.2em]">
              Custom & Long-Term Hire
            </span>
          </div>
          <h1 className="font-[Oswald] text-4xl lg:text-5xl font-bold text-white uppercase tracking-wider mb-3">
            Request a Quote
          </h1>
          <p className="text-cream/60 max-w-xl leading-relaxed">
            Need equipment for a longer project, a large fleet, or something specific? Fill in the form below and we'll prepare a tailored quote — usually within 2 hours.
          </p>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-navy-deep/50 border-b border-white/5">
        <div className="container py-4">
          <div className="flex flex-wrap gap-6 text-sm text-cream/60">
            {[
              { icon: Clock, text: "Response within 2 hours" },
              { icon: Shield, text: "No obligation quote" },
              { icon: Wrench, text: "All equipment certified & inspected" },
              { icon: MessageCircle, text: "WhatsApp support available" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-orange shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container py-12">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">

            {/* Contact Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="font-[Oswald] text-xl font-bold text-navy-deep uppercase tracking-wider mb-5 flex items-center gap-2">
                <span className="bg-orange text-white w-7 h-7 rounded flex items-center justify-center text-sm font-bold">1</span>
                Your Contact Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-navy-deep font-semibold text-sm">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="John Chan"
                    required
                    className="border-gray-300 focus:border-orange"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company" className="text-navy-deep font-semibold text-sm">
                    Company Name
                  </Label>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    placeholder="KCC Construction Ltd"
                    className="border-gray-300 focus:border-orange"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-navy-deep font-semibold text-sm">
                    Phone / WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+852 9XXX XXXX"
                    required
                    className="border-gray-300 focus:border-orange"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-navy-deep font-semibold text-sm">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="john@company.com.hk"
                    required
                    className="border-gray-300 focus:border-orange"
                  />
                </div>
              </div>
            </div>

            {/* Equipment Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="font-[Oswald] text-xl font-bold text-navy-deep uppercase tracking-wider mb-5 flex items-center gap-2">
                <span className="bg-orange text-white w-7 h-7 rounded flex items-center justify-center text-sm font-bold">2</span>
                Equipment Required
              </h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="equipmentCategory" className="text-navy-deep font-semibold text-sm">
                    Equipment Category
                  </Label>
                  <Select onValueChange={(v) => handleChange("equipmentCategory", v)}>
                    <SelectTrigger className="border-gray-300 focus:border-orange">
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="equipmentDetails" className="text-navy-deep font-semibold text-sm">
                    Describe the Equipment Needed <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="equipmentDetails"
                    value={form.equipmentDetails}
                    onChange={(e) => handleChange("equipmentDetails", e.target.value)}
                    placeholder="e.g. 2× angle grinders, 1× concrete mixer (350L), 1× chain block 2T, safety harnesses for 5 workers..."
                    rows={4}
                    required
                    className="border-gray-300 focus:border-orange resize-none"
                  />
                  <p className="text-xs text-gray-400">Be as specific as possible — brand, model, capacity, or quantity all help us quote accurately.</p>
                </div>
              </div>
            </div>

            {/* Hire Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="font-[Oswald] text-xl font-bold text-navy-deep uppercase tracking-wider mb-5 flex items-center gap-2">
                <span className="bg-orange text-white w-7 h-7 rounded flex items-center justify-center text-sm font-bold">3</span>
                Hire Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-navy-deep font-semibold text-sm">Hire Duration</Label>
                  <Select onValueChange={(v) => handleChange("duration", v)}>
                    <SelectTrigger className="border-gray-300 focus:border-orange">
                      <SelectValue placeholder="How long do you need it?" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-navy-deep font-semibold text-sm">
                    Preferred Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    className="border-gray-300 focus:border-orange"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-navy-deep font-semibold text-sm">Site Type</Label>
                  <Select onValueChange={(v) => handleChange("siteType", v)}>
                    <SelectTrigger className="border-gray-300 focus:border-orange">
                      <SelectValue placeholder="What type of site?" />
                    </SelectTrigger>
                    <SelectContent>
                      {siteTypes.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deliveryLocation" className="text-navy-deep font-semibold text-sm">
                    Delivery Location
                  </Label>
                  <Input
                    id="deliveryLocation"
                    value={form.deliveryLocation}
                    onChange={(e) => handleChange("deliveryLocation", e.target.value)}
                    placeholder="e.g. Kwun Tong, Kowloon"
                    className="border-gray-300 focus:border-orange"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="font-[Oswald] text-xl font-bold text-navy-deep uppercase tracking-wider mb-5 flex items-center gap-2">
                <span className="bg-orange text-white w-7 h-7 rounded flex items-center justify-center text-sm font-bold">4</span>
                Anything Else?
              </h2>
              <Textarea
                value={form.message}
                onChange={(e) => handleChange("message", e.target.value)}
                placeholder="Special requirements, site access restrictions, certifications needed, delivery time windows, budget range..."
                rows={4}
                className="border-gray-300 focus:border-orange resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="flex-1 bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider text-base h-13"
              >
                {submitMutation.isPending ? "Sending..." : "Submit Quote Request"}
              </Button>
              <Button
                type="button"
                onClick={handleWhatsApp}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-[Oswald] uppercase tracking-wider text-base h-13 gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp Instead
              </Button>
            </div>
          </form>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Why Quote? */}
            <div className="bg-navy-deep text-white rounded-lg p-6">
              <h3 className="font-[Oswald] text-lg font-bold uppercase tracking-wider mb-4 text-orange">
                Why Request a Quote?
              </h3>
              <ul className="space-y-3 text-sm text-cream/80">
                {[
                  "Long-term hire discounts (30+ days)",
                  "Fleet pricing for multiple items",
                  "Custom delivery & collection scheduling",
                  "Project-based billing options",
                  "Priority availability reservation",
                  "Dedicated account manager",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-orange mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Options */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-[Oswald] text-lg font-bold text-navy-deep uppercase tracking-wider mb-4">
                Prefer to Talk?
              </h3>
              <div className="space-y-3">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm text-green-800">WhatsApp</div>
                    <div className="text-xs text-green-600">Fastest response</div>
                  </div>
                </a>
                <a
                  href="tel:+85291234567"
                  className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm text-blue-800">Call Us</div>
                    <div className="text-xs text-blue-600">+852 9123 4567</div>
                  </div>
                </a>
                <a
                  href="mailto:info@equip.hk"
                  className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Mail className="w-5 h-5 text-gray-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm text-gray-800">Email</div>
                    <div className="text-xs text-gray-500">info@equip.hk</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-orange/10 border border-orange/30 rounded-lg p-5 text-center">
              <Clock className="w-8 h-8 text-orange mx-auto mb-2" />
              <div className="font-[Oswald] text-2xl font-bold text-navy-deep">2 Hours</div>
              <div className="text-sm text-navy-deep/70">Average quote response time during business hours</div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
