"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Upload,
  ExternalLink,
  Layers,
  Sparkles,
  Check,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Grid,
  List,
  FolderTree,
  Eye,
  Star,
  Package,
  Tag,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { IProduct, ICategory, IBrand, IProductImage, IProductColor } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "Free Size", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10"];
const PRESET_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy Blue", hex: "#1e3a8a" },
  { name: "Ash Grey", hex: "#6b7280" },
  { name: "Olive Green", hex: "#3f6212" },
  { name: "Beige", hex: "#d4b895" },
  { name: "Burgundy", hex: "#831843" },
];

const getCategoryIcon = (catName: string) => {
  const lower = catName.toLowerCase();
  if (lower.includes("women")) return "♀";
  if (lower.includes("men") && !lower.includes("women")) return "♂";
  if (lower.includes("kid")) return "👶";
  if (lower.includes("unisex")) return "👕";
  if (lower.includes("health")) return "💚";
  if (lower.includes("clothing") || lower.includes("apparel")) return "👔";
  if (lower.includes("bag")) return "👜";
  if (lower.includes("shoe") || lower.includes("footwear")) return "👟";
  return "🏷️";
};

const getCategoryBadgeStyle = (catName: string) => {
  const lower = catName.toLowerCase();
  if (lower.includes("health")) {
    return { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: "💚" };
  }
  if (lower.includes("men") && !lower.includes("women")) {
    return { bg: "bg-sky-50 text-sky-700 border-sky-100", icon: "💙" };
  }
  if (lower.includes("bag")) {
    return { bg: "bg-purple-50 text-purple-700 border-purple-100", icon: "💜" };
  }
  if (lower.includes("women")) {
    return { bg: "bg-rose-50 text-rose-700 border-rose-100", icon: "💖" };
  }
  if (lower.includes("kid")) {
    return { bg: "bg-amber-50 text-amber-700 border-amber-100", icon: "💛" };
  }
  return { bg: "bg-neutral-100 text-neutral-700 border-neutral-200", icon: "🏷️" };
};

