/*
 * Equip.HK Footer — Neo-Brutalist Industrial
 * Dark navy, multi-column layout, orange accents
 */
import { Phone, Mail, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-logo_22cf3871.png";

export default function Footer() {
  const [, navigate] = useLocation();
  const { tk, t } = useLanguage();

  const footerLinks = {
    equipment: [
      { label: tk("footer_power_tools"), href: "/equipment?category=power-tools", external: true },
      { label: tk("footer_heavy_plant"), href: "/equipment?category=heavy-plant", external: true },
      { label: tk("footer_aerial"), href: "/equipment?category=aerial-platforms", external: true },
      { label: tk("footer_generators"), href: "/equipment?category=generators", external: true },
      { label: tk("footer_safety_equip"), href: "/equipment?category=safety-equipment", external: true },
    ],
    company: [
      { label: tk("footer_about"), href: "/about", external: true },
      { label: tk("footer_safety_compliance"), href: "/#safety", external: false },
      { label: tk("footer_enterprise"), href: "/#enterprise", external: false },
      { label: tk("footer_pricing"), href: "/#pricing", external: false },
      { label: tk("footer_careers"), href: "/careers", external: true },
    ],
    support: [
      { label: tk("footer_contact"), href: "/#contact", external: false },
      { label: tk("footer_faq"), href: "/faq", external: true },
      { label: tk("footer_delivery"), href: "/delivery-info", external: true },
      { label: tk("footer_terms"), href: "/terms", external: true },
      { label: tk("footer_privacy"), href: "/privacy", external: true },
    ],
  };

  const handleClick = (href: string, external: boolean) => {
    if (external) {
      navigate(href);
    } else if (href.startsWith("/#")) {
      if (window.location.pathname !== "/") {
        window.location.href = href;
      } else {
        const id = href.replace("/#", "");
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="bg-navy-deep pt-16 pb-8">
      <div className="container">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-10 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <img src={LOGO_URL} alt="Equip.HK" className="h-12 w-auto mb-4" />
            <p className="text-cream/50 text-sm leading-relaxed mb-6 max-w-sm">
              {tk("footer_tagline")}
            </p>
            <div className="space-y-3">
              <a
                href="https://wa.me/85298325789"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-cream/60 hover:text-orange transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                <span className="font-data text-xs">+852 9832 5789</span>
              </a>
              <a
                href="mailto:info@equip.hk"
                className="flex items-center gap-3 text-cream/60 hover:text-orange transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                <span className="font-data text-xs">info@equip.hk</span>
              </a>
              <div className="flex items-center gap-3 text-cream/60 text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="text-xs">
                  {t("Tuen Mun, New Territories, Hong Kong", "香港新界屯門")}
                </span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-[Oswald] text-sm uppercase tracking-wider text-orange mb-4">
              {tk("footer_equipment_col")}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.equipment.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => handleClick(link.href, link.external)}
                    className="text-sm text-cream/50 hover:text-cream transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-[Oswald] text-sm uppercase tracking-wider text-orange mb-4">
              {tk("footer_company_col")}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => handleClick(link.href, link.external)}
                    className="text-sm text-cream/50 hover:text-cream transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-[Oswald] text-sm uppercase tracking-wider text-orange mb-4">
              {tk("footer_support_col")}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => handleClick(link.href, link.external)}
                    className="text-sm text-cream/50 hover:text-orange transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream/30">
            &copy; {new Date().getFullYear()} Equip.HK — {t("A Kowloon Construction Company (KCC) Enterprise. All rights reserved.", "九龍建設公司（KCC）旗下企業。版權所有。")}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-cream/30">
              {t("Cap. 59 & Cap. 59I Compliant", "符合第59章及第59I章")}
            </span>
            <div className="h-3 w-px bg-cream/20" />
            <span className="text-xs text-cream/30">
              {t("EPD Registered", "環保署登記")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
