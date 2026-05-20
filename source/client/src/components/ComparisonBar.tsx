/*
 * Global Sticky Comparison Bar
 * Appears at the bottom of the screen when 1+ items are in comparison.
 * Shows thumbnail previews of selected items and opens the full ComparisonModal.
 */
import { useState } from "react";
import { useComparison } from "@/contexts/ComparisonContext";
import ComparisonModal from "@/components/ComparisonModal";
import { X, Package, GitCompare, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ComparisonBar() {
  const { items, removeItem, clearAll } = useComparison();
  const [showModal, setShowModal] = useState(false);

  if (items.length === 0) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="comparison-bar"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-navy-deep border-t-2 border-orange shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
            {/* Label */}
            <div className="shrink-0 hidden sm:block">
              <p className="text-orange font-[Oswald] text-xs uppercase tracking-widest">Comparing</p>
              <p className="text-cream/40 text-[10px]">{items.length}/4 items</p>
            </div>

            {/* Item thumbnails */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative shrink-0 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 group"
                >
                  {/* Thumbnail */}
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain rounded"
                      />
                    ) : (
                      <Package className="w-4 h-4 text-navy/40" />
                    )}
                  </div>
                  {/* Name */}
                  <span className="text-cream/80 text-xs font-medium max-w-[100px] truncate hidden sm:block">
                    {item.name}
                  </span>
                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-4 h-4 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="shrink-0 w-12 h-12 border border-dashed border-white/10 rounded-lg flex items-center justify-center hidden sm:flex"
                >
                  <span className="text-cream/20 text-lg">+</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={clearAll}
                className="p-2 text-cream/30 hover:text-red-400 transition-colors"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-orange hover:bg-orange/90 text-white font-[Oswald] uppercase tracking-wider text-sm px-4 py-2 rounded-lg transition-colors shadow-lg"
              >
                <GitCompare className="w-4 h-4" />
                <span>Compare {items.length > 1 ? `(${items.length})` : ""}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Full comparison modal */}
      <ComparisonModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
