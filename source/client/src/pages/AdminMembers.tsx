/**
 * Admin Members Management Page
 * View all registered members, verify HKID, filter by plan
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AccessDenied from "@/components/AccessDenied";
import {
  Users,
  Shield,
  CheckCircle2,
  Clock,
  Search,
  Building2,
  Zap,
  Eye,
  Loader2,
  ChevronLeft,
} from "lucide-react";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-HK", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminMembers() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "payg" | "trade_pro">("all");

  const canAccess = user?.role === "admin" || user?.role === "manager";

  const { data: members, isLoading, refetch } = trpc.membership.adminListMembers.useQuery(
    { plan: planFilter, limit: 200, offset: 0 },
    { enabled: canAccess }
  );

  const verifyMutation = trpc.membership.adminVerifyHkid.useMutation({
    onSuccess: () => {
      toast.success("HKID verification status updated.");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!canAccess) {
    return <AccessDenied requiredRole="Admin or Manager" message="Only Admins and Managers can access Member records." />;
  }

  type MemberRow = {
    membership: {
      id: number;
      plan: string;
      status: string;
      fullName: string;
      email: string;
      phone: string;
      companyName?: string | null;
      hkidNumber?: string | null;
      hkidPhotoUrl?: string | null;
      hkidVerified: boolean;
      createdAt: Date | string;
    };
    user: { id: number; email: string; role: string; createdAt: Date | string } | null;
  };

  const filtered = (members as MemberRow[] | undefined)?.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.membership.fullName.toLowerCase().includes(q) ||
      m.membership.email.toLowerCase().includes(q) ||
      (m.membership.phone ?? "").toLowerCase().includes(q) ||
      (m.membership.companyName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="bg-[#0d1220] border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Admin
            </Button>
            <span className="text-gray-600">/</span>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-400" />
              <h1 className="text-xl font-black">Members</h1>
            </div>
          </div>
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40">
            {filtered?.length ?? 0} members
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="pl-9 bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "payg", "trade_pro"] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={planFilter === p ? "default" : "outline"}
                onClick={() => setPlanFilter(p)}
                className={planFilter === p ? "bg-orange-500 text-white" : "border-gray-600 text-gray-300 hover:bg-white/5"}
              >
                {p === "all" ? "All Plans" : p === "payg" ? "Pay-As-You-Go" : "Trade Pro"}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="bg-white/5 border border-gray-700 rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No members found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <div
                key={m.membership.id}
                className="bg-white/5 border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${m.membership.plan === "trade_pro" ? "bg-blue-500/20" : "bg-orange-500/20"}`}>
                      {m.membership.plan === "trade_pro" ? (
                        <Building2 className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Zap className="w-5 h-5 text-orange-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold">{m.membership.fullName}</span>
                        <Badge className={`text-xs border ${m.membership.plan === "trade_pro" ? "bg-blue-500/20 text-blue-300 border-blue-500/40" : "bg-orange-500/20 text-orange-300 border-orange-500/40"}`}>
                          {m.membership.plan === "trade_pro" ? "Trade Pro" : "Pay-As-You-Go"}
                        </Badge>
                        <Badge className={`text-xs border ${m.membership.status === "active" ? "bg-green-500/20 text-green-300 border-green-500/40" : "bg-gray-500/20 text-gray-300 border-gray-500/40"}`}>
                          {m.membership.status}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm">{m.membership.email} · {m.membership.phone}</p>
                      {m.membership.companyName && (
                        <p className="text-gray-500 text-xs">{m.membership.companyName}</p>
                      )}
                      <p className="text-gray-600 text-xs mt-1">Joined {formatDate(m.membership.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* HKID Status */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">HKID</p>
                      {m.membership.hkidNumber ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 text-xs font-mono">{m.membership.hkidNumber}</span>
                          {m.membership.hkidPhotoUrl && (
                            <a
                              href={m.membership.hkidPhotoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">Not provided</span>
                      )}
                    </div>

                    {/* Verify Button */}
                    {m.membership.hkidNumber && (
                      <Button
                        size="sm"
                        onClick={() =>
                          verifyMutation.mutate({
                            membershipId: m.membership.id,
                            verified: !m.membership.hkidVerified,
                          })
                        }
                        disabled={verifyMutation.isPending}
                        className={m.membership.hkidVerified
                          ? "bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40"
                          : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-green-500/20 hover:text-green-300 hover:border-green-500/40"
                        }
                      >
                        {m.membership.hkidVerified ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" /> Verify</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
