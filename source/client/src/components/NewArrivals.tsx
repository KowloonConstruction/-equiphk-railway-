/*
 * New Arrivals Section
 * Displays the latest 20 equipment items in an attractive carousel
 * Neo-brutalist design with smooth scrolling and real-time updates
 */
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatHKD } from "@/lib/utils";

export default function NewArrivals() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Fetch latest 20 equipment items
  const { data: equipment, isLoading } = trpc.equipment.list.useQuery({
    activeOnly: true,
  });

  // Get latest 20 items (sorted by creation date)
  const latestEquipment = equipment?.slice(0, 20) ?? [];

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-cream to-white">
        <div className="container space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-6 h-6 text-orange" />
            <h2 className="font-[Oswald] text-3xl uppercase tracking-wider text-navy-deep">
              New Arrivals
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-200 rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (latestEquipment.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-cream to-white border-t border-slate-200">
      <div className="container space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-orange" />
            <div>
              <h2 className="font-[Oswald] text-3xl uppercase tracking-wider text-navy-deep">
                New Arrivals
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Latest equipment added to our inventory
              </p>
            </div>
          </div>
          <Sparkles className="w-6 h-6 text-orange hidden sm:block" />
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Scroll Buttons */}
          {canScrollLeft && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-lg rounded-full"
            >
              <ChevronLeft className="w-5 h-5 text-navy-deep" />
            </Button>
          )}
          {canScrollRight && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-lg rounded-full"
            >
              <ChevronRight className="w-5 h-5 text-navy-deep" />
            </Button>
          )}

          {/* Carousel Items */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide flex gap-4 pb-2"
            style={{ scrollBehavior: "smooth" }}
          >
            {latestEquipment.map((item) => (
              <Link
                key={item.id}
                href={`/product/${item.id}`}
                className="flex-shrink-0 w-72 group cursor-pointer transition-transform hover:scale-105 no-underline"
              >
                {/* Card */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                  {/* Image Container */}
                  <div className="relative h-48 bg-white overflow-hidden flex items-center justify-center p-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <span className="text-slate-400 text-sm">No image</span>
                      </div>
                    )}
                    {/* New Badge */}
                    <div className="absolute top-3 right-3 bg-orange text-white px-3 py-1 rounded-full text-xs font-[Oswald] uppercase tracking-wider">
                      New
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                        {item.brand || "Equipment"}
                      </p>
                      <h3 className="font-[Oswald] text-sm uppercase tracking-wider text-navy-deep line-clamp-2 mb-2">
                        {item.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description || "Professional equipment for rent"}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      {item.dailyRate ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-orange">
                            {formatHKD(item.dailyRate)}
                          </span>
                          <span className="text-xs text-muted-foreground">/day</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Contact for pricing</span>
                      )}
                    </div>

                    {/* Availability */}
                    <div className="mt-3 flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.availability === "available" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                      <span className="text-xs font-medium text-muted-foreground capitalize">
                        {item.availability === "available" ? "In Stock" : item.availability}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Info Text */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {latestEquipment.length} of {equipment?.length ?? 0} available items
          </p>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
