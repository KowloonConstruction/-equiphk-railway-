/*
 * Equip.HK Pricing — Neo-Brutalist Industrial
 * Three pricing tiers: Casual, Trade Pro, Enterprise
 * Data-style pricing with JetBrains Mono, orange accent highlights
 */
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PricingSection() {
  const [, navigate] = useLocation();
  const { tk, t } = useLanguage();

  const tiers = [
    {
      id: "casual",
      name: tk("pricing_casual"),
      tagline: tk("pricing_casual_desc"),
      price: tk("pricing_casual_price"),
      priceNote: tk("pricing_standard_rates"),
      features: [
        tk("pricing_full_catalog"),
        tk("pricing_online_booking"),
        tk("pricing_hkid"),
        tk("pricing_delivery"),
        tk("pricing_insurance"),
        tk("pricing_support"),
      ],
      cta: tk("pricing_start_renting"),
      variant: "outline" as const,
      highlight: false,
    },
    {
      id: "trade_pro",
      name: tk("pricing_trade_pro"),
      tagline: tk("pricing_trade_pro_desc"),
      price: tk("pricing_trade_pro_price"),
      priceNote: t("/month membership", "/月會員"),
      features: [
        `${tk("pricing_everything_in")} ${tk("pricing_casual")}, ${tk("pricing_plus")}`,
        t("10-15% discount on all published rates", "所有公開收費享10-15%折扣"),
        tk("pricing_priority_booking"),
        t("Waived deposits on tools under HK$5,000", "港幣5,000元以下工具免押金"),
        t("Monthly consolidated invoicing", "每月綜合發票"),
        t("Dedicated support line", "專屬支援熱線"),
        t("Free delivery on orders over HK$500", "港幣500元以上訂單免費送貨"),
      ],
      cta: t("Join Trade Pro", "加入貿易專業"),
      variant: "default" as const,
      highlight: true,
    },
    {
      id: "enterprise",
      name: tk("pricing_enterprise"),
      tagline: tk("pricing_enterprise_desc"),
      price: tk("pricing_enterprise_price"),
      priceNote: t("Project-negotiated rates", "項目協議收費"),
      features: [
        `${tk("pricing_everything_in")} ${tk("pricing_trade_pro")}, ${tk("pricing_plus")}`,
        t("20-35% volume discount on all equipment", "所有設備享20-35%批量折扣"),
        t("Dedicated Key Account Manager", "專屬重點客戶經理"),
        t("4-hour emergency replacement SLA", "4小時緊急替換服務水平協議"),
        t("Project-based dashboards & tracking", "項目儀表板及追蹤"),
        t("Multi-user access with role permissions", "多用戶訪問，支援角色權限"),
        t("30-60 day credit account terms", "30-60天信用帳期"),
        t("Full Cap. 59/59I compliance documentation", "完整第59章/第59I章合規文件"),
      ],
      cta: t("Contact B2B Team", "聯絡 B2B 團隊"),
      variant: "outline" as const,
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-concrete">
      <div className="container">
        {/* Section Header */}
        <div className="relative mb-14 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-orange" />
            <span className="text-orange font-data text-xs uppercase tracking-[0.2em]">
              {tk("pricing_eyebrow")}
            </span>
            <div className="h-px w-12 bg-orange" />
          </div>
          <h2 className="text-3xl lg:text-5xl text-navy-deep leading-tight">
            {t("Transparent", "透明")}{" "}
            <span className="text-orange">{t("Pricing", "收費")}</span>
          </h2>
          <p className="mt-4 text-steel max-w-xl mx-auto text-lg">
            {t(
              "No hidden fees. Choose the plan that fits your project scale — from weekend DIY to multi-year infrastructure contracts.",
              "無隱藏費用。選擇適合您項目規模的方案——從週末 DIY 到多年基礎建設合約。"
            )}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className={`relative flex flex-col ${
                tier.highlight
                  ? "bg-navy-deep text-white border-2 border-orange shadow-xl shadow-orange/10 -mt-2 mb-[-8px] lg:-mt-4 lg:mb-[-16px]"
                  : "bg-white border border-border"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange text-white font-data text-xs uppercase tracking-wider px-4 py-1">
                  {t("Most Popular", "最受歡迎")}
                </div>
              )}

              <div className="p-6 lg:p-8 flex-1 flex flex-col">
                {/* Tier Name */}
                <h3
                  className={`font-[Oswald] text-xl uppercase tracking-wider mb-1 ${
                    tier.highlight ? "text-orange" : "text-navy-deep"
                  }`}
                >
                  {tier.name}
                </h3>
                <p
                  className={`text-sm mb-6 ${
                    tier.highlight ? "text-cream/60" : "text-steel"
                  }`}
                >
                  {tier.tagline}
                </p>

                {/* Price */}
                <div className="mb-6 pb-6 border-b border-white/10">
                  <span
                    className={`font-data text-3xl font-bold ${
                      tier.highlight ? "text-white" : "text-navy-deep"
                    }`}
                  >
                    {tier.price}
                  </span>
                  <span
                    className={`font-data text-sm ml-1 ${
                      tier.highlight ? "text-cream/50" : "text-steel"
                    }`}
                  >
                    {tier.priceNote}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-orange" />
                      <span
                        className={`text-sm ${
                          tier.highlight ? "text-cream/80" : "text-steel"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => {
                    if (tier.id === "enterprise") {
                      const el = document.querySelector("#contact");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    } else if (tier.id === "trade_pro") {
                      navigate("/register?plan=trade_pro");
                    } else {
                      navigate("/register?plan=payg");
                    }
                  }}
                  className={`w-full font-[Oswald] uppercase tracking-wider gap-2 ${
                    tier.highlight
                      ? "bg-orange hover:bg-orange-dark text-white"
                      : "border-navy-deep/20 text-navy-deep hover:bg-navy-deep hover:text-white bg-transparent border"
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pricing note */}
        <p className="text-center text-sm text-steel mt-8 max-w-lg mx-auto">
          {t(
            "All prices in HKD. Equipment rates vary by category and availability. Enterprise rates are negotiated per project. Dynamic pricing may apply during peak demand periods.",
            "所有價格以港幣計算。設備收費因類別及庫存而異。企業收費按項目協議。高峰期可能實施動態定價。"
          )}
        </p>
      </div>
    </section>
  );
}
