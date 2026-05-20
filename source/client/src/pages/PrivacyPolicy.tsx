/**
 * EquipHK Privacy Policy Page
 * Compliant with Hong Kong Personal Data (Privacy) Ordinance (Cap. 592)
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ChevronLeft, Shield } from "lucide-react";

export const PRIVACY_VERSION = "1.0";
export const PRIVACY_EFFECTIVE_DATE = "8 April 2026";

const SECTIONS = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: `EquipHK (a trading name of Kowloon Construction Company Limited, "we", "us", or "our") is committed to protecting your personal data in accordance with the Personal Data (Privacy) Ordinance (Cap. 592) of Hong Kong SAR ("PDPO") and applicable data protection principles.

This Privacy Policy explains what personal data we collect, how we use it, who we share it with, and your rights as a data subject. By using our website (www.equip.hk) or services, you acknowledge that you have read and understood this policy.`,
  },
  {
    id: "data-collected",
    title: "2. Personal Data We Collect",
    content: `We collect the following categories of personal data:

**Identity & Contact Data:** Full name, Hong Kong Identity Card (HKID) number, HKID photograph, email address, phone number, and company name (if applicable).

**Transaction Data:** Rental order details, equipment hired, rental dates, payment records, Stripe transaction references, and delivery addresses.

**Technical Data:** IP address, browser type, device identifiers, pages visited, and session data collected automatically when you use our website.

**Account Data:** Login credentials (managed via Manus OAuth), membership tier, referral codes, saved carts, and account preferences.

**Communications Data:** Enquiries submitted via our contact form, WhatsApp messages, and email correspondence.`,
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Personal Data",
    content: `We use your personal data for the following purposes:

**Fulfilling Rental Orders:** Processing bookings, verifying identity (HKID), arranging delivery or collection, and managing returns and deposits.

**Payment Processing:** Transmitting payment data to Stripe, Inc. for secure card processing. We do not store full card numbers on our systems.

**Identity Verification:** HKID numbers and photographs are collected to verify renter identity, prevent fraud, and comply with our insurance obligations. HKID images are stored securely on encrypted cloud storage (Amazon S3) and are only accessible to authorised EquipHK staff.

**Account Management:** Creating and maintaining your EquipHK account, managing membership tiers, and processing referral rewards.

**Communications:** Sending booking confirmations, order status updates, and responding to enquiries. We do not send unsolicited marketing emails without your consent.

**Legal Compliance:** Complying with applicable Hong Kong laws, regulations, and court orders.

**Service Improvement:** Analysing usage patterns (via anonymised analytics) to improve our platform.`,
  },
  {
    id: "legal-basis",
    title: "4. Legal Basis for Processing",
    content: `We process your personal data on the following grounds under the PDPO:

— **Contractual necessity:** Processing required to fulfil a rental agreement with you.
— **Legal obligation:** Processing required to comply with Hong Kong law (e.g., identity verification, tax records).
— **Legitimate interests:** Processing for fraud prevention, security, and service improvement, where these interests are not overridden by your rights.
— **Consent:** Where you have provided explicit consent (e.g., marketing communications).`,
  },
  {
    id: "data-sharing",
    title: "5. Data Sharing and Disclosure",
    content: `We do not sell your personal data. We may share your data with:

**Service Providers:** Stripe, Inc. (payment processing); Resend (transactional email); Amazon Web Services (cloud storage); TiDB Cloud (database hosting). All providers are contractually bound to protect your data.

**Insurance Providers:** Where required to process claims relating to equipment damage or loss.

**Law Enforcement:** Where required by a valid court order, warrant, or applicable Hong Kong law.

**Business Transfers:** In the event of a merger, acquisition, or sale of assets, your data may be transferred to the successor entity, subject to equivalent privacy protections.

We do not transfer your personal data outside Hong Kong SAR except where necessary to use the cloud services listed above, all of which maintain appropriate security standards.`,
  },
  {
    id: "hkid-data",
    title: "6. HKID Data — Special Handling",
    content: `Collection of HKID data is a regulatory and insurance requirement for equipment rental in Hong Kong. We handle HKID data with heightened care:

— HKID photographs are uploaded directly to encrypted Amazon S3 storage over HTTPS.
— HKID numbers are stored in encrypted form in our database.
— Access to HKID data is restricted to authorised EquipHK staff on a need-to-know basis.
— HKID data is retained for a minimum of 7 years to comply with our insurance policy and applicable commercial law, after which it is securely deleted.
— We do not share HKID data with third parties except where required by law or for insurance claims.`,
  },
  {
    id: "retention",
    title: "7. Data Retention",
    content: `We retain personal data only for as long as necessary for the purposes described in this policy:

— **Order and transaction records:** 7 years (Hong Kong tax and commercial law requirements).
— **HKID data:** 7 years from the date of the last rental transaction.
— **Account data:** Until account deletion, plus 12 months.
— **Technical/analytics data:** 24 months (anonymised after 12 months).
— **Marketing consent records:** Until consent is withdrawn, plus 12 months.

You may request deletion of your account and associated data at any time (subject to legal retention obligations) by contacting us at privacy@equip.hk.`,
  },
  {
    id: "your-rights",
    title: "8. Your Rights Under the PDPO",
    content: `Under the Personal Data (Privacy) Ordinance (Cap. 592), you have the right to:

**Access:** Request a copy of the personal data we hold about you (Data Access Request).
**Correction:** Request correction of inaccurate personal data.
**Opt-out:** Opt out of direct marketing communications at any time.
**Erasure:** Request deletion of your data, subject to legal retention obligations.

To exercise any of these rights, please contact our Data Protection Officer at **privacy@equip.hk**. We will respond within 40 days as required by the PDPO.

If you are dissatisfied with our response, you may lodge a complaint with the Office of the Privacy Commissioner for Personal Data (PCPD) at www.pcpd.org.hk.`,
  },
  {
    id: "security",
    title: "9. Data Security",
    content: `We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure, including:

— HTTPS encryption for all data in transit.
— Encrypted storage for sensitive data (HKID numbers, payment references).
— Access controls limiting data access to authorised personnel.
— Regular security reviews and automated backups.
— Stripe PCI-DSS compliant payment processing (we never handle raw card data).

No system is completely secure. If you believe your data has been compromised, please contact us immediately at security@equip.hk.`,
  },
  {
    id: "cookies",
    title: "10. Cookies and Tracking",
    content: `Our website uses the following types of cookies and tracking technologies:

**Essential Cookies:** Required for the website to function (session management, authentication). These cannot be disabled.

**Analytics:** We use Umami Analytics, a privacy-focused analytics platform that does not use cookies and does not collect personally identifiable information. Usage data is anonymised.

We do not use advertising cookies, Facebook Pixel, or Google Ads tracking.`,
  },
  {
    id: "changes",
    title: "11. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. Material changes will be notified via email to registered account holders and posted on this page with an updated effective date. Continued use of our services after changes constitutes acceptance of the updated policy.`,
  },
  {
    id: "contact",
    title: "12. Contact Us",
    content: `For any privacy-related queries, Data Access Requests, or complaints, please contact:

**Data Protection Officer**
EquipHK (Kowloon Construction Company Limited)
Email: **privacy@equip.hk**
WhatsApp: **+852 9832 5789**

Office of the Privacy Commissioner for Personal Data (PCPD):
Website: www.pcpd.org.hk | Hotline: +852 2827 2827`,
  },
];

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-navy-deep text-cream">
      <SEOHead
        title="Privacy Policy"
        description="EquipHK Privacy Policy — how we collect, use, and protect your personal data in compliance with Hong Kong's Personal Data (Privacy) Ordinance (Cap. 592)."
        url="/privacy"
      />
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 text-cream/60 hover:text-cream -ml-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Button>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange/10 rounded-lg border border-orange/20">
                <Shield className="w-6 h-6 text-orange" />
              </div>
              <span className="text-orange font-[Oswald] uppercase tracking-wider text-sm">
                Legal
              </span>
            </div>
            <h1 className="font-[Oswald] text-4xl font-bold text-cream mb-3">
              Privacy Policy
            </h1>
            <p className="text-cream/50 text-sm">
              Version {PRIVACY_VERSION} — Effective {PRIVACY_EFFECTIVE_DATE}
            </p>
            <p className="text-cream/60 text-sm mt-3 max-w-2xl">
              This policy applies to all personal data collected by EquipHK (a trading name of Kowloon Construction Company Limited) through www.equip.hk and related services. It is compliant with the Hong Kong Personal Data (Privacy) Ordinance (Cap. 592).
            </p>
          </div>

          {/* Table of Contents */}
          <div className="bg-navy-light/30 border border-white/10 rounded-lg p-6 mb-10">
            <h2 className="font-[Oswald] text-sm uppercase tracking-wider text-orange mb-4">
              Contents
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-sm text-cream/60 hover:text-orange transition-colors"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="font-[Oswald] text-xl font-semibold text-cream mb-4 pb-2 border-b border-white/10">
                  {section.title}
                </h2>
                <div className="text-cream/70 text-sm leading-relaxed space-y-3">
                  {section.content.split("\n\n").map((para, i) => (
                    <p
                      key={i}
                      dangerouslySetInnerHTML={{
                        __html: para
                          .replace(/\*\*(.+?)\*\*/g, "<strong class='text-cream'>$1</strong>")
                          .replace(/^— /gm, "• "),
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-cream/30 text-xs">
              © {new Date().getFullYear()} EquipHK — Kowloon Construction Company Limited. All rights reserved.
            </p>
            <p className="text-cream/30 text-xs mt-1">
              For questions about this policy, contact{" "}
              <a href="mailto:privacy@equip.hk" className="text-orange hover:underline">
                privacy@equip.hk
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
