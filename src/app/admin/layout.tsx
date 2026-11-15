"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Sliders,
  Sparkles,
  Tag,
  Settings,
  Menu,
  X,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Store,
  Palette,
  Search,
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SiteLogo from "@/components/SiteLogo";

// Master Superadmin Navigation
const ADMIN_NAV = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Custom Orders", href: "/admin/custom-orders", icon: Sparkles },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Layers },
  { name: "Brands", href: "/admin/brands", icon: Store },
  { name: "Inventory", href: "/admin/inventory", icon: Sliders },
  { name: "Coupons", href: "/admin/coupons", icon: Tag },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

// Dedicated Brand Partner / Vendor Navigation
const BRAND_MANAGER_NAV = [
  { name: "Store Overview", href: "/admin", icon: LayoutDashboard },
  { name: "My Brand Products", href: "/admin/products", icon: Package },
  { name: "Storefront Customizer", href: "/admin/brand-customizer", icon: Palette },
  { name: "Stock & Inventory", href: "/admin/inventory", icon: Sliders },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const isLoginPage = pathname?.startsWith("/admin/login");
  const isBrandManager = user?.role === "brand_manager" || user?.role === "vendor";
  const brandSlug = user?.brandSlug || "";
  const navigationItems = isBrandManager ? BRAND_MANAGER_NAV : ADMIN_NAV;

  // Authentication Guard
  useEffect(() => {
    if (!isLoading && !isAdmin && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [isLoading, isAdmin, isLoginPage, router]);

  // Immediately render children on login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-neutral-900 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-black animate-spin mb-3" />
        <p className="text-xs uppercase tracking-widest font-bold text-neutral-500">
          Verifying Management Credentials...
        </p>
      </div>
    );
  }

  // Unauthorized fallback
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-neutral-900 flex flex-col items-center justify-center p-4">
        <ShieldCheck className="w-10 h-10 text-neutral-800 mb-3" />
        <h2 className="text-base font-black uppercase tracking-wider text-black">Access Restricted</h2>
        <p className="text-xs text-neutral-500 mt-1 mb-4 text-center max-w-sm">
          Please log in with administrator or brand partner privileges to access this console.
        </p>
        <Link
          href="/admin/login"
          className="bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-sm"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eceff3] text-neutral-900 antialiased flex flex-col relative overflow-x-hidden">
      {/* Left Floating Slim Action Dock (Separate & Vertically Centered on Screen) */}
      <aside className="hidden md:flex flex-col items-center bg-white border border-neutral-300/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] rounded-3xl py-3 px-1.5 w-14 sm:w-16 fixed left-3 sm:left-5 top-1/2 -translate-y-1/2 z-40 overflow-hidden">
        {/* Top: Day/Night Single Toggle Button */}
        <div className="flex flex-col items-center pb-2 border-b border-neutral-100 w-full">
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? (
              <Moon className="w-3.5 h-3.5 text-neutral-800" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
          </button>
        </div>

        {/* Middle: Icon Navigation */}
        <nav className="flex flex-col items-center gap-1.5 my-2.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-black text-white shadow-md scale-105"
                    : "text-neutral-400 hover:text-black hover:bg-neutral-100"
                }`}
              >
                <Icon className="w-4 h-4" />
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Storefront & Sign Out (RED Logout Icon) */}
        <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-neutral-100 w-full">
          <Link
            href={isBrandManager ? `/brand/${brandSlug}` : "/"}
            target={isBrandManager ? "_blank" : "_self"}
            title={isBrandManager ? `View ${brandSlug.toUpperCase()} Storefront` : "View Storefront"}
            className="w-8.5 h-8.5 rounded-xl text-neutral-400 hover:text-black hover:bg-neutral-100 flex items-center justify-center transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => logout("/admin/login")}
            title="Sign Out"
            className="w-8.5 h-8.5 rounded-xl text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer border border-red-200/60 shadow-xs"
          >
            <LogOut className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </aside>

      {/* Top Floating Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-30 py-3 bg-[#eceff3]/85 backdrop-blur-md border-b border-neutral-300/40 transition-all">
        <div className="w-full max-w-[1560px] mx-auto md:pl-28 px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Left: TBH Brand Logo Capsule (Aligned with 'G' of Good morning) */}
          <div className="flex items-center gap-3">
            <div className="bg-white border border-neutral-300 shadow-xs px-4 py-2 rounded-full flex items-center hover:border-black transition-colors">
              <SiteLogo />
              {isBrandManager && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 ml-2 pl-2 border-l border-neutral-200">
                  {brandSlug}
                </span>
              )}
            </div>
          </div>

          {/* Center: Search Box Capsule (Centered in the header) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-auto px-4">
            <div className="w-full bg-white border border-neutral-300 shadow-xs rounded-full px-4 py-2 flex items-center gap-2.5 transition-all focus-within:border-black focus-within:shadow-md">
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Search products, orders, categories..."
                className="w-full text-xs bg-transparent text-neutral-900 placeholder-neutral-400 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Right: Quick Action Controls & User Profile (Unified Single Capsule) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Single Capsule containing Notification Icon and Login Profile Avatar */}
            <div className="flex items-center bg-white border border-neutral-300 shadow-xs rounded-full px-2.5 py-1.5 gap-2.5 relative">
              {/* Notification Button */}
              <button
                type="button"
                className="p-1 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-orange-500 absolute top-0.5 right-0.5 ring-1.5 ring-white" />
              </button>

              {/* User Profile Avatar (Login as) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-7 h-7 rounded-full bg-neutral-900 hover:bg-black text-white font-black text-xs flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105"
                  title={user?.name || "TBH Executive Admin"}
                >
                  {(user?.name || "T")[0]}
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white border border-neutral-200 rounded-2xl shadow-xl p-2 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-neutral-100">
                      <p className="font-bold text-neutral-900">{user?.name || "TBH Executive Admin"}</p>
                      <p className="text-[11px] text-neutral-500 font-semibold">
                        {isBrandManager ? `BRAND PARTNER (@${brandSlug.toUpperCase()})` : (user?.role || "SUPERADMIN")}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{user?.email || "admin@thebrandhub.lk"}</p>
                    </div>
                    <Link
                      href={isBrandManager ? `/brand/${brandSlug}` : "/"}
                      target={isBrandManager ? "_blank" : "_self"}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors font-medium mt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isBrandManager ? `View ${brandSlug.toUpperCase()} Storefront` : "View Storefront"}</span>
                    </Link>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout("/admin/login");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full bg-white border border-neutral-200 text-black shadow-xs cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 max-w-[1560px] mx-auto px-4 bg-white border border-neutral-200 rounded-3xl p-4 shadow-lg flex flex-col gap-1.5 max-h-[calc(100vh-80px)] overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="w-full max-w-[1560px] mx-auto md:pl-28 px-4 sm:px-8 pt-20 sm:pt-24 pb-10 flex-1">
        <main className="w-full min-w-0">{children}</main>
      </div>
    </div>
  );
}
