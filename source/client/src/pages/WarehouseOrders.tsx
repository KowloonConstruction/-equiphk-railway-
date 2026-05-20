/**
 * WarehouseOrders — Warehouse staff view
 * - Read-only list of active and upcoming orders
 * - Complete order on equipment return
 * - Log damage / repair / cleaning charges
 * - Sends charge summary email to customer
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Package, CheckCircle2, AlertTriangle, Plus, Trash2, ClipboardList, ChevronDown, ChevronUp, Wrench, Camera, X } from "lucide-react";
import { Link } from "wouter";
import AccessDenied from "@/components/AccessDenied";

interface ReturnCharge {
  chargeType: "damage" | "repair" | "cleaning" | "missing_item" | "other";
  description: string;
  amount: string;
  photoUrls: string[]; // S3 URLs for damage evidence photos
  uploading: boolean;  // tracks upload in progress for this charge
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-800",
};

const CONDITION_OPTIONS = [
  { value: "excellent", label: "Excellent — no issues" },
  { value: "good", label: "Good — minor wear only" },
  { value: "fair", label: "Fair — noticeable wear" },
  { value: "damaged", label: "Damaged — repairs needed" },
  { value: "missing_items", label: "Missing Items" },
];

const CHARGE_TYPE_OPTIONS = [
  { value: "damage", label: "Damage" },
  { value: "repair", label: "Repair" },
  { value: "cleaning", label: "Cleaning" },
  { value: "missing_item", label: "Missing Item" },
  { value: "other", label: "Other" },
];

export default function WarehouseOrders() {
  const { user, loading } = useAuth();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [returnDialogOrderId, setReturnDialogOrderId] = useState<number | null>(null);
  const [condition, setCondition] = useState("good");
  const [overallNotes, setOverallNotes] = useState("");
  const [charges, setCharges] = useState<ReturnCharge[]>([]);
  const [statusFilter, setStatusFilter] = useState<"active" | "confirmed" | "all">("active");

  const { data: orders, isLoading, refetch } = trpc.warehouse.listOrders.useQuery({
    statusFilter,
  });

  const completeReturn = trpc.warehouse.completeReturn.useMutation({
    onSuccess: (result: { success: boolean; emailSent: boolean }) => {
      if (result.emailSent) {
        toast.success("Order completed — charge summary emailed to customer.");
      } else {
        toast.success("Return logged. Email notification could not be sent.");
      }
      setReturnDialogOrderId(null);
      setCondition("good");
      setOverallNotes("");
      setCharges([]);
      refetch();
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const allowedRoles = ["admin", "manager", "warehouse"];
  if (!user || !allowedRoles.includes(user.role ?? "")) {
    return <AccessDenied requiredRole="warehouse" />;
  }

  const addCharge = () => {
    setCharges(prev => [...prev, { chargeType: "damage", description: "", amount: "", photoUrls: [], uploading: false }]);
  };

  const removeCharge = (idx: number) => {
    setCharges(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCharge = (idx: number, field: keyof ReturnCharge, value: string) => {
    setCharges(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const addPhotoToCharge = (idx: number, url: string) => {
    setCharges(prev => prev.map((c, i) => i === idx ? { ...c, photoUrls: [...c.photoUrls, url] } : c));
  };

  const removePhotoFromCharge = (idx: number, photoIdx: number) => {
    setCharges(prev => prev.map((c, i) => i === idx ? { ...c, photoUrls: c.photoUrls.filter((_, pi) => pi !== photoIdx) } : c));
  };

  const setChargeUploading = (idx: number, uploading: boolean) => {
    setCharges(prev => prev.map((c, i) => i === idx ? { ...c, uploading } : c));
  };

  const handlePhotoUpload = async (idx: number, file: File) => {
    setChargeUploading(idx, true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-damage-photo", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      addPhotoToCharge(idx, url);
    } catch (err) {
      toast.error("Photo upload failed — please try again");
    } finally {
      setChargeUploading(idx, false);
    }
  };

  const totalCharges = charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  const selectedOrder = orders?.find((o: { id: number }) => o.id === returnDialogOrderId);

  const handleCompleteReturn = () => {
    if (!returnDialogOrderId) return;
    const validCharges = charges.filter(c => c.description.trim() && parseFloat(c.amount) > 0);
    completeReturn.mutate({
      orderId: returnDialogOrderId,
      condition: condition as "excellent" | "good" | "fair" | "damaged" | "missing_items",
      overallNotes: overallNotes.trim() || undefined,
      charges: validCharges.map(c => ({
        chargeType: c.chargeType,
        description: c.description.trim(),
        amount: parseFloat(c.amount),
        photoUrl: c.photoUrls.length > 0 ? c.photoUrls[0] : undefined,
        photoUrls: c.photoUrls,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0a0e1a] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="h-6 w-6 text-orange-500" />
          <div>
            <h1 className="text-lg font-bold">Warehouse Orders</h1>
            <p className="text-xs text-gray-400">Equipment prep, dispatch, and returns</p>
          </div>
        </div>
        <Link href="/admin">
          <Button variant="outline" size="sm" className="text-white border-gray-600 hover:bg-gray-800">
            ← Admin Panel
          </Button>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "active", label: "Active (Dispatched)", icon: "🚚" },
            { key: "confirmed", label: "Confirmed (Prep)", icon: "⚙" },
            { key: "all", label: "All Open Orders", icon: "📋" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as typeof statusFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No orders in this view</p>
            <p className="text-sm mt-1">Check a different filter above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: {
              id: number;
              status: string;
              customerName: string;
              customerPhone?: string | null;
              deliveryType: string;
              deliveryAddress?: string | null;
              deliverySlotDate?: string | Date | null;
              deliverySlotTime?: string | null;
              collectionSlotDate?: string | Date | null;
              collectionSlotTime?: string | null;
              rentalStartDate: string | Date;
              rentalEndDate: string | Date;
              totalAmount: string | number;
              specialInstructions?: string | null;
              items?: Array<{ equipmentName: string; rentalDays: number }>;
            }) => (
              <Card key={order.id} className="border border-gray-200 shadow-sm">
                <CardContent className="p-0">
                  {/* Order Row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-sm">
                        <span className="font-bold text-gray-900">#{order.id}</span>
                        <span className="text-gray-500 ml-2">{order.customerName}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {order.status.toUpperCase()}
                      </span>
                      {order.deliveryType === "delivery" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">DELIVERY</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500">
                          {new Date(order.rentalStartDate).toLocaleDateString("en-HK", { day: "numeric", month: "short" })}
                          {" — "}
                          {new Date(order.rentalEndDate).toLocaleDateString("en-HK", { day: "numeric", month: "short" })}
                        </p>
                        <p className="text-xs font-medium text-orange-600">HK${Number(order.totalAmount).toLocaleString()}</p>
                      </div>
                      {order.status === "active" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReturnDialogOrderId(order.id);
                            setCondition("good");
                            setOverallNotes("");
                            setCharges([]);
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Log Return
                        </Button>
                      )}
                      {expandedOrderId === order.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrderId === order.id && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Equipment */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Equipment</p>
                          <ul className="space-y-1">
                            {order.items?.map((item: { equipmentName: string; rentalDays: number }, i: number) => (
                              <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                <Package className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                                {item.equipmentName}
                                <span className="text-gray-400 text-xs">({item.rentalDays}d)</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Logistics */}
                        <div className="space-y-1 text-sm">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Logistics</p>
                          <p className="text-gray-700">
                            <span className="text-gray-500">Type: </span>
                            {order.deliveryType === "delivery" ? "Delivery" : "Self-Collection"}
                          </p>
                          {order.deliveryAddress && (
                            <p className="text-gray-700">
                              <span className="text-gray-500">Address: </span>
                              {order.deliveryAddress}
                            </p>
                          )}
                          {order.deliverySlotDate && (
                            <p className="text-gray-700">
                              <span className="text-gray-500">Delivery Slot: </span>
                              {new Date(order.deliverySlotDate).toLocaleDateString("en-HK")} {order.deliverySlotTime}
                            </p>
                          )}
                          {order.collectionSlotDate && (
                            <p className="text-gray-700">
                              <span className="text-gray-500">Collection Slot: </span>
                              {new Date(order.collectionSlotDate).toLocaleDateString("en-HK")} {order.collectionSlotTime}
                            </p>
                          )}
                          {order.customerPhone && (
                            <p className="text-gray-700">
                              <span className="text-gray-500">Phone: </span>
                              <a href={`tel:${order.customerPhone}`} className="text-orange-600 hover:underline">{order.customerPhone}</a>
                            </p>
                          )}
                        </div>
                      </div>
                      {order.specialInstructions && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-yellow-800 mb-1">Special Instructions</p>
                          <p className="text-sm text-yellow-900">{order.specialInstructions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Return Log Dialog */}
      <Dialog open={returnDialogOrderId !== null} onOpenChange={(open) => { if (!open) setReturnDialogOrderId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-orange-500" />
              Log Equipment Return — Order #{returnDialogOrderId}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Equipment list */}
            {selectedOrder?.items && selectedOrder.items.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Items Being Returned</p>
                <ul className="space-y-1">
                  {selectedOrder.items.map((item: { equipmentName: string; rentalDays: number }, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      {item.equipmentName}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Condition */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Overall Equipment Condition *</label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Inspection Notes (optional)</label>
              <Textarea
                placeholder="Describe the condition, any issues found, or general notes..."
                value={overallNotes}
                onChange={e => setOverallNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Charges */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Additional Charges</label>
                <Button size="sm" variant="outline" onClick={addCharge} className="text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Charge
                </Button>
              </div>

              {charges.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-400">
                  No charges — click "Add Charge" to log damage, repairs, or cleaning fees
                </div>
              ) : (
                <div className="space-y-3">
                  {charges.map((charge, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={charge.chargeType}
                          onValueChange={v => updateCharge(idx, "chargeType", v)}
                        >
                          <SelectTrigger className="w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CHARGE_TYPE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Amount (HK$)"
                          type="number"
                          min="0"
                          step="0.01"
                          value={charge.amount}
                          onChange={e => updateCharge(idx, "amount", e.target.value)}
                          className="w-32 text-sm"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCharge(idx)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Description (e.g. Cracked guard panel, oil spill cleaning)"
                        value={charge.description}
                        onChange={e => updateCharge(idx, "description", e.target.value)}
                        className="text-sm"
                      />
                      {/* Photo evidence upload */}
                      <div className="mt-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {charge.photoUrls.map((url, photoIdx) => (
                            <div key={photoIdx} className="relative group">
                              <img
                                src={url}
                                alt={`Damage evidence ${photoIdx + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removePhotoFromCharge(idx, photoIdx)}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors">
                            {charge.uploading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Camera className="h-3.5 w-3.5" />
                            )}
                            {charge.uploading ? "Uploading..." : "Add Photo"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={charge.uploading}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(idx, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                        {charge.photoUrls.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">{charge.photoUrls.length} photo{charge.photoUrls.length !== 1 ? "s" : ""} attached — will be included in customer email</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {totalCharges > 0 && (
                    <div className="flex justify-between items-center bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                      <span className="text-sm font-semibold text-red-800">Total Additional Charges</span>
                      <span className="text-sm font-bold text-red-800">HK${totalCharges.toLocaleString("en-HK", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Warning if charges */}
            {totalCharges > 0 && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  A charge summary email will be sent to the customer automatically when you complete this return.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReturnDialogOrderId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleCompleteReturn}
              disabled={completeReturn.isPending}
            >
              {completeReturn.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Completing...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" />Complete Return</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
