"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Layers,
  Folder,
  Tag,
  Package,
  BarChart3,
  Plus,
  Upload,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  ExternalLink,
  ArrowRight,
  X,
  Check,
} from "lucide-react";
import { ICategory, IBrand, IProduct } from "@/types";
import { toast } from "sonner";

// Decorative SVG wave for Stat Cards (matching target design)
function StatWave({ color = "#10b981" }: { color?: string }) {
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

// Brand Logo SVG / Emblem Resolver (matching target screenshot logos)
function BrandLogoIcon({ name }: { name: string }) {
  const n = (name || "").toLowerCase();
  if (n.includes("breakwater")) {
    return (
      <svg
        className="w-6 h-6 text-cyan-800"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 9c2-2 4-2 6 0 2 2 4 2 6 0 2-2 4-2 6 0" />
        <path d="M2 14c2-2 4-2 6 0 2 2 4 2 6 0 2-2 4-2 6 0" />
        <path d="M2 19c2-2 4-2 6 0 2 2 4 2 6 0 2-2 4-2 6 0" />
      </svg>
    );
  }
  if (n.includes("waves")) {
    return (
      <svg
        className="w-6 h-6 text-neutral-900"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <path d="M3 13c2.5-3 5.5-3 8 0 2.5 3 5.5 3 8 0" />
      </svg>
    );
  }
  if (n.includes("ansel")) {
    return (
      <svg
        className="w-6 h-6 text-neutral-900"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 3L3 21h4.2l2.3-5.5h5l2.3 5.5H21L12 3zm0 5.8l1.6 3.8h-3.2L12 8.8z" />
      </svg>
    );
  }
  if (n.includes("parakeet")) {
    return (
      <span className="font-black text-emerald-600 text-sm tracking-tighter">
        PK
      </span>
    );
  }
  if (n.includes("aura")) {
    return (
      <span className="font-black text-sky-600 text-sm tracking-tighter">
        AU
      </span>
    );
  }
  if (n.includes("sil")) {
    return (
      <span className="font-black text-indigo-600 text-sm tracking-tighter">
        SIL
      </span>
    );
  }
  return (
    <span className="font-black text-neutral-800 text-xs uppercase tracking-tight">
      {name.slice(0, 2)}
    </span>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded category IDs for viewing inside products
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Add Category State
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatImage, setNewCatImage] = useState("");
  const [isUploadingCat, setIsUploadingCat] = useState(false);

  // Edit Category Modal
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatDesc, setEditCatDesc] = useState("");
  const [editCatImage, setEditCatImage] = useState("");

  // Add Brand State
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandDesc, setNewBrandDesc] = useState("");

  // Edit Brand Modal
  const [editingBrand, setEditingBrand] = useState<IBrand | null>(null);
  const [editBrandName, setEditBrandName] = useState("");
  const [editBrandTagline, setEditBrandTagline] = useState("");
  const [editBrandDesc, setEditBrandDesc] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, bRes, pRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/brands"),
        fetch("/api/products?limit=200&includeInactive=true"),
      ]);
      const cData = await cRes.json();
      const bData = await bRes.json();
      const pData = await pRes.json();

      setCategories(cData || []);
      setBrands(bData || []);
      setProducts(pData.products || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load taxonomies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map products by category
  const productsByCategory = useMemo(() => {
    const map: Record<string, IProduct[]> = {};
    products.forEach((p) => {
      const cat = (p.category || "Uncategorized").toLowerCase();
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return map;
  }, [products]);

  // Map products by brand
  const productsByBrand = useMemo(() => {
    const map: Record<string, IProduct[]> = {};
    products.forEach((p) => {
      const br = (p.brand || "TBH").toLowerCase();
      if (!map[br]) map[br] = [];
      map[br].push(p);
    });
    return map;
  }, [products]);

  // Categories with products calculation
  const activeCategoriesCount = useMemo(() => {
    return categories.filter((c) => {
      const prods = productsByCategory[c.name.toLowerCase()] || [];
      return prods.length > 0;
    }).length;
  }, [categories, productsByCategory]);

  const activePercentage = useMemo(() => {
    if (categories.length === 0) return 100;
    return Math.round((activeCategoriesCount / categories.length) * 100);
  }, [activeCategoriesCount, categories]);

  const toggleExpand = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Upload image to Cloudinary for Category
  const handleCatImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingCat(true);
    const toastId = toast.loading("Uploading category banner to Cloudinary...");

    try {
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        if (isEdit) {
          setEditCatImage(data.url);
        } else {
          setNewCatImage(data.url);
        }
        toast.success("Image uploaded successfully!", { id: toastId });
      } else {
        toast.error("Upload failed", { id: toastId });
      }
    } catch {
      toast.error("Error uploading image", { id: toastId });
    } finally {
      setIsUploadingCat(false);
      e.target.value = "";
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const toastId = toast.loading("Creating category...");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
          image: newCatImage.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Category added successfully!", { id: toastId });
        setNewCatName("");
        setNewCatDesc("");
        setNewCatImage("");
        loadData();
      } else {
        toast.error("Failed to add category", { id: toastId });
      }
    } catch {
      toast.error("Error creating category", { id: toastId });
    }
  };

  // Open Edit Category
  const openEditCategory = (c: ICategory) => {
    setEditingCategory(c);
    setEditCatName(c.name);
    setEditCatDesc(c.description || "");
    setEditCatImage(c.image || "");
  };

  // Save Edit Category
  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;

    const id = editingCategory._id || editingCategory.slug;
    const toastId = toast.loading("Updating category...");
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCatName.trim(),
          description: editCatDesc.trim(),
          image: editCatImage.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Category updated!", { id: toastId });
        setEditingCategory(null);
        loadData();
      } else {
        toast.error("Failed to update category", { id: toastId });
      }
    } catch {
      toast.error("Error saving category", { id: toastId });
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove category "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category deleted");
        loadData();
      }
    } catch {
      toast.error("Error deleting category");
    }
  };

  // Add Brand
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBrandName.trim(),
          tagline: newBrandDesc.trim(),
          description: newBrandDesc.trim(),
        }),
      });
      if (res.ok) {
        toast.success("Brand added!");
        setNewBrandName("");
        setNewBrandDesc("");
        loadData();
      } else {
        toast.error("Failed to add brand");
      }
    } catch {
      toast.error("Failed to add brand");
    }
  };

  // Open Edit Brand
  const openEditBrand = (b: IBrand) => {
    setEditingBrand(b);
    setEditBrandName(b.name);
    setEditBrandTagline(b.tagline || "");
    setEditBrandDesc(b.description || "");
  };

  // Save Edit Brand
  const handleSaveEditBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editBrandName.trim()) return;

    const id = editingBrand._id || editingBrand.slug;
    const toastId = toast.loading("Updating brand...");
    try {
      const res = await fetch(`/api/brands/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editBrandName.trim(),
          tagline: editBrandTagline.trim(),
          description: editBrandDesc.trim(),
        }),
      });
      if (res.ok) {
        toast.success("Brand updated!", { id: toastId });
        setEditingBrand(null);
        loadData();
      } else {
        toast.error("Failed to update brand", { id: toastId });
      }
    } catch {
      toast.error("Error saving brand", { id: toastId });
    }
  };

  // Delete Brand
  const handleDeleteBrand = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove brand "${name}"?`)) return;
    try {
      const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Brand deleted");
        loadData();
      }
    } catch {
      toast.error("Error deleting brand");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Outer White Card Container matching Product & Order Management */}
      <div className="bg-white border border-neutral-200/90 rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 shadow-xs space-y-6">
        {/* 1. Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-center text-neutral-900 shrink-0">
              <Layers className="w-5 h-5 text-neutral-800" />
            </div>
            <div className="border-l-3 border-amber-500 pl-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
                Category &amp; Taxonomy Management
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                Organize products by category, inspect products inside each category, and manage official brands.
              </p>
            </div>
          </div>

          <Link
            href="/admin/products"
            className="bg-neutral-900 text-white hover:bg-neutral-800 px-5 py-2.5 rounded-full text-xs font-bold transition-colors flex items-center gap-2 self-start md:self-auto shadow-xs"
          >
            <Package className="w-4 h-4" />
            <span>All Products ({products.length})</span>
          </Link>
        </div>

        {/* 2. Four KPI Bento Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative">
          {/* Card 1: Total Categories */}
          <div className="bg-gradient-to-r from-amber-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  Total Categories
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {categories.length}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    +2 this month
                  </span>
                </div>
              </div>
            </div>
            <StatWave color="#10b981" />
          </div>

          {/* Card 2: Official Brands */}
          <div className="bg-gradient-to-r from-purple-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  Official Brands
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {brands.length}
                  </span>
                </div>
              </div>
            </div>
            <StatWave color="#a855f7" />
          </div>

          {/* Card 3: Total Products */}
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
                    {products.length}
                  </span>
                </div>
              </div>
            </div>
            <StatWave color="#3b82f6" />
          </div>

          {/* Card 4: Categories with Products */}
          <div className="bg-gradient-to-r from-emerald-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">
                  Categories with Products
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {activeCategoriesCount}/{categories.length}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    {activePercentage}%
                  </span>
                </div>
              </div>
            </div>
            <StatWave color="#10b981" />
          </div>
        </div>

        {/* 3. Main Two-Column Layout: Categories on Left, Official Brands on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Categories (Span 7) */}
          <div className="lg:col-span-7 bg-white border border-neutral-200/80 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xs space-y-5">
            {/* Categories Section Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200/60 flex items-center justify-center text-neutral-900 shrink-0">
                  <Folder className="w-4 h-4 text-neutral-800" />
                </div>
                <div>
                  <h2 className="text-base font-black text-neutral-900">
                    Categories ({categories.length})
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5 font-normal">
                    Click any category below to inspect and manage the products inside it.
                  </p>
                </div>
              </div>

              <a
                href="#create-category-box"
                className="bg-neutral-900 text-white hover:bg-neutral-800 px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Category</span>
              </a>
            </div>

            {/* Create Category Form (Amber Soft Box) */}
            <form
              id="create-category-box"
              onSubmit={handleAddCategory}
              className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4 sm:p-5 space-y-3"
            >
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                <Plus className="w-3.5 h-3.5 text-amber-700" />
                <span>Create New Category</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Category Name (e.g. Resort Wear)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-white border border-neutral-200/90 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-900 font-medium"
                />
                <input
                  type="text"
                  placeholder="Short Description..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-white border border-neutral-200/90 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-900 font-medium"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <ImageIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Optional Banner / Thumbnail URL (or upload to Cloudinary)..."
                    value={newCatImage}
                    onChange={(e) => setNewCatImage(e.target.value)}
                    className="w-full bg-white border border-neutral-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-900 font-medium"
                  />
                </div>

                <label className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-xl px-4 py-2.5 cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingCat ? "Uploading..." : "Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingCat}
                    onChange={(e) => handleCatImageUpload(e, false)}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  className="bg-neutral-900 text-white hover:bg-neutral-800 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer whitespace-nowrap"
                >
                  Create Category
                </button>
              </div>
            </form>

            {/* Categories List with Accordion */}
            <div className="space-y-2.5">
              {loading ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  No categories created yet.
                </div>
              ) : (
                categories.map((c) => {
                  const catId = c._id || c.slug;
                  const catProducts = productsByCategory[c.name.toLowerCase()] || [];
                  const isExpanded = Boolean(expandedCategories[catId]);

                  return (
                    <div
                      key={catId}
                      className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden hover:border-neutral-300 transition-all shadow-2xs"
                    >
                      {/* Main Category Row */}
                      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                        <div
                          className="flex items-center gap-3.5 min-w-0 cursor-pointer flex-1"
                          onClick={() => toggleExpand(catId)}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-neutral-100 overflow-hidden relative shrink-0 border border-neutral-200/70">
                            {c.image ? (
                              <Image
                                src={c.image}
                                alt={c.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                <Layers className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-900 font-bold text-sm truncate">
                                {c.name}
                              </span>
                              <span className="bg-neutral-100 text-neutral-600 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                                {catProducts.length} items
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5 truncate font-normal">
                              {c.description || "Clothing & Apparel"}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleExpand(catId)}
                            className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <span>{isExpanded ? "Hide Items" : "View Items"}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditCategory(c)}
                            className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 shadow-2xs transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(catId, c.name)}
                            className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-rose-50 flex items-center justify-center text-neutral-600 hover:text-rose-600 shadow-2xs transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Accordion Content: Products inside category */}
                      {isExpanded && (
                        <div className="border-t border-neutral-100 bg-neutral-50/70 p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-neutral-700 uppercase tracking-wider text-[11px]">
                              Products in &quot;{c.name}&quot; ({catProducts.length})
                            </span>
                            <Link
                              href="/admin/products"
                              className="text-neutral-900 hover:underline text-[11px] font-bold flex items-center gap-1"
                            >
                              <span>Manage in Products catalog</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>

                          {catProducts.length === 0 ? (
                            <div className="text-center py-6 bg-white rounded-xl border border-neutral-200/70 text-neutral-400 text-xs">
                              <p>No products currently added to this category.</p>
                              <Link
                                href="/admin/products"
                                className="inline-block mt-2 px-3.5 py-1.5 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 font-bold text-[11px] shadow-xs"
                              >
                                + Add product to {c.name}
                              </Link>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {catProducts.map((p) => (
                                <div
                                  key={p._id || p.sku}
                                  className="bg-white p-2.5 rounded-xl border border-neutral-200/70 flex items-center justify-between gap-3 text-xs shadow-2xs"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-12 rounded-lg bg-neutral-100 overflow-hidden relative shrink-0 border border-neutral-200">
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
                                    <div className="min-w-0">
                                      <strong className="text-neutral-900 block font-bold truncate">
                                        {p.name}
                                      </strong>
                                      <span className="text-[10px] text-neutral-500 block">
                                        Rs. {p.price.toLocaleString()} • {p.stock} units
                                      </span>
                                    </div>
                                  </div>

                                  <Link
                                    href={`/product/${p.slug}`}
                                    target="_blank"
                                    className="p-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-600 hover:text-black shrink-0"
                                    title="View Live"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Official Brands (Span 5) */}
          <div className="lg:col-span-5 bg-white border border-neutral-200/80 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xs space-y-5">
            {/* Brands Section Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200/60 flex items-center justify-center text-neutral-900 shrink-0">
                <Tag className="w-4 h-4 text-neutral-800" />
              </div>
              <div>
                <h2 className="text-base font-black text-neutral-900">
                  Official Brands ({brands.length})
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5 font-normal">
                  Licensed brand identities for storefront tagging.
                </p>
              </div>
            </div>

            {/* Add Brand Form (Amber Soft Box) */}
            <form
              onSubmit={handleAddBrand}
              className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4 sm:p-5 space-y-3"
            >
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                <Plus className="w-3.5 h-3.5 text-amber-700" />
                <span>Add New Brand</span>
              </div>

              <input
                type="text"
                required
                placeholder="Brand Name (e.g. Breakwater)"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className="w-full bg-white border border-neutral-200/90 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-900 font-medium"
              />

              <input
                type="text"
                placeholder="Tagline or Description..."
                value={newBrandDesc}
                onChange={(e) => setNewBrandDesc(e.target.value)}
                className="w-full bg-white border border-neutral-200/90 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-900 font-medium"
              />

              <button
                type="submit"
                className="w-full bg-neutral-900 text-white hover:bg-neutral-800 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer text-center"
              >
                Add Brand
              </button>
            </form>

            {/* Brands List */}
            <div className="space-y-2.5">
              {loading ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  Loading brands...
                </div>
              ) : brands.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  No brands created yet.
                </div>
              ) : (
                brands.map((b) => {
                  const brandId = b._id || b.slug;
                  const brandProducts = productsByBrand[b.name.toLowerCase()] || [];

                  return (
                    <div
                      key={brandId}
                      className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:border-neutral-300 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                          <BrandLogoIcon name={b.name} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-900 font-bold text-sm truncate">
                              {b.name}
                            </span>
                            <span className="bg-neutral-100 text-neutral-600 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                              {brandProducts.length} items
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5 truncate font-normal">
                            {b.tagline || b.description || "Official brand store"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditBrand(b)}
                          className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 shadow-2xs transition-colors cursor-pointer"
                          title="Edit Brand"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBrand(brandId, b.name)}
                          className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-rose-50 flex items-center justify-center text-neutral-600 hover:text-rose-600 shadow-2xs transition-colors cursor-pointer"
                          title="Delete Brand"
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

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-2xl text-neutral-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                Edit Category: {editingCategory.name}
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCategory} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Banner / Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editCatImage}
                    onChange={(e) => setEditCatImage(e.target.value)}
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 text-xs focus:outline-hidden focus:border-black"
                  />
                  <label className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 px-3 py-2.5 rounded-xl cursor-pointer text-xs font-bold flex items-center gap-1 shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCatImageUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-neutral-100 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
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

      {/* Edit Brand Modal */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-2xl text-neutral-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                Edit Brand: {editingBrand.name}
              </h3>
              <button
                onClick={() => setEditingBrand(null)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBrand} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={editBrandName}
                  onChange={(e) => setEditBrandName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={editBrandTagline}
                  onChange={(e) => setEditBrandTagline(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editBrandDesc}
                  onChange={(e) => setEditBrandDesc(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-neutral-100 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
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
