/*
 * Equip.HK Why Us — Neo-Brutalist Industrial
 * Comparison table vs competitors, key differentiators
 * Dark navy section with orange accents
 */
import { Check, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WhySection() {
  const { tk, t } = useLanguage();

  const comparisonData = [
    {
      feature: tk("why_digital_booking"),
      equiphk: tk("why_digital_booking_us"),
      compA: tk("why_phone_email"),
      compB: tk("why_basic_form"),
    },
    {
      feature: tk("why_target_market"),
      equiphk: tk("why_target_market_us"),
      compA: tk("why_b2b_heavy"),
      compB: tk("why_b2b_general"),
    },
    {
      feature: tk("why_compliance"),
      equiphk: tk("why_compliance_us"),
      compA: tk("why_paper_based"),
      compB: tk("why_paper_based"),
    },
    {
      feature: tk("why_pricing_model"),
      equiphk: tk("why_pricing_us"),
      compA: tk("why_static_pricing"),
      compB: tk("why_static_pricing"),
    },
    {
      feature: tk("why_emergency_sla"),
      equiphk: tk("why_emergency_us"),
      compA: tk("why_best_effort"),
      compB: t("Next business day", "下一個工作日"),
    },
    {
      feature: t("Bilingual Platform", "雙語平台"),
      equiphk: t("EN / 繁中 / 普通話", "英文 / 繁體中文 / 普通話"),
      compA: t("Chinese only", "僅限中文"),
      compB: t("Limited English", "有限英文"),
    },
  ];

  return (
    <section className="relative py-20 lg:py-28 bg-navy-deep overflow-hidden">
      <div className="absolute inset-0 blueprint-grid opacity-30" />

      <div className="relative container">
        {/* Section Header */}
        <div className="relative mb-14 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-orange" />
            <span className="text-orange font-data text-xs uppercase tracking-[0.2em]">
              {t("Competitive Edge", "競爭優勢")}
            </span>
            <div className="h-px w-12 bg-orange" />
          </div>
          <h2 className="text-3xl lg:text-5xl text-white leading-tight">
            {t("Why", "為何選擇")}{" "}
            <span className="text-orange">Equip.HK</span>
          </h2>
          <p className="mt-4 text-cream/60 max-w-xl mx-auto text-lg">
            {t(
              "See how we stack up against traditional plant hire operators in Hong Kong.",
              "了解我們與香港傳統設備租借公司的比較。"
            )}
          </p>
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-x-auto"
        >
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-orange/30">
                <th className="text-left py-4 px-4 font-[Oswald] text-sm uppercase tracking-wider text-cream/50">
                  {t("Feature", "功能")}
                </th>
                <th className="text-left py-4 px-4 font-[Oswald] text-sm uppercase tracking-wider text-orange">
                  Equip.HK
                </th>
                <th className="text-left py-4 px-4 font-[Oswald] text-sm uppercase tracking-wider text-cream/40">
                  {tk("why_competitor_1")}
                </th>
                <th className="text-left py-4 px-4 font-[Oswald] text-sm uppercase tracking-wider text-cream/40">
                  {tk("why_competitor_2")}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row) => (
                <tr
                  key={row.feature}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4 font-medium text-cream/80 text-sm">
                    {row.feature}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-orange shrink-0" />
                      <span className="text-sm text-cream/90">{row.equiphk}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Minus className="w-4 h-4 text-cream/30 shrink-0" />
                      <span className="text-sm text-cream/40">{row.compA}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Minus className="w-4 h-4 text-cream/30 shrink-0" />
                      <span className="text-sm text-cream/40">{row.compB}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Key Stats Row */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: "500+", label: t("Equipment Units", "設備數量"), sub: t("Across all categories", "涵蓋所有類別") },
            { value: "3", label: t("Depot Locations", "倉庫位置"), sub: t("Hong Kong", "香港") },
            { value: "24/7", label: t("Support Available", "全天候支援"), sub: t("Emergency hotline", "緊急熱線") },
            { value: "100%", label: t("Digital Records", "數碼記錄"), sub: t("Fully auditable", "完全可審計") },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="text-center py-6 border border-white/10"
            >
              <span className="font-data text-3xl lg:text-4xl font-bold text-orange block">
                {stat.value}
              </span>
              <span className="font-[Oswald] text-sm uppercase tracking-wider text-white mt-1 block">
                {stat.label}
              </span>
              <span className="text-xs text-cream/40 mt-1 block">
                {stat.sub}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
