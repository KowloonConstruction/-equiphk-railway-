/**
 * EquipHK FAQ Page
 * Frequently asked questions for customers
 */
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle } from "lucide-react";

const FAQ_SECTIONS = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "Do I need an account to rent equipment?",
        a: "No — you can rent as a guest without creating an account. Just add items to your cart, fill in your details, and pay via Stripe. However, creating a free account lets you save Job Kits, track your orders, earn referral rewards, and access Trade Pro membership.",
      },
      {
        q: "What is Trade Pro membership?",
        a: "Trade Pro is our HK$499/month membership for frequent renters and contractors. Benefits include 10–15% off all rental rates, waived deposits on tools under HK$5,000, priority booking, free delivery on orders over HK$500, and monthly consolidated invoicing. You can sign up at equip.hk/register.",
      },
      {
        q: "How do I get a quote for a large or long-term project?",
        a: "Use our Get a Quote page (/get-a-quote) for project-scale enquiries. Describe your requirements and we'll respond within one business day with a tailored quote. Enterprise and government clients can also negotiate project-rate agreements.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit and debit cards (Visa, Mastercard, Amex) via Stripe. Trade Pro members can also arrange monthly consolidated invoicing. We do not accept cash.",
      },
    ],
  },
  {
    category: "Booking & Availability",
    questions: [
      {
        q: "How do I check if equipment is available?",
        a: "Availability is shown in real time on each product page. Items marked 'Available' can be added to your cart and booked immediately. Items marked 'On Hire' are currently out and will show an estimated return date where possible.",
      },
      {
        q: "Can I book equipment in advance?",
        a: "Yes — you can select your rental start and end dates at checkout. We recommend booking at least 48 hours in advance for standard items, and 5–7 days for heavy plant and specialist equipment.",
      },
      {
        q: "What is the minimum rental period?",
        a: "The minimum rental period is 1 day. Daily, weekly, and monthly rates are available — weekly and monthly rates offer significant savings over daily rates.",
      },
      {
        q: "Can I extend my rental?",
        a: "Yes — contact us via WhatsApp (+852 9832 5789) or email (Bookings@Equip.hk) before your return deadline to arrange an extension. Extensions are subject to availability and will be charged at the applicable daily rate.",
      },
    ],
  },
  {
    category: "Delivery & Collection",
    questions: [
      {
        q: "Do you offer delivery?",
        a: "Yes — we deliver across Hong Kong Island, Kowloon, and the New Territories. A flat delivery fee of HK$150 applies. Trade Pro members receive free delivery on orders over HK$500. Delivery slots are available in morning (8am–12pm), afternoon (12pm–5pm), and evening (5pm–8pm) windows.",
      },
      {
        q: "Can I collect equipment myself?",
        a: "Yes — self-collection is available from our Shing Fung Industrial Park pick-up point in Sai Kung (1-12 Shing Fung Industrial Park, 1 Hon Kin Road, Sai Kung, Hong Kong). Select 'Self-Collect' at checkout. Collection is free of charge. Please bring your booking confirmation and a valid photo ID.",
      },
      {
        q: "How is equipment returned at the end of my rental?",
        a: "We collect the equipment from your site or address at the end of your rental period. Return collection details are confirmed in your booking. Equipment must be ready for collection by 15:00 HKT on the agreed return date. Late returns are charged at the daily rate per day overdue.",
      },
      {
        q: "What happens if I return equipment late?",
        a: "Late returns are charged at the standard daily rate for each additional day. If you know you'll be late, contact us before 15:00 on your return date — we can often arrange an extension if the equipment isn't booked by another customer.",
      },
    ],
  },
  {
    category: "Deposits & Damage",
    questions: [
      {
        q: "Is a deposit required?",
        a: "A refundable security deposit of 20% of the rental value is charged at checkout for Pay-As-You-Go customers. Trade Pro members have deposits waived on tools under HK$5,000. Deposits are refunded within 5–7 business days after the equipment is returned in good condition.",
      },
      {
        q: "What if equipment is damaged during my rental?",
        a: "You are responsible for equipment in your care during the rental period. Damage charges are assessed by our warehouse team on return. Minor wear is expected and not charged; damage beyond normal use (drops, flooding, misuse) will be charged at repair or replacement cost. We recommend using appropriate PPE and following all safety guidelines.",
      },
      {
        q: "Is equipment insured?",
        a: "Standard equipment insurance is included in all rentals, covering mechanical failure and manufacturing defects. Damage caused by misuse, negligence, or failure to follow safety guidelines is not covered and will be charged to the renter.",
      },
    ],
  },
  {
    category: "Identity Verification",
    questions: [
      {
        q: "Why do you need my HKID?",
        a: "HKID verification is required for all rentals as a condition of our insurance policy and to comply with Hong Kong commercial law. It protects both you and us in the event of a dispute. Your HKID data is stored securely and handled in accordance with our Privacy Policy.",
      },
      {
        q: "How is my HKID data stored?",
        a: "Your HKID number is stored in encrypted form in our database. Your HKID photograph is uploaded directly to encrypted cloud storage (Amazon S3) over HTTPS. Access is restricted to authorised EquipHK staff only. We retain HKID data for 7 years as required by our insurance obligations, then securely delete it. See our Privacy Policy for full details.",
      },
      {
        q: "Can I rent without providing HKID?",
        a: "No — HKID verification is mandatory for all rentals. This is a non-negotiable insurance and compliance requirement. Foreign nationals may provide a valid passport in lieu of HKID.",
      },
    ],
  },
  {
    category: "Account & Referrals",
    questions: [
      {
        q: "How does the referral programme work?",
        a: "When you refer a friend using your unique referral code and they complete their first rental, you both receive HK$250 credit applied to your next order. There is no limit to how many friends you can refer. Find your referral code in your Account dashboard.",
      },
      {
        q: "What are Job Kits?",
        a: "Job Kits are saved carts — a list of equipment you frequently hire together for a specific type of job (e.g., 'Waterproofing Kit' or 'Scaffolding Setup'). Save a cart as a Job Kit and re-hire the same equipment in one click next time. Available to registered account holders.",
      },
      {
        q: "How do I delete my account?",
        a: "To request account deletion, email privacy@equip.hk with your registered email address. We will delete your account and associated data within 30 days, subject to legal retention obligations (e.g., order records must be kept for 7 years under Hong Kong law).",
      },
    ],
  },
];

