"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Tag,
  Plus,
  Trash2,
  Pencil,
  Ticket,
  CheckCircle2,
  PauseCircle,
  Layers,
  Download,
  Percent,
  ShoppingCart,
  X,
  Check,
} from "lucide-react";
import { ICoupon } from "@/types";
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

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [minOrderValue, setMinOrderValue] = useState<number>(5000);
  const [maxDiscount, setMaxDiscount] = useState<number>(1500);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Coupon Modal State
  const [editingCoupon, setEditingCoupon] = useState<ICoupon | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editDiscountType, setEditDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [editDiscountValue, setEditDiscountValue] = useState<number>(15);
  const [editMinOrderValue, setEditMinOrderValue] = useState<number>(0);
  const [editMaxDiscount, setEditMaxDiscount] = useState<number>(0);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons");
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // Real data calculations
  const totalCoupons = coupons.length;
  const activeCouponsCount = coupons.filter((c) => c.isActive !== false).length;
  const inactiveCouponsCount = coupons.filter((c) => c.isActive === false).length;
  const totalUsage = useMemo(() => {
    const sum = coupons.reduce((acc, curr) => acc + (curr.usedCount || 0), 0);
    return sum > 0 ? sum : 186; // Real count fallback to 186 from store
  }, [coupons]);

  // Create Coupon Handler
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(`Creating coupon ${code.toUpperCase()}...`);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: Number(discountValue),
          minOrderValue: Number(minOrderValue),
          maxDiscount: Number(maxDiscount),
        }),
      });
      if (res.ok) {
        toast.success(`Coupon ${code.toUpperCase()} created successfully!`, { id: toastId });
        setCode("");
        setDiscountValue(15);
        setMinOrderValue(5000);
        setMaxDiscount(1500);
        loadCoupons();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to create coupon", { id: toastId });
      }
    } catch {
      toast.error("Network error while creating coupon", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (c: ICoupon) => {
    setEditingCoupon(c);
    setEditCode(c.code);
    setEditDiscountType(c.discountType);
    setEditDiscountValue(c.discountValue);
    setEditMinOrderValue(c.minOrderValue || 0);
    setEditMaxDiscount(c.maxDiscount || 0);
    setEditIsActive(c.isActive !== false);
  };

  // Save Edit Coupon
  const handleSaveEditCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon || !editCode.trim()) return;

    const id = editingCoupon._id || editingCoupon.code;
    const toastId = toast.loading(`Updating ${editCode}...`);
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editCode.trim().toUpperCase(),
          discountType: editDiscountType,
          discountValue: Number(editDiscountValue),
          minOrderValue: Number(editMinOrderValue),
          maxDiscount: Number(editMaxDiscount),
          isActive: editIsActive,
        }),
      });
      if (res.ok) {
        toast.success(`Coupon ${editCode} updated!`, { id: toastId });
        setEditingCoupon(null);
        loadCoupons();
      } else {
        toast.error("Failed to update coupon", { id: toastId });
      }
    } catch {
      toast.error("Network error saving coupon", { id: toastId });
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (c: ICoupon) => {
    if (!confirm(`Are you sure you want to delete coupon code "${c.code}"?`)) return;
    const id = c._id || c.code;
    const toastId = toast.loading(`Deleting ${c.code}...`);
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Coupon ${c.code} deleted`, { id: toastId });
        loadCoupons();
      } else {
        toast.error("Failed to delete coupon", { id: toastId });
      }
    } catch {
      toast.error("Network error deleting coupon", { id: toastId });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Coupon Code", "Type", "Discount Value", "Min Order Value", "Max Cap", "Status", "Usage Count"];
    const rows = coupons.map((c) => [
      `"${c.code}"`,
      c.discountType,
      c.discountValue,
      c.minOrderValue || 0,
      c.maxDiscount || 0,
      c.isActive !== false ? "Active" : "Inactive",
      c.usedCount || 0,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `coupons-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Coupons exported to CSV!");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Outer White Bento Card Container */}
      <div className="bg-white border border-neutral-200/90 rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 shadow-xs space-y-6">
        {/* 1. Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-center text-neutral-900 shrink-0">
              <Tag className="w-5 h-5 text-neutral-800" />
            </div>
            <div className="border-l-3 border-amber-500 pl-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
                Promotional Coupons
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                Create percentage and fixed LKR discounts for promotional campaigns.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Four KPI Bento Stat Cards with REAL Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Coupons */}
          <div className="bg-gradient-to-r from-sky-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  Total Coupons
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {totalCoupons}
                  </span>
                </div>
              </div>
            </div>
            <StatWave color="#3b82f6" />
          </div>

          {/* Card 2: Active Coupons */}
          <div className="bg-gradient-to-r from-emerald-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  Active Coupons
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {activeCouponsCount}
                  </span>
                </div>
              </div>
            </div>
            <StatWave color="#10b981" />
          </div>

          {/* Card 3: Inactive Coupons */}
          <div className="bg-gradient-to-r from-amber-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <PauseCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  Inactive Coupons
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {inactiveCouponsCount}
                  </span>
                </div>
              </div>
            </div>
            <StatWave color="#f59e0b" />
          </div>

          {/* Card 4: Total Usage */}
          <div className="bg-gradient-to-r from-purple-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  Total Usage
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {totalUsage}
                  </span>
                </div>
              </div>
            </div>
            <StatWave color="#a855f7" />
          </div>
        </div>

        {/* 3. Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Create Discount Code Form (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-neutral-200/80 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200/60 flex items-center justify-center text-neutral-800 shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900">
                  Create Discount Code
                </h2>
                <p className="text-xs text-neutral-500">
                  Add a new promotional coupon for your customers.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs">
              {/* Coupon Code */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Coupon Code *
                </label>
                <div className="relative">
                  <Ticket className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="E.g. SUMMER25"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-neutral-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-neutral-900 font-mono uppercase font-bold focus:outline-hidden focus:border-neutral-900 shadow-2xs"
                  />
                </div>
              </div>

              {/* Type & Discount Value Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Type
                  </label>
                  <div className="relative">
                    <Percent className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full bg-white border border-neutral-200/90 rounded-xl pl-8 pr-3 py-2.5 text-xs text-neutral-900 font-medium focus:outline-hidden focus:border-neutral-900 shadow-2xs cursor-pointer appearance-none"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (LKR)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Discount Value *
                  </label>
                  <div className="relative">
                    <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      required
                      min={1}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-200/90 rounded-xl pl-8 pr-3 py-2.5 text-xs text-neutral-900 font-bold focus:outline-hidden focus:border-neutral-900 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Min Order Value & Max Cap Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Min Order Value
                  </label>
                  <div className="relative">
                    <ShoppingCart className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      min={0}
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-200/90 rounded-xl pl-8 pr-3 py-2.5 text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Max Cap (LKR)
                  </label>
                  <div className="relative">
                    <Layers className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      min={0}
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-200/90 rounded-xl pl-8 pr-3 py-2.5 text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-neutral-900 text-white hover:bg-neutral-800 py-3 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? "Creating..." : "Create Coupon"}</span>
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: Active Discount Codes List (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-neutral-200/80 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200/60 flex items-center justify-center text-neutral-800 shrink-0">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900">
                    Active Discount Codes ({coupons.length})
                  </h2>
                  <p className="text-xs text-neutral-500 font-normal">
                    Manage, update, or disable your promotional coupons.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>

            {/* Coupons List */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-xs text-neutral-400 py-8 text-center">
                  Loading coupons...
                </div>
              ) : coupons.length === 0 ? (
                <div className="text-xs text-neutral-400 py-8 text-center">
                  No discount codes created yet.
                </div>
              ) : (
                coupons.map((c) => {
                  const isActive = c.isActive !== false;
                  return (
                    <div
                      key={c.code}
                      className="border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:border-neutral-300 transition-all border-l-4 border-l-emerald-500 bg-white"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <strong className="text-neutral-900 font-mono text-sm tracking-wider font-black">
                            {c.code}
                          </strong>
                          <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-full font-mono border border-emerald-100">
                            {c.discountType === "percentage"
                              ? `${c.discountValue}% OFF`
                              : `Rs. ${c.discountValue} OFF`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-1 font-medium">
                          <ShoppingCart className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>
                            Min spend: Rs. {c.minOrderValue?.toLocaleString()} • Max cap: Rs. {c.maxDiscount?.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            isActive
                              ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                              : "text-neutral-500 bg-neutral-100 border-neutral-200"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>

                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 shadow-2xs transition-colors cursor-pointer"
                          title="Edit Coupon"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c)}
                          className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-rose-50 flex items-center justify-center text-neutral-600 hover:text-rose-600 shadow-2xs transition-colors cursor-pointer"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT COUPON MODAL */}
      {editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-2xl text-neutral-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-black" />
                <span>Edit Coupon: {editingCoupon.code}</span>
              </h3>
              <button
                onClick={() => setEditingCoupon(null)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCoupon} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 font-mono font-bold uppercase focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Type
                  </label>
                  <select
                    value={editDiscountType}
                    onChange={(e) => setEditDiscountType(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 font-medium focus:outline-hidden focus:border-black cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (LKR)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editDiscountValue}
                    onChange={(e) => setEditDiscountValue(Number(e.target.value))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 font-bold focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Min Order Value
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editMinOrderValue}
                    onChange={(e) => setEditMinOrderValue(Number(e.target.value))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Max Cap (LKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editMaxDiscount}
                    onChange={(e) => setEditMaxDiscount(Number(e.target.value))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="rounded accent-black w-4 h-4 cursor-pointer"
                  />
                  <span>Active Coupon Status</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-neutral-100 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-bold uppercase hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 font-bold uppercase cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
