/**
 * EquipHK Terms & Conditions Page
 * Legally binding under the laws of Hong Kong SAR
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ChevronLeft, FileText } from "lucide-react";

export const TERMS_VERSION = "1.0";
export const TERMS_EFFECTIVE_DATE = "5 April 2026";

export const TERMS_SECTIONS = [
  {
    id: "parties",
    title: "1. Parties and Definitions",
    content: `These Equipment Rental Terms and Conditions ("Agreement") constitute a legally binding contract between **EquipHK** (a trading name of Kowloon Construction Company Limited, a company incorporated in Hong Kong SAR, and its parent company, subsidiaries, affiliates, officers, directors, employees, agents, and assigns, collectively "EquipHK", "we", "us", or "our") and the individual or entity completing registration or placing a rental order ("Renter", "you", or "your").

**"Equipment"** means any tool, plant, machinery, accessory, consumable, or item made available for rental through the EquipHK platform (www.equip.hk).

**"Rental Period"** means the period commencing on the agreed start date and ending on the agreed return date as specified in the rental order.

**"Return Deadline"** means 15:00 Hong Kong Standard Time (HKT, UTC+8) on the agreed return date.

**"Late Return"** means any Equipment not returned to the designated return location by the Return Deadline.

**"Return Location"** means Y2, Shing Fung Film Studio, Ho Chung, Sai Kung, New Territories, Hong Kong SAR, or such other address as notified by EquipHK in writing.

By completing registration, placing a rental order, or taking possession of any Equipment, you confirm that you have read, understood, and agree to be bound by this Agreement in its entirety.`,
  },
  {
    id: "rental",
    title: "2. Rental Agreement and Order Confirmation",
    content: `2.1 A binding rental contract is formed when EquipHK confirms your order and payment is successfully processed via Stripe. Order confirmation will be sent to the email address provided at registration.

2.2 All rental charges are payable in full upfront prior to the commencement of the Rental Period. No Equipment will be released until full payment has been received and confirmed.

2.3 EquipHK reserves the right to refuse, cancel, or modify any rental order at its sole discretion, including where Equipment is unavailable, where identity verification has not been completed, or where EquipHK has reasonable grounds to believe the Equipment will be used unlawfully or unsafely.

2.4 The Renter is responsible for ensuring that the Equipment ordered is suitable for the intended purpose. EquipHK makes no warranty that any Equipment is fit for any particular purpose beyond its standard manufacturer specifications.`,
  },
  {
    id: "collection",
    title: "3. Collection, Delivery, and Return",
    content: `3.1 **Self-Collection.** Where the Renter elects self-collection, Equipment must be collected from the Return Location during agreed operating hours. The Renter must present valid photo identification (HKID or passport) upon collection.

3.2 **Delivery.** Where EquipHK agrees to deliver Equipment, delivery will be made to the address specified in the order. A responsible adult must be present to accept delivery and sign the delivery receipt. Delivery charges apply as set out in the current pricing schedule.

3.3 **Return Deadline.** All Equipment must be returned to the Return Location by **15:00 HKT on the agreed return date** ("Return Deadline"). The Renter is solely responsible for arranging timely return. Traffic, weather, or other circumstances do not constitute grounds for waiver of the Return Deadline.

3.4 **Late Return Charges.** If Equipment is not returned by the Return Deadline:
- The Renter will be charged the full published daily rate for each additional day or part thereof that the Equipment remains unreturned.
- All membership discounts, promotional discounts, and Trade Pro rate reductions are **immediately void** for the overdue period. The full standard published rate applies from the Return Deadline onwards.
- EquipHK reserves the right to charge the Renter's payment method on file for all accrued late return charges without further notice.
- Where Equipment is not returned within 7 calendar days of the Return Deadline, EquipHK may treat the Equipment as lost or stolen and pursue recovery of the full replacement value, in addition to all accrued rental and late charges.

3.5 **Condition on Return.** Equipment must be returned in the same condition as received, subject to fair wear and tear. The Renter is responsible for cleaning Equipment before return. Failure to return Equipment in a clean and serviceable condition may result in additional cleaning or repair charges.`,
  },
  {
    id: "payment",
    title: "4. Payment, Deposits, and Invoicing",
    content: `4.1 All charges are quoted and payable in Hong Kong Dollars (HKD).

4.2 A refundable security deposit may be required at the time of booking, as specified in the rental order. The deposit will be refunded within 7 business days of Equipment return, subject to inspection and deduction of any applicable charges for damage, loss, late return, or cleaning.

4.3 Trade Pro members with active membership status may benefit from deposit waivers on qualifying orders as set out in the current membership terms. Deposit waivers are applied at EquipHK's discretion and may be withdrawn at any time.

4.4 Where a Renter's payment method fails or a chargeback is initiated, EquipHK reserves the right to immediately suspend the Renter's account, retain any Equipment until outstanding amounts are settled, and pursue recovery of all outstanding amounts by legal means.

4.5 EquipHK will issue a tax invoice for each completed rental order. Invoices are provided electronically to the email address on file.`,
  },
  {
    id: "use",
    title: "5. Permitted Use of Equipment",
    content: `5.1 Equipment may only be used for its intended purpose and in accordance with the manufacturer's operating instructions, applicable safety standards, and all applicable laws and regulations of Hong Kong SAR.

5.2 The Renter must not:
- Sub-let, lend, transfer, or otherwise make Equipment available to any third party without EquipHK's prior written consent;
- Use Equipment outside of Hong Kong SAR without prior written consent;
- Use Equipment for any unlawful, dangerous, or reckless purpose;
- Modify, repair, or tamper with Equipment in any way;
- Remove, obscure, or alter any identification markings, serial numbers, or safety labels on Equipment.

5.3 The Renter is solely responsible for ensuring that all operators of Equipment hold any required licences, certifications, or qualifications required by Hong Kong law or applicable industry standards.

5.4 EquipHK reserves the right to inspect Equipment at any time during the Rental Period upon reasonable notice.`,
  },
  {
    id: "liability",
    title: "6. Limitation of Liability and Indemnity",
    content: `6.1 **Assumption of Risk.** The Renter acknowledges that the use of tools, plant, and equipment involves inherent risks, including but not limited to personal injury, death, and property damage. The Renter voluntarily assumes all such risks associated with the possession, use, operation, and return of Equipment.

6.2 **Exclusion of Liability.** To the fullest extent permitted by the laws of Hong Kong SAR, **EquipHK, Kowloon Construction Company Limited, and their respective parent companies, subsidiaries, affiliates, officers, directors, employees, agents, contractors, and assigns** (collectively, "EquipHK Parties") shall not be liable for:
- Any personal injury, death, or bodily harm suffered by the Renter, any operator, or any third party arising from or in connection with the use, misuse, or malfunction of Equipment;
- Any damage to property (real or personal) arising from or in connection with the use, misuse, or malfunction of Equipment;
- Any indirect, consequential, incidental, special, or punitive loss or damage, including loss of profit, loss of revenue, loss of business, or loss of opportunity;
- Any loss arising from the Renter's failure to comply with operating instructions, safety guidelines, or applicable law;
- Any loss arising from Equipment defects that were not known to EquipHK at the time of rental and could not have been discovered by reasonable inspection.

6.3 **Indemnity.** The Renter agrees to fully indemnify, defend, and hold harmless the EquipHK Parties from and against any and all claims, demands, actions, losses, damages, costs, and expenses (including legal fees on a full indemnity basis) arising out of or in connection with:
- The Renter's possession, use, operation, or return of Equipment;
- Any breach of this Agreement by the Renter;
- Any negligence, wilful misconduct, or unlawful act of the Renter or any person operating Equipment with the Renter's permission.

6.4 **Maximum Liability.** Where liability cannot be excluded by law, the total aggregate liability of the EquipHK Parties to the Renter under or in connection with this Agreement shall not exceed the total rental charges paid by the Renter for the specific order giving rise to the claim.

6.5 **Insurance.** Standard equipment insurance is included with all rentals as described in the current pricing schedule. This insurance covers Equipment loss or accidental damage during normal use. It does not cover: personal injury, third-party property damage, consequential loss, damage arising from misuse or negligence, or loss of Equipment due to theft where the Renter failed to take reasonable precautions.`,
  },
  {
    id: "damage",
    title: "7. Damage, Loss, and Theft",
    content: `7.1 The Renter is responsible for all damage to Equipment beyond fair wear and tear occurring during the Rental Period.

7.2 The Renter must notify EquipHK immediately (and in any event within 24 hours) of any damage, loss, or theft of Equipment. Failure to notify EquipHK promptly may result in the Renter being held fully liable for the replacement cost of the Equipment.

7.3 In the event of theft, the Renter must file a police report with the Hong Kong Police Force and provide EquipHK with a copy of the report within 48 hours.

7.4 EquipHK will assess damage upon return of Equipment. The cost of repair or replacement, as determined by EquipHK in its reasonable discretion, will be charged to the Renter's payment method on file.`,
  },
  {
    id: "identity",
    title: "8. Identity Verification and HKID",
    content: `8.1 The Renter consents to EquipHK collecting, storing, and processing their Hong Kong Identity Card (HKID) number and photo for the purposes of identity verification, fraud prevention, and compliance with applicable law.

8.2 HKID information is stored securely and handled in accordance with the Personal Data (Privacy) Ordinance (Cap. 486) of Hong Kong SAR.

8.3 EquipHK reserves the right to refuse rental to any person who fails to provide satisfactory identity verification.`,
  },
  {
    id: "cancellation",
    title: "9. Cancellation and Refunds",
    content: `9.1 Cancellations made more than 48 hours before the Rental Period start date will receive a full refund, less any payment processing fees.

9.2 Cancellations made within 48 hours of the Rental Period start date will receive a 50% refund of the rental charge. Delivery fees and deposits are fully refundable on cancellation.

9.3 No refund will be issued for early return of Equipment during the Rental Period unless EquipHK agrees in writing.

9.4 EquipHK reserves the right to cancel any order at any time. In such cases, a full refund will be issued.`,
  },
  {
    id: "membership",
    title: "10. Membership Terms",
    content: `10.1 **Pay-As-You-Go.** Registration as a Pay-As-You-Go member is free. Members are subject to standard published rental rates and all terms of this Agreement.

10.2 **Trade Pro.** Trade Pro membership is available at HK$499 per month, billed via Stripe recurring subscription. Trade Pro benefits (discounts, deposit waivers, free delivery) apply only while the subscription is active and in good standing.

10.3 EquipHK reserves the right to modify membership fees, benefits, and eligibility criteria at any time upon 30 days' notice to members.

10.4 Membership may be suspended or terminated by EquipHK immediately and without notice where the member breaches this Agreement, provides false information, or engages in conduct detrimental to EquipHK or other customers.`,
  },
  {
    id: "governing",
    title: "11. Governing Law and Dispute Resolution",
    content: `11.1 This Agreement shall be governed by and construed in accordance with the laws of the Hong Kong Special Administrative Region of the People's Republic of China.

11.2 Any dispute arising out of or in connection with this Agreement shall first be subject to good-faith negotiation between the parties. If the dispute is not resolved within 30 days, either party may refer the matter to the Hong Kong International Arbitration Centre (HKIAC) for final resolution by arbitration in accordance with the HKIAC Administered Arbitration Rules then in force.

11.3 Notwithstanding clause 11.2, EquipHK reserves the right to seek injunctive or other urgent relief from the courts of Hong Kong SAR without prior arbitration.

11.4 The Renter irrevocably submits to the non-exclusive jurisdiction of the courts of Hong Kong SAR for any matter not subject to arbitration.`,
  },
  {
    id: "general",
    title: "12. General Provisions",
    content: `12.1 **Entire Agreement.** This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior agreements, representations, and understandings.

12.2 **Severability.** If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

12.3 **Waiver.** No failure or delay by EquipHK in exercising any right under this Agreement shall operate as a waiver of that right.

12.4 **Amendments.** EquipHK reserves the right to amend this Agreement at any time. Continued use of the EquipHK platform following notice of amendment constitutes acceptance of the amended terms.

12.5 **Force Majeure.** EquipHK shall not be liable for any failure or delay in performance due to circumstances beyond its reasonable control, including but not limited to acts of God, typhoons, flooding, government action, or civil unrest.

12.6 **Language.** This Agreement is executed in English. In the event of any conflict between an English version and any translation, the English version shall prevail.

12.7 **Contact.** For any queries regarding this Agreement, please contact EquipHK at Bookings@Equip.hk or +852 9832 5789.`,
  },
];

export default function TermsAndConditions() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">

          {/* Back button */}
          <button
            onClick={() => navigate(-1 as any)}
            className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors mb-8 text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400 font-[Oswald]">
                Legal Document
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black font-[Oswald] uppercase tracking-wide mb-4">
              Terms &amp; Conditions
            </h1>
            <p className="text-gray-400 text-sm">
              <strong className="text-white">EquipHK Equipment Rental Agreement</strong><br />
              Version {TERMS_VERSION} — Effective {TERMS_EFFECTIVE_DATE}<br />
              Governed by the laws of the Hong Kong Special Administrative Region
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-orange-500/10 border border-orange-500/40 rounded-xl p-5 mb-10">
            <p className="text-orange-200 text-sm leading-relaxed">
              <strong className="text-orange-300">IMPORTANT NOTICE:</strong> By registering an account or placing a rental order with EquipHK, you enter into a legally binding contract governed by Hong Kong law. Please read this Agreement carefully before proceeding. If you do not agree to these terms, do not register or place an order.
            </p>
          </div>

          {/* Table of Contents */}
          <div className="bg-white/5 border border-gray-700 rounded-xl p-6 mb-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Contents</h2>
            <div className="grid sm:grid-cols-2 gap-1">
              {TERMS_SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-sm text-orange-300 hover:text-orange-200 transition-colors py-0.5"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {TERMS_SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-xl font-black font-[Oswald] uppercase tracking-wide text-white mb-4 pb-2 border-b border-gray-700">
                  {section.title}
                </h2>
                <div className="text-gray-300 text-sm leading-relaxed space-y-3">
                  {section.content.split("\n\n").map((para, i) => {
                    if (para.startsWith("- ")) {
                      const items = para.split("\n- ");
                      return (
                        <ul key={i} className="list-disc list-inside space-y-1 pl-2">
                          {items.map((item, j) => (
                            <li key={j} className="text-gray-300"
                              dangerouslySetInnerHTML={{
                                __html: item.replace(/^- /, "").replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>"),
                              }}
                            />
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p
                        key={i}
                        dangerouslySetInnerHTML={{
                          __html: para.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>"),
                        }}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-gray-700 text-center space-y-4">
            <p className="text-gray-500 text-xs">
              EquipHK is a trading name of Kowloon Construction Company Limited.<br />
              Registered in Hong Kong SAR. Version {TERMS_VERSION} — {TERMS_EFFECTIVE_DATE}.
            </p>
            <Button
              onClick={() => navigate("/register")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold font-[Oswald] uppercase tracking-wider"
            >
              Register Now
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
