/*
 * Equip.HK How It Works — Neo-Brutalist Industrial
 * 3-step process with numbered cards, dark navy background
 * Blueprint grid overlay, orange accent lines
 */
import { Search, CalendarCheck, Truck, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HowItWorksSection() {
  const { tk } = useLanguage();

  const steps = [
    {
      num: "01",
      icon: Search,
      title: tk("how_step1_title"),
      desc: tk("how_step1_desc"),
    },
    {
      num: "02",
      icon: CalendarCheck,
      title: tk("how_step2_title"),
      desc: tk("how_step2_desc"),
    },
    {
      num: "03",
      icon: Truck,
      title: tk("how_step3_title"),
      desc: tk("how_step3_desc"),
      badge: tk("how_step3_badge"),
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative py-20 lg:py-28 bg-navy-deep overflow-hidden"
    >
      {/* Blueprint grid */}
      <div className="absolute inset-0 blueprint-grid opacity-40" />

      <div className="relative container">
        {/* Section Header */}
        <div className="relative mb-14">
          <span className="section-number text-white/5">02</span>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-orange" />
              <span className="text-orange font-data text-xs uppercase tracking-[0.2em]">
                {tk("how_eyebrow")}
              </span>
            </div>
            <h2 className="text-3xl lg:text-5xl text-white leading-tight">
              {tk("how_title").split(" ").slice(0, -1).join(" ")}{" "}
              <span className="text-orange">{tk("how_title").split(" ").slice(-1)}</span>
            </h2>
            <p className="mt-4 text-cream/60 max-w-xl text-lg">
              {tk("how_subtitle")}
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="relative group"
            >
              {/* Connector line (not on last) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[calc(50%+2rem)] right-[-2rem] h-px border-t-2 border-dashed border-orange/20 z-0" />
              )}

              <div className="relative bg-navy-light/50 border border-white/10 p-6 lg:p-8 hover:border-orange/30 transition-all duration-200">
                {/* Step number */}
                <div className="flex items-center justify-between mb-6">
                  <span className="font-data text-4xl font-bold text-orange/20">
                    {step.num}
                  </span>
                  <div className="w-12 h-12 bg-orange/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-orange" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-3 font-[Oswald] uppercase tracking-wide">
                  {step.title}
                </h3>
                <p className="text-cream/60 leading-relaxed">{step.desc}</p>
                {step.badge && (
                  <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange/10 border border-orange/20 text-orange text-xs font-[Oswald] uppercase tracking-wider">
                    <Package className="w-3 h-3" />
                    {step.badge}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
