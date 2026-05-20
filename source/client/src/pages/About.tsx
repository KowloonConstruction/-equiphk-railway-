/**
 * EquipHK About Page
 * Company story, mission, and team overview
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Building2, Users, Wrench, Shield, Award, MapPin, Phone, Mail } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-logo_22cf3871.png";

const STATS = [
  { value: "500+", label: "Equipment Units" },
  { value: "18+", label: "Years Industry Experience" },
  { value: "Tier 1", label: "Contractor Clients" },
  { value: "HK$85", label: "Starting Day Rate" },
];

const VALUES = [
  {
    icon: Shield,
    title: "Safety First",
    desc: "Every item is inspected, tested, and certified before it is dispatched. We comply with Cap. 59 and Cap. 59I regulations as standard.",
  },
  {
    icon: Wrench,
    title: "Always Ready",
    desc: "Equipment is serviced between every hire. No surprises on site — what you book is what you get, in full working order.",
  },
  {
    icon: Users,
    title: "Built for Contractors",
    desc: "From DIY weekenders to Tier-1 contractors, our platform and pricing tiers are designed around how Hong Kong builders actually work.",
  },
  {
    icon: Award,
    title: "Transparent Pricing",
    desc: "No hidden fees. Published rates, clear deposit terms, and consolidated monthly invoicing for Trade Pro members.",
  },
];

export default function About() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-navy-deep text-cream">
      <SEOHead
        title="About EquipHK"
        description="EquipHK is Hong Kong's digital-first equipment rental platform, backed by 18+ years of construction industry experience. Learn about our story, mission, and values."
        zhDescription="EquipHK是香港首個數位化器材租賃平台，得到超過18年建築業經驗支持。了解我們的故事、使命與核心價値觀。"
        url="/about"
      />
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 border-b border-white/10">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-orange font-[Oswald] uppercase tracking-wider text-sm mb-4 block">
                  About Us
                </span>
                <h1 className="font-[Oswald] text-5xl font-bold text-cream mb-6 leading-tight">
                  Built by Builders,<br />
                  <span className="text-orange">For Builders.</span>
                </h1>
                <p className="text-cream/70 text-base leading-relaxed mb-6">
                  EquipHK is Hong Kong's digital-first equipment rental platform — a venture of Kowloon Construction Company (KCC), founded by commercial divers and construction professionals with over 18 years of hands-on industry experience.
                </p>
                <p className="text-cream/60 text-sm leading-relaxed mb-8">
                  We built EquipHK because we knew what was missing: a rental platform that actually understands construction sites, speaks the language of contractors, and doesn't make you chase a phone call to find out if a generator is available.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => navigate("/equipment")}
                    className="bg-orange hover:bg-orange/90 text-white font-[Oswald] uppercase tracking-wider"
                  >
                    Browse Equipment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/get-a-quote")}
                    className="border-cream/20 text-cream hover:bg-cream/10 font-[Oswald] uppercase tracking-wider"
                  >
                    Get a Quote
                  </Button>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <img src={LOGO_URL} alt="EquipHK" className="h-32 w-auto opacity-90" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-b border-white/10 bg-navy-light/20">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-[Oswald] text-4xl font-bold text-orange mb-1">
                    {stat.value}
                  </div>
                  <div className="text-cream/50 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 border-b border-white/10">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="max-w-3xl">
              <h2 className="font-[Oswald] text-3xl font-bold text-cream mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-cream/70 text-sm leading-relaxed">
                <p>
                  EquipHK is the equipment rental arm of <strong className="text-cream">Kowloon Construction Company (KCC)</strong> — a specialist diving and marine construction company founded in Hong Kong. KCC evolved from Apex Marine, co-founded in 2013, and has since grown into a full-service marine and civil contractor with projects across the region.
                </p>
                <p>
                  Our founder, Casey, is a commercial diver by trade with over 18 years of international experience across underwater construction, marine works, and inspection operations. Having worked on projects globally since 2007, he understood firsthand the frustration of sourcing reliable equipment quickly, at fair prices, with no paperwork headaches.
                </p>
                <p>
                  EquipHK was created to solve exactly that problem — not just for KCC's own projects, but for every contractor, tradesperson, and DIY enthusiast in Hong Kong who needs the right tool, right now, without the runaround.
                </p>
                <p>
                  Today, EquipHK serves clients from DIY enthusiasts through to Tier-1 contractors and government departments, with a growing catalogue of power tools, heavy plant, aerial platforms, safety equipment, and specialist marine gear.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 border-b border-white/10 bg-navy-light/10">
          <div className="container max-w-5xl mx-auto px-4">
            <h2 className="font-[Oswald] text-3xl font-bold text-cream mb-10">
              What We Stand For
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  className="bg-navy-light/30 border border-white/10 rounded-lg p-6 hover:border-orange/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange/10 rounded-lg">
                      <v.icon className="w-5 h-5 text-orange" />
                    </div>
                    <h3 className="font-[Oswald] text-lg font-semibold text-cream">
                      {v.title}
                    </h3>
                  </div>
                  <p className="text-cream/60 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Parent Company */}
        <section className="py-16 border-b border-white/10">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="font-[Oswald] text-3xl font-bold text-cream mb-4">
                  Part of the KCC Group
                </h2>
                <p className="text-cream/70 text-sm leading-relaxed mb-4">
                  EquipHK operates under the umbrella of <strong className="text-cream">Kowloon Construction Company Limited (KCC)</strong>, a Hong Kong-registered specialist contractor providing underwater construction, marine works, inspection, and diving operations.
                </p>
                <p className="text-cream/60 text-sm leading-relaxed mb-6">
                  KCC's marine and diving expertise means EquipHK has direct access to specialist equipment that most rental companies simply don't carry — from underwater inspection gear to marine-grade generators and safety systems.
                </p>
                <div className="flex items-start gap-3 text-cream/60 text-sm">
                  <Building2 className="w-4 h-4 mt-0.5 text-orange shrink-0" />
                  <span>Kowloon Construction Company Limited — Hong Kong SAR</span>
                </div>
              </div>
              <div className="bg-navy-light/30 border border-white/10 rounded-lg p-6">
                <h3 className="font-[Oswald] text-lg font-semibold text-cream mb-4">
                  Get in Touch
                </h3>
                <div className="space-y-3">
                  <a
                    href="https://wa.me/85298325789"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-cream/60 hover:text-orange transition-colors text-sm"
                  >
                    <Phone className="w-4 h-4 text-orange" />
                    +852 9832 5789 (WhatsApp)
                  </a>
                  <a
                    href="mailto:info@equip.hk"
                    className="flex items-center gap-3 text-cream/60 hover:text-orange transition-colors text-sm"
                  >
                    <Mail className="w-4 h-4 text-orange" />
                    info@equip.hk
                  </a>
                  <div className="flex items-start gap-3 text-cream/60 text-sm">
                    <MapPin className="w-4 h-4 text-orange mt-0.5 shrink-0" />
                    <span>Y2 Shing Fung Film Studio, Ho Chung, Sai Kung, Hong Kong</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <Button
                    onClick={() => navigate("/get-a-quote")}
                    className="w-full bg-orange hover:bg-orange/90 text-white font-[Oswald] uppercase tracking-wider"
                  >
                    Request a Quote
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
