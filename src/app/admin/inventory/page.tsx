"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sliders,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Folder,
  Activity,
  List,
  Grid,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Package,
  Layers,
  X,
  ExternalLink,
} from "lucide-react";
import { IProduct } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Decorative SVG wave for Stat Cards
function StatWave({ color = "#3b82f6" }: { color?: string }) {
  return (
    <svg
      className="w-20 sm:w-24 h-10 opacity-70 shrink-0 self-end -mb-1 -mr-1"
      viewBox="0 0 100 40"
      fill="none"
    >
      <path
        d="M0 35 Q 25 15, 50 26 T 100 12 L 100 40 L 0 40 Z"
        fill={color}
        fillOpacity="0.18"
      />
      <path
        d="M0 35 Q 25 15, 50 26 T 100 12"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AdminInventoryPage() {
  const { user } = useAuth();
  const isBrandManager = user?.role === "brand_manager" || user?.role === "vendor";
  const brandSlug = user?.brandSlug || "";

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedHealth, setSelectedHealth] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Selection & Pagination
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Custom Quick Adjust Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustValue, setAdjustValue] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<"set" | "add">("set");

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/products?limit=500&includeInactive=true"),
        fetch("/api/categories"),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();

      const prodList: IProduct[] = pData.products || [];
      setProducts(prodList);

      if (Array.isArray(cData)) {
        setCategories(cData.map((c) => c.name));
      } else {
        const uniqueCats = Array.from(
          new Set(prodList.map((p) => p.category).filter(Boolean))
        ) as string[];
        setCategories(uniqueCats);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real data calculations for KPI cards
  const scopedProducts = useMemo(() => {
    if (isBrandManager && brandSlug) {
      return products.filter(
        (p) => (p.brand || "").toLowerCase() === brandSlug.toLowerCase()
      );
    }
    return products;
  }, [products, isBrandManager, brandSlug]);

  const totalProducts = scopedProducts.length;
  const outOfStockCount = scopedProducts.filter((p) => (p.stock || 0) === 0).length;
  const lowStockCount = scopedProducts.filter(
    (p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5
  ).length;
  const inStockCount = scopedProducts.filter((p) => (p.stock || 0) > 5).length;

  const inStockPercentage =
    totalProducts > 0 ? ((inStockCount / totalProducts) * 100).toFixed(1) : "0.0";
  const lowStockPercentage =
    totalProducts > 0 ? ((lowStockCount / totalProducts) * 100).toFixed(1) : "0.0";
  const outOfStockPercentage =
    totalProducts > 0 ? ((outOfStockCount / totalProducts) * 100).toFixed(1) : "0.0";

  // Filtered products
  const filteredProducts = useMemo(() => {
    return scopedProducts.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand || "").toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        (p.category || "").toLowerCase() === selectedCategory.toLowerCase();

      let matchesHealth = true;
      if (selectedHealth === "healthy") {
        matchesHealth = (p.stock || 0) > 5;
      } else if (selectedHealth === "low") {
        matchesHealth = (p.stock || 0) > 0 && (p.stock || 0) <= 5;
      } else if (selectedHealth === "out") {
        matchesHealth = (p.stock || 0) === 0;
      }

      return matchesSearch && matchesCategory && matchesHealth;
    });
  }, [scopedProducts, search, selectedCategory, selectedHealth]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Selection
  const isAllSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) =>
      selectedProductIds.includes(p._id || p.sku)
    );

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = paginatedProducts.map((p) => p._id || p.sku);
      setSelectedProductIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedProducts.map((p) => p._id || p.sku);
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Stock Adjustment Handler
  const handleStockAdjustment = async (p: IProduct, delta: number) => {
    const newStock = Math.max(0, (p.stock || 0) + delta);
    const toastId = toast.loading(`Updating ${p.sku} stock to ${newStock}...`);
    try {
      const id = p._id || p.slug;
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      if (res.ok) {
        toast.success(`Updated stock for ${p.name} to ${newStock} units`, { id: toastId });
        setProducts((prev) =>
          prev.map((item) =>
            item._id === p._id || item.sku === p.sku ? { ...item, stock: newStock } : item
          )
        );
      } else {
        toast.error("Failed to update stock", { id: toastId });
      }
    } catch {
      toast.error("Network error while updating stock", { id: toastId });
    }
  };

  // Quick Modal Submit
  const handleModalAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) {
      toast.error("Please select a product");
      return;
    }
    const targetProduct = products.find(
      (p) => p._id === adjustProductId || p.sku === adjustProductId
    );
    if (!targetProduct) return;

    const newStock =
      adjustType === "set"
        ? Math.max(0, adjustValue)
        : Math.max(0, (targetProduct.stock || 0) + adjustValue);

    const toastId = toast.loading(`Setting ${targetProduct.sku} stock to ${newStock}...`);
    try {
      const id = targetProduct._id || targetProduct.slug;
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      if (res.ok) {
        toast.success(`Inventory updated for ${targetProduct.name}!`, { id: toastId });
        setProducts((prev) =>
          prev.map((item) =>
            item._id === targetProduct._id || item.sku === targetProduct.sku
              ? { ...item, stock: newStock }
              : item
          )
        );
        setIsAdjustModalOpen(false);
      } else {
        toast.error("Failed to update inventory", { id: toastId });
      }
    } catch {
      toast.error("Network error while updating inventory", { id: toastId });
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Product Name", "SKU", "Brand", "Category", "Current Stock", "Status", "Price"];
    const rows = filteredProducts.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku}"`,
      `"${p.brand || ""}"`,
      `"${p.category || ""}"`,
      p.stock || 0,
      (p.stock || 0) === 0 ? "Out of Stock" : (p.stock || 0) <= 5 ? "Low Stock" : "Healthy",
      p.price || 0,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory-audit-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inventory audit exported to CSV!");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Outer White Bento Card Container */}
      <div className="bg-white border border-neutral-200/90 rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 shadow-xs space-y-6">
        {/* 1. Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-center text-neutral-900 shrink-0">
              <Sliders className="w-5 h-5 text-neutral-800" />
            </div>
            <div className="border-l-3 border-amber-500 pl-3">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
                  {isBrandManager && brandSlug
                    ? `${brandSlug.toUpperCase()} Inventory Control`
                    : "Inventory Control"}
                </h1>
                {isBrandManager && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 uppercase">
                    Partner Scoped
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                Real-time stock audits, replenishment triggers, and low inventory tracking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={handleExportCSV}
              className="bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 px-4 py-2.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={() => {
                if (scopedProducts.length > 0) {
                  setAdjustProductId(scopedProducts[0]._id || scopedProducts[0].sku);
                  setAdjustValue(scopedProducts[0].stock || 0);
                }
                setIsAdjustModalOpen(true);
              }}
              className="bg-neutral-900 text-white hover:bg-neutral-800 px-5 py-2.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adjust Inventory</span>
            </button>
          </div>
        </div>

        {/* 2. Four KPI Bento Stat Cards with REAL Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Products */}
          <div className="bg-gradient-to-r from-blue-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  Total Products
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {totalProducts}
                  </span>
                </div>
              </div>
            </div>
            <StatWave color="#3b82f6" />
          </div>

          {/* Card 2: In Stock */}
          <div className="bg-gradient-to-r from-emerald-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  In Stock
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {inStockCount}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    {inStockPercentage}%
                  </span>
                </div>
              </div>
            </div>
            <StatWave color="#10b981" />
          </div>

          {/* Card 3: Low Stock */}
          <div className="bg-gradient-to-r from-amber-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  Low Stock
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {lowStockCount}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                    {lowStockPercentage}%
                  </span>
                </div>
              </div>
            </div>
            <StatWave color="#f59e0b" />
          </div>

          {/* Card 4: Out of Stock */}
          <div className="bg-gradient-to-r from-rose-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  Out of Stock
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {outOfStockCount}
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                    {outOfStockPercentage}%
                  </span>
                </div>
              </div>
            </div>
            <StatWave color="#f43f5e" />
          </div>
        </div>

        {/* 3. Toolbar: Search Pill, Category Dropdown, Health Dropdown, View Mode Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter SKU or product name..."
              className="w-full bg-white border border-neutral-200/90 rounded-full pl-11 pr-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-900 shadow-2xs font-medium"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-neutral-200/90 text-neutral-800 text-xs font-semibold rounded-full pl-9 pr-8 py-2.5 shadow-2xs focus:outline-hidden focus:border-neutral-900 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Folder className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Stock Health Dropdown */}
            <div className="relative">
              <select
                value={selectedHealth}
                onChange={(e) => {
                  setSelectedHealth(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-neutral-200/90 text-neutral-800 text-xs font-semibold rounded-full pl-9 pr-8 py-2.5 shadow-2xs focus:outline-hidden focus:border-neutral-900 cursor-pointer"
              >
                <option value="all">All Stock Health</option>
                <option value="healthy">Healthy Stock</option>
                <option value="low">Low Stock Alert</option>
                <option value="out">Out of Stock</option>
              </select>
              <Activity className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* View Mode Switcher */}
            <div className="bg-neutral-100 p-1 rounded-full flex items-center border border-neutral-200/60 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Inventory Table View */}
        {viewMode === "table" ? (
          <div className="overflow-x-auto rounded-2xl border border-neutral-200/80 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/70 text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="rounded accent-black w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 font-bold tracking-wider">PRODUCT</th>
                  <th className="py-3.5 px-4 font-bold tracking-wider">SKU</th>
                  <th className="py-3.5 px-4 font-bold tracking-wider">CATEGORY</th>
                  <th className="py-3.5 px-4 font-bold tracking-wider">CURRENT STOCK</th>
                  <th className="py-3.5 px-4 font-bold tracking-wider">THRESHOLD HEALTH</th>
                  <th className="py-3.5 px-4 font-bold tracking-wider text-right">
                    ADJUST QUANTITY
                  </th>
                  <th className="py-3.5 pr-4 pl-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400">
                      Loading inventory...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400">
                      No matching products found.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => {
                    const id = p._id || p.sku;
                    const isSelected = selectedProductIds.includes(id);
                    const stock = p.stock || 0;

                    return (
                      <tr
                        key={id}
                        className={`hover:bg-neutral-50/70 transition-colors ${
                          isSelected ? "bg-amber-50/20" : ""
                        }`}
                      >
                        <td className="py-3.5 pl-4 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectProduct(id)}
                            className="rounded accent-black w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>

                        {/* Product Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden relative shrink-0 border border-neutral-200/80">
                              {p.images?.[0]?.url && (
                                <Image
                                  src={p.images[0].url}
                                  alt={p.name}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              )}
                            </div>
                            <span className="font-bold text-neutral-900 truncate max-w-[220px]">
                              {p.name}
                            </span>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500 font-semibold">
                          {p.sku}
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 text-neutral-700 font-medium">
                          {p.category || "Uncategorized"}
                        </td>

                        {/* Current Stock */}
                        <td className="py-3.5 px-4 font-black text-neutral-900 text-sm">
                          {stock} units
                        </td>

                        {/* Threshold Health Badge */}
                        <td className="py-3.5 px-4">
                          {stock === 0 ? (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 text-[10px] uppercase">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>OUT OF STOCK</span>
                            </span>
                          ) : stock <= 5 ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 text-[10px] uppercase">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>LOW STOCK</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px] uppercase">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>HEALTHY</span>
                            </span>
                          )}
                        </td>

                        {/* Adjust Quantity Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => handleStockAdjustment(p, -1)}
                              className="w-7 h-7 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
                              title="Decrease 1 unit"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStockAdjustment(p, 5)}
                              className="px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-xs transition-colors cursor-pointer"
                              title="Add 5 units"
                            >
                              +5
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStockAdjustment(p, 10)}
                              className="px-3 py-1 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                              title="Add 10 units"
                            >
                              +10
                            </button>
                          </div>
                        </td>

                        {/* Row Actions Menu */}
                        <td className="py-3.5 pr-4 pl-2 text-center">
                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 transition-colors inline-block"
                            title="View Product Live"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProducts.map((p) => {
              const stock = p.stock || 0;
              return (
                <div
                  key={p._id || p.sku}
                  className="bg-white border border-neutral-200/90 rounded-2xl p-4 space-y-3 shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 rounded-xl bg-neutral-100 overflow-hidden relative shrink-0 border border-neutral-200">
                      {p.images?.[0]?.url && (
                        <Image
                          src={p.images[0].url}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <strong className="text-neutral-900 block font-bold text-sm truncate">
                        {p.name}
                      </strong>
                      <span className="text-[11px] font-mono text-neutral-500 block">
                        {p.sku} • {p.category}
                      </span>
                      <span className="text-xs font-black text-neutral-900 mt-1 block">
                        {stock} units
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <div>
                      {stock === 0 ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          OUT OF STOCK
                        </span>
                      ) : stock <= 5 ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          HEALTHY
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStockAdjustment(p, -1)}
                        className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-xs"
                      >
                        –
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStockAdjustment(p, 5)}
                        className="px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-xs"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStockAdjustment(p, 10)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 font-bold text-xs shadow-2xs"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-neutral-500 font-medium">
          <div>
            Showing{" "}
            <span className="font-bold text-neutral-900">
              {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            –{" "}
            <span className="font-bold text-neutral-900">
              {Math.min(currentPage * pageSize, filteredProducts.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-neutral-900">{filteredProducts.length}</span> products
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                totalPages > 5 &&
                page !== 1 &&
                page !== totalPages &&
                Math.abs(page - currentPage) > 1
              ) {
                if (page === 2 || page === totalPages - 1) {
                  return (
                    <span key={page} className="px-1 text-neutral-400">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    currentPage === page
                      ? "bg-neutral-900 text-white shadow-2xs"
                      : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-2xs"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ADJUST INVENTORY MODAL */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-2xl text-neutral-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-black" />
                <span>Adjust Stock Quantity</span>
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalAdjustSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Select Product *
                </label>
                <select
                  value={adjustProductId}
                  onChange={(e) => {
                    setAdjustProductId(e.target.value);
                    const prod = products.find(
                      (p) => p._id === e.target.value || p.sku === e.target.value
                    );
                    if (prod) setAdjustValue(prod.stock || 0);
                  }}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 font-medium focus:outline-hidden focus:border-black"
                >
                  {scopedProducts.map((p) => (
                    <option key={p._id || p.sku} value={p._id || p.sku}>
                      {p.name} ({p.sku}) — Current: {p.stock || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Adjustment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("set")}
                    className={`py-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                      adjustType === "set"
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    Set Exact Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("add")}
                    className={`py-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                      adjustType === "add"
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    Add / Restock Units
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  {adjustType === "set" ? "New Total Units" : "Units to Add (or negative to deduct)"}
                </label>
                <input
                  type="number"
                  required
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 font-bold text-base focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-neutral-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-bold uppercase hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 font-bold uppercase cursor-pointer shadow-xs"
                >
                  Confirm Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
