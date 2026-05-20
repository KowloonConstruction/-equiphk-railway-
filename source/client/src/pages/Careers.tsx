/**
 * EquipHK Careers Page
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Briefcase, MapPin, Clock, Users, Wrench, Truck, HeadphonesIcon } from "lucide-react";

const OPEN_ROLES = [
  {
    title: "Equipment Technician",
    type: "Full-time",
    location: "Sai Kung, NT",
    icon: Wrench,
    desc: "Inspect, service, and certify equipment between hires. Diagnose faults, carry out repairs, and maintain service records. Experience with power tools, generators, and construction plant preferred.",
    requirements: ["2+ years equipment maintenance experience", "Relevant trade qualification preferred", "Valid HK driving licence (Class 1 or 2)", "Conversational English and Cantonese"],
  },
  {
    title: "Logistics & Delivery Driver",
    type: "Full-time",
    location: "Sai Kung, NT",
    icon: Truck,
    desc: "Deliver and collect equipment across Hong Kong. Load and unload safely, complete handover documentation, and provide excellent customer service on site.",
    requirements: ["Valid HK driving licence (Class 1 or 2)", "Physically fit — able to lift 25kg", "Punctual and customer-focused", "Basic English and Cantonese"],
  },
  {
    title: "Customer Service & Bookings",
    type: "Full-time / Part-time",
    location: "Remote / Hybrid",
    icon: HeadphonesIcon,
    desc: "Handle inbound enquiries via WhatsApp, email, and phone. Process bookings, manage order changes, and support customers through the rental process.",
    requirements: ["Strong written and spoken English and Cantonese", "Experience in customer service or logistics", "Comfortable with digital tools (WhatsApp, email, web platforms)", "Organised and detail-oriented"],
  },
  {
    title: "Operations Coordinator",
    type: "Full-time",
    location: "Sai Kung, NT",
    icon: Users,
    desc: "Coordinate daily operations — scheduling deliveries, managing the equipment yard, liaising with customers and the technical team, and supporting the warehouse manager.",
    requirements: ["2+ years operations or logistics experience", "Strong organisational and communication skills", "Proficiency in English and Cantonese", "Experience in construction, plant hire, or logistics preferred"],
  },
];

const PERKS = [
  "Competitive salary + performance bonus",
  "5-day work week",
  "Medical insurance",
  "Staff equipment discount",
  "Training and development support",
  "Growing company — real career progression",
];

export default function Careers() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-navy-deep text-cream">
      <SEOHead
        title="Careers"
        description="Join the EquipHK team — Hong Kong's fastest-growing equipment rental platform. View open roles in equipment maintenance, logistics, customer service, and operations."
        zhDescription="加入EquipHK團隊，香港成長最快的器材租賃平台。查看器材維修、物流、客服及營運等職位空缺。"
        url="/careers"
      />
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange/10 rounded-lg border border-orange/20">
                <Briefcase className="w-6 h-6 text-orange" />
              </div>
              <span className="text-orange font-[Oswald] uppercase tracking-wider text-sm">
                Join the Team
              </span>
            </div>
            <h1 className="font-[Oswald] text-4xl font-bold text-cream mb-4">
              Build Your Career<br />
              <span className="text-orange">With EquipHK</span>
            </h1>
            <p className="text-cream/60 text-sm leading-relaxed max-w-2xl">
              We're a fast-growing equipment rental company backed by 18+ years of construction industry experience. We're looking for hands-on, reliable people who take pride in their work and want to grow with us.
            </p>
          </div>

          {/* Perks */}
          <section className="mb-12 bg-navy-light/20 border border-white/10 rounded-lg p-6">
            <h2 className="font-[Oswald] text-xl font-bold text-cream mb-4">
              Why Work With Us?
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-cream/70 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>
          </section>

          {/* Open Roles */}
          <section className="mb-12">
            <h2 className="font-[Oswald] text-2xl font-bold text-cream mb-6">
              Current Openings
            </h2>
            <div className="space-y-4">
              {OPEN_ROLES.map((role) => (
                <div
                  key={role.title}
                  className="bg-navy-light/20 border border-white/10 rounded-lg p-6 hover:border-orange/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange/10 rounded-lg">
                        <role.icon className="w-5 h-5 text-orange" />
                      </div>
                      <div>
                        <h3 className="font-[Oswald] text-lg font-semibold text-cream">
                          {role.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-cream/50 text-xs">
                            <Clock className="w-3 h-3" />
                            {role.type}
                          </span>
                          <span className="flex items-center gap-1 text-cream/50 text-xs">
                            <MapPin className="w-3 h-3" />
                            {role.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        window.open(
                          `mailto:info@equip.hk?subject=Application: ${role.title}&body=Hi EquipHK team,%0D%0A%0D%0AI'd like to apply for the ${role.title} position.%0D%0A%0D%0APlease find my details below:%0D%0A%0D%0AName:%0D%0APhone:%0D%0AExperience:%0D%0A`,
                          "_blank"
                        )
                      }
                      className="bg-orange hover:bg-orange/90 text-white font-[Oswald] uppercase tracking-wider text-xs shrink-0"
                    >
                      Apply Now
                    </Button>
                  </div>
                  <p className="text-cream/60 text-sm leading-relaxed mb-4">{role.desc}</p>
                  <div>
                    <p className="text-cream/40 text-xs uppercase tracking-wider font-[Oswald] mb-2">Requirements</p>
                    <ul className="space-y-1">
                      {role.requirements.map((req) => (
                        <li key={req} className="flex items-start gap-2 text-cream/60 text-xs">
                          <span className="w-1 h-1 rounded-full bg-orange mt-1.5 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Speculative */}
          <div className="bg-navy-light/30 border border-orange/20 rounded-lg p-8 text-center">
            <h3 className="font-[Oswald] text-2xl font-bold text-cream mb-2">
              Don't See Your Role?
            </h3>
            <p className="text-cream/60 text-sm mb-6 max-w-lg mx-auto">
              We're always interested in hearing from motivated people. Send us your CV and tell us what you bring to the table — we'll keep it on file for future opportunities.
            </p>
            <Button
              onClick={() =>
                window.open(
                  "mailto:info@equip.hk?subject=Speculative Application&body=Hi EquipHK team,%0D%0A%0D%0AI'd like to be considered for future opportunities at EquipHK.%0D%0A%0D%0AName:%0D%0APhone:%0D%0ASkills/Experience:%0D%0A",
                  "_blank"
                )
              }
              className="bg-orange hover:bg-orange/90 text-white font-[Oswald] uppercase tracking-wider"
            >
              Send Your CV
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
