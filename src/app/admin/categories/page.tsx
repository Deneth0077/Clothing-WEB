"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Layers,
  Folder,
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
} from "lucide-react";
import { ICategory, IProduct } from "@/types";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Inspector & Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inspectingCategory, setInspectingCategory] = useState<ICategory | null>(null);

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products?limit=200&includeInactive=true"),
      ]);
      const cData = await cRes.json();
      const pData = await pRes.json();

      setCategories(cData || []);
      setProducts(pData.products || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load categories");
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
        setIsCreateModalOpen(false);
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
        if (inspectingCategory && (inspectingCategory._id === id || inspectingCategory.slug === id)) {
          setInspectingCategory(null);
        }
        loadData();
      }
    } catch {
      toast.error("Error deleting category");
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
                Organize products by category and inspect products inside each category.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            <Link
              href="/admin/products"
              className="bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 px-4 py-2.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Package className="w-4 h-4 text-neutral-600" />
              <span>All Products</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-black text-white hover:bg-neutral-800 px-5 py-2.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* 2. Three KPI Bento Stat Cards (No color curves) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Categories */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow">
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
          </div>

          {/* Card 2: Total Products */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow">
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
          </div>

          {/* Card 3: Categories with Products */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow">
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
          </div>
        </div>

        {/* 3. Categories Management Section (Card View Only) */}
        <div className="w-full bg-white border border-neutral-200/80 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xs space-y-5">
          {/* Categories Section Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200/60 flex items-center justify-center text-neutral-900 shrink-0">
              <Folder className="w-4 h-4 text-neutral-800" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900">
                Categories
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5 font-normal">
                Manage product categories, inspect products inside each category, and update banners.
              </p>
            </div>
          </div>

          {/* Categories Grid (Card View Only) */}
          {loading ? (
            <div className="text-center py-12 text-neutral-400 text-xs">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-neutral-400 text-xs">
              <Folder className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="font-semibold text-neutral-600">No categories created yet.</p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-3 px-4 py-2 rounded-full bg-black text-white hover:bg-neutral-800 font-bold text-xs cursor-pointer shadow-xs"
              >
                + Create First Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((c) => {
                const catId = c._id || c.slug;
                const catProducts = productsByCategory[c.name.toLowerCase()] || [];

                return (
                  <div
                    key={catId}
                    className="group bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div className="relative aspect-16/10 w-full bg-neutral-100 overflow-hidden border-b border-neutral-100">
                        {c.image ? (
                          <Image
                            src={c.image}
                            alt={c.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300 bg-neutral-50">
                            <Layers className="w-10 h-10" />
                          </div>
                        )}
                        <span className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                          {catProducts.length} items
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-1">
                        <h3 className="font-bold text-neutral-900 text-sm truncate">
                          {c.name}
                        </h3>
                        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed min-h-[32px]">
                          {c.description || "Clothing, apparel & lifestyle pieces"}
                        </p>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-4 pt-3 border-t border-neutral-100 mt-1 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectingCategory(c)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Package className="w-3.5 h-3.5 text-neutral-500" />
                        <span>View Items</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditCategory(c)}
                          className="w-8 h-8 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-black transition-colors cursor-pointer shadow-2xs"
                          title="Edit Category"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(catId, c.name)}
                          className="w-8 h-8 rounded-xl border border-neutral-200 bg-white hover:bg-rose-50 flex items-center justify-center text-neutral-600 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
                          title="Delete Category"
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
      </div>

      {/* Create Category Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-2xl text-neutral-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-900">
                  <Folder className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                  Create New Category
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-black cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Resort Wear"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description of items in this category..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black resize-none"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Banner / Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/... or upload"
                    value={newCatImage}
                    onChange={(e) => setNewCatImage(e.target.value)}
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 text-xs focus:outline-hidden focus:border-black"
                  />
                  <label className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 px-3.5 py-2.5 rounded-xl cursor-pointer text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs">
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
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-neutral-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-bold uppercase hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 font-bold uppercase cursor-pointer shadow-xs"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Category Products Modal */}
      {inspectingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-neutral-900 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900">
                  <Folder className="w-4 h-4 text-neutral-800" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900">
                    Products in &quot;{inspectingCategory.name}&quot;
                  </h3>
                  <span className="text-[11px] text-neutral-500 font-semibold">
                    {(productsByCategory[inspectingCategory.name.toLowerCase()] || []).length} catalog products
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingCategory(null)}
                className="text-neutral-400 hover:text-black cursor-pointer p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {(() => {
                const catProducts = productsByCategory[inspectingCategory.name.toLowerCase()] || [];
                if (catProducts.length === 0) {
                  return (
                    <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-neutral-400 text-xs">
                      <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                      <p className="font-semibold text-neutral-700">No products currently added to this category.</p>
                      <p className="text-[11px] text-neutral-400 mt-1">Assign this category when creating or editing a product in catalog.</p>
                      <Link
                        href="/admin/products"
                        className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 font-bold text-xs shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Go to Products Catalog</span>
                      </Link>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {catProducts.map((p) => (
                      <div
                        key={p._id || p.sku}
                        className="bg-neutral-50/80 p-3 rounded-2xl border border-neutral-200/80 flex items-center justify-between gap-3 text-xs shadow-2xs hover:border-neutral-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-14 rounded-xl bg-white overflow-hidden relative shrink-0 border border-neutral-200">
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
                          <div className="min-w-0">
                            <strong className="text-neutral-900 block font-bold truncate">
                              {p.name}
                            </strong>
                            <span className="text-[11px] font-semibold text-neutral-600 block mt-0.5">
                              Rs. {p.price.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-neutral-400 block font-mono">
                              SKU: {p.sku} • {p.stock} in stock
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="p-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-600 hover:text-black shrink-0 transition-colors"
                          title="View Live Product"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50/70 flex items-center justify-between gap-3 shrink-0 text-xs">
              <Link
                href="/admin/products"
                className="text-neutral-900 hover:underline font-bold flex items-center gap-1.5"
              >
                <span>Open in Products Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setInspectingCategory(null)}
                className="px-4 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
