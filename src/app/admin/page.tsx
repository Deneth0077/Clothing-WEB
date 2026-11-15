"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  TrendingUp,
  ArrowRightLeft,
  Plus,
  ArrowDownLeft,
  CreditCard,
  Banknote,
  Sparkles,
  ShoppingBag,
  Package,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronDown,
  ExternalLink,
  Store,
  Tag,
  Eye,
  Edit3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { IProduct, IBrand } from "@/types";

const PROFIT_LOSS_DATA = [
  { day: "Mon", profit: 34000, orders: 12000 },
  { day: "Tue", profit: 48000, orders: 19000 },
  { day: "Wed", profit: 41000, orders: 15000 },
  { day: "Thu", profit: 55000, orders: 22000 },
  { day: "Fri", profit: 69000, orders: 27000 },
  { day: "Sat", profit: 89000, orders: 36000 },
  { day: "Sun", profit: 78000, orders: 31000 },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isBrandManager = user?.role === "brand_manager" || user?.role === "vendor";
  const brandSlug = user?.brandSlug || "";

  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [brandData, setBrandData] = useState<IBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("LKR");
  const [searchActivity, setSearchActivity] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 12) {
        setGreeting("Good morning");
      } else if (hour < 17) {
        setGreeting("Good afternoon");
      } else {
        setGreeting("Good evening");
      }

      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    }
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadStats() {
      try {
        const [dashRes, prodRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/products?limit=200&includeInactive=true"),
        ]);
        if (dashRes.ok) {
          const data = await dashRes.json();
          setStats(data);
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.products || []);
        }

        if (isBrandManager && brandSlug) {
          const bRes = await fetch(`/api/brands/${brandSlug.toLowerCase()}`);
          if (bRes.ok) {
            const b = await bRes.json();
            setBrandData(b);
          }
        }
      } catch (e) {
        console.error("Failed to load dashboard stats", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [isBrandManager, brandSlug]);

  // Brand Manager calculations
  const brandProducts = useMemo(() => {
    if (!isBrandManager || !brandSlug) return [];
    return products.filter(
      (p) => (p.brand || "").toLowerCase() === brandSlug.toLowerCase()
    );
  }, [products, isBrandManager, brandSlug]);

  const brandInStock = useMemo(() => {
    return brandProducts.filter((p) => p.stock > 5).length;
  }, [brandProducts]);

  const brandLowStock = useMemo(() => {
    return brandProducts.filter((p) => p.stock <= 5);
  }, [brandProducts]);

  const brandTotalUnits = useMemo(() => {
    return brandProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
  }, [brandProducts]);

  // If logged in as Brand Partner / Manager
  if (isBrandManager) {
    return (
      <div className="space-y-8 pb-12">
        {/* Brand Hero Welcome Banner */}
        <div className="bg-gradient-to-r from-amber-500/20 via-neutral-900 to-amber-500/10 border border-amber-500/40 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-black tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                  Verified Brand Partner Console
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Storefront Live</span>
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                {brandSlug.toUpperCase()} STORE STUDIO
              </h1>
              <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed">
                Welcome back to your store workspace. You have full control over your brand items, descriptions, pricing, inventory drops, and storefront appearance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href={`/brand/${brandSlug.toLowerCase()}`}
                target="_blank"
                className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2 transition-all border border-neutral-700 shadow-md"
              >
                <Eye className="w-4 h-4 text-neutral-400" />
                <span>View Live Store</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              </Link>
              <Link
                href="/admin/brand-customizer"
                className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg hover:scale-102"
              >
                <Sparkles className="w-4 h-4" />
                <span>Storefront Customizer</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Brand Scoped KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Brand Products */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
              <span>Catalog SKUs</span>
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-white">
                <Package className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="text-3xl font-black text-white mt-3">
              {brandProducts.length} Items
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block font-medium">
              Scoped exclusively to {brandSlug.toUpperCase()}
            </span>
          </div>

          {/* In Stock Count */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
              <span>Healthy Inventory</span>
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-400 mt-3">
              {brandInStock} SKUs
            </div>
            <span className="text-[11px] text-emerald-400/80 mt-1 block font-bold">
              Ready for instant online checkout
            </span>
          </div>

          {/* Total Units in Stock */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
              <span>Total Units</span>
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-white">
                <Store className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-black text-white mt-3">
              {brandTotalUnits.toLocaleString()} Pcs
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block font-medium">
              Combined islandwide stock volume
            </span>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
              <span>Low Stock Alerts</span>
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-white">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-400 mt-3">
              {brandLowStock.length} Items
            </div>
            <span className="text-[11px] text-amber-400/80 mt-1 block font-bold">
              {brandLowStock.length > 0 ? "Re-stock replenishment advised" : "Inventory optimal"}
            </span>
          </div>
        </div>

        {/* Quick Launch & Store Preview Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Actions Panel */}
          <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Brand Store Management
            </h2>
            <p className="text-xs text-neutral-400">
              Direct tools to expand your collection and personalize customer touchpoints.
            </p>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/admin/products"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                      Add New Brand Product
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Upload photos, set size/color variants and price
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/admin/brand-customizer"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                      Customize Storefront Page
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Edit hero banner, brand heritage story &amp; WhatsApp
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/admin/inventory"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                      Adjust Stock Levels
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Keep units up-to-date across your catalog
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>
            </div>
          </div>

          {/* Brand Details Card */}
          <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
                  Storefront Snapshot
                </span>
                <Link
                  href="/admin/brand-customizer"
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </Link>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80">
                  <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-500">
                    Tagline
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {brandData?.tagline || `Authentic ${brandSlug.toUpperCase()} Collection`}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80">
                  <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-500">
                    Heritage &amp; Story
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 line-clamp-3 leading-relaxed">
                    {brandData?.story ||
                      "Premium lifestyle fashion crafted for modern elegance and tropical ease."}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800/80 mt-4 flex items-center justify-between text-xs text-neutral-400">
              <span>Live Public Storefront:</span>
              <Link
                href={`/brand/${brandSlug.toLowerCase()}`}
                target="_blank"
                className="text-white hover:text-amber-400 font-mono font-bold flex items-center gap-1 transition-colors"
              >
                <span>/brand/{brandSlug.toLowerCase()}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Brand Products Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                {brandSlug.toUpperCase()} Catalog Items
              </h2>
              <p className="text-xs text-neutral-400">
                All products currently featured in your store
              </p>
            </div>
            <Link
              href="/admin/products"
              className="bg-white text-black text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl hover:bg-neutral-200 transition-all flex items-center gap-1.5"
            >
              <span>Manage All ({brandProducts.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-800">
                <tr>
                  <th className="py-2.5">Product</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Price</th>
                  <th className="py-2.5">Stock</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium">
                {brandProducts.slice(0, 8).map((p) => (
                  <tr key={p._id || p.slug} className="hover:bg-neutral-800/40">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0]?.url && (
                          <img
                            src={p.images[0].url}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover border border-neutral-800 shrink-0"
                          />
                        )}
                        <div>
                          <strong className="text-white block font-bold truncate max-w-[220px]">
                            {p.name}
                          </strong>
                          <span className="text-[10px] font-mono text-neutral-500 uppercase">
                            SKU: {p.sku}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-white">
                      Rs. {p.price.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          p.stock > 5
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : p.stock > 0
                            ? "bg-amber-950 text-amber-400 border border-amber-800"
                            : "bg-rose-950 text-rose-400 border border-rose-800"
                        }`}
                      >
                        {p.stock} in stock
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/products`}
                        className="text-xs text-neutral-400 hover:text-white font-bold underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {brandProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                      No products added for {brandSlug.toUpperCase()} yet. Click &quot;Add New Brand Product&quot; above to publish your first item!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Superadmin view (Default)
  const totalBalance = stats?.totalRevenue || 135669;

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting (Time-relevant & Realtime Clock) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
            {greeting}, {user?.name || "TBH Executive Admin"}
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            Stay on top of your tasks, monitor progress, and track status.
          </p>
        </div>

        {/* Realtime Live Date & Time Widget (Without + Icon) */}
        <div className="flex items-center">
          <div className="bg-white border border-neutral-300 shadow-xs px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>{currentDate || "Loading date..."}</span>
            </div>
            <div className="h-4 w-px bg-neutral-200" />
            <div className="flex items-center gap-1.5 font-mono text-xs font-black text-neutral-900 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span>{currentTime || "00:00:00"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Bento Grid (3 Balanced Main Blocks) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Block A: Total Balance & Wallets (Col Span 4) */}
        <div className="lg:col-span-4 bg-white border border-neutral-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            {/* Header: Label + Currency Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">Total Balance</span>
              <button
                type="button"
                className="flex items-center gap-1 text-[11px] font-black uppercase bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 hover:border-black px-2.5 py-1 rounded-full shadow-xs transition-colors cursor-pointer"
              >
                <span>🇱🇰 {currency}</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>
            </div>

            {/* Big Amount */}
            <div className="text-3xl sm:text-4xl font-black text-neutral-900 mt-3 tracking-tight">
              Rs. {totalBalance.toLocaleString()}.00
            </div>

            {/* Trend Indicator */}
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% from last month</span>
            </div>

            {/* Action Buttons: Solid Black Primary + Black-Outlined Secondary */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Link
                href="/admin/products"
                className="bg-black hover:bg-neutral-800 text-white border border-black rounded-2xl py-3 px-4 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transfer</span>
              </Link>
              <Link
                href="/admin/orders"
                className="bg-white hover:bg-black hover:text-white text-black border-2 border-black rounded-2xl py-3 px-4 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Request</span>
              </Link>
            </div>
          </div>

          {/* Sub-Wallets / Payment Channels Breakdown */}
          <div className="mt-6 pt-5 border-t border-neutral-100">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-3">
              Payment Channels
            </span>
            <div className="grid grid-cols-3 gap-2">
              {/* Card Wallet */}
              <div className="bg-neutral-50 hover:bg-white border border-neutral-250 hover:border-black rounded-2xl p-2.5 text-center shadow-xs transition-all cursor-pointer">
                <span className="text-[10px] font-bold text-neutral-500 block truncate">Online Card</span>
                <strong className="text-xs font-black text-neutral-900 mt-1 block">Rs. 78,500</strong>
              </div>
              {/* COD Wallet */}
              <div className="bg-neutral-50 hover:bg-white border border-neutral-250 hover:border-black rounded-2xl p-2.5 text-center shadow-xs transition-all cursor-pointer">
                <span className="text-[10px] font-bold text-neutral-500 block truncate">COD Islandwide</span>
                <strong className="text-xs font-black text-neutral-900 mt-1 block">Rs. 42,169</strong>
              </div>
              {/* Koko Wallet */}
              <div className="bg-neutral-50 hover:bg-white border border-neutral-250 hover:border-black rounded-2xl p-2.5 text-center shadow-xs transition-all cursor-pointer">
                <span className="text-[10px] font-bold text-neutral-500 block truncate">Koko / Mint</span>
                <strong className="text-xs font-black text-neutral-900 mt-1 block">Rs. 15,000</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Block B: 2x2 Middle Cards Grid (Col Span 4) */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          {/* Card 1: Featured Orange Accent Card */}
          <div className="col-span-1 bg-gradient-to-br from-[#ff5b33] to-[#eb441b] text-white border-2 border-[#e03d15] rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between text-[11px] font-bold opacity-90">
              <span>Total Earnings</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black mt-2 tracking-tight">
              Rs. {Math.round(totalBalance * 0.65).toLocaleString()}
            </div>
            <span className="text-[10px] font-extrabold bg-black/20 border border-white/30 px-2.5 py-0.5 rounded-full inline-block mt-2 self-start shadow-xs">
              +12% This month
            </span>
          </div>

          {/* Card 2: Total Spending / Shipping Fees */}
          <div className="col-span-1 bg-white border border-neutral-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500">
              <span>Total Spending</span>
              <Banknote className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="text-2xl font-black text-neutral-900 mt-2 tracking-tight">
              Rs. 12,450
            </div>
            <span className="text-[10px] font-extrabold bg-neutral-100 border border-neutral-250 text-neutral-500 px-2.5 py-0.5 rounded-full inline-block mt-2 self-start">
              -5% This month
            </span>
          </div>

          {/* Card 3: Total Income / Orders */}
          <div className="col-span-1 bg-white border border-neutral-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500">
              <span>Total Orders</span>
              <ShoppingBag className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="text-2xl font-black text-neutral-900 mt-2 tracking-tight">
              {stats?.totalOrders || 24}
            </div>
            <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 px-2.5 py-0.5 rounded-full inline-block mt-2 self-start">
              +8% This month
            </span>
          </div>

          {/* Card 4: Total Revenue / Active SKUs */}
          <div className="col-span-1 bg-white border border-neutral-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500">
              <span>Active SKUs</span>
              <Package className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="text-2xl font-black text-neutral-900 mt-2 tracking-tight">
              {stats?.activeProducts || 16}
            </div>
            <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 px-2.5 py-0.5 rounded-full inline-block mt-2 self-start">
              100% active
            </span>
          </div>
        </div>

        {/* Block C: Right Performance Stacked Bar Chart (Col Span 4) */}
        <div className="lg:col-span-4 bg-white border border-neutral-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-black text-neutral-900">Total Income</h2>
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <span className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-250 px-2.5 py-1 rounded-full text-[#ff5b33]">
                  <span className="w-2 h-2 rounded-full bg-[#ff5b33]" />
                  Profit
                </span>
                <span className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-250 px-2.5 py-1 rounded-full text-black">
                  <span className="w-2 h-2 rounded-full bg-black" />
                  Orders
                </span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-400">
              View your streams at a certain market of loss
            </p>

            <span className="text-xs font-bold text-neutral-800 block mt-3">
              Profit and Loss
            </span>
          </div>

          {/* Vertical Stacked Capsule Bar Chart */}
          <div className="h-44 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PROFIT_LOSS_DATA} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#a3a3a3"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: "#f8f9fa" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e5e7eb",
                    borderRadius: "16px",
                    fontSize: "11px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar dataKey="orders" fill="#000000" radius={[6, 6, 0, 0]} barSize={14} />
                <Bar dataKey="profit" fill="#ff5b33" radius={[6, 6, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Spending Limit & Recent Activities Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Bottom Left: Monthly Spending Limit (Col Span 4) */}
        <div className="lg:col-span-4 bg-white border border-neutral-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-500">Monthly Spending Limit</h3>
            <span className="text-[10px] font-bold text-neutral-400">Budget Target</span>
          </div>

          <div className="pt-2">
            {/* Visual Progress Bar (Orange accent from image) */}
            <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full bg-[#ff5b33] rounded-full transition-all duration-500 shadow-sm"
                style={{ width: "45%" }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-black text-neutral-900 mt-3">
              <span>Rs. 135,669.00</span>
              <span className="text-neutral-400 font-medium">Rs. 300,000.00</span>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 font-medium">Low Stock Warnings</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-300">
                {stats?.lowStockCount || 1} Alert
              </span>
            </div>
            <Link
              href="/admin/inventory"
              className="mt-3 block w-full bg-black hover:bg-neutral-800 text-white border border-black text-center py-2.5 rounded-2xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Audit Inventory
            </Link>
          </div>
        </div>

        {/* Bottom Right: Recent Activities / Orders Table (Col Span 8) */}
        <div className="lg:col-span-8 bg-white border border-neutral-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-3xl p-6">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-sm font-black text-neutral-900">Recent Activities</h2>
              <p className="text-[11px] text-neutral-400">Latest store transactions and fulfillments</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchActivity}
                  onChange={(e) => setSearchActivity(e.target.value)}
                  className="bg-white border border-neutral-300 focus:border-black text-neutral-900 placeholder-neutral-400 text-xs rounded-full pl-8 pr-3 py-1.5 focus:outline-hidden font-medium shadow-xs transition-colors w-36 sm:w-48"
                />
              </div>

              <Link
                href="/admin/orders"
                className="bg-white hover:bg-black hover:text-white text-black border border-neutral-300 hover:border-black px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Filter className="w-3 h-3 text-neutral-500" />
                <span>Filter</span>
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-neutral-400 border-b border-neutral-100">
                <tr>
                  <th className="py-2.5">Order ID</th>
                  <th className="py-2.5">Activity</th>
                  <th className="py-2.5">Price</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                {stats?.recentOrders?.map((ord: any) => (
                  <tr key={ord.orderNumber || ord._id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 font-bold text-neutral-900">{ord.orderNumber || "TBH-90214"}</td>
                    <td className="py-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 text-[10px] font-black">
                        {(ord.customer?.name || "C")[0]}
                      </div>
                      <span className="truncate max-w-[140px]">{ord.customer?.name || "Customer Purchase"}</span>
                    </td>
                    <td className="py-3 font-bold text-neutral-900">
                      Rs. {(ord.total || 2950).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {ord.orderStatus || "Completed"}
                      </span>
                    </td>
                    <td className="py-3 text-[11px] text-neutral-400">
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "Today"}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-neutral-400">
                      Loading recent activities...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
