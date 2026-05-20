/*
 * Equip.HK Contact — Neo-Brutalist Industrial
 * Contact form wired to backend + location cards
 * Submissions trigger admin notification via notifyOwner
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Building2,
  Loader2,
  Navigation,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

const inquiryTypeToFormType = (type: string): "contact" | "quote" | "enterprise" => {
  if (type === "b2b") return "enterprise";
  if (type === "quote") return "quote";
  return "contact";
};

const inquiryTypeToSubject = (type: string): string => {
  const map: Record<string, string> = {
    b2c: "DIY / Small Trade Rental Inquiry",
    b2b: "Enterprise / B2B Inquiry",
    quote: "Quote Request",
    support: "Technical Support",
    other: "General Inquiry",
  };
  return map[type] ?? "General Inquiry";
};

export default function ContactSection() {
  const { tk, t } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    type: "b2c",
    message: "",
  });

  const trackLead = trpc.enquiryLeads.track.useMutation();

  const submitMut = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success(tk("contact_success"));
      trackLead.mutate({
        type: formData.type === "quote" ? "quote_request" : "email_click",
        customerName: formData.name || undefined,
        customerEmail: formData.email || undefined,
        customerPhone: formData.phone || undefined,
        company: formData.company || undefined,
        notes: `${inquiryTypeToSubject(formData.type)}: ${formData.message.slice(0, 200)}`,
        source: "contact_form",
      });
      setFormData({ name: "", email: "", company: "", phone: "", type: "b2c", message: "" });
    },
    onError: (err) => {
      toast.error(err.message || tk("contact_error"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMut.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      subject: inquiryTypeToSubject(formData.type),
      message: formData.message,
      formType: inquiryTypeToFormType(formData.type),
    });
  };

  const locations = [
    {
      name: "Sai Kung — Shing Fung Industrial Park",
      address: "1-12 Shing Fung Industrial Park, 1 Hon Kin Road, Sai Kung, Hong Kong",
      phone: "+852 9832 5789",
      hours: tk("contact_hours"),
      type: tk("contact_pickup"),
      showAddress: true,
      mapsUrl: "https://maps.google.com/?q=1-12+Shing+Fung+Industrial+Park,+1+Hon+Kin+Road,+Sai+Kung,+Hong+Kong",
    },
    {
      name: t("Sai Kung Depot", "西貢倉庫"),
      address: "",
      phone: "+852 9832 5789",
      hours: tk("contact_hours"),
      type: tk("contact_dispatch"),
      showAddress: false,
      mapsUrl: "",
    },
    {
      name: t("Tuen Mun Depot", "屯門倉庫"),
      address: "",
      phone: "+852 9832 5789",
      hours: tk("contact_hours"),
      type: tk("contact_dispatch"),
      showAddress: false,
      mapsUrl: "",
    },
  ];

  return (
    <section id="contact" className="py-20 lg:py-28 bg-concrete">
      <div className="container">
        {/* Section Header */}
        <div className="relative mb-14">
          <span className="section-number">05</span>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-orange" />
              <span className="text-orange font-data text-xs uppercase tracking-[0.2em]">
                {tk("contact_eyebrow")}
              </span>
            </div>
            <h2 className="text-3xl lg:text-5xl text-navy-deep leading-tight">
              {t("Contact", "聯絡")}{" "}
              <span className="text-orange">{t("Us", "我們")}</span>
            </h2>
            <p className="mt-4 text-steel max-w-2xl text-lg">
              {tk("contact_subtitle")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Contact Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="bg-white border border-border p-6 lg:p-8">
              <h3 className="font-[Oswald] text-xl uppercase tracking-wide text-navy-deep mb-6">
                {tk("contact_form_title")}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-navy-deep mb-1.5">
                    {tk("contact_full_name")}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border bg-concrete/50 text-navy-deep text-sm focus:outline-none focus:border-orange transition-colors"
                    placeholder={tk("contact_name_placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-deep mb-1.5">
                    {tk("contact_email")}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border bg-concrete/50 text-navy-deep text-sm focus:outline-none focus:border-orange transition-colors"
                    placeholder={tk("contact_email_placeholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-navy-deep mb-1.5">
                    {tk("contact_company")}
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border bg-concrete/50 text-navy-deep text-sm focus:outline-none focus:border-orange transition-colors"
                    placeholder={tk("contact_company_placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-deep mb-1.5">
                    {tk("contact_phone")}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border bg-concrete/50 text-navy-deep text-sm focus:outline-none focus:border-orange transition-colors"
                    placeholder={tk("contact_phone_placeholder")}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-navy-deep mb-1.5">
                  {tk("contact_inquiry_type")}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border bg-concrete/50 text-navy-deep text-sm focus:outline-none focus:border-orange transition-colors"
                >
                  <option value="b2c">{tk("contact_inquiry_b2c")}</option>
                  <option value="b2b">{tk("contact_inquiry_b2b")}</option>
                  <option value="quote">{tk("contact_inquiry_quote")}</option>
                  <option value="support">{tk("contact_inquiry_support")}</option>
                  <option value="other">{tk("contact_inquiry_other")}</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-navy-deep mb-1.5">
                  {tk("contact_message")}
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border bg-concrete/50 text-navy-deep text-sm focus:outline-none focus:border-orange transition-colors resize-none"
                  placeholder={tk("contact_message_placeholder")}
                />
              </div>

              <Button
                type="submit"
                disabled={submitMut.isPending}
                className="bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider gap-2 px-8"
              >
                {submitMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitMut.isPending ? tk("contact_sending") : tk("contact_send")}
              </Button>
            </form>
          </div>

          {/* Locations */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-[Oswald] text-xl uppercase tracking-wide text-navy-deep mb-4">
              {tk("contact_depots")}
            </h3>

            {locations.map((loc, i) => (
              <motion.div
                key={loc.name}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="bg-white border border-border p-5 accent-bar pl-7 hover:border-orange/30 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <Building2 className="w-5 h-5 text-orange shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-[Oswald] text-sm uppercase tracking-wide text-navy-deep">
                      {loc.name}
                    </h4>
                    <span className="text-xs text-orange font-data">{loc.type}</span>
                  </div>
                </div>

                <div className="space-y-2 ml-8">
                  {loc.showAddress && loc.address && (
                    <div className="flex items-center gap-2 text-sm text-steel">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs">{loc.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-steel">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-data text-xs">{loc.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-steel">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    {loc.hours}
                  </div>
                  {loc.mapsUrl && (
                    <a
                      href={loc.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1 text-xs font-[Oswald] uppercase tracking-wider text-orange hover:text-orange-dark transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {tk("contact_get_directions")}
                    </a>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Emergency Contact */}
            <div className="bg-navy-deep p-5 mt-4">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5 text-orange" />
                <h4 className="font-[Oswald] text-sm uppercase tracking-wide text-white">
                  {tk("contact_24_7")}
                </h4>
              </div>
              <p className="text-cream/60 text-sm ml-8 mb-2">
                {tk("contact_24_7_desc")}
              </p>
              <a
                href="https://wa.me/85298325789"
                target="_blank"
                rel="noopener noreferrer"
                className="font-data text-lg font-bold text-orange ml-8 hover:text-orange-light transition-colors"
                onClick={() => trackLead.mutate({ type: "whatsapp_click", source: "contact_section" })}
              >
                WhatsApp: +852 9832 5789
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