export default function FAQ() {
  const [, navigate] = useLocation();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-deep text-cream">
      <SEOHead
        title="FAQs"
        description="Frequently asked questions about EquipHK equipment rental — booking, delivery, deposits, HKID verification, Trade Pro membership, and more."
        zhDescription="EquipHK器材租賃常見問題解答，包括預訂、送貨、押金、身份證驗證及 Trade Pro 會員資格等詳細資訊。"
        url="/faq"
      />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ_SECTIONS.flatMap((section) =>
          section.questions.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          }))
        ),
      }} />
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange/10 rounded-lg border border-orange/20">
                <HelpCircle className="w-6 h-6 text-orange" />
              </div>
              <span className="text-orange font-[Oswald] uppercase tracking-wider text-sm">
                Help Centre
              </span>
            </div>
            <h1 className="font-[Oswald] text-4xl font-bold text-cream mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-cream/60 text-sm max-w-2xl">
              Can't find what you're looking for? Chat with us on WhatsApp or send us an email — we typically respond within a few hours.
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-10">
            {FAQ_SECTIONS.map((section) => (
              <div key={section.category}>
                <h2 className="font-[Oswald] text-xl font-semibold text-orange uppercase tracking-wider mb-4 pb-2 border-b border-orange/20">
                  {section.category}
                </h2>
                <div className="space-y-2">
                  {section.questions.map((item, idx) => {
                    const key = `${section.category}-${idx}`;
                    const isOpen = openItems[key];
                    return (
                      <div
                        key={key}
                        className="bg-navy-light/20 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-colors"
                      >
                        <button
                          onClick={() => toggle(key)}
                          className="w-full flex items-center justify-between p-4 text-left"
                        >
                          <span className="text-cream text-sm font-medium pr-4">{item.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-orange shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-cream/40 shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 text-cream/60 text-sm leading-relaxed border-t border-white/10 pt-3">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Still need help */}
          <div className="mt-12 bg-navy-light/30 border border-orange/20 rounded-lg p-8 text-center">
            <h3 className="font-[Oswald] text-2xl font-bold text-cream mb-2">
              Still need help?
            </h3>
            <p className="text-cream/60 text-sm mb-6">
              Our team is available Monday–Saturday, 8am–6pm HKT.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.open("https://wa.me/85298325789", "_blank")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-[Oswald] uppercase tracking-wider"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp Us
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/get-a-quote")}
                className="border-orange/30 text-orange hover:bg-orange/10 font-[Oswald] uppercase tracking-wider"
              >
                Get a Quote
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
