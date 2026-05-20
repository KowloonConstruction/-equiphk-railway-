/*
 * Equip.HK Hero — Neo-Brutalist Industrial Design
 * Full-bleed hero with dramatic HK construction site backdrop
 * Asymmetric layout, bold Oswald headlines, diagonal bottom cut
 */
import { Button } from "@/components/ui/button";
import { ArrowRight, Wrench, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/hero-banner-SJBQLFhtkG2oCdyr3Coic5.webp";

export default function HeroSection() {
  const [, navigate] = useLocation();
  const { tk } = useLanguage();

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const { data: stats } = trpc.equipment.stats.useQuery(undefined, { retry: false });

  return (
    <section className="relative min-h-[90vh] lg:min-h-screen flex items-end overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={HERO_BG}
          alt="Hong Kong construction site at sunset"
          className="w-full h-full object-cover object-center"
        />
        {/* Dark overlay gradient — heavier at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/70 to-navy-deep/30" />
        {/* Blueprint grid overlay */}
        <div className="absolute inset-0 blueprint-grid opacity-30" />
      </div>

      {/* Content */}
      <div className="relative container pb-24 lg:pb-32 pt-32">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="h-px w-12 bg-orange" />
            <span className="text-orange font-data text-xs uppercase tracking-[0.2em]">
              {tk("hero_eyebrow")}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.05] mb-6"
          >
            {tk("hero_headline_1")}
            <br />
            <span className="text-orange">{tk("hero_headline_2")}</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="text-lg lg:text-xl text-cream/80 max-w-xl mb-10 font-light leading-relaxed"
          >
            {tk("hero_subheadline")}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              onClick={() => scrollTo("#equipment")}
              className="bg-orange hover:bg-orange-dark text-white font-[Oswald] uppercase tracking-wider text-base px-8 h-13 gap-2 group"
            >
              <Wrench className="w-5 h-5" />
              {tk("hero_cta_browse")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/get-a-quote")}
              className="border-orange/60 text-orange hover:bg-orange/10 hover:text-orange font-[Oswald] uppercase tracking-wider text-base px-8 h-13 gap-2"
            >
              <FileText className="w-5 h-5" />
              {tk("hero_cta_quote")}
            </Button>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3"
          >
            {[
              { value: stats ? `${stats.totalItems}+` : "274+", labelKey: "hero_stat_units" as const },
              { value: "4hr", labelKey: "hero_stat_sla" as const },
              { value: "Cap.59", labelKey: "hero_stat_compliant" as const },
            ].map((stat) => (
              <div key={stat.labelKey} className="flex items-baseline gap-2">
                <span className="font-data text-2xl lg:text-3xl font-bold text-orange">
                  {stat.value}
                </span>
                <span className="text-cream/60 text-sm uppercase tracking-wider">
                  {tk(stat.labelKey)}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Diagonal bottom cut */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
          preserveAspectRatio="none"
        >
          <path
            d="M0 80L1440 80L1440 30L0 80Z"
            className="fill-concrete"
          />
        </svg>
      </div>
    </section>
  );
}
