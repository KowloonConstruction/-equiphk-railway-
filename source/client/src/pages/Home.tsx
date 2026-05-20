/*
 * Equip.HK Home Page — Neo-Brutalist Industrial Design
 * Assembles all sections into a single-page experience
 * Dark navy + orange + cream palette, Oswald/Source Sans 3/JetBrains Mono
 */
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SupportChatWidget from "@/components/SupportChatWidget";
import EquipmentSection from "@/components/EquipmentSection";
import RecentlyViewedSection from "@/components/RecentlyViewedSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import EnterpriseSection from "@/components/EnterpriseSection";
import SafetySection from "@/components/SafetySection";
import PricingSection from "@/components/PricingSection";
import WhySection from "@/components/WhySection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import NotificationBell from "@/components/NotificationBell";
import RealTimeToast from "@/components/RealTimeToast";
import JsonLd from "@/components/JsonLd";
import { useEffect } from "react";
import { useLocation } from "wouter";

const LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://www.equip.hk/#business",
  name: "EquipHK",
  alternateName: "Equip HK",
  description: "Hong Kong's trusted equipment rental platform. Power tools, construction equipment, generators and plant hire. Serving DIY enthusiasts to Tier-1 contractors.",
  url: "https://www.equip.hk",
  logo: "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-og-image-gbsgsY4eLL2e6p4Dos2cHG.png",
  image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-og-image-gbsgsY4eLL2e6p4Dos2cHG.png",
  telephone: "+85298325789",
  email: "info@equip.hk",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1-12 Shing Fung Industrial Park, 1 Hon Kin Road",
    addressLocality: "Sai Kung",
    addressRegion: "New Territories, Hong Kong SAR",
    addressCountry: "HK",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 22.3772,
    longitude: 114.2714,
  },
  areaServed: {
    "@type": "AdministrativeArea",
    name: "Hong Kong",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "08:00",
      closes: "13:00",
    },
  ],
  sameAs: [
    "https://www.equip.hk",
  ],
  priceRange: "HK$85 – HK$5,000/day",
  currenciesAccepted: "HKD",
  paymentAccepted: "Cash, Credit Card, Bank Transfer",
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.equip.hk/#website",
  url: "https://www.equip.hk",
  name: "EquipHK",
  description: "Hong Kong equipment rental — power tools, construction plant, generators and more.",
  publisher: { "@id": "https://www.equip.hk/#business" },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.equip.hk/equipment?search={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function Home() {
  const [location] = useLocation();

  // Scroll to anchor section when navigating from another page (e.g. /#{section})
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={undefined}
        description="Hong Kong's trusted equipment rental platform. Rent power tools, construction equipment, and plant hire from HK$85/day. Serving DIY enthusiasts to Tier-1 contractors. Fast delivery across HK."
        zhDescription="香港最可靠的器材租賃平台。租用電動工具、建築設備及重型機械，每日低至港幣85元。服務涵蓋DIY愛好者至一級承建商，全港即日送貨。"
        url="/"
      />
      <JsonLd data={LOCAL_BUSINESS_SCHEMA} />
      <JsonLd data={WEBSITE_SCHEMA} />
      <AnnouncementBanner />
      <Navbar />
      <main>
        <HeroSection />
        <EquipmentSection />
        <RecentlyViewedSection />
        <HowItWorksSection />
        <EnterpriseSection />
        <SafetySection />
        <WhySection />
        <PricingSection />
        <ContactSection />
      </main>
      <Footer />
      <NotificationBell />
      <RealTimeToast />
      <SupportChatWidget />
    </div>
  );
}
