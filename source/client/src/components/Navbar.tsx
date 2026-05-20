/*
 * Equip.HK Navbar — Neo-Brutalist Industrial Design
 * Dark navy background, orange accents, Oswald typography
 * Sticky header with transparent-to-solid scroll behavior
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, Heart, User, LogOut, LayoutDashboard, Crown, Shield, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "./SearchBar";
import { useCart } from "@/contexts/CartContext";
import { EquipmentMenuTrigger } from "./EquipmentMegaMenu";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk_logo_transparent_15fbc42e.png";



export default function Navbar() {
  const [location, navigate] = useLocation();
  const { items } = useCart();
  const { user, logout } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const favouriteIdsQ = trpc.favourites.ids.useQuery(undefined, { retry: false });
  const favouriteCount = favouriteIdsQ.data?.length ?? 0;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang, tk } = useLanguage();

  const navLinks = [
    { labelKey: "nav_consumables" as const, href: "/consumables", isPage: true },
    { labelKey: "nav_how_it_works" as const, href: "#how-it-works" },
    { labelKey: "nav_pricing" as const, href: "#pricing" },
    { labelKey: "nav_contact" as const, href: "#contact" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    // If we're on the homepage, scroll directly to the section
    if (location === "/") {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      // Navigate to homepage with the anchor hash so it scrolls on arrival
      navigate(`/${href}`);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-navy-deep/98 shadow-lg shadow-black/20 backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <div className="w-full max-w-[1280px] mx-auto px-4 lg:px-8 flex items-center justify-between gap-4" style={{ height: '72px' }}>
        {/* Brand name — top left, text only */}
        <a
          href="/"
          onClick={(e) => { e.preventDefault(); navigate("/"); }}
          className="flex flex-col items-center shrink-0 select-none leading-none"
        >
          <span className="font-[Oswald] font-700 text-2xl lg:text-3xl tracking-wider uppercase text-white">
            Equip<span className="text-orange">HK</span>
          </span>
        </a>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden lg:block flex-1 max-w-3xl">
          <SearchBar />
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Equipment mega-dropdown */}
          <EquipmentMenuTrigger />
            {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => {
                if ((link as any).isPage) {
                  navigate(link.href);
                } else {
                  handleNavClick(link.href);
                }
              }}
              className="px-3 py-2 text-sm font-medium text-cream/80 hover:text-orange transition-colors duration-150 uppercase tracking-wider font-[Oswald]"
            >
              {tk(link.labelKey)}
            </button>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="px-2 py-1 text-xs font-bold font-[Oswald] uppercase tracking-wider border border-cream/30 rounded text-cream/70 hover:text-orange hover:border-orange transition-colors"
            title={lang === "en" ? "切換至繁體中文" : "Switch to English"}
          >
            {lang === "en" ? "中文" : "EN"}
          </button>
          {/* Favourites Button */}
          <button
            onClick={() => navigate("/favourites")}
            className="relative p-2 text-cream/70 hover:text-orange transition-colors"
            title="Your favourites"
          >
            <Heart className="w-5 h-5" />
            {favouriteCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {favouriteCount}
              </span>
            )}
          </button>
          {/* Cart Button */}
          <button
            onClick={() => navigate("/cart")}
            className="relative p-2 text-cream/70 hover:text-orange transition-colors"
            title="View rental cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </button>
          {/* Account / Login */}
          <div className="relative">
            {user ? (
              <>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-2 p-2 text-cream/70 hover:text-orange transition-colors"
                  title={user.name ?? "Account"}
                >
                  <User className="w-5 h-5" />
                  <span className="text-xs font-[Oswald] uppercase tracking-wider max-w-[80px] truncate">
                    {user.name?.split(" ")[0] ?? "Account"}
                  </span>
                  {/* Role badge for staff */}
                  {(user as any).role === 'admin' && (
                    <span className="text-[9px] font-bold uppercase bg-orange/20 text-orange border border-orange/40 px-1.5 py-0.5 rounded-full leading-none">
                      Admin
                    </span>
                  )}
                  {(user as any).role === 'manager' && (
                    <span className="text-[9px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.5 rounded-full leading-none">
                      Manager
                    </span>
                  )}
                  {(user as any).role === 'warehouse' && (
                    <span className="text-[9px] font-bold uppercase bg-green-500/20 text-green-300 border border-green-500/40 px-1.5 py-0.5 rounded-full leading-none">
                      Warehouse
                    </span>
                  )}
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-navy-deep border border-white/10 rounded shadow-xl min-w-[180px] z-50 py-1">
                    <button
                      onClick={() => { setAccountMenuOpen(false); navigate("/account"); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-cream/80 hover:text-orange hover:bg-white/5 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      {tk("nav_my_account")}
                    </button>
                    {(['admin', 'manager', 'warehouse'] as string[]).includes((user as any).role) && (
                      <button
                        onClick={() => { setAccountMenuOpen(false); navigate("/admin"); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-cream/80 hover:text-orange hover:bg-white/5 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {(user as any).role === 'admin' ? tk("nav_admin_panel") :
                         (user as any).role === 'manager' ? tk("nav_manager_panel") :
                         tk("nav_warehouse_panel")}
                      </button>
                    )}
                    <div className="border-t border-white/10 my-1" />
                    <button
                      onClick={() => { setAccountMenuOpen(false); logout(); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-cream/80 hover:text-orange hover:bg-white/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {tk("nav_sign_out")}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => { window.location.href = getLoginUrl(); }}
                className="flex items-center gap-1.5 p-2 text-cream/70 hover:text-orange transition-colors"
                title="Sign in"
              >
                <User className="w-5 h-5" />
                <span className="text-xs font-[Oswald] uppercase tracking-wider">{tk("nav_sign_in")}</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-cream"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-navy-deep border-t border-white/10 overflow-hidden"
          >
            <nav className="container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => {
                    if ((link as any).isPage) {
                      setMobileOpen(false);
                      navigate(link.href);
                    } else {
                      handleNavClick(link.href);
                    }
                  }}
                  className="py-3 px-4 text-left text-cream/80 hover:text-orange hover:bg-white/5 transition-colors uppercase tracking-wider font-[Oswald] text-sm"
                >
                  {tk(link.labelKey)}
                </button>
              ))}
              <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-3">
                {/* Mobile Favourites Button */}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/favourites");
                  }}
                  className="relative flex items-center gap-2 px-4 py-3 text-cream/70 hover:text-orange transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span className="uppercase tracking-wider font-[Oswald] text-sm">{tk("nav_favourites")}</span>
                  {favouriteCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {favouriteCount}
                    </span>
                  )}
                </button>
                {/* Mobile Cart Button */}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/cart");
                  }}
                  className="relative flex items-center gap-2 px-4 py-3 text-cream/70 hover:text-orange transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="uppercase tracking-wider font-[Oswald] text-sm">{tk("nav_cart")}</span>
                  {items.length > 0 && (
                    <span className="bg-orange text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </button>
                {user ? (
                  <>
                    {(['admin', 'manager', 'warehouse'] as string[]).includes((user as any).role) && (
                      <button
                        onClick={() => { setMobileOpen(false); navigate("/admin"); }}
                        className="flex items-center gap-2 px-4 py-3 text-cream/70 hover:text-orange transition-colors"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="uppercase tracking-wider font-[Oswald] text-sm">
                          {(user as any).role === 'admin' ? tk("nav_admin_panel") :
                           (user as any).role === 'manager' ? tk("nav_manager_panel") :
                           tk("nav_warehouse_panel")}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => { setMobileOpen(false); logout(); }}
                      className="flex items-center gap-2 px-4 py-3 text-cream/70 hover:text-orange transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="uppercase tracking-wider font-[Oswald] text-sm">{tk("nav_sign_out")}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setMobileOpen(false); window.location.href = getLoginUrl(); }}
                    className="flex items-center gap-2 px-4 py-3 text-cream/70 hover:text-orange transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="uppercase tracking-wider font-[Oswald] text-sm">{tk("nav_sign_in")}</span>
                  </button>
                )}
                {/* Mobile Language Toggle */}
                <button
                  onClick={() => setLang(lang === "en" ? "zh" : "en")}
                  className="flex items-center gap-2 px-4 py-3 text-cream/70 hover:text-orange transition-colors"
                >
                  <span className="text-sm font-bold font-[Oswald] uppercase tracking-wider border border-cream/30 rounded px-2 py-0.5">
                    {lang === "en" ? "中文" : "EN"}
                  </span>
                  <span className="uppercase tracking-wider font-[Oswald] text-sm">
                    {lang === "en" ? "切換至繁體中文" : "Switch to English"}
                  </span>
                </button>

              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
