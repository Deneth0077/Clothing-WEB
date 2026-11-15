"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Save,
  Store,
  Phone,
  Mail,
  MapPin,
  Megaphone,
  Truck,
  Package,
  CreditCard,
  Check,
} from "lucide-react";
import { ISiteSettings } from "@/types";
import { toast } from "sonner";

// Decorative SVG wave for Stat Cards
function StatWave({ color = "#f59e0b" }: { color?: string }) {
  return (
    <svg
      className="w-24 sm:w-28 h-10 opacity-70 shrink-0 self-end -mb-1 -mr-1 absolute bottom-0 right-0 pointer-events-none"
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

// WhatsApp Icon
function WhatsAppIcon({ className = "w-4 h-4 text-emerald-500" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

// 3D Storefront Illustration (matching target screenshot)
function StorefrontIllustration() {
  return (
    <svg
      className="w-32 h-20 drop-shadow-sm shrink-0"
      viewBox="0 0 140 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Green foliage behind */}
      <path
        d="M20 50 C10 35, 25 15, 38 25 C30 40, 25 45, 20 50 Z"
        fill="#86efac"
      />
      <path
        d="M120 50 C130 35, 115 15, 102 25 C110 40, 115 45, 120 50 Z"
        fill="#86efac"
      />
      <path
        d="M28 42 C22 30, 32 18, 42 26 C36 36, 32 39, 28 42 Z"
        fill="#4ade80"
      />
      <path
        d="M112 42 C118 30, 108 18, 98 26 C104 36, 108 39, 112 42 Z"
        fill="#4ade80"
      />

      {/* Building Body */}
      <rect
        x="36"
        y="38"
        width="68"
        height="42"
        rx="4"
        fill="#ffffff"
        stroke="#cbd5e1"
        strokeWidth="1.5"
      />

      {/* Blue Roof with TBH */}
      <path
        d="M32 38 L40 18 L100 18 L108 38 Z"
        fill="#3b82f6"
        stroke="#2563eb"
        strokeWidth="1.5"
      />
      <text
        x="70"
        y="31"
        fill="#ffffff"
        fontSize="10"
        fontWeight="900"
        textAnchor="middle"
        letterSpacing="1.5"
      >
        TBH
      </text>

      {/* Awning Trim */}
      <path
        d="M32 38 Q36 43, 40 38 Q44 43, 48 38 Q52 43, 56 38 Q60 43, 64 38 Q68 43, 72 38 Q76 43, 80 38 Q84 43, 88 38 Q92 43, 96 38 Q100 43, 104 38 Q108 43, 112 38"
        stroke="#93c5fd"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Windows & Door */}
      <rect
        x="42"
        y="46"
        width="16"
        height="20"
        rx="2"
        fill="#eff6ff"
        stroke="#93c5fd"
        strokeWidth="1"
      />
      <rect
        x="82"
        y="46"
        width="16"
        height="20"
        rx="2"
        fill="#eff6ff"
        stroke="#93c5fd"
        strokeWidth="1"
      />
      <rect
        x="63"
        y="48"
        width="14"
        height="32"
        rx="2"
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth="1"
      />

      {/* Yellow Shopping Bag */}
      <rect
        x="105"
        y="60"
        width="12"
        height="15"
        rx="2"
        fill="#fde047"
        stroke="#eab308"
        strokeWidth="1"
      />
      <path
        d="M108 60 Q111 56, 114 60"
        stroke="#ca8a04"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<ISiteSettings>({
    storeName: "TBH — The Brand Hub",
    announcementText: "Free Shipping For Orders Above Rs. 8500/=",
    contactPhone: "+ (94) 76 347 3075",
    contactEmail: "info@thebrandhub.lk",
    whatsappNumber: "+94763473075",
    address: "110, Kumaran Ratnam Road, Colombo 02, Sri Lanka.",
    freeShippingThreshold: 8500,
    standardShippingFee: 450,
    kokoEnabled: true,
    mintpayEnabled: true,
    codEnabled: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data) setSettings(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Saving store & logistics settings...");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Store & Logistics settings saved successfully!", { id: toastId });
      } else {
        toast.error("Failed to save settings", { id: toastId });
      }
    } catch {
      toast.error("Network error while saving settings", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Outer White Bento Card Container */}
      <div className="bg-white border border-neutral-200/90 rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 shadow-xs space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Top Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-center text-neutral-900 shrink-0">
                <Settings className="w-5 h-5 text-neutral-800" />
              </div>
              <div className="border-l-3 border-amber-500 pl-3">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
                  Store &amp; Logistics Settings
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                  Configure global announcement messages, shipping thresholds, and payment integrations.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-neutral-900 text-white hover:bg-neutral-800 px-5 py-2.5 rounded-full text-xs font-bold transition-colors flex items-center gap-2 self-start sm:self-auto shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save All Settings"}</span>
            </button>
          </div>

          {/* 2. Top Card: Brand Profile & Contact */}
          <div className="bg-gradient-to-r from-blue-50/20 via-white to-white border border-neutral-200/80 rounded-[24px] sm:rounded-[28px] p-6 shadow-2xs space-y-4 relative overflow-hidden">
            {/* Header with 3D Storefront Illustration */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-neutral-900">
                    Brand Profile &amp; Contact
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Update your store identity and customer contact details.
                  </p>
                </div>
              </div>

              <div className="hidden sm:block absolute top-3 right-6 pointer-events-none select-none">
                <StorefrontIllustration />
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              {/* Store Name */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Store Name *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={settings.storeName}
                    onChange={(e) =>
                      setSettings({ ...settings, storeName: e.target.value })
                    }
                    className="w-full bg-white border border-neutral-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-neutral-900 font-medium focus:outline-hidden focus:border-neutral-900 shadow-2xs"
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={settings.contactPhone}
                    onChange={(e) =>
                      setSettings({ ...settings, contactPhone: e.target.value })
                    }
                    className="w-full bg-white border border-neutral-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-neutral-900 font-medium focus:outline-hidden focus:border-neutral-900 shadow-2xs"
                  />
                </div>
              </div>

              {/* Customer Support Email */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Customer Support Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={settings.contactEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, contactEmail: e.target.value })
                    }
                    className="w-full bg-white border border-neutral-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-neutral-900 font-medium focus:outline-hidden focus:border-neutral-900 shadow-2xs"
                  />
                </div>
              </div>

              {/* WhatsApp Concierge Phone */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  WhatsApp Concierge Phone
                </label>
                <div className="relative">
                  <WhatsAppIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500" />
                  <input
                    type="text"
                    value={settings.whatsappNumber}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsappNumber: e.target.value })
                    }
                    className="w-full bg-white border border-neutral-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-neutral-900 font-medium focus:outline-hidden focus:border-neutral-900 shadow-2xs"
                  />
                </div>
              </div>

              {/* Store Address Full Width */}
              <div className="sm:col-span-2">
                <label className="font-bold text-neutral-700 block mb-1">
                  Store Address (Colombo) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={settings.address}
                    onChange={(e) =>
                      setSettings({ ...settings, address: e.target.value })
                    }
                    className="w-full bg-white border border-neutral-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-neutral-900 font-medium focus:outline-hidden focus:border-neutral-900 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Bottom Row: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Card 2: Announcement Bar & Islandwide Logistics */}
            <div className="bg-gradient-to-r from-amber-50/20 via-white to-white border border-neutral-200/80 rounded-[24px] sm:rounded-[28px] p-6 shadow-2xs space-y-4 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-neutral-900">
                      Announcement Bar &amp; Islandwide Logistics
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Set your site-wide announcement and shipping configuration.
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Header Announcement Text */}
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Header Announcement Text
                    </label>
                    <input
                      type="text"
                      value={settings.announcementText}
                      onChange={(e) =>
                        setSettings({ ...settings, announcementText: e.target.value })
                      }
                      className="w-full bg-white border border-neutral-200/90 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 font-medium focus:outline-hidden focus:border-neutral-900 shadow-2xs"
                    />
                  </div>

                  {/* Free Shipping & Standard Fee */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-bold text-neutral-700 flex items-center gap-1.5 mb-1">
                        <Truck className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Free Shipping Threshold (LKR)</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={settings.freeShippingThreshold}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            freeShippingThreshold: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border border-neutral-200/90 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 font-bold focus:outline-hidden focus:border-neutral-900 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-neutral-700 flex items-center gap-1.5 mb-1">
                        <Package className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Standard Islandwide Shipping Fee (LKR)</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={settings.standardShippingFee}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            standardShippingFee: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border border-neutral-200/90 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 font-bold focus:outline-hidden focus:border-neutral-900 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <StatWave color="#f59e0b" />
            </div>

            {/* Card 3: Payment Methods Active on Storefront */}
            <div className="bg-gradient-to-r from-purple-50/20 via-white to-white border border-neutral-200/80 rounded-[24px] sm:rounded-[28px] p-6 shadow-2xs space-y-4 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-neutral-900">
                      Payment Methods Active on Storefront
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Choose which payment methods to display at checkout.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* COD */}
                  <div
                    onClick={() =>
                      setSettings({ ...settings, codEnabled: !settings.codEnabled })
                    }
                    className="p-3 rounded-2xl border border-neutral-200/80 bg-white hover:border-neutral-300 flex items-center justify-between transition-colors shadow-2xs cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          settings.codEnabled
                            ? "bg-neutral-900 border-neutral-900 text-white"
                            : "border-neutral-300 bg-white"
                        }`}
                      >
                        {settings.codEnabled && <Check className="w-3 h-3" />}
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-neutral-900">
                        Cash On Delivery (Island Wide COD)
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        settings.codEnabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-neutral-100 text-neutral-500 border-neutral-200"
                      }`}
                    >
                      {settings.codEnabled ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* KOKO */}
                  <div
                    onClick={() =>
                      setSettings({ ...settings, kokoEnabled: !settings.kokoEnabled })
                    }
                    className="p-3 rounded-2xl border border-rose-100 bg-rose-50/20 hover:border-rose-200 flex items-center justify-between transition-colors shadow-2xs cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          settings.kokoEnabled
                            ? "bg-neutral-900 border-neutral-900 text-white"
                            : "border-neutral-300 bg-white"
                        }`}
                      >
                        {settings.kokoEnabled && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-rose-600 font-black italic tracking-wider text-xs px-1">
                        KOKO
                      </span>
                      <span className="font-bold text-neutral-900">
                        KOKO — 3 Interest-Free Installments
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        settings.kokoEnabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-neutral-100 text-neutral-500 border-neutral-200"
                      }`}
                    >
                      {settings.kokoEnabled ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Mintpay */}
                  <div
                    onClick={() =>
                      setSettings({ ...settings, mintpayEnabled: !settings.mintpayEnabled })
                    }
                    className="p-3 rounded-2xl border border-sky-100 bg-sky-50/20 hover:border-sky-200 flex items-center justify-between transition-colors shadow-2xs cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          settings.mintpayEnabled
                            ? "bg-neutral-900 border-neutral-900 text-white"
                            : "border-neutral-300 bg-white"
                        }`}
                      >
                        {settings.mintpayEnabled && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-sky-600 font-bold text-xs px-1">
                        Mintpay
                      </span>
                      <span className="font-bold text-neutral-900">
                        Mintpay — Buy Now Pay Later
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        settings.mintpayEnabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-neutral-100 text-neutral-500 border-neutral-200"
                      }`}
                    >
                      {settings.mintpayEnabled ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <StatWave color="#a855f7" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
