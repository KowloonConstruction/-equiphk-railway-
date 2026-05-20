/*
 * Equip.HK Mega-Dropdown Menu
 * Shows all 13 main categories with their sub-categories in a wide panel
 * Triggered by hovering/clicking "Equipment" in the navbar
 */
import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronDown, ChevronRight, LayoutGrid } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface MegaMenuProps {
  onClose?: () => void;
}


export default function EquipmentMegaMenu({ onClose }: MegaMenuProps) {
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const { data: categoriesWithSubs, isLoading } = trpc.subCategories.listWithCategories.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  const handleCategoryClick = (categorySlug: string, _categoryId: number) => {
    navigate(`/equipment?category=${categorySlug}`);
    onClose?.();
  };

  const handleSubCategoryClick = (categorySlug: string, subSlug: string) => {
    navigate(`/equipment?category=${categorySlug}&sub=${subSlug}`);
    onClose?.();
  };

  if (isLoading) {
    return (
      <div className="p-8 text-cream/50 text-sm font-[Source_Sans_3]">
        Loading categories...
      </div>
    );
  }

  const categories = categoriesWithSubs ?? [];
  const activeCat = activeCategory !== null
    ? categories.find(c => c.id === activeCategory)
    : null;

  // Default to first category
  const displayCat = activeCat ?? categories[0] ?? null;

  return (
    <div className="flex flex-col" style={{ minHeight: "320px" }}>
      {/* Main area: categories + sub-categories side by side */}
      <div className="flex flex-1">
        {/* Left: Category list */}
        <div className="w-56 border-r border-white/10 py-3 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onMouseEnter={() => setActiveCategory(cat.id)}
              onClick={() => handleCategoryClick(cat.slug, cat.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors group ${
                (displayCat?.id === cat.id)
                  ? "bg-orange/10 text-orange"
                  : "text-cream/80 hover:bg-white/5 hover:text-cream"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-[Oswald] uppercase tracking-wide leading-tight">
                  {cat.name}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0" />
            </button>
          ))}
        </div>

        {/* Right: Sub-categories for active category */}
        <div className="flex-1 p-5">
          {displayCat && (
            <>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-[Oswald] uppercase tracking-wider text-cream">
                    {displayCat.name}
                  </h3>
                  {displayCat.description && (
                    <p className="text-xs text-cream/50 font-[Source_Sans_3] mt-0.5">
                      {displayCat.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleCategoryClick(displayCat.slug, displayCat.id)}
                  className="ml-auto text-xs text-orange hover:text-orange/80 font-[Oswald] uppercase tracking-wider transition-colors"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(displayCat as any).subCategories?.map((sub: any) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubCategoryClick(displayCat.slug, sub.slug)}
                    className="flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-white/5 transition-colors group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange/40 group-hover:bg-orange shrink-0 transition-colors" />
                    <span className="text-sm text-cream/70 group-hover:text-cream font-[Source_Sans_3] transition-colors">
                      {sub.name}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer: See All Tools */}
      <div className="border-t border-white/10 px-5 py-3 flex items-center">
        <button
          onClick={() => { navigate("/equipment"); onClose?.(); }}
          className="flex items-center gap-2 text-sm text-orange hover:text-orange/80 font-[Oswald] uppercase tracking-wider transition-colors group"
        >
          <LayoutGrid className="w-4 h-4" />
          See All Tools
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

// ─── Trigger button (used in Navbar) ────────────────────────────────────────
export function EquipmentMenuTrigger() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors duration-150 uppercase tracking-wider font-[Oswald] ${
          open ? "text-orange" : "text-cream/80 hover:text-orange"
        }`}
      >
        Equipment
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[680px] bg-navy-deep border border-white/10 shadow-2xl shadow-black/50 z-50 overflow-hidden"
          style={{ borderTop: "2px solid #FF6B00" }}
        >
          <EquipmentMegaMenu onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
