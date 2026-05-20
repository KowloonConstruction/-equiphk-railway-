/**
 * Referral Programme Page
 * Users can share their unique referral code and track credits earned
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Gift,
  Copy,
  Check,
  ArrowLeft,
  Users,
  Coins,
  Share2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { getLoginUrl } from "@/const";

export default function ReferralPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: referralCode, isLoading: codeLoading } = trpc.referral.getMyCode.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: credits } = trpc.referral.getCredits.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: events = [] } = trpc.referral.listEvents.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const handleCopy = () => {
    if (!referralCode?.code) return;
    navigator.clipboard.writeText(referralCode.code);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!referralCode?.code) return;
    const shareText = `Get HK$250 off your first EquipHK rental! Use my referral code: ${referralCode.code} at equip.hk`;
    if (navigator.share) {
      navigator.share({ title: "EquipHK Referral", text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Share message copied to clipboard!");
    }
  };

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f1e]">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Gift className="w-16 h-16 text-cream/20 mb-4" />
          <h2 className="text-white font-[Oswald] text-2xl uppercase mb-2">Sign In Required</h2>
          <p className="text-cream/50 mb-6">Sign in to access your referral code and track your credits.</p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="bg-orange hover:bg-orange/90 text-white">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/account")} className="text-cream/50 hover:text-cream transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-[Oswald] text-3xl uppercase tracking-wider">
              Refer & Earn
            </h1>
            <p className="text-cream/50 text-sm mt-1">
              Share your code — earn HK$250 credit for every friend who completes their first order.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Share2, step: "1", title: "Share Your Code", desc: "Send your unique code to friends, colleagues, or post it online." },
            { icon: Users, step: "2", title: "They Sign Up & Order", desc: "Your friend uses the code at checkout on their first order." },
            { icon: Coins, step: "3", title: "You Earn HK$250", desc: "Credit is added to your account once their order is confirmed." },
          ].map(({ icon: Icon, step, title, desc }) => (
            <Card key={step} className="bg-navy-light border-cream/10 p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-orange/20 text-orange flex items-center justify-center text-sm font-bold mx-auto mb-3">
                {step}
              </div>
              <Icon className="w-5 h-5 text-orange mx-auto mb-2" />
              <h3 className="text-white text-sm font-semibold mb-1">{title}</h3>
              <p className="text-cream/40 text-xs leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>

        {/* Referral Code Card */}
        <Card className="bg-navy-light border-cream/10 p-6 mb-6">
          <h2 className="text-white font-[Oswald] text-lg uppercase tracking-wider mb-4">Your Referral Code</h2>
          {codeLoading ? (
            <div className="flex items-center gap-2 text-cream/50">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating your code...</span>
            </div>
          ) : referralCode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-navy-deep border border-orange/30 rounded-lg px-5 py-3 font-mono text-2xl font-bold text-orange tracking-widest text-center">
                  {referralCode.code}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={handleCopy}
                    className="bg-orange/20 hover:bg-orange/30 text-orange border border-orange/30 gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleShare}
                    variant="outline"
                    className="border-cream/20 text-cream/70 hover:text-cream gap-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-6 pt-2 border-t border-cream/10">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{referralCode.totalReferrals ?? 0}</p>
                  <p className="text-cream/40 text-xs">Referrals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange">HK${Number(referralCode.totalCreditsEarned ?? 0).toLocaleString()}</p>
                  <p className="text-cream/40 text-xs">Credits Earned</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">HK${Number(credits?.balance ?? 0).toLocaleString()}</p>
                  <p className="text-cream/40 text-xs">Available Balance</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-cream/50 text-sm">Unable to load referral code. Please refresh.</p>
          )}
        </Card>

        {/* Referral History */}
        <Card className="bg-navy-light border-cream/10 p-6">
          <h2 className="text-white font-[Oswald] text-lg uppercase tracking-wider mb-4">Referral History</h2>
          {(events as any[]).length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-cream/20 mx-auto mb-3" />
              <p className="text-cream/40 text-sm">No referrals yet — share your code to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(events as any[]).map((event: any) => (
                <div key={event.id} className="flex items-center justify-between py-3 border-b border-cream/10 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {event.referredEmail ?? `User #${event.referredUserId}`}
                    </p>
                    <p className="text-cream/40 text-xs">
                      {new Date(event.createdAt).toLocaleDateString("en-HK", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        event.status === "awarded"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : event.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }
                    >
                      {event.status}
                    </Badge>
                    <span className="text-orange font-bold text-sm">+HK${Number(event.creditAwarded).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* CTA to account */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/account")}
            className="text-cream/40 hover:text-cream/70 text-sm flex items-center gap-1 mx-auto transition-colors"
          >
            Back to Account
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