export default function AdminProductsPage() {
  const { user } = useAuth();
  const isBrandManager = user?.role === "brand_manager" || user?.role === "vendor";
  const brandSlug = user?.brandSlug || "";

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"table" | "grouped" | "grid">("table");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "media" | "pricing" | "variants">("basic");

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  // Media
  const [images, setImages] = useState<IProductImage[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Pricing & Stock
  const [price, setPrice] = useState<number | "">("");
  const [originalPrice, setOriginalPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");

  // Variants & Features
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [colors, setColors] = useState<IProductColor[]>([]);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

  const [isVirtualTryOn, setIsVirtualTryOn] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Products, Categories & Brands
  const loadAll = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch("/api/products?limit=200&includeInactive=true"),
        fetch("/api/categories"),
        fetch("/api/brands"),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      const brandData = await brandRes.json();

      setProducts(prodData.products || []);
      setCategories(catData || []);
      setBrands(brandData || []);
    } catch (e) {
      console.error("Failed to load admin catalog:", e);
      toast.error("Failed to load catalog data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Category counts map
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || "Uncategorized";
      counts[cat.toLowerCase()] = (counts[cat.toLowerCase()] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Distinct category list from categories API + any found in products
  const categoryTabs = useMemo(() => {
    const defaultOrder = ["Women", "Men", "Kids", "Unisex", "Health", "Clothing", "Bags"];
    const set = new Set<string>();
    defaultOrder.forEach((c) => set.add(c));
    categories.forEach((c) => set.add(c.name));
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [categories, products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // If logged in as Brand Manager, strictly only show their brand's products
        if (isBrandManager && brandSlug) {
          if (p.brand.toLowerCase() !== brandSlug.toLowerCase()) {
            return false;
          }
        }
        const matchesSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.brand.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
          selectedCategory === "all" ||
          p.category.toLowerCase() === selectedCategory.toLowerCase();

        const matchesStock =
          stockFilter === "all" ||
          (stockFilter === "in_stock" && p.stock > 5) ||
          (stockFilter === "low_stock" && p.stock > 0 && p.stock <= 5) ||
          (stockFilter === "out_of_stock" && p.stock <= 0);

        const matchesBrand =
          selectedBrand === "all" ||
          p.brand.toLowerCase() === selectedBrand.toLowerCase();

        return matchesSearch && matchesCategory && matchesStock && matchesBrand;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "stock_asc") return a.stock - b.stock;
        if (sortBy === "name_asc") return a.name.localeCompare(b.name);
        // Default newest
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [products, search, selectedCategory, selectedBrand, stockFilter, sortBy, isBrandManager, brandSlug]);

  // Grouped by Category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, IProduct[]> = {};
    filteredProducts.forEach((p) => {
      const cat = p.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [filteredProducts]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Bulk selection logic
  const isAllSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedProductIds.includes(p._id || p.sku));

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
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Create Modal
  const openCreateModal = (prefillCategory?: string) => {
    setEditingProduct(null);
    setActiveTab("basic");
    setName("");
    setSlug("");
    setSku("");
    setBrand(isBrandManager && brandSlug ? brandSlug.toUpperCase() : "");
    setCategory(prefillCategory || "");
    setSubcategory("");
    setShortDescription("");
    setDescription("");
    setImages([]);
    setImageUrlInput("");
    setPrice("");
    setOriginalPrice("");
    setCostPrice("");
    setStock("");
    setSelectedSizes([]);
    setColors([]);
    setIsVirtualTryOn(false);
    setIsFeatured(false);
    setIsBestseller(false);
    setIsNewArrival(false);
    setIsActive(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: IProduct) => {
    setEditingProduct(p);
    setActiveTab("basic");
    setName(p.name);
    setSlug(p.slug);
    setSku(p.sku);
    setBrand(p.brand);
    setCategory(p.category);
    setSubcategory(p.subcategory || "");
    setShortDescription(p.shortDescription || "");
    setDescription(p.description);
    setImages(p.images && p.images.length > 0 ? p.images : []);
    setImageUrlInput("");
    setPrice(p.price);
    setOriginalPrice(p.originalPrice !== undefined ? p.originalPrice : "");
    setCostPrice(p.costPrice !== undefined ? p.costPrice : "");
    setStock(p.stock !== undefined ? p.stock : 0);
    setSelectedSizes(p.sizes && p.sizes.length > 0 ? p.sizes : ["Free Size"]);
    setColors(p.colors && p.colors.length > 0 ? p.colors : [{ name: "Standard", hex: "#000000", inStock: true }]);
    setIsVirtualTryOn(Boolean(p.isVirtualTryOn));
    setIsFeatured(Boolean(p.isFeatured));
    setIsBestseller(Boolean(p.isBestseller));
    setIsNewArrival(Boolean(p.isNewArrival));
    setIsActive(p.isActive !== undefined ? p.isActive : true);
    setIsModalOpen(true);
  };

  // Cloudinary Direct Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    const toastId = toast.loading("Uploading image to Cloudinary...");

    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setImages((prev) => [...prev, { url: data.url, alt: name || "Product image" }]);
        toast.success("Image uploaded to Cloudinary!", { id: toastId });
      } else {
        toast.error(data.message || "Upload failed", { id: toastId });
      }
    } catch {
      toast.error("Network error during image upload", { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [...prev, { url: imageUrlInput.trim(), alt: name || "Product image" }]);
    setImageUrlInput("");
    toast.success("Image URL added to gallery");
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const clone = [...prev];
      const [item] = clone.splice(index, 1);
      clone.unshift(item);
      return clone;
    });
    toast.success("Primary cover image updated");
  };

  // Size toggles
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleAddCustomSize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSizeInput.trim()) return;
    if (!selectedSizes.includes(customSizeInput.trim())) {
      setSelectedSizes((prev) => [...prev, customSizeInput.trim()]);
    }
    setCustomSizeInput("");
  };

  // Color management
  const handleAddColor = () => {
    if (!newColorName.trim()) {
      toast.error("Please enter a color name");
      return;
    }
    setColors((prev) => [...prev, { name: newColorName.trim(), hex: newColorHex, inStock: true }]);
    setNewColorName("");
  };

  const handleRemoveColor = (idx: number) => {
    setColors((prev) => prev.filter((_, i) => i !== idx));
  };

  // Quick Stock Adjustment with Optimistic UI & Error Recovery
  const handleQuickStock = async (product: IProduct, delta: number) => {
    const prevStock = product.stock;
    const newStock = Math.max(0, prevStock + delta);
    if (newStock === prevStock) return;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) =>
        p._id === product._id || p.slug === product.slug ? { ...p, stock: newStock } : p
      )
    );

    try {
      const id = product._id || product.slug;
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      if (res.ok) {
        toast.success(`${product.name}: stock updated to ${newStock} units`);
      } else {
        // Revert on failure
        setProducts((prev) =>
          prev.map((p) =>
            p._id === product._id || p.slug === product.slug ? { ...p, stock: prevStock } : p
          )
        );
        const err = await res.json().catch(() => null);
        toast.error(err?.message || "Failed to update stock");
      }
    } catch {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id || p.slug === product.slug ? { ...p, stock: prevStock } : p
        )
      );
      toast.error("Network error while updating stock");
    }
  };

  // Toggle Active / Visibility Status with Optimistic UI & Error Recovery
  const handleToggleActive = async (product: IProduct) => {
    const prevStatus = product.isActive !== false;
    const newStatus = !prevStatus;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) =>
        p._id === product._id || p.slug === product.slug ? { ...p, isActive: newStatus } : p
      )
    );

    try {
      const id = product._id || product.slug;
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.ok) {
        toast.success(newStatus ? "Product published to storefront" : "Product hidden from storefront");
      } else {
        // Revert on failure
        setProducts((prev) =>
          prev.map((p) =>
            p._id === product._id || p.slug === product.slug ? { ...p, isActive: prevStatus } : p
          )
        );
        const err = await res.json().catch(() => null);
        toast.error(err?.message || "Failed to update product visibility");
      }
    } catch {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id || p.slug === product.slug ? { ...p, isActive: prevStatus } : p
        )
      );
      toast.error("Network error updating visibility");
    }
  };

  // Save Product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Product title is required");
      setActiveTab("basic");
      return;
    }
    if (!brand.trim()) {
      toast.error("Please select a brand");
      setActiveTab("basic");
      return;
    }
    if (!category.trim()) {
      toast.error("Please select a primary category");
      setActiveTab("basic");
      return;
    }
    if (price === "" || Number(price) <= 0) {
      toast.error("Valid selling price is required");
      setActiveTab("pricing");
      return;
    }
    if (stock === "" || Number(stock) < 0) {
      toast.error("Please enter available stock quantity");
      setActiveTab("pricing");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(editingProduct ? "Updating product..." : "Publishing new product...");

    try {
      const finalSku = sku.trim()
        ? sku.trim().toUpperCase()
        : `TBH-${Math.floor(10000 + Math.random() * 90000)}`;

      const payload: Partial<IProduct> = {
        name: name.trim(),
        sku: finalSku,
        brand: brand.trim(),
        category: category.trim(),
        subcategory: subcategory.trim(),
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        images:
          images.length > 0
            ? images
            : [
                {
                  url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
                  alt: name,
                },
              ],
        price: Number(price),
        originalPrice: originalPrice !== "" && Number(originalPrice) > 0 ? Number(originalPrice) : undefined,
        costPrice: costPrice !== "" && Number(costPrice) > 0 ? Number(costPrice) : undefined,
        stock: Number(stock) || 0,
        sizes: selectedSizes.length > 0 ? selectedSizes : ["Free Size"],
        colors: colors.length > 0 ? colors : [{ name: "Standard", hex: "#000000", inStock: true }],
        isVirtualTryOn,
        isFeatured,
        isBestseller,
        isNewArrival,
        isActive,
      };

      if (editingProduct) {
        const id = editingProduct._id || editingProduct.slug;
        const res = await fetch(`/api/products/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success("Product updated successfully!", { id: toastId });
          setIsModalOpen(false);
          loadAll();
        } else {
          toast.error("Failed to update product", { id: toastId });
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success("New product published to catalog!", { id: toastId });
          setIsModalOpen(false);
          loadAll();
        } else {
          toast.error("Failed to create product", { id: toastId });
        }
      }
    } catch {
      toast.error("Network error while saving product", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (product: IProduct) => {
    if (!confirm(`Are you sure you want to permanently delete "${product.name}"?`)) return;

    const id = product._id || product.slug;
    const toastId = toast.loading("Deleting product...");
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Product deleted successfully", { id: toastId });
        loadAll();
      } else {
        toast.error("Failed to delete product", { id: toastId });
      }
    } catch {
      toast.error("Error deleting product", { id: toastId });
    }
  };

  // Calculate discount %
  const discountPercent =
    originalPrice !== "" && price !== "" && Number(originalPrice) > Number(price)
      ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
      : 0;

  // Calculate profit margin
  const profit = (Number(price) || 0) - (Number(costPrice) || 0);
  const profitMargin = Number(price) > 0 ? Math.round((profit / Number(price)) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Brand Partner Scoped Notice Banner */}
      {isBrandManager && brandSlug && (
        <div className="bg-gradient-to-r from-amber-500/20 via-neutral-900 to-amber-500/10 border border-amber-500/40 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-2xl border border-amber-500/30 shrink-0">
              🏬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-black uppercase text-base tracking-wide">
                  {brandSlug.toUpperCase()} Partner Catalog Console
                </span>
                <span className="text-[10px] bg-amber-400 text-black font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Official Partner Scoped
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 max-w-2xl">
                You have exclusive authoring permissions for the official <strong>{brandSlug.toUpperCase()}</strong> collection. You can add new drops, adjust inventory, edit descriptions, and fine-tune your dedicated storefront.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link
              href={`/brand/${brandSlug.toLowerCase()}`}
              target="_blank"
              className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors border border-neutral-700"
            >
              <span>View Live Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </Link>
            <Link
              href="/admin/brand-customizer"
              className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Customize Storefront</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Container Card matching Image 1 */}
      <div className="bg-white border border-neutral-200/90 rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 shadow-xs space-y-6">
        {/* 1. Top Header with Squircle Icon & Orange Line */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-center text-neutral-900 shrink-0">
              <Package className="w-5 h-5 text-neutral-800" />
            </div>
            <div className="border-l-3 border-amber-500 pl-3">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900">
                {isBrandManager && brandSlug ? `${brandSlug.toUpperCase()} Products` : "Product Management"}
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                Easily add, edit descriptions, manage categories, and organize catalog stock.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {!isBrandManager && (
              <Link
                href="/admin/categories"
                className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/90 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <Layers className="w-4 h-4 text-neutral-600" />
                <span>Manage Categories</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="bg-black hover:bg-neutral-800 text-white px-5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* 2. KPI / Stat Summary Cards (Clean Bento Cards without photos) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Products */}
          <div className="bg-gradient-to-r from-blue-50/50 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">Total Products</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {products.length}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                    ↑ +12%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Categories */}
          <div className="bg-gradient-to-r from-indigo-50/50 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">Categories</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {categoryTabs.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Low Stock */}
          <div className="bg-gradient-to-r from-rose-50/50 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100/80 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">Low Stock</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {products.filter((p) => p.stock <= 5).length}
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-full">
                    ↓ -25%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Published */}
          <div className="bg-gradient-to-r from-emerald-50/50 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">Published</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {products.filter((p) => p.isActive !== false).length}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                    {products.length > 0 ? `${Math.round((products.filter((p) => p.isActive !== false).length / products.length) * 100)}%` : "100%"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Filter by Category Pills (Exact styling from Image 1) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-neutral-900 shrink-0 mr-1">Filter by Category:</span>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === "all"
                ? "bg-black text-white shadow-xs"
                : "bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200/90"
            }`}
          >
            <span>All Categories</span>
            <span className="text-[11px] font-mono opacity-80">({products.length})</span>
          </button>

          {categoryTabs.map((cat) => {
            const count = categoryCounts[cat.toLowerCase()] || 0;
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const icon = getCategoryIcon(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-black text-white shadow-xs"
                    : "bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200/90"
                }`}
              >
                <span>{icon} {cat}</span>
                <span className="text-[11px] font-mono opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* 4. Toolbar: Search Bar, Dropdowns with Aligned Arrows & View Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by title, SKU, brand, or tag..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-neutral-200 rounded-full pl-11 pr-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-900 font-medium shadow-2xs"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Brand Filter */}
            {isBrandManager && brandSlug ? (
              <div className="bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-full text-xs text-amber-800 font-bold uppercase flex items-center gap-1.5 shadow-2xs">
                <span>🏬 {brandSlug.toUpperCase()}</span>
              </div>
            ) : (
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white border border-neutral-200/90 text-neutral-800 text-xs font-semibold rounded-full pl-9 pr-8 py-2.5 shadow-2xs focus:outline-hidden focus:border-neutral-900 cursor-pointer"
                >
                  <option value="all">Brand: All Stores</option>
                  {brands.map((b) => (
                    <option key={b.slug} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Stock Filter */}
            <div className="relative">
              <Package className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-neutral-200/90 text-neutral-800 text-xs font-semibold rounded-full pl-9 pr-8 py-2.5 shadow-2xs focus:outline-hidden focus:border-neutral-900 cursor-pointer"
              >
                <option value="all">Stock: All</option>
                <option value="in_stock">In Stock (&gt; 5)</option>
                <option value="low_stock">Low Stock (1-5)</option>
                <option value="out_of_stock">Out of Stock (0)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-neutral-200/90 text-neutral-800 text-xs font-semibold rounded-full pl-9 pr-8 py-2.5 shadow-2xs focus:outline-hidden focus:border-neutral-900 cursor-pointer"
              >
                <option value="newest">Sort: Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="stock_asc">Stock: Low to High</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset Filter Button */}
            {(search || selectedCategory !== "all" || selectedBrand !== "all" || stockFilter !== "all" || sortBy !== "newest") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                  setSelectedBrand("all");
                  setStockFilter("all");
                  setSortBy("newest");
                  setCurrentPage(1);
                }}
                className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                title="Reset Filters"
              >
                <Filter className="w-4 h-4" />
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-neutral-200 rounded-full p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table View"
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  viewMode === "table" ? "bg-black text-white" : "text-neutral-400 hover:text-black"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grouped")}
                title="Grouped by Category"
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  viewMode === "grouped" ? "bg-black text-white" : "text-neutral-400 hover:text-black"
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid Cards"
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  viewMode === "grid" ? "bg-black text-white" : "text-neutral-400 hover:text-black"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>



      {/* Main Content Area based on View Mode */}
      {loading ? (
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-16 text-center text-neutral-500 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading TBH catalog products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-16 text-center text-neutral-500 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-3">
          <Package className="w-12 h-12 text-neutral-400 mx-auto" />
          <h3 className="text-base font-bold text-neutral-900">No products found</h3>
          <p className="text-xs max-w-sm mx-auto text-neutral-500">
            No items match your search or category filter. Try clearing filters or create a new product.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
              setStockFilter("all");
            }}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "grouped" ? (
        /* ================= GROUPED BY CATEGORY VIEW ================= */
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(([catName, prods]) => (
            <div
              key={catName}
              className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.03)]"
            >
              {/* Category Section Header */}
              <div className="bg-neutral-50/70 px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                    {catName}
                  </h3>
                  <span className="text-[11px] font-bold text-neutral-600 bg-neutral-200/70 px-2 py-0.5 rounded-full">
                    {prods.length} products
                  </span>
                </div>

                <button
                  onClick={() => openCreateModal(catName)}
                  className="text-xs font-bold text-white bg-black hover:bg-neutral-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to {catName}</span>
                </button>
              </div>

              {/* Products in this category */}
              <div className="divide-y divide-neutral-100">
                {prods.map((p) => (
                  <div
                    key={p._id || p.sku}
                    className="p-4 hover:bg-neutral-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-14 rounded-xl bg-neutral-100 overflow-hidden relative shrink-0 border border-neutral-200/80">
                        {p.images?.[0]?.url && (
                          <Image src={p.images[0].url} alt={p.name} fill className="object-cover" sizes="48px" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-neutral-900 text-xs font-bold truncate max-w-[280px]">
                            {p.name}
                          </strong>
                          {!p.isActive && (
                            <span className="text-[9px] font-bold bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-200">
                              Hidden
                            </span>
                          )}
                          {p.isVirtualTryOn && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              NeuralFit
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-1">
                          <span className="font-mono text-neutral-600">{p.sku}</span>
                          <span>•</span>
                          <span className="uppercase font-bold text-neutral-700">{p.brand}</span>
                          <span>•</span>
                          <span className="text-neutral-900 font-black">Rs. {p.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      {/* Quick Stock */}
                      <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-xl border border-neutral-200">
                        <button
                          onClick={() => handleQuickStock(p, -1)}
                          className="text-neutral-500 hover:text-black px-1 font-mono font-bold"
                          title="-1 Stock"
                        >
                          -
                        </button>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            p.stock <= 2
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {p.stock} in stock
                        </span>
                        <button
                          onClick={() => handleQuickStock(p, 1)}
                          className="text-neutral-500 hover:text-black px-1 font-mono font-bold"
                          title="+1 Stock"
                        >
                          +
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                          title="View on Storefront"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold flex items-center gap-1 text-xs transition-colors shadow-xs"
                          title="Edit Product"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === "grid" ? (
        /* ================= GRID CARD VIEW ================= */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedProducts.map((p) => (
              <div
                key={p._id || p.sku}
                className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all shadow-[0_2px_16px_rgba(0,0,0,0.03)] group"
              >
                <div>
                  <div className="aspect-4/5 bg-neutral-100 relative overflow-hidden">
                    {p.images?.[0]?.url && (
                      <Image
                        src={p.images[0].url}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                    )}
                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                      <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase shadow-xs">
                        {p.category}
                      </span>
                      {p.isVirtualTryOn && (
                        <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          NeuralFit™
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${
                          p.stock <= 2
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-white/95 text-emerald-700 border border-neutral-200"
                        }`}
                      >
                        {p.stock} units
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase font-mono">
                      <span className="font-bold text-neutral-600">{p.brand}</span>
                      <span>{p.sku}</span>
                    </div>
                    <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{p.name}</h4>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-black text-neutral-900">
                        Rs. {p.price.toLocaleString()}
                      </span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-[10px] text-neutral-400 line-through">
                          Rs. {p.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center gap-2 border-t border-neutral-100 mt-3 pt-3">
                  <Link
                    href={`/product/${p.slug}`}
                    target="_blank"
                    className="flex-1 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </Link>
                  <button
                    onClick={() => openEditModal(p)}
                    className="flex-1 py-2 rounded-xl bg-black text-white text-[11px] font-bold uppercase hover:bg-neutral-800 flex items-center justify-center gap-1 transition-colors shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-100 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-neutral-500 font-medium">
                Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} –{" "}
                {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} products
              </span>
              <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-neutral-200 rounded-lg px-2 py-0.5 text-xs text-neutral-800 font-bold focus:outline-hidden cursor-pointer shadow-2xs"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>per page</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                      isActive
                        ? "bg-black text-white shadow-xs"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= TABLE VIEW (Matching Image 1) ================= */
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="text-xs text-neutral-700 font-semibold border-b border-neutral-100">
                <tr>
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded-sm border-neutral-300 text-black focus:ring-black cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 font-semibold">Product</th>
                  <th className="py-3 px-3 font-semibold">SKU / Brand</th>
                  <th className="py-3 px-3 font-semibold">Category</th>
                  <th className="py-3 px-3 font-semibold">Price</th>
                  <th className="py-3 px-3 font-semibold">Stock</th>
                  <th className="py-3 px-3 font-semibold">Visibility</th>
                  <th className="py-3 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedProducts.map((p) => {
                  const id = p._id || p.sku;
                  const isSelected = selectedProductIds.includes(id);
                  const badge = getCategoryBadgeStyle(p.category || "Uncategorized");
                  const origPrice =
                    p.originalPrice && p.originalPrice > p.price
                      ? p.originalPrice
                      : Math.round(p.price * 1.2);

                  return (
                    <tr key={id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Checkbox */}
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(id)}
                          className="w-4 h-4 rounded-sm border-neutral-300 text-black focus:ring-black cursor-pointer"
                        />
                      </td>

                      {/* Product Thumbnail & Title with Featured Badge */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden relative shrink-0 border border-neutral-200/80">
                            {p.images?.[0]?.url && (
                              <img
                                src={p.images[0].url}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-neutral-900 block truncate max-w-[240px]">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              <span>Featured</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU / Brand */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-semibold text-neutral-800 block">
                          {p.sku}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-neutral-500">
                          {p.brand}
                        </span>
                      </td>

                      {/* Category with soft badge and icon */}
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 border ${badge.bg}`}>
                          <span>{badge.icon}</span>
                          <span>{p.category}</span>
                        </span>
                      </td>

                      {/* Price (Current & Strike-through original) */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-xs text-neutral-900">
                          Rs. {p.price.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-neutral-400 line-through">
                          Rs. {origPrice.toLocaleString()}
                        </div>
                      </td>

                      {/* Stock Stepper [ -  20  + ] */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-200/90 w-fit">
                          <button
                            type="button"
                            onClick={() => handleQuickStock(p, -1)}
                            className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-200/70 rounded-full font-mono text-sm cursor-pointer font-bold transition-colors"
                            title="Decrease stock"
                          >
                            -
                          </button>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold min-w-[28px] text-center ${
                              p.stock <= 0
                                ? "bg-rose-100 text-rose-800"
                                : p.stock <= 5
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {p.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStock(p, 1)}
                            className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-200/70 rounded-full font-mono text-sm cursor-pointer font-bold transition-colors"
                            title="Increase stock"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Visibility (Toggle Switch + Published text) */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className="flex items-center gap-2 cursor-pointer group"
                          title="Click to toggle store visibility"
                        >
                          <span
                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                              p.isActive !== false ? "bg-emerald-500" : "bg-neutral-300"
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                                p.isActive !== false ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              p.isActive !== false ? "text-neutral-900" : "text-neutral-400"
                            }`}
                          >
                            {p.isActive !== false ? "Published" : "Hidden"}
                          </span>
                        </button>
                      </td>

                      {/* Actions (ExternalLink, Edit, Trash) */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
                            title="View Live Product"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-100 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-neutral-500 font-medium">
                Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} –{" "}
                {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} products
              </span>
              <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-neutral-200 rounded-lg px-2 py-0.5 text-xs text-neutral-800 font-bold focus:outline-hidden cursor-pointer shadow-2xs"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>per page</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                      isActive
                        ? "bg-black text-white shadow-xs"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ================= ADD / EDIT PRODUCT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6">
          <div className="bg-white border border-neutral-200/90 rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl text-neutral-900 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* 1. FIXED TOP HEADER & NAVIGATION TABS */}
            <div className="px-6 sm:px-8 py-5 border-b border-neutral-100 shrink-0 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-neutral-900">
                    {editingProduct ? `Edit Product: ${editingProduct.name}` : "Create New Product"}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                    Fill in product details, upload images to Cloudinary, and configure options.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-neutral-400 hover:text-black p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-neutral-100 mt-4 overflow-x-auto pb-2 scrollbar-none">
                {[
                  { id: "basic", label: "1. Info & Category" },
                  { id: "media", label: `2. Cloudinary Images (${images.length})` },
                  { id: "pricing", label: "3. Pricing & Stock" },
                  { id: "variants", label: "4. Sizes, Colors & AI" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-black text-white shadow-xs"
                        : "text-neutral-500 hover:text-black hover:bg-neutral-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. FORM WRAPPER (flex-1 flex flex-col min-h-0 overflow-hidden) */}
            <form onSubmit={handleSaveProduct} className="flex flex-col min-h-0 flex-1 overflow-hidden">
              {/* 3. SCROLLABLE MIDDLE BODY CONTENT */}
              <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-5 text-xs">
                {/* TAB 1: BASIC INFO & CATEGORIES */}
                {activeTab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="font-bold text-neutral-700 block mb-1">Product Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Waves Poncho Ash – Flower"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-medium text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">SKU Code (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. TBH-10294"
                        value={sku}
                        onChange={(e) => setSku(e.target.value.toUpperCase())}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-mono uppercase text-xs"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-neutral-700 text-xs">Brand *</label>
                        {isBrandManager && (
                          <span className="text-[10px] text-amber-700 font-bold uppercase">
                            🔒 Partner Scoped
                          </span>
                        )}
                      </div>
                      <select
                        value={brand}
                        disabled={isBrandManager}
                        onChange={(e) => setBrand(e.target.value)}
                        className={`w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden text-xs uppercase ${
                          isBrandManager ? "opacity-60 cursor-not-allowed bg-neutral-100" : "cursor-pointer"
                        }`}
                      >
                        <option value="">-- Choose Brand --</option>
                        {brands.map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                        {["TBH", "WAVES", "ANSEL", "PARAKEET", "BREAKWATER"]
                          .filter((bName) => !brands.some((b) => b.name?.toUpperCase() === bName.toUpperCase()))
                          .map((bName) => (
                            <option key={bName} value={bName}>
                              {bName}
                            </option>
                          ))}
                      </select>
                      {isBrandManager && brandSlug && (
                        <p className="text-[10px] text-amber-400/90 mt-1">
                          Product will be permanently bound to your assigned brand: <strong>{brandSlug.toUpperCase()}</strong>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">Primary Category *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden cursor-pointer text-xs font-bold"
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                        {["Women", "Men", "Kids", "Unisex", "Health", "Clothing", "Bags"]
                          .filter((catName) => !categories.some((c) => c.name?.toLowerCase() === catName.toLowerCase()))
                          .map((catName) => (
                            <option key={catName} value={catName}>
                              {catName}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">Subcategory (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Footwear, Loafers, Dresses"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Short Tagline / Summary</label>
                    <input
                      type="text"
                      placeholder="e.g. Lightweight breathable cotton poncho with floral finish"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Full Detailed Description</label>
                    <textarea
                      rows={4}
                      placeholder="Enter fabric composition, fit, care instructions, and brand story..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden text-xs leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: CLOUDINARY IMAGES & GALLERY */}
              {activeTab === "media" && (
                <div className="space-y-4">
                  {/* Upload Box */}
                  <div className="border-2 border-dashed border-neutral-300 hover:border-black rounded-2xl p-6 text-center bg-neutral-50/70 transition-colors">
                    <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="font-bold text-neutral-900 text-xs mb-1">
                      Upload Product Images to Cloudinary
                    </p>
                    <p className="text-[11px] text-neutral-500 mb-3">
                      High resolution PNG, JPG, or WEBP. Uploads directly to your Cloudinary storage folder.
                    </p>

                    <label className="bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl cursor-pointer text-xs font-bold uppercase inline-flex items-center gap-1.5 transition-colors shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? "Uploading..." : "Select Image File"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Or Image URL Input */}
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Or Add via Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 text-xs focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                  {/* Gallery Thumbnails */}
                  <div>
                    <span className="font-bold text-neutral-700 block mb-2">
                      Current Gallery ({images.length} images) — Click star to set Cover Image
                    </span>

                    {images.length === 0 ? (
                      <p className="text-neutral-400 italic text-[11px]">No images uploaded yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            className={`group relative rounded-2xl overflow-hidden aspect-3/4 border-2 ${
                              idx === 0 ? "border-black" : "border-neutral-200"
                            } bg-neutral-100`}
                          >
                            <Image src={img.url} alt={`Image ${idx + 1}`} fill className="object-cover" sizes="120px" />

                            {/* Badge */}
                            {idx === 0 && (
                              <span className="absolute top-2 left-2 bg-black text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                                <Star className="w-2.5 h-2.5 fill-white text-white" />
                                Cover
                              </span>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {idx !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(idx)}
                                  className="p-1.5 rounded-lg bg-white text-black hover:bg-neutral-200"
                                  title="Make Primary Cover"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                                title="Remove Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PRICING & INVENTORY */}
              {activeTab === "pricing" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">Selling Price (Rs.) *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 2950"
                        value={price}
                        onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 font-bold text-xs focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">Original MRP (Rs.)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3500"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 text-xs focus:outline-hidden"
                      />
                      {discountPercent > 0 && (
                        <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                          Savings: {discountPercent}% OFF to customer
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="font-bold text-neutral-700 block mb-1">Cost Price (Admin Only)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1400"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 text-xs focus:outline-hidden"
                      />
                      {costPrice !== "" && Number(costPrice) > 0 && (
                        <span className="text-[10px] text-neutral-500 font-bold mt-1 block">
                          Profit: Rs. {profit.toLocaleString()} ({profitMargin}%)
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Available Stock Units *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 20"
                      value={stock}
                      onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 font-black text-sm focus:outline-hidden"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">
                      Items with stock ≤ 5 will trigger low stock warnings automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: SIZES, COLORS & FEATURES */}
              {activeTab === "variants" && (
                <div className="space-y-4">
                  {/* Sizes */}
                  <div>
                    <label className="font-bold text-neutral-700 block mb-2">Available Sizes</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {PRESET_SIZES.map((size) => {
                        const isChecked = selectedSizes.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                              isChecked
                                ? "bg-black text-white font-bold"
                                : "bg-neutral-100 text-neutral-600 hover:text-black border border-neutral-200"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>

                    {/* Add custom size */}
                    <div className="flex gap-2 max-w-xs">
                      <input
                        type="text"
                        placeholder="Add custom size..."
                        value={customSizeInput}
                        onChange={(e) => setCustomSizeInput(e.target.value)}
                        className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSize}
                        className="bg-black hover:bg-neutral-800 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="pt-2 border-t border-neutral-200">
                    <label className="font-bold text-neutral-700 block mb-2">Color Swatches</label>
                    {colors.length === 0 ? (
                      <p className="text-neutral-400 italic text-[11px] mb-3">No custom color swatches added yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {colors.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-xl text-xs"
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-neutral-300"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="text-neutral-900 font-medium">{c.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(i)}
                              className="text-neutral-400 hover:text-red-500 ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Navy Blue)"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-hidden w-44"
                      />
                      <button
                        type="button"
                        onClick={handleAddColor}
                        className="bg-black hover:bg-neutral-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                      >
                        + Add Color
                      </button>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="pt-4 border-t border-neutral-200 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                      <input
                        type="checkbox"
                        checked={isVirtualTryOn}
                        onChange={(e) => setIsVirtualTryOn(e.target.checked)}
                        className="accent-black w-4 h-4 rounded"
                      />
                      <div>
                        <span className="font-bold text-neutral-900 block">Enable NeuralFit™ AI Virtual Try-On</span>
                        <span className="text-[10px] text-neutral-500">
                          Allows shoppers to fit this garment in the interactive 3D virtual studio.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="accent-black w-4 h-4 rounded"
                      />
                      <div>
                        <span className="font-bold text-neutral-900 block">Featured on Homepage</span>
                        <span className="text-[10px] text-neutral-500">
                          Highlights product in the &apos;Must Have&apos; homepage section.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="accent-black w-4 h-4 rounded"
                      />
                      <div>
                        <span className="font-bold text-neutral-900 block">Visible in Storefront (Published)</span>
                        <span className="text-[10px] text-neutral-500">
                          Uncheck if you want to keep this item as a draft.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              </div>

              {/* 4. FIXED BOTTOM FOOTER (shrink-0) */}
              <div className="px-6 sm:px-8 py-4 border-t border-neutral-100 bg-neutral-50/80 shrink-0 flex items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-700 font-bold uppercase hover:bg-neutral-100 transition-colors cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {activeTab !== "basic" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === "media") setActiveTab("basic");
                        if (activeTab === "pricing") setActiveTab("media");
                        if (activeTab === "variants") setActiveTab("pricing");
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      Back
                    </button>
                  )}

                  {activeTab !== "variants" ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === "basic") setActiveTab("media");
                        if (activeTab === "media") setActiveTab("pricing");
                        if (activeTab === "pricing") setActiveTab("variants");
                      }}
                      className="px-5 py-2.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      Next Step →
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-black text-white font-bold uppercase hover:bg-neutral-800 transition-all disabled:opacity-50 shadow-md cursor-pointer"
                  >
                    {isSubmitting ? "Saving..." : editingProduct ? "Save Changes" : "Publish Product"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
