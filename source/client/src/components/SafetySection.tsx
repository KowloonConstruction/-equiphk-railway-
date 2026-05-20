/*
 * Equip.HK Safety & Compliance — Neo-Brutalist Industrial
 * Dark section with safety image, compliance checklist
 * Regulatory framework cards, Cap. 59 / Cap. 59I focus
 */
import {
  ShieldCheck,
  FileCheck,
  ClipboardCheck,
  BadgeCheck,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const SAFETY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/safety-compliance-gP4KtC3x2XPakVAyxSVwjh.webp";

export default function SafetySection() {
  const { tk, t } = useLanguage();

  const complianceItems = [
    {
      icon: FileCheck,
      title: tk("safety_cap59"),
      desc: t(
        "All equipment maintained to Factories and Industrial Undertakings Ordinance standards.",
        "所有設備均按《工廠及工業經營條例》標準維護。"
      ),
    },
    {
      icon: ClipboardCheck,
      title: tk("safety_cap59i"),
      desc: t(
        "Lifting appliances inspected and certified by competent examiners before every dispatch.",
        "每次調度前，起重設備均由合資格檢驗員檢驗及認證。"
      ),
    },
    {
      icon: BadgeCheck,
      title: tk("safety_inspection"),
      desc: tk("safety_inspection_desc"),
    },
    {
      icon: BookOpen,
      title: tk("safety_audit"),
      desc: t(
        "Complete digital maintenance logs — service records, inspection events, and certifications.",
        "完整數碼維護記錄——服務記錄、檢驗事件及認證。"
      ),
    },
    {
      icon: AlertTriangle,
      title: tk("safety_epd"),
      desc: t(
        "Fully registered with Environmental Protection Department for percussive breaker permits.",
        "已向環境保護署完整登記，持有鑿岩機許可證。"
      ),
    },
    {
      icon: ShieldCheck,
      title: tk("safety_liability"),
      desc: t(
        "Comprehensive public liability, equipment all-risks, and employer's liability insurance.",
        "全面的公眾責任、設備全險及僱主責任保險。"
      ),
    },
  ];

  return (
    <section
      id="safety"
      className="relative py-20 lg:py-28 bg-navy-deep overflow-hidden"
    >
      {/* Blueprint grid */}
      <div className="absolute inset-0 blueprint-grid opacity-30" />

      <div className="relative container">
        {/* Section Header */}
        <div className="relative mb-14">
          <span className="section-number text-white/5">04</span>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-orange" />
              <span className="text-orange font-data text-xs uppercase tracking-[0.2em]">
                {tk("safety_eyebrow")}
              </span>
            </div>
            <h2 className="text-3xl lg:text-5xl text-white leading-tight">
              {t("Compliance is", "合規")}{" "}
              <span className="text-orange">{t("Non-Negotiable", "不可妥協")}</span>
            </h2>
            <p className="mt-4 text-cream/60 max-w-2xl text-lg">
              {t(
                "Every piece of equipment leaves our depot inspected, certified, and fully documented. Your regulatory risk is our responsibility.",
                "每台設備離開倉庫前均經過檢驗、認證及完整記錄。您的合規風險由我們負責。"
              )}
            </p>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Image */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden h-full min-h-[400px]">
              <img
                src={SAFETY_IMG}
                alt="Safety equipment and compliance inspection"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/30 to-transparent" />
            </div>
          </div>

          {/* Compliance Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {complianceItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="bg-white/5 border border-white/10 p-5 hover:border-orange/30 transition-colors"
              >
                <item.icon className="w-7 h-7 text-orange mb-3" />
                <h3 className="font-[Oswald] text-base uppercase tracking-wide text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-cream/60 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
