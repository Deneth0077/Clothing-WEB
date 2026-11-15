"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  ShoppingBag,
  Package,
  CreditCard,
  Truck,
  CheckCircle2,
  Calendar,
  Download,
  Plus,
  Filter,
  Tag,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Loader2,
  Clock,
  Edit3,
  Trash2,
  Eye,
  User,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { IOrder, OrderStatus, PaymentStatus, IProduct } from "@/types";
import { toast } from "sonner";

// Customer avatar initials helper
const getInitials = (name?: string) => {
  if (!name) return "CU";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Customer avatar background color helper
const getAvatarColor = (name?: string) => {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Date and time formatter
const formatOrderDate = (dateVal?: string | Date) => {
  if (!dateVal) return { date: "11/15/2026", time: "09:31 AM" };
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return { date: "11/15/2026", time: "09:31 AM" };
  const dateStr = d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return { date: dateStr, time: timeStr };
};

// Date range matching helper (proper calendar boundaries in local time)
const matchesDateFilter = (createdAt: string | Date | undefined, range: string) => {
  if (range === "all") return true;
  if (!createdAt) return false;
  const orderDate = new Date(createdAt);
  if (isNaN(orderDate.getTime())) return false;

  const now = new Date();
  // Today boundaries: 00:00:00.000 to 23:59:59.999 local time
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (range === "today") {
    return orderDate >= startOfToday && orderDate <= endOfToday;
  }

  if (range === "week") {
    // Last 7 days: starting 6 days before today at 00:00:00 through end of today
    const startOf7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    return orderDate >= startOf7Days && orderDate <= endOfToday;
  }

  if (range === "month") {
    // This month: 1st of current month 00:00:00 through end of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return orderDate >= startOfMonth && orderDate <= endOfMonth;
  }

  return true;
};

// Fulfillment status badge styling
const getFulfillmentBadge = (status?: string) => {
  const s = (status || "pending").toLowerCase();
  if (s === "processing") {
    return {
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Loader2 className="w-3 h-3 animate-spin text-blue-600" />,
      label: "Processing",
    };
  }
  if (s === "confirmed") {
    return {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <Check className="w-3 h-3 text-emerald-600" />,
      label: "Confirmed",
    };
  }
  if (s === "delivered") {
    return {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
      label: "Delivered",
    };
  }
  if (s === "shipped") {
    return {
      bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: <Truck className="w-3 h-3 text-indigo-600" />,
      label: "Shipped",
    };
  }
  if (s === "cancelled") {
    return {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      icon: <X className="w-3 h-3 text-rose-600" />,
      label: "Cancelled",
    };
  }
  return {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock className="w-3 h-3 text-amber-600" />,
    label: "Pending",
  };
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");

  // Selection & Pagination (Default 15 orders per page)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Selected Order for Status Update Modal
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("processing");
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // View Details Modal State
  const [viewDetailsOrder, setViewDetailsOrder] = useState<IOrder | null>(null);

  // Quick Action Menu Popover per order (Portaled outside card to prevent scrollbars)
  const [mounted, setMounted] = useState(false);
  const [activeMenu, setActiveMenu] = useState<{
    order: IOrder;
    top: number;
    left: number;
    openUpward: boolean;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dismiss dropdown menu on click outside, scroll, or resize
  useEffect(() => {
    if (!activeMenu) return;
    const handleDismiss = () => setActiveMenu(null);
    window.addEventListener("click", handleDismiss);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    return () => {
      window.removeEventListener("click", handleDismiss);
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [activeMenu]);

  // Comprehensive Create Order Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createCustomerName, setCreateCustomerName] = useState("");
  const [createCustomerPhone, setCreateCustomerPhone] = useState("");
  const [createCustomerEmail, setCreateCustomerEmail] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createCity, setCreateCity] = useState("Colombo");
  const [createDistrict, setCreateDistrict] = useState("Colombo");
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState("");
  const [createItemName, setCreateItemName] = useState("");
  const [createItemPrice, setCreateItemPrice] = useState<number>(0);
  const [createQuantity, setCreateQuantity] = useState<number>(1);
  const [createShippingFee, setCreateShippingFee] = useState<number>(450);
  const [createPaymentMethod, setCreatePaymentMethod] = useState("cod");
  const [createPaymentStatus, setCreatePaymentStatus] = useState<PaymentStatus>("pending");
  const [createOrderStatus, setCreateOrderStatus] = useState<OrderStatus>("processing");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordRes, prodRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/products?limit=200"),
      ]);
      const ordData = await ordRes.json();
      const prodData = await prodRes.json();
      setOrders(Array.isArray(ordData) ? ordData : []);
      setProducts(prodData.products || []);
    } catch (e) {
      console.error("Failed to load orders", e);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const custName = o.customer?.name || "";
      const custPhone = o.customer?.phone || "";
      const orderNum = o.orderNumber || "";

      // 1. Search filter
      const matchesSearch =
        !search ||
        orderNum.toLowerCase().includes(search.toLowerCase()) ||
        custName.toLowerCase().includes(search.toLowerCase()) ||
        custPhone.includes(search) ||
        (o.items || []).some((i) => i.name.toLowerCase().includes(search.toLowerCase()));

      // 2. Fulfillment Status filter
      const matchesFulfillment =
        fulfillmentFilter === "all" ||
        (o.orderStatus || "").toLowerCase() === fulfillmentFilter.toLowerCase();

      // 3. Payment Method filter
      const matchesPaymentMethod =
        paymentMethodFilter === "all" ||
        (o.paymentMethod || "").toLowerCase().includes(paymentMethodFilter.toLowerCase());

      // 4. Payment Status ("All Statuses") filter
      const matchesPaymentStatus =
        paymentStatusFilter === "all" ||
        (o.paymentStatus || "").toLowerCase() === paymentStatusFilter.toLowerCase();

      // 5. Date Range filter (Today, Last 7 Days, This Month)
      const matchesDate = matchesDateFilter(o.createdAt, dateRange);

      return (
        matchesSearch &&
        matchesFulfillment &&
        matchesPaymentMethod &&
        matchesPaymentStatus &&
        matchesDate
      );
    });
  }, [orders, search, fulfillmentFilter, paymentMethodFilter, paymentStatusFilter, dateRange]);

  // Orders matching active date range (for KPI bento stat cards)
  const dateFilteredOrders = useMemo(() => {
    return orders.filter((o) => matchesDateFilter(o.createdAt, dateRange));
  }, [orders, dateRange]);

  // Stats calculation based on active date range
  const totalOrders = dateFilteredOrders.length;
  const totalItems = dateFilteredOrders.reduce(
    (sum, o) =>
      sum +
      (o.items?.reduce((s, i) => s + (i.quantity || 1), 0) || o.items?.length || 0),
    0
  );
  const totalAmount = dateFilteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const processingCount = dateFilteredOrders.filter((o) => o.orderStatus === "processing").length;
  const completedCount = dateFilteredOrders.filter(
    (o) => o.orderStatus === "delivered" || o.orderStatus === "confirmed"
  ).length;

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Selection
  const isAllSelected =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((o) =>
      selectedOrderIds.includes(o.orderNumber || o._id || "")
    );

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = paginatedOrders.map((o) => o.orderNumber || o._id || "");
      setSelectedOrderIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedOrders.map((o) => o.orderNumber || o._id || "");
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Open Status Modal
  const openStatusModal = (ord: IOrder) => {
    setSelectedOrder(ord);
    setNewStatus(ord.orderStatus);
    setNewPaymentStatus(ord.paymentStatus || "pending");
    setTrackingNumber(ord.trackingNumber || "");
    setInternalNotes(ord.internalNotes || "");
    setActiveMenu(null);
  };

  // Update Status
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdating(true);
    const toastId = toast.loading(`Updating order #${selectedOrder.orderNumber}...`);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus,
          trackingNumber,
          internalNotes,
        }),
      });

      if (res.ok) {
        toast.success(`Order #${selectedOrder.orderNumber} updated!`, { id: toastId });
        setSelectedOrder(null);
        loadData();
      } else {
        toast.error("Failed to update status", { id: toastId });
      }
    } catch {
      toast.error("Network error updating order", { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick One-Click Status Update (from ... menu)
  const handleQuickStatusUpdate = async (
    orderNumber: string,
    statusUpdates: { status?: OrderStatus; paymentStatus?: PaymentStatus }
  ) => {
    setActiveMenu(null);
    const toastId = toast.loading(`Updating ${orderNumber}...`);
    try {
      const res = await fetch(`/api/orders/${orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusUpdates),
      });
      if (res.ok) {
        toast.success(`Order #${orderNumber} updated!`, { id: toastId });
        loadData();
      } else {
        toast.error("Failed to update order", { id: toastId });
      }
    } catch {
      toast.error("Network error", { id: toastId });
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderNumber: string) => {
    setActiveMenu(null);
    if (!confirm(`Are you sure you want to permanently delete order #${orderNumber}?`)) {
      return;
    }
    const toastId = toast.loading(`Deleting order #${orderNumber}...`);
    try {
      const res = await fetch(`/api/orders/${orderNumber}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Order #${orderNumber} deleted`, { id: toastId });
        loadData();
      } else {
        toast.error("Failed to delete order", { id: toastId });
      }
    } catch {
      toast.error("Network error deleting order", { id: toastId });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const headers = [
      "Order Ref",
      "Date",
      "Customer Name",
      "Customer Phone",
      "Items Count",
      "Total Amount",
      "Payment Method",
      "Payment Status",
      "Fulfillment Status",
      "Tracking Number",
    ];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt || Date.now()).toISOString(),
      `"${o.customer?.name || ""}"`,
      `"${o.customer?.phone || ""}"`,
      o.items?.length || 0,
      o.total || 0,
      o.paymentMethod || "",
      o.paymentStatus || "",
      o.orderStatus || "",
      o.trackingNumber || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tbh_orders_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders CSV exported successfully!");
  };

  // Create Order Submit (Full CRUD)
  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCustomerName.trim() || !createCustomerPhone.trim()) {
      toast.error("Customer name and phone are required");
      return;
    }
    if (!createAddress.trim()) {
      toast.error("Delivery address is required");
      return;
    }
    if (!createItemName.trim()) {
      toast.error("Please choose a product or enter an item name");
      return;
    }
    if (createItemPrice <= 0) {
      toast.error("Please enter a valid unit price");
      return;
    }

    setIsCreatingOrder(true);
    const toastId = toast.loading("Creating new customer order...");
    try {
      const subtotal = createItemPrice * createQuantity;
      const total = subtotal + createShippingFee;

      const payload = {
        customer: {
          name: createCustomerName.trim(),
          phone: createCustomerPhone.trim(),
          email: createCustomerEmail.trim() || "customer@thebrandhub.lk",
        },
        shippingAddress: {
          street: createAddress.trim(),
          city: createCity.trim() || "Colombo",
          district: createDistrict.trim() || "Colombo",
          postalCode: "11500",
          country: "Sri Lanka",
        },
        items: [
          {
            name: createItemName.trim() || "Waves Lifestyle Collection Item",
            price: createItemPrice || 3400,
            quantity: createQuantity || 1,
            sku: `TBH-${Math.floor(100 + Math.random() * 900)}`,
            image:
              "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80",
          },
        ],
        subtotal,
        shippingFee: createShippingFee,
        discount: 0,
        total,
        paymentMethod: createPaymentMethod,
        paymentStatus: createPaymentStatus,
        orderStatus: createOrderStatus,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        toast.success(`Order #${created.orderNumber || "NEW"} created successfully!`, {
          id: toastId,
        });
        setIsCreateOpen(false);
        // Reset form
        setCreateCustomerName("");
        setCreateCustomerPhone("");
        setCreateCustomerEmail("");
        setCreateAddress("");
        setSelectedCatalogProduct("");
        setCreateItemName("");
        setCreateItemPrice(0);
        setCreateQuantity(1);
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to create order", { id: toastId });
      }
    } catch {
      toast.error("Network error creating order", { id: toastId });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Main Container Card */}
      <div className="bg-white border border-neutral-200/90 rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 shadow-xs space-y-6">
        {/* 1. Top Header (With squircle icon and orange vertical accent line) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-center text-neutral-900 shrink-0">
              <Calendar className="w-5 h-5 text-neutral-800" />
            </div>
            <div className="border-l-3 border-amber-500 pl-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
                Order Management
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                Review customer purchases, assign courier waybills, and update dispatch status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/90 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-neutral-600" />
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCatalogProduct("");
                setCreateItemName("");
                setCreateItemPrice(0);
                setIsCreateOpen(true);
              }}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Order</span>
            </button>
          </div>
        </div>

        {/* 2. 5 Stats / KPI Bento Cards (Clean cards WITHOUT color wave curves) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Total Orders */}
          <div className="bg-gradient-to-r from-emerald-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">Total Orders</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {totalOrders}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                    ↑ +100%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Total Items */}
          <div className="bg-gradient-to-r from-blue-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">Total Items</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {totalItems}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Total Amount */}
          <div className="bg-gradient-to-r from-orange-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">Total Amount</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-neutral-900 leading-none">
                    Rs. {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Processing */}
          <div className="bg-gradient-to-r from-amber-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">Processing</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {processingCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Completed */}
          <div className="bg-gradient-to-r from-emerald-50/40 via-white to-white border border-neutral-200/90 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block">Completed</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-neutral-900 leading-none">
                    {completedCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Toolbar: Search Input & Filter Dropdowns (Correctly aligned ChevronDown arrows) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order #, Customer Name, or Phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-neutral-200 rounded-full pl-11 pr-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-900 font-medium shadow-2xs"
            />
          </div>

          {/* Filters with Proper ChevronDown Alignment */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Range Dropdown */}
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-neutral-200/90 text-neutral-800 text-xs font-semibold rounded-full pl-9 pr-8 py-2.5 shadow-2xs focus:outline-hidden focus:border-neutral-900 cursor-pointer"
              >
                <option value="all">Date Range</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Fulfillment Status Dropdown */}
            <div className="relative">
              <Truck className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={fulfillmentFilter}
                onChange={(e) => {
                  setFulfillmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-neutral-200/90 text-neutral-800 text-xs font-semibold rounded-full pl-9 pr-8 py-2.5 shadow-2xs focus:outline-hidden focus:border-neutral-900 cursor-pointer"
              >
                <option value="all">Fulfillment Status</option>
                <option value="processing">Processing</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Payment Method Dropdown */}
            <div className="relative">
              <CreditCard className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={paymentMethodFilter}
                onChange={(e) => {
                  setPaymentMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-neutral-200/90 text-neutral-800 text-xs font-semibold rounded-full pl-9 pr-8 py-2.5 shadow-2xs focus:outline-hidden focus:border-neutral-900 cursor-pointer"
              >
                <option value="all">Payment Method</option>
                <option value="cod">Cash on Delivery (COD)</option>
                <option value="card">Online Card</option>
                <option value="koko">Koko / Mintpay</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* All Statuses (Payment Status) Dropdown */}
            <div className="relative">
              <Tag className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-neutral-200/90 text-neutral-800 text-xs font-semibold rounded-full pl-9 pr-8 py-2.5 shadow-2xs focus:outline-hidden focus:border-neutral-900 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter Reset Button */}
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDateRange("all");
                setFulfillmentFilter("all");
                setPaymentMethodFilter("all");
                setPaymentStatusFilter("all");
                setCurrentPage(1);
              }}
              className="p-2 rounded-full bg-white border border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
              title="Reset Filters"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4. Orders Table */}
        {loading ? (
          <div className="p-16 text-center text-neutral-500">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-neutral-500 space-y-3">
            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
            <h3 className="text-base font-bold text-neutral-900">No orders found</h3>
            <p className="text-xs max-w-sm mx-auto text-neutral-500">
              No customer orders matched your search or filter criteria. Try clearing filters or create a new order.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDateRange("all");
                setFulfillmentFilter("all");
                setPaymentMethodFilter("all");
                setPaymentStatusFilter("all");
              }}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-neutral-200/80 bg-white">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50/70 text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-200">
                  <tr>
                    <th className="py-3.5 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded accent-black cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 px-4 font-bold tracking-wider">ORDER REF</th>
                    <th className="py-3.5 px-4 font-bold tracking-wider">DATE</th>
                    <th className="py-3.5 px-4 font-bold tracking-wider">CUSTOMER</th>
                    <th className="py-3.5 px-4 font-bold tracking-wider">ITEMS</th>
                    <th className="py-3.5 px-4 font-bold tracking-wider">TOTAL AMOUNT</th>
                    <th className="py-3.5 px-4 font-bold tracking-wider">PAYMENT</th>
                    <th className="py-3.5 px-4 font-bold tracking-wider">FULFILLMENT STATUS</th>
                    <th className="py-3.5 pr-4 pl-2 text-right font-bold tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {paginatedOrders.map((o) => {
                    const id = o.orderNumber || o._id || "";
                    const isSelected = selectedOrderIds.includes(id);
                    const { date, time } = formatOrderDate(o.createdAt);
                    const badge = getFulfillmentBadge(o.orderStatus);
                    const isCod = (o.paymentMethod || "").toLowerCase().includes("cod");
                    const itemCount =
                      o.items?.reduce((s, i) => s + (i.quantity || 1), 0) ||
                      o.items?.length ||
                      1;
                    const itemNames = (o.items || [])
                      .map((i) => i.name)
                      .filter(Boolean)
                      .join(", ") || "Waves Lifestyle Item";
                    const isMenuOpen = activeMenu?.order.orderNumber === o.orderNumber;

                    return (
                      <tr
                        key={id}
                        className={`hover:bg-neutral-50/70 transition-colors ${
                          isSelected ? "bg-amber-50/20" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 pl-4 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOrder(id)}
                            className="w-3.5 h-3.5 rounded accent-black cursor-pointer"
                          />
                        </td>

                        {/* Order Ref */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-xs text-neutral-900 font-mono block">
                            {o.orderNumber || "TBH-ORDER"}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs text-neutral-800 font-medium">{date}</div>
                          <div className="text-[10px] text-neutral-400 font-normal">{time}</div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${getAvatarColor(
                                o.customer?.name
                              )}`}
                            >
                              {getInitials(o.customer?.name)}
                            </div>
                            <div className="min-w-0">
                              <strong className="text-xs font-bold text-neutral-900 block leading-tight truncate">
                                {o.customer?.name || "Customer"}
                              </strong>
                              <span className="text-[11px] text-neutral-500 font-medium block mt-0.5">
                                {o.customer?.phone || "+94 77 123 4567"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* ITEMS Column: NO PHOTOS, strictly Items Count & Names */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="text-xs font-bold text-neutral-900 block leading-tight">
                              {itemCount} {itemCount === 1 ? "item" : "items"}
                            </span>
                            <span className="text-[11px] text-neutral-500 block truncate max-w-[200px] font-normal mt-0.5">
                              {itemNames}
                            </span>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-xs text-neutral-900 font-mono">
                            Rs. {(o.total || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Payment */}
                        <td className="py-3.5 px-4">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  o.paymentStatus === "paid"
                                    ? "bg-emerald-500"
                                    : "bg-amber-500"
                                }`}
                              />
                              <span className="uppercase text-[11px]">
                                {isCod ? "COD" : o.paymentMethod || "Card"}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 ${
                                o.paymentStatus === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : "bg-amber-50 text-amber-700 border border-amber-200/60"
                              }`}
                            >
                              <Check className="w-2.5 h-2.5" />
                              <span>{o.paymentStatus === "paid" ? "Paid" : "Pending"}</span>
                            </span>
                          </div>
                        </td>

                        {/* Fulfillment Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border ${badge.bg}`}
                          >
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Actions (Update Button & More Menu) */}
                        <td className="py-3.5 pr-4 pl-2 text-right relative">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Update Button */}
                            <button
                              type="button"
                              onClick={() => openStatusModal(o)}
                              className="bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Update</span>
                            </button>

                            {/* More Options (...) Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isMenuOpen) {
                                  setActiveMenu(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const menuHeight = 220;
                                  const spaceBelow = window.innerHeight - rect.bottom;
                                  const openUpward = spaceBelow < menuHeight;
                                  setActiveMenu({
                                    order: o,
                                    top: openUpward ? rect.top - 6 : rect.bottom + 6,
                                    left: Math.max(12, rect.right - 180),
                                    openUpward,
                                  });
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isMenuOpen
                                  ? "bg-neutral-100 text-black"
                                  : "text-neutral-400 hover:text-black hover:bg-neutral-50"
                              }`}
                              title="More Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
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
                  Showing {filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} –{" "}
                  {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
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

      {/* ================= MODAL: UPDATE ORDER STATUS ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl text-neutral-900 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <form onSubmit={handleUpdateStatus} className="flex flex-col min-h-0 flex-1">
              {/* Fixed Header */}
              <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-neutral-100 shrink-0 bg-white">
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-neutral-900">
                    Update Order #{selectedOrder.orderNumber}
                  </h3>
                  <span className="text-[11px] text-neutral-500 block mt-0.5 font-medium">
                    Customer: {selectedOrder.customer?.name || "Customer"} (
                    {selectedOrder.customer?.phone || "N/A"})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-neutral-400 hover:text-black p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Fulfillment Status */}
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Fulfillment Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 font-bold focus:outline-hidden focus:border-black cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="returned">Returned</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Payment Status
                    </label>
                    <select
                      value={newPaymentStatus}
                      onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 font-bold focus:outline-hidden focus:border-black cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Courier Tracking / Waybill Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. PRONET-902148"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Internal Administrative Notes
                  </label>
                  <textarea
                    rows={2}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="e.g. Verified via WhatsApp call, packaging customized items..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black resize-none"
                  />
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-6 sm:px-8 py-4 border-t border-neutral-100 shrink-0 bg-white flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-3 rounded-2xl border border-neutral-200 text-neutral-700 font-bold uppercase hover:bg-neutral-100 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-3 rounded-2xl bg-neutral-900 text-white font-bold uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer shadow-xs text-xs"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW ORDER DETAILS ================= */}
      {viewDetailsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-neutral-900 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-black text-neutral-900">
                  Order #{viewDetailsOrder.orderNumber}
                </h3>
                <span className="text-xs text-neutral-500">
                  Placed on {formatOrderDate(viewDetailsOrder.createdAt).date} at{" "}
                  {formatOrderDate(viewDetailsOrder.createdAt).time}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailsOrder(null)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Address Details */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-800 font-bold">
                <User className="w-4 h-4 text-neutral-600" />
                <span>{viewDetailsOrder.customer?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <Phone className="w-4 h-4 text-neutral-400" />
                <span>{viewDetailsOrder.customer?.phone}</span>
                {viewDetailsOrder.customer?.email && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <span>{viewDetailsOrder.customer?.email}</span>
                  </>
                )}
              </div>
              <div className="flex items-start gap-2 text-neutral-600">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <span>
                  {viewDetailsOrder.shippingAddress?.street},{" "}
                  {viewDetailsOrder.shippingAddress?.city},{" "}
                  {viewDetailsOrder.shippingAddress?.district || "Sri Lanka"}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-neutral-900 block">
                Purchased Items ({viewDetailsOrder.items?.length || 0})
              </span>
              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden bg-white">
                {(viewDetailsOrder.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3">
                    <div>
                      <strong className="text-neutral-900 font-bold block">
                        {item.name}
                      </strong>
                      <span className="text-[11px] text-neutral-500">
                        Qty: {item.quantity || 1} • SKU: {item.sku || "N/A"}
                      </span>
                    </div>
                    <span className="font-bold text-neutral-900 font-mono">
                      Rs. {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="pt-2 border-t border-neutral-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-mono">Rs. {(viewDetailsOrder.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping Fee</span>
                <span className="font-mono">Rs. {(viewDetailsOrder.shippingFee || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-neutral-900 pt-1 border-t border-neutral-100">
                <span>Total Amount</span>
                <span className="font-mono text-base">Rs. {(viewDetailsOrder.total || 0).toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewDetailsOrder(null)}
              className="w-full py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE ORDER ================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl text-neutral-900 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <form onSubmit={handleCreateOrderSubmit} className="flex flex-col min-h-0 flex-1">
              {/* 1. FIXED TOP HEADER (Fixed on single screen) */}
              <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-neutral-100 shrink-0 bg-white">
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-neutral-900">
                    Create New Customer Order
                  </h3>
                  <span className="text-[11px] text-neutral-500 block mt-0.5 font-medium">
                    Manually book an offline or direct phone order into the TBH system.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-neutral-400 hover:text-black p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 2. SCROLLABLE MIDDLE FORM CONTENT (Scrollbar only between Header and Footer) */}
              <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-3.5 text-xs">
                {/* Customer Full Name */}
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createCustomerName}
                    onChange={(e) => setCreateCustomerName(e.target.value)}
                    placeholder="e.g. Kasun Jayawardena"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-medium"
                  />
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={createCustomerPhone}
                      onChange={(e) => setCreateCustomerPhone(e.target.value)}
                      placeholder="e.g. +94 77 123 4567"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={createCustomerEmail}
                      onChange={(e) => setCreateCustomerEmail(e.target.value)}
                      placeholder="e.g. kasun@example.com"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-medium"
                    />
                  </div>
                </div>

                {/* Delivery Address & City */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-neutral-700 block mb-1">
                      Delivery Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={createAddress}
                      onChange={(e) => setCreateAddress(e.target.value)}
                      placeholder="e.g. No. 45, Galle Road"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={createCity}
                      onChange={(e) => setCreateCity(e.target.value)}
                      placeholder="Colombo"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-medium"
                    />
                  </div>
                </div>

                {/* Product Catalog Picker / Custom Item */}
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Select Product from Catalog (or enter custom)
                  </label>
                  {products.length > 0 && (
                    <select
                      value={selectedCatalogProduct}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCatalogProduct(val);
                        if (!val) {
                          setCreateItemName("");
                          setCreateItemPrice(0);
                        } else {
                          const prod = products.find((p) => p.name === val);
                          if (prod) {
                            setCreateItemName(prod.name);
                            setCreateItemPrice(prod.price);
                          }
                        }
                      }}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-medium mb-2 cursor-pointer"
                    >
                      <option value="">-- Choose from available products --</option>
                      {products.map((p) => (
                        <option key={p._id || p.sku} value={p.name}>
                          {p.name} — Rs. {p.price.toLocaleString()} ({p.brand})
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    required
                    value={createItemName}
                    onChange={(e) => {
                      setCreateItemName(e.target.value);
                      if (selectedCatalogProduct && e.target.value !== selectedCatalogProduct) {
                        setSelectedCatalogProduct("");
                      }
                    }}
                    placeholder="Item name (select from dropdown above or enter custom)"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-medium"
                  />
                </div>

                {/* Unit Price & Quantity & Shipping Fee */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Unit Price (Rs) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={createItemPrice === 0 ? "" : createItemPrice}
                      onChange={(e) => setCreateItemPrice(Number(e.target.value) || 0)}
                      placeholder="e.g. 2950"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={createQuantity}
                      onChange={(e) => setCreateQuantity(Number(e.target.value))}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Shipping (Rs)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={createShippingFee}
                      onChange={(e) => setCreateShippingFee(Number(e.target.value))}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden focus:border-black font-mono font-medium"
                    />
                  </div>
                </div>

                {/* Payment Method & Initial Status */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Payment Method
                    </label>
                    <select
                      value={createPaymentMethod}
                      onChange={(e) => setCreatePaymentMethod(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 font-medium focus:outline-hidden focus:border-black cursor-pointer"
                    >
                      <option value="cod">Cash on Delivery (COD)</option>
                      <option value="card">Online Card</option>
                      <option value="koko">Koko / Mintpay</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Payment Status
                    </label>
                    <select
                      value={createPaymentStatus}
                      onChange={(e) => setCreatePaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 font-medium focus:outline-hidden focus:border-black cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Order Status
                    </label>
                    <select
                      value={createOrderStatus}
                      onChange={(e) => setCreateOrderStatus(e.target.value as OrderStatus)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 font-medium focus:outline-hidden focus:border-black cursor-pointer"
                    >
                      <option value="processing">Processing</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-700">Calculated Total</span>
                  <span className="font-black text-sm text-neutral-900 font-mono">
                    Rs. {(createItemPrice * createQuantity + createShippingFee).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 3. FIXED BOTTOM FOOTER (Fixed on single screen, always visible) */}
              <div className="px-6 sm:px-8 py-4 border-t border-neutral-100 shrink-0 bg-white flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-neutral-200 text-neutral-700 font-bold uppercase hover:bg-neutral-100 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOrder}
                  className="flex-1 py-3 rounded-2xl bg-neutral-900 text-white font-bold uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer shadow-xs text-xs"
                >
                  {isCreatingOrder ? "Creating..." : "Confirm & Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3-Dot Dropdown Action Menu (Portaled outside card & table to avoid any scrollbar clipping) */}
      {mounted && activeMenu && createPortal(
        <div
          style={{
            position: "fixed",
            top: activeMenu.openUpward ? undefined : `${activeMenu.top}px`,
            bottom: activeMenu.openUpward ? `${window.innerHeight - activeMenu.top}px` : undefined,
            left: `${activeMenu.left}px`,
            zIndex: 99999,
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-44 bg-white border border-neutral-200/90 rounded-2xl shadow-2xl p-1.5 text-left text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            type="button"
            onClick={() => {
              setViewDetailsOrder(activeMenu.order);
              setActiveMenu(null);
            }}
            className="w-full px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-neutral-500" />
            <span>View Details</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleQuickStatusUpdate(activeMenu.order.orderNumber, {
                status: "delivered",
                paymentStatus: "paid",
              });
              setActiveMenu(null);
            }}
            className="w-full px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark Delivered</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleQuickStatusUpdate(activeMenu.order.orderNumber, {
                status: "shipped",
              });
              setActiveMenu(null);
            }}
            className="w-full px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mark Shipped</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleQuickStatusUpdate(activeMenu.order.orderNumber, {
                paymentStatus: "paid",
              });
              setActiveMenu(null);
            }}
            className="w-full px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark Paid</span>
          </button>

          <div className="my-1 border-t border-neutral-100" />

          <button
            type="button"
            onClick={() => {
              const num = activeMenu.order.orderNumber;
              setActiveMenu(null);
              handleDeleteOrder(num);
            }}
            className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Delete Order</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
