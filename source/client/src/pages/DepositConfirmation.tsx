/*
 * EquipHK — Deposit Card Hold Explanation Page
 * Explains to customers how the pre-authorised card hold works
 * Linked from booking confirmation and booking confirmation email
 */
import { ShieldCheck, Clock, CheckCircle, XCircle, AlertTriangle, CreditCard, Phone, Mail } from "lucide-react";
import { Link } from "wouter";

export default function DepositConfirmation() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">

      {/* Header */}
      <div className="bg-[#0d1220] border-b border-gray-800 px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-orange-500 font-black text-xl tracking-tight">
            EQUIPHK
          </Link>
          <Link href="/equipment" className="text-gray-400 hover:text-white text-sm transition-colors">
            Browse Equipment →
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* Hero */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 mb-5">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-black mb-3">Your Security Deposit Hold</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            We place a temporary hold on your card instead of charging a cash deposit.
            Here's exactly how it works and what to expect.
          </p>
        </div>

        {/* What is a card hold */}
        <div className="bg-white/5 border border-gray-700 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-5">
            <CreditCard className="w-5 h-5 text-orange-400 shrink-0" />
            <h2 className="text-lg font-bold">What is a card hold?</h2>
          </div>
          <p className="text-gray-300 leading-relaxed mb-4">
            A card hold (also called a pre-authorisation) is a temporary reservation of funds on your credit or debit card.
            The money is <strong className="text-white">not charged</strong> — it is simply set aside as a guarantee while your equipment is on hire.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Think of it like a hotel placing a hold on your card at check-in. You see it on your statement as a pending amount,
            but it is released back to you automatically once the equipment is returned in good condition.
          </p>
        </div>

        {/* Step by step */}
        <div>
          <h2 className="text-lg font-bold mb-5">How the hold works — step by step</h2>
          <div className="space-y-4">
            {[
              {
                step: "1",
                icon: <CreditCard className="w-4 h-4 text-blue-400" />,
                color: "border-blue-500/30 bg-blue-500/5",
                title: "Hold placed after payment",
                desc: "Once your rental payment is confirmed, we create a separate card hold for the deposit amount. You will see this as a pending transaction on your bank statement.",
              },
              {
                step: "2",
                icon: <Clock className="w-4 h-4 text-yellow-400" />,
                color: "border-yellow-500/30 bg-yellow-500/5",
                title: "Hold is active during your rental",
                desc: "The hold remains active while your equipment is on hire. No money leaves your account — it is simply reserved. Most banks show this as a pending charge.",
              },
              {
                step: "3",
                icon: <CheckCircle className="w-4 h-4 text-green-400" />,
                color: "border-green-500/30 bg-green-500/5",
                title: "Hold released when equipment is returned",
                desc: "Once our team confirms the equipment is back and in good condition, we release the hold immediately. Your bank will clear the pending amount within 3–5 business days.",
              },
            ].map((item) => (
              <div key={item.step} className={`flex gap-4 border rounded-xl p-5 ${item.color}`}>
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-black text-white">
                  {item.step}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {item.icon}
                    <p className="font-semibold text-white">{item.title}</p>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What happens if there's damage */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <h2 className="text-lg font-bold">What if there is damage or loss?</h2>
          </div>
          <p className="text-gray-300 leading-relaxed mb-3">
            If equipment is returned damaged, missing, or excessively dirty, we will capture part or all of the deposit hold to cover repair, replacement, or cleaning costs.
          </p>
          <p className="text-gray-300 leading-relaxed mb-3">
            We will always contact you first to explain the charges before capturing any funds. A detailed damage report will be sent to your email.
          </p>
          <p className="text-gray-400 text-sm">
            Partial captures are possible — for example, if only minor cleaning is required, only a portion of the hold will be charged.
            Any remaining hold amount will be released back to your card.
          </p>
        </div>

        {/* Hold expiry note */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
            <h2 className="text-lg font-bold">Important: Hold expiry</h2>
          </div>
          <p className="text-gray-300 leading-relaxed mb-3">
            Card holds expire after <strong className="text-white">7 days</strong> on most cards (this is a bank rule, not EquipHK's policy).
            For rentals longer than 7 days, we may need to re-authorise the hold before it lapses.
          </p>
          <p className="text-gray-300 leading-relaxed">
            If your rental extends beyond 7 days, we will contact you in advance to arrange a new authorisation. This is a quick process and does not require any additional payment.
          </p>
        </div>

        {/* What you will NOT be charged */}
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-5">
            <XCircle className="w-5 h-5 text-green-400 shrink-0" />
            <h2 className="text-lg font-bold">You will NOT be charged for the hold if…</h2>
          </div>
          <ul className="space-y-3">
            {[
              "Equipment is returned on time and in the same condition",
              "All accessories and parts are present",
              "Equipment is reasonably clean (normal construction site use is expected)",
              "No consumables included in the hire have been used beyond what was agreed",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span className="text-gray-300 text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-bold mb-5">Common questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Will I see the hold on my bank statement?",
                a: "Yes. It will appear as a pending transaction for the deposit amount. It is not a charge — no money has left your account.",
              },
              {
                q: "How long does it take for the hold to clear after release?",
                a: "Typically 3–5 business days, depending on your bank. Some banks clear it faster. We release it on our end immediately upon equipment return.",
              },
              {
                q: "Can I use a debit card for the hold?",
                a: "Yes, debit cards work fine. Just ensure you have sufficient available balance to cover both the rental payment and the deposit hold simultaneously.",
              },
              {
                q: "What if my card expires during a long rental?",
                a: "Please contact us at Bookings@Equip.hk before your card expires so we can arrange an updated authorisation.",
              },
              {
                q: "Do Trade Pro members still have a hold placed?",
                a: "Trade Pro members may have reduced deposit amounts or waivers depending on their account standing. Check your booking confirmation for your specific deposit terms.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-gray-700 rounded-xl p-5">
                <p className="font-semibold text-white mb-2">{item.q}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-[#0d1220] border border-gray-700 rounded-2xl p-7 text-center">
          <h2 className="text-lg font-bold mb-2">Still have questions?</h2>
          <p className="text-gray-400 mb-5">Our team is available 7 days a week to help.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:Bookings@Equip.hk"
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              <Mail className="w-4 h-4" /> Bookings@Equip.hk
            </a>
            <a
              href="tel:+85298325789"
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-6 py-3 rounded-xl transition-colors border border-gray-600"
            >
              <Phone className="w-4 h-4" /> +852 9832 5789
            </a>
          </div>
        </div>

        {/* Back to site */}
        <div className="text-center pb-4">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Back to EquipHK
          </Link>
        </div>

      </div>
    </div>
  );
}
