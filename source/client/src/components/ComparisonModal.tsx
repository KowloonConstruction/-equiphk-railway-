/*
 * Equipment Comparison Modal — Enhanced Full-Screen View
 * Side-by-side comparison with spec parsing, pricing tiers, availability,
 * add-to-cart per item, and navigation to product pages.
 */
import { useComparison } from "@/contexts/ComparisonContext";
import { Button } from "@/components/ui/button";
import { X, Trash2, ShoppingCart, ArrowUpRight, Check, Minus, Package } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Parse specs string into key-value pairs
function parseSpecs(specs?: string): Record<string, string> {
  if (!specs) return {};
  const result: Record<string, string> = {};
  // Try JSON first
  try {
    const parsed = JSON.parse(specs);
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {}
  // Try "Key: Value" lines
  const lines = specs.split(/[\n;,]+/);
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (key && val) result[key] = val;
    }
  }
  return result;
}

// Get all unique spec keys across all items
function getAllSpecKeys(items: any[]): string[] {
  const keys = new Set<string>();
  items.forEach((item) => {
    Object.keys(parseSpecs(item.specs)).forEach((k) => keys.add(k));
  });
  return Array.from(keys);
}

export default function ComparisonModal({ isOpen, onClose }: ComparisonModalProps) {
  const { items, removeItem, clearAll } = useComparison();
  const [, navigate] = useLocation();
  const { addToCart } = useCart();

  if (!isOpen || items.length === 0) return null;

  const allSpecKeys = getAllSpecKeys(items);

  const handleAddToCart = (item: any) => {
    const dailyRate = parseFloat(String(item.dailyRate || 0));
    addToCart({
      equipmentId: item.id,
      name: item.name,
      dailyRate,
      rentalDays: 1,
      startDate: new Date().toISOString().split('T')[0],
      totalPrice: dailyRate,
      imageUrl: item.imageUrl || '',
    });
    toast.success(`${item.name} added to rental cart`);
  };

  const handleViewProduct = (itemId: number) => {
    onClose();
    navigate(`/product/${itemId}`);
  };

  const formatRate = (rate?: string | number) => {
    if (!rate) return null;
    const num = parseFloat(String(rate));
    if (isNaN(num) || num <= 0) return null;
    return `HK$${Math.round(num).toLocaleString("en-HK")}`;
  };

  const getAvailabilityColor = (item: any) => {
    const qty = item.availableQty ?? item.quantity ?? 0;
    if (qty > 2) return "text-green-400";
    if (qty > 0) return "text-amber-400";
    return "text-red-400";
  };

  const getAvailabilityLabel = (item: any) => {
    const qty = item.availableQty ?? item.quantity ?? 0;
    if (qty > 2) return `In Stock (${qty})`;
    if (qty > 0) return `Low Stock (${qty})`;
    return "Out of Stock";
  };

  // Table row component for clean rendering
  const Row = ({ label, children, highlight }: { label: string; children: React.ReactNode; highlight?: boolean }) => (
    <tr className={`border-b border-white/5 ${highlight ? "bg-orange/5" : "hover:bg-white/2"}`}>
      <td className="py-3 px-4 text-cream/50 text-xs font-[Oswald] uppercase tracking-wider whitespace-nowrap w-36 align-top">
        {label}
      </td>
      {children}
    </tr>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-navy">
      {/* Header */}
      <div className="bg-navy-deep border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-[Oswald] text-2xl uppercase tracking-wider">
            Compare Equipment
          </h2>
          <p className="text-cream/40 text-xs mt-0.5">
            {items.length} item{items.length !== 1 ? "s" : ""} selected — up to 4 items
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="border-white/20 text-cream/60 hover:text-red-400 hover:border-red-400/40 gap-1.5 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </Button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-cream/60 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[600px] border-collapse">
          {/* Column headers — product cards */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-navy-deep border-b border-white/10">
              <th className="w-36 p-4 text-left">
                <span className="text-cream/30 text-[10px] uppercase tracking-widest font-[Oswald]">Attribute</span>
              </th>
              {items.map((item) => (
                <th key={item.id} className="p-4 min-w-[200px] align-top">
                  <div className="relative">
                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* Product image */}
                    <div className="w-20 h-20 bg-white rounded-lg mx-auto mb-3 p-2 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                      ) : (
                        <Package className="w-8 h-8 text-navy/30" />
                      )}
                    </div>

                    {/* Product name */}
                    {item.brand && (
                      <p className="text-orange text-[10px] font-bold uppercase tracking-wider text-center mb-0.5">
                        {item.brand}
                      </p>
                    )}
                    <h3 className="text-white text-sm font-[Oswald] uppercase tracking-wide text-center leading-tight line-clamp-2 mb-3">
                      {item.name}
                    </h3>

                    {/* Action buttons */}
                    <div className="flex gap-1.5 justify-center">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex items-center gap-1 bg-orange hover:bg-orange/80 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Add
                      </button>
                      <button
                        onClick={() => handleViewProduct(item.id)}
                        className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-cream text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors"
                      >
                        View
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </th>
              ))}
              {/* Empty column placeholder if fewer than 4 items */}
              {items.length < 4 && (
                <th className="p-4 min-w-[160px] align-middle">
                  <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center">
                    <p className="text-cream/20 text-xs">Add another item to compare</p>
                  </div>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {/* Pricing section */}
            <tr className="bg-navy-light">
              <td colSpan={items.length + 2} className="px-4 py-2">
                <span className="text-orange text-[10px] font-bold uppercase tracking-widest">Rental Rates</span>
              </td>
            </tr>

            <Row label="Daily Rate" highlight>
              {items.map((item) => (
                <td key={item.id} className="py-3 px-4 text-center">
                  {formatRate(item.dailyRate) ? (
                    <span className="text-orange font-bold text-xl">{formatRate(item.dailyRate)}</span>
                  ) : (
                    <span className="text-cream/30 text-sm">POA</span>
                  )}
                  {formatRate(item.dailyRate) && <div className="text-cream/30 text-[10px]">per day</div>}
                </td>
              ))}
              {items.length < 4 && <td />}
            </Row>

            <Row label="Weekly Rate">
              {items.map((item) => (
                <td key={item.id} className="py-3 px-4 text-center">
                  {formatRate(item.weeklyRate) ? (
                    <span className="text-white font-semibold">{formatRate(item.weeklyRate)}</span>
                  ) : (
                    <span className="text-cream/30 text-sm">—</span>
                  )}
                  {formatRate(item.weeklyRate) && <div className="text-cream/30 text-[10px]">per week</div>}
                </td>
              ))}
              {items.length < 4 && <td />}
            </Row>

            <Row label="Monthly Rate">
              {items.map((item) => (
                <td key={item.id} className="py-3 px-4 text-center">
                  {formatRate(item.monthlyRate) ? (
                    <span className="text-white font-semibold">{formatRate(item.monthlyRate)}</span>
                  ) : (
                    <span className="text-cream/30 text-sm">—</span>
                  )}
                  {formatRate(item.monthlyRate) && <div className="text-cream/30 text-[10px]">per month</div>}
                </td>
              ))}
              {items.length < 4 && <td />}
            </Row>

            {/* Availability section */}
            <tr className="bg-navy-light">
              <td colSpan={items.length + 2} className="px-4 py-2">
                <span className="text-orange text-[10px] font-bold uppercase tracking-widest">Availability & Condition</span>
              </td>
            </tr>

            <Row label="Availability">
              {items.map((item) => (
                <td key={item.id} className="py-3 px-4 text-center">
                  <span className={`text-sm font-semibold ${getAvailabilityColor(item)}`}>
                    {getAvailabilityLabel(item)}
                  </span>
                </td>
              ))}
              {items.length < 4 && <td />}
            </Row>

            <Row label="Condition">
              {items.map((item) => (
                <td key={item.id} className="py-3 px-4 text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    item.condition === "new" ? "bg-green-500/20 text-green-400" :
                    item.condition === "excellent" ? "bg-blue-500/20 text-blue-400" :
                    item.condition === "good" ? "bg-amber-500/20 text-amber-400" :
                    "bg-white/10 text-cream/50"
                  }`}>
                    {item.condition || "Good"}
                  </span>
                </td>
              ))}
              {items.length < 4 && <td />}
            </Row>

            {/* Description */}
            <tr className="bg-navy-light">
              <td colSpan={items.length + 2} className="px-4 py-2">
                <span className="text-orange text-[10px] font-bold uppercase tracking-widest">Details</span>
              </td>
            </tr>

            <Row label="Description">
              {items.map((item) => (
                <td key={item.id} className="py-3 px-4 align-top">
                  <p className="text-cream/60 text-xs leading-relaxed">
                    {item.description || "No description available."}
                  </p>
                </td>
              ))}
              {items.length < 4 && <td />}
            </Row>

            {/* Specs section — only if any items have specs */}
            {allSpecKeys.length > 0 && (
              <>
                <tr className="bg-navy-light">
                  <td colSpan={items.length + 2} className="px-4 py-2">
                    <span className="text-orange text-[10px] font-bold uppercase tracking-widest">Specifications</span>
                  </td>
                </tr>
                {allSpecKeys.map((key) => (
                  <Row key={key} label={key}>
                    {items.map((item) => {
                      const parsed = parseSpecs(item.specs);
                      const val = parsed[key];
                      return (
                        <td key={item.id} className="py-3 px-4 text-center">
                          {val ? (
                            <span className="text-cream/80 text-sm">{val}</span>
                          ) : (
                            <Minus className="w-4 h-4 text-cream/20 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                    {items.length < 4 && <td />}
                  </Row>
                ))}
              </>
            )}

            {/* Raw specs fallback if no parsed keys */}
            {allSpecKeys.length === 0 && items.some(i => i.specs) && (
              <Row label="Specs">
                {items.map((item) => (
                  <td key={item.id} className="py-3 px-4 align-top">
                    <p className="text-cream/60 text-xs leading-relaxed whitespace-pre-line">
                      {item.specs || <Minus className="w-4 h-4 text-cream/20 mx-auto" />}
                    </p>
                  </td>
                ))}
                {items.length < 4 && <td />}
              </Row>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-navy-deep border-t border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
        <p className="text-cream/30 text-xs">
          Tip: Click <strong className="text-cream/50">Add</strong> on any item to add it to your rental cart
        </p>
        <Button onClick={onClose} className="bg-orange hover:bg-orange/90 font-[Oswald] uppercase tracking-wider">
          Done
        </Button>
      </div>
    </div>
  );
}
