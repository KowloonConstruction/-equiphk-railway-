/*
 * Equip.HK Enterprise Section — Neo-Brutalist Industrial
 * B2B value proposition with feature grid and trust logos
 * Split layout with depot image, dark-on-light design
 */
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  Clock,
  Shield,
  BarChart3,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const DEPOT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/hk-depot-TEEoPTdf6ZbU7rTJKcAQ7H.webp";

const trustedBy = [
  "Leighton Asia",
  "Gammon Construction",
  "Hip Hing",
  "China State",
  "Dragages HK",
];

export default function EnterpriseSection() {
  const { tk, t } = useLanguage();

  const features = [
    {
      icon: Users,
      title: tk("enterprise_key_account"),
      desc: t(
        "Dedicated relationship managers for your top projects. One call, one contact, zero runaround.",
        "為您的重要項目提供專屬客戶關係經理。一個電話，一個聯絡人，零繁瑣。"
      ),
    },
    {
      icon: FileText,
      title: tk("enterprise_invoicing"),
      desc: t(
        "Monthly invoices with itemized breakdowns by project. 30-60 day credit terms for approved accounts.",
        "按項目分類的月度發票。已批准帳戶享30-60天信用期。"
      ),
    },
    {
      icon: Clock,
      title: t("4-Hour Emergency SLA", "4小時緊急服務水平協議"),
      desc: t(
        "Critical equipment breakdown? We guarantee a replacement on-site within 4 hours across Hong Kong.",
        "設備緊急故障？我們保證在4小時內在香港各地提供替換設備。"
      ),
    },
    {
      icon: Shield,
      title: tk("enterprise_compliance"),
      desc: t(
        "Every unit dispatched with Cap. 59 / Cap. 59I documentation. Digital audit trail included.",
        "每台設備均附有第59章/第59I章文件。包含數碼審計追蹤。"
      ),
    },
    {
      icon: BarChart3,
      title: tk("enterprise_dashboard"),
      desc: t(
        "Track all active equipment across multiple sites. Multi-user access with role-based permissions.",
        "追蹤多個工地的所有在用設備。多用戶訪問，支援角色權限管理。"
      ),
    },
    {
      icon: Headphones,
      title: t("24/7 Technical Support", "24/7 技術支援"),
      desc: t(
        "Round-the-clock support line for breakdowns, operator queries, and emergency mobilization.",
        "全天候支援熱線，處理故障、操作查詢及緊急調動。"
      ),
    },
  ];

  return (
    <section id="enterprise" className="py-20 lg:py-28 bg-concrete">
      <div className="container">
        {/* Section Header */}
        <div className="relative mb-14">
          <span className="section-number">03</span>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-orange" />
              <span className="text-orange font-data text-xs uppercase tracking-[0.2em]">
                {tk("enterprise_eyebrow")}
              </span>
            </div>
            <h2 className="text-3xl lg:text-5xl text-navy-deep leading-tight">
              {t("Built for", "專為")}{" "}
              <span className="text-orange">{t("Tier-1", "一級")}</span>{" "}
              {t("Contractors", "承建商而設")}
            </h2>
            <p className="mt-4 text-steel max-w-2xl text-lg">
              {t(
                "Dedicated B2B portal, project-rate pricing, and compliance-ready equipment for Hong Kong's largest infrastructure projects.",
                "專屬 B2B 平台、項目定價及合規設備，服務香港最大型基礎建設項目。"
              )}
            </p>
          </div>
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left: Depot Image + Stats */}
          <div>
            <div className="relative overflow-hidden mb-8">
              <img
                src={DEPOT_IMG}
                alt="Equip.HK New Territories depot"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white font-[Oswald] text-lg uppercase tracking-wide">
                  {t("EquipHK Depot", "Equip.HK 倉庫")}
                </p>
                <p className="text-cream/70 text-sm">
                  {t("Hong Kong — 20,000 sq ft facility", "香港 — 20,000 平方呎設施")}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "75%+", labelKey: "enterprise_fleet_util" as const },
                { value: "<45", labelKey: "enterprise_dso" as const },
                { value: "20-35%", labelKey: "enterprise_volume" as const },
                { value: "3", labelKey: "enterprise_depots" as const },
              ].map((stat) => (
                <div
                  key={stat.labelKey}
                  className="bg-white border border-border p-4 accent-bar pl-6"
                >
                  <span className="font-data text-2xl font-bold text-orange block">
                    {stat.value}
                  </span>
                  <span className="text-sm text-steel uppercase tracking-wider">
                    {tk(stat.labelKey)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="group"
              >
                <div className="bg-white border border-border p-5 h-full hover:border-orange/30 transition-colors">
                  <feature.icon className="w-8 h-8 text-navy-deep mb-3" />
                  <h3 className="font-[Oswald] text-base uppercase tracking-wide text-navy-deep mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-steel leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* CTA Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="sm:col-span-2 bg-navy-deep p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <h3 className="font-[Oswald] text-lg uppercase tracking-wide text-white mb-1">
                  {t("Ready to set up your enterprise account?", "準備好設立企業帳戶了嗎？")}
                </h3>
                <p className="text-cream/60 text-sm">
                  {t("Speak with our B2B team for project-specific rates.", "與我們的 B2B 團隊聯繫，獲取項目專屬報價。")}
                </p>
              </div>
              <Button
                onClick={() => {
                  const el = document.querySelector("#contact");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider shrink-0 gap-2"
              >
                {tk("enterprise_cta")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Trusted By */}
        <div className="mt-16 pt-10 border-t border-border">
          <p className="text-sm text-steel uppercase tracking-[0.2em] font-data mb-6 text-center">
            {tk("enterprise_trusted_by")}
          </p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {trustedBy.map((name) => (
              <span
                key={name}
                className="font-[Oswald] text-lg text-navy-deep/30 uppercase tracking-wider"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
