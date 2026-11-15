"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Store,
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X,
  Copy,
  Users,
  Layers,
  Link2,
  Upload,
} from "lucide-react";
import { IBrand, IProduct } from "@/types";
import { toast } from "sonner";

// Decorative SVG wave for Stat Cards (matching target design)
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

// Brand Logo & Typography Overlay inside Banner (matching screenshot)
function BrandBannerLogo({ name }: { name: string }) {
  const n = (name || "").toLowerCase();
  if (n.includes("breakwater")) {
    return (
      <div className="flex flex-col items-start gap-1">
        <svg
          className="w-8 h-5 text-white drop-shadow-sm"
          viewBox="0 0 24 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="M2 5c2-2 4-2 6 0 2 2 4 2 6 0 2-2 4-2 6 0" />
          <path d="M2 9c2-2 4-2 6 0 2 2 4 2 6 0 2-2 4-2 6 0" />
          <path d="M2 13c2-2 4-2 6 0 2 2 4 2 6 0 2-2 4-2 6 0" />
        </svg>
        <span className="text-xl font-black uppercase text-white tracking-widest drop-shadow-md">
          BREAKWATER
        </span>
      </div>
    );
  }
  if (n.includes("waves")) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <svg
          className="w-9 h-4 text-white drop-shadow-sm"
          viewBox="0 0 24 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M2 6c3-3 6-3 9 0s6 3 9 0" />
          <path d="M2 10c3-3 6-3 9 0s6 3 9 0" />
        </svg>
        <span className="text-2xl font-serif italic font-bold text-white tracking-wider drop-shadow-md">
          WAVES
        </span>
      </div>
    );
  }
  if (n.includes("ansel")) {
    return (
      <div className="flex flex-col items-start gap-1">
        <svg
          className="w-6 h-6 text-white drop-shadow-sm"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 3L3 21h4.2l2.3-5.5h5l2.3 5.5H21L12 3zm0 5.8l1.6 3.8h-3.2L12 8.8z" />
        </svg>
        <span className="text-xl font-black uppercase text-white tracking-widest drop-shadow-md">
          ANSEL
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl font-black uppercase text-white tracking-wider drop-shadow-md">
        {name}
      </span>
    </div>
  );
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<IBrand | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [banner, setBanner] = useState("");
  const [logo, setLogo] = useState("");
  const [description, setDescription] = useState("");
  const [story, setStory] = useState("");
  const [phone, setPhone] = useState("+94 76 347 3075");
  const [email, setEmail] = useState("");
  const [managerUsername, setManagerUsername] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Fetch data
  const loadData = async () => {
    setLoading(true);
    try {
      const [brandsRes, prodRes] = await Promise.all([
        fetch("/api/brands"),
        fetch("/api/products?limit=1000"),
      ]);
      const brandsData = await brandsRes.json();
      const prodData = await prodRes.json();

      setBrands(Array.isArray(brandsData) ? brandsData : []);
      setProducts(prodData.products || []);
    } catch (err) {
      console.error("Failed to load brands:", err);
      toast.error("Failed to fetch brand stores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingBrand(null);
    setName("");
    setSlug("");
    setTagline("");
    setBanner("");
    setLogo("");
    setDescription("");
    setStory("");
    setPhone("+94 76 347 3075");
    setEmail("");
    setManagerUsername("");
    setManagerPassword("");
    setSortOrder(brands.length + 1);
    setIsActive(true);
    setFeatured(false);
    setIsModalOpen(true);
  };

  const openEditModal = (b: IBrand) => {
    setEditingBrand(b);
    setName(b.name);
    setSlug(b.slug);
    setTagline(b.tagline || "");
    setBanner(b.banner || "");
    setLogo(b.logo || "");
    setDescription(b.description || "");
    setStory(b.story || "");
    setPhone(b.phone || "+94 76 347 3075");
    setEmail(b.email || "");
    setManagerUsername(b.managerUsername || b.slug);
    setManagerPassword("");
    setSortOrder(b.sortOrder ?? brands.indexOf(b) + 1);
    setIsActive(b.isActive !== false);
    setFeatured(Boolean(b.featured));
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingBrand) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  // Cloudinary Banner Upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingBanner(true);
    const toastId = toast.loading("Uploading banner image to Cloudinary...");

    try {
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setBanner(data.url);
        toast.success("Banner uploaded successfully!", { id: toastId });
      } else {
        toast.error("Upload failed", { id: toastId });
      }
    } catch {
      toast.error("Error uploading banner", { id: toastId });
    } finally {
      setIsUploadingBanner(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error("Brand name and slug are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const brandPayload: Partial<IBrand> & { managerPassword?: string } = {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        tagline: tagline.trim(),
        banner: banner.trim(),
        logo: logo.trim(),
        description: description.trim(),
        story: story.trim(),
        phone: phone.trim(),
        email: email.trim(),
        managerUsername: managerUsername.trim().toLowerCase() || slug.trim().toLowerCase(),
        ...(managerPassword.trim() ? { managerPassword: managerPassword.trim() } : {}),
        sortOrder: Number(sortOrder),
        isActive,
        featured,
      };

      if (editingBrand) {
        const res = await fetch(`/api/brands/${editingBrand._id || editingBrand.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(brandPayload),
        });
        if (res.ok) {
          toast.success(`Updated ${name} Brand Store!`);
          setIsModalOpen(false);
          loadData();
        } else {
          toast.error("Failed to update brand");
        }
      } else {
        const res = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(brandPayload),
        });
        if (res.ok) {
          toast.success(`Brand store ${name} registered successfully!`);
          setIsModalOpen(false);
          loadData();
        } else {
          toast.error("Failed to create brand");
        }
      }
    } catch {
      toast.error("Network error while saving brand");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (idOrSlug: string, brandName: string) => {
    if (!confirm(`Are you sure you want to delete the ${brandName} brand store?`)) return;
    try {
      const res = await fetch(`/api/brands/${idOrSlug}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Deleted ${brandName}`);
        loadData();
      } else {
        toast.error("Failed to delete brand");
      }
    } catch {
      toast.error("Error deleting brand");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied "${text}" to clipboard!`);
  };

  // Products count map
  const productCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      const b = (p.brand || "").toLowerCase();
      map[b] = (map[b] || 0) + 1;
    });
    return map;
  }, [products]);

  // Filtered brands
  const filteredBrands = useMemo(() => {
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.slug.toLowerCase().includes(search.toLowerCase()) ||
        b.tagline?.toLowerCase().includes(search.toLowerCase())
    );
  }, [brands, search]);

  const activeBrandsCount = useMemo(() => {
    return brands.filter((b) => b.isActive !== false).length;
  }, [brands]);

  return (
    <div className="space-y-6 pb-12">
      {/* Outer White Bento Card Container */}
      <div className="bg-white border border-neutral-200/90 rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 shadow-xs space-y-6">
        {/* 1. Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-center text-neutral-900 shrink-0">
              <Store className="w-5 h-5 text-neutral-800" />
            </div>
            <div className="border-l-3 border-amber-500 pl-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
                Brand Partner Flagship Stores
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                Manage partner brand storefronts, dedicated URLs, covers, stories, and vendor permissions.
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-neutral-900 text-white hover:bg-neutral-800 px-5 py-2.5 rounded-full text-xs font-bold transition-colors flex items-center gap-2 self-start sm:self-auto shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Brand Store</span>
          </button>
        </div>

        {/* 2. Three KPI Bento Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Total Brand Partners */}
          <div className="bg-gradient-to-r from-sky-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  Total Brand Partners
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {brands.length}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                  {activeBrandsCount} Active Storefronts
                </span>
              </div>
            </div>
            <StatWave color="#3b82f6" />
          </div>

          {/* Card 2: Total Multi-Vendor Catalog */}
          <div className="bg-gradient-to-r from-purple-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  Total Multi-Vendor Catalog
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {products.length}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500 font-normal mt-1 block">
                  Distributed across official brands
                </span>
              </div>
            </div>
            <StatWave color="#a855f7" />
          </div>

          {/* Card 3: Customer Entrypoint */}
          <div className="bg-gradient-to-r from-orange-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  Customer Entrypoint
                </span>
                <span className="text-sm font-black text-neutral-900 tracking-wide block mt-0.5">
                  SHOP BY BRANDS
                </span>
                <span className="text-[11px] font-mono font-bold text-[#ea580c] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                  /brand/[slug]
                </span>
              </div>
            </div>
            <StatWave color="#f97316" />
          </div>
        </div>

        {/* 3. Search & Count Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand name, slug or description..."
              className="w-full bg-white border border-neutral-200/90 rounded-full pl-11 pr-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-900 shadow-2xs font-medium"
            />
          </div>

          <span className="text-xs font-bold text-neutral-500 whitespace-nowrap pr-2">
            Showing {filteredBrands.length} of {brands.length} Brands
          </span>
        </div>

        {/* 4. Brands Grid */}
        {loading ? (
          <div className="py-12 text-center text-neutral-400 text-xs">
            Loading brand partners...
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-xs">
            <Store className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p>No brand stores found matching your query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBrands.map((b) => {
              const count = productCountMap[b.name.toLowerCase()] || 0;
              const managerHandle = `@${b.managerUsername || b.slug}`;

              return (
                <div
                  key={b.slug}
                  className="bg-white border border-neutral-200/90 rounded-[24px] sm:rounded-[28px] overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-xs hover:border-neutral-300 transition-all group"
                >
                  <div>
                    {/* Banner Header with Logo Overlay */}
                    <div className="relative h-32 sm:h-36 w-full bg-neutral-900 overflow-hidden">
                      {b.banner ? (
                        <Image
                          src={b.banner}
                          alt={b.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-neutral-800 to-neutral-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                      {/* Status Pill Badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 flex items-center gap-1.5 shadow-xs backdrop-blur-xs ${
                            b.isActive !== false
                              ? "bg-emerald-50/95 text-emerald-800 border border-emerald-200/80"
                              : "bg-rose-50/95 text-rose-800 border border-rose-200/80"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              b.isActive !== false ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          <span>{b.isActive !== false ? "ACTIVE" : "DISABLED"}</span>
                        </span>
                      </div>

                      {/* Brand Logo & Name Overlay */}
                      <div className="absolute bottom-3 left-4">
                        <BrandBannerLogo name={b.name} />
                      </div>
                    </div>

                    {/* Brand Details */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span className="font-mono text-neutral-500 text-[11px]">
                          URL: /brand/{b.slug}
                        </span>
                        <span className="font-bold text-neutral-900 text-xs">
                          {count} Products
                        </span>
                      </div>

                      <p className="text-xs text-neutral-600 line-clamp-1 font-medium">
                        {b.tagline || b.description || "Official brand flagship store."}
                      </p>

                      {/* Manager Login Dark Bar */}
                      <div className="flex items-center justify-between text-xs bg-[#262626] text-neutral-200 rounded-xl px-3 py-2 border border-neutral-800 shadow-2xs">
                        <span className="flex items-center gap-1.5 text-neutral-300 font-medium text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Manager Login:</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            {managerHandle}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(managerHandle)}
                            className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy Manager Handle"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 sm:p-5 pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                    <Link
                      href={`/brand/${b.slug}`}
                      target="_blank"
                      className="text-xs font-bold text-neutral-900 hover:text-neutral-600 flex items-center gap-1.5 transition-colors"
                    >
                      <span>View Storefront</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(b)}
                        className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 shadow-2xs transition-colors cursor-pointer"
                        title="Edit Brand Store"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(b._id || b.slug, b.name)}
                        className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-rose-50 flex items-center justify-center text-neutral-600 hover:text-rose-600 shadow-2xs transition-colors cursor-pointer"
                        title="Delete Brand"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT BRAND MODAL */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        >
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 text-neutral-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-black" />
                  <span>
                    {editingBrand ? `Edit ${name} Brand Store` : "Create New Brand Store"}
                  </span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Configure brand storefront details, custom banner, and marketing copy.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. WAVES"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-3 py-2.5 text-neutral-900 font-bold focus:outline-hidden focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Store Slug / URL *
                  </label>
                  <div className="flex items-center">
                    <span className="bg-neutral-100 border border-r-0 border-neutral-200 text-neutral-500 px-3 py-2.5 rounded-l-2xl font-mono text-[11px]">
                      /brand/
                    </span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase())}
                      placeholder="waves"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-r-2xl px-3 py-2.5 text-neutral-900 font-mono focus:outline-hidden focus:border-black"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Tagline / Catchphrase
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Sri Lanka's premier flip-flops and beachwear brand."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-3 py-2.5 text-neutral-900 focus:outline-hidden focus:border-black"
                />
              </div>

              {/* Banner Upload / URL */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Storefront Banner Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    placeholder="https://images.unsplash.com/... or upload"
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-2xl px-3 py-2.5 text-neutral-900 focus:outline-hidden focus:border-black"
                  />
                  <label className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 px-3.5 py-2.5 rounded-2xl cursor-pointer font-bold flex items-center gap-1.5 shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingBanner ? "Uploading..." : "Upload"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingBanner}
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short marketing overview..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-3 text-neutral-900 focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Brand Heritage Story
                </label>
                <textarea
                  rows={3}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="The artisan journey, heritage, and values..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-3 text-neutral-900 focus:outline-hidden focus:border-black"
                />
              </div>

              {/* Manager Credentials */}
              <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Brand Partner Login Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-600 font-medium block mb-1">
                      Manager Username
                    </label>
                    <input
                      type="text"
                      value={managerUsername}
                      onChange={(e) => setManagerUsername(e.target.value.toLowerCase())}
                      placeholder={slug || "brand_manager"}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 font-mono focus:outline-hidden focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-600 font-medium block mb-1">
                      {editingBrand ? "Reset Password (optional)" : "Password *"}
                    </label>
                    <input
                      type="password"
                      value={managerPassword}
                      onChange={(e) => setManagerPassword(e.target.value)}
                      placeholder={editingBrand ? "Leave blank to keep" : "••••••••"}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 focus:outline-hidden focus:border-black"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-3 py-2.5 text-neutral-900 focus:outline-hidden focus:border-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Store Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@thebrandhub.lk"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-3 py-2.5 text-neutral-900 focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded accent-black w-4 h-4 cursor-pointer"
                  />
                  <span>Active Storefront</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded accent-black w-4 h-4 cursor-pointer"
                  />
                  <span>Featured Partner</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-neutral-200 font-bold uppercase hover:bg-neutral-100 cursor-pointer text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl bg-black text-white hover:bg-neutral-800 font-bold uppercase transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingBrand
                    ? "Save Changes"
                    : "Create Brand Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
