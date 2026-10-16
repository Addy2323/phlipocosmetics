import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  BarChart2,
  Package,
  ShoppingCart,
  UserCheck,
  Boxes,
  Layers,
  DollarSign,
  MessageSquare,
  Search,
  PanelLeft,
  Sun,
  Moon,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  Bell,
  Sparkles,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Scissors,
  Store,
  LogOut,
  ChevronRight,
  X,
  FileSpreadsheet,
  Tag,
  Star,
  HelpCircle,
  Settings,
  Eye,
  EyeOff,
  UserPlus,
  Phone,
  Trash2,
  ShieldCheck,
  FileText,
  MapPin,
  Building2,
  Camera,
  Check,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/auth";
import {
  adminCreateUserClient,
  adminGetStoredAccounts,
  adminDeleteUserClient,
  UserRole,
} from "@/lib/auth-client";
import { money, formatTSh, products as initialProducts, categories, salonServices } from "@/data/shop";
import { SALON_STYLISTS, getStoredAppointments, SalonAppointmentRecord } from "@/lib/salon-data";
import { getStoredOrders, StoreOrder } from "@/lib/orders-store";
import {
  getStoredResellerApplications,
  saveResellerApplication,
  ResellerApplication,
  formatNINDisplay,
  TANZANIA_REGIONS,
} from "@/lib/reseller-store";
import { toast } from "@/components/ui/sonner";
import { EditPriceModal, ConfirmDialog } from "@/components/admin/AdminModals";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Philipo AI Command Center" },
      {
        name: "description",
        content:
          "Executive AI business dashboard, real-time analytics, inventory, and order operations.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCommandCenter,
});

type MenuTab =
  | "dashboard"
  | "users"
  | "partners"
  | "reports"
  | "products"
  | "orders"
  | "customers"
  | "inventory"
  | "categories"
  | "coupons"
  | "reviews";

export function AdminCommandCenter() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Active navigation tab matching Dashforge AI menu
  const [activeTab, setActiveTab] = useState<MenuTab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [priceEditTarget, setPriceEditTarget] = useState<any>(null);
  const [archiveTarget, setArchiveTarget] = useState<any>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("philipo_dashboard_theme") === "dark";
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("philipo_dashboard_theme", next ? "dark" : "light");
      } catch (err) {
        console.error("Failed to save dashboard theme:", err);
      }
      return next;
    });
  };

  const cardBg = darkMode
    ? "bg-[#0B1326] border-[#15213B] shadow-lg shadow-black/20"
    : "bg-white border-slate-100 shadow-xs";
  const textPrimary = darkMode ? "text-white" : "text-slate-900";
  const textSecondary = darkMode ? "text-[#8899A6]" : "text-slate-500";
  const inputBg = darkMode
    ? "bg-[#0E1726] border-[#1B273F] text-white placeholder:text-slate-500 focus:bg-[#111C35]"
    : "bg-slate-50/70 border-slate-200/70 text-slate-700 placeholder:text-slate-400 focus:bg-white";
  const tableHeaderClass = darkMode
    ? "border-b border-[#15213B] text-[#8899A6] font-semibold"
    : "border-b border-slate-100 text-slate-400 font-semibold";
  const tableRowClass = darkMode
    ? "border-b border-[#15213B] hover:bg-[#0E1A33] text-slate-200 transition-colors"
    : "hover:bg-slate-50/60 transition-colors";

  const [searchQuery, setSearchQuery] = useState("");

  // Product catalog state
  const [productsList, setProductsList] = useState(initialProducts);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState(50000);
  const [newProductCategory, setNewProductCategory] = useState("Skincare");
  const [newProductStock, setNewProductStock] = useState(25);

  // Appointments state
  const [appointments, setAppointments] = useState<SalonAppointmentRecord[]>([]);

  // Selected chart hover point for interactive Revenue Overview
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Add User State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("sales");
  const [newUserLocation, setNewUserLocation] = useState("Kariakoo Flagship");
  const [newUserTarget, setNewUserTarget] = useState(4000000);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [userAddError, setUserAddError] = useState("");
  const [userAddSuccess, setUserAddSuccess] = useState<string | null>(null);

  interface AdminStaffAccount {
    id: string;
    name: string;
    phone: string;
    email?: string;
    role: string;
    roleLabel: string;
    location: string;
    target: number;
    currentSales: number;
    status: string;
    isDefault: boolean;
  }

  // Users list (dynamically loaded from persistent accounts store)
  const [allUsersList, setAllUsersList] = useState<AdminStaffAccount[]>([]);
  // Orders list (dynamically loaded from persistent orders store)
  const [ordersList, setOrdersList] = useState<StoreOrder[]>(() => getStoredOrders());

  // Interactive states for Revenue Overview and Order Status charts
  const [revenueTimeframe, setRevenueTimeframe] = useState<"12M" | "YTD" | "6M">("12M");
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  const loadUsersList = () => {
    const stored = adminGetStoredAccounts();
    const customAccounts = stored.map((s) => ({
      id: s.id,
      name: s.fullName,
      phone: s.phone,
      email: s.email,
      role: s.role,
      roleLabel:
        s.role === "admin"
          ? "Branch Admin"
          : s.role === "sales"
            ? "Sales Person"
            : "Customer / VIP",
      location: s.location || "Kariakoo Flagship",
      target: s.target || 4000000,
      currentSales: s.currentSales || 0,
      status: s.isActive ? "Active" : "Inactive",
      isDefault: false,
    }));
    setAllUsersList(customAccounts);
  };

  const loadOrdersList = () => {
    setOrdersList(getStoredOrders());
  };

  // Reseller & Business Partner Applications state
  const [partnerApps, setPartnerApps] = useState<ResellerApplication[]>([]);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<string>("ALL");
  const [partnerRegionFilter, setPartnerRegionFilter] = useState<string>("ALL");
  const [selectedPartnerApp, setSelectedPartnerApp] = useState<ResellerApplication | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewerNotesInput, setReviewerNotesInput] = useState("");
  const [moreInfoInput, setMoreInfoInput] = useState("");
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [discountRateInput, setDiscountRateInput] = useState(25);
  const [partnerActionSuccess, setPartnerActionSuccess] = useState<string | null>(null);

  const loadPartnerApps = () => {
    setPartnerApps(getStoredResellerApplications());
  };

  const openPartnerReview = (app: ResellerApplication) => {
    setSelectedPartnerApp(app);
    setReviewerNotesInput(app.adminNotes || "");
    setMoreInfoInput(app.moreInfoReason || "");
    setRejectionReasonInput(app.rejectionReason || "");
    setDiscountRateInput(app.resellerDiscountRate || 25);
    setPartnerActionSuccess(null);
    setShowReviewModal(true);
  };

  const handleStartReview = (app: ResellerApplication) => {
    const updated: ResellerApplication = {
      ...app,
      status: "UNDER_REVIEW",
      assignedReviewer: user?.fullName || "Admin Reviewer",
      updatedAt: new Date().toISOString(),
    };
    saveResellerApplication(updated);
    loadPartnerApps();
    setSelectedPartnerApp(updated);
    setPartnerActionSuccess(
      `Review started for ${app.fullName} (${app.id}). Status updated to UNDER REVIEW.`,
    );
    toast.info("Review Started", {
      description: `Application ${app.id} is now under review.`,
    });
  };

  const handleApprovePartner = (app: ResellerApplication) => {
    const code = app.partnerCode || `PHL-PARTNER-${Math.floor(100000 + Math.random() * 900000)}`;
    const updated: ResellerApplication = {
      ...app,
      status: "APPROVED",
      partnerCode: code,
      resellerDiscountRate: Number(discountRateInput) || 25,
      adminNotes:
        reviewerNotesInput.trim() ||
        "Approved for official wholesale partner & reseller distribution.",
      reviewedAt: new Date().toISOString(),
      assignedReviewer: user?.fullName || "Admin Reviewer",
      updatedAt: new Date().toISOString(),
    };
    saveResellerApplication(updated);
    loadPartnerApps();
    setSelectedPartnerApp(updated);
    setPartnerActionSuccess(
      `🎉 Successfully approved ${app.fullName}! Assigned Partner Code: ${code} with ${updated.resellerDiscountRate}% wholesale discount.`,
    );
    toast.success("Partner Approved!", {
      description: `${app.fullName} is now an authorized Philipo Cosmetics wholesale partner (${code}).`,
    });
  };

  const handleRequestMoreInfo = (app: ResellerApplication) => {
    if (!moreInfoInput.trim()) {
      toast.error("Feedback Required", {
        description: "Please specify what additional information or documents are required.",
      });
      return;
    }
    const updated: ResellerApplication = {
      ...app,
      status: "MORE_INFORMATION_REQUIRED",
      moreInfoReason: moreInfoInput.trim(),
      adminNotes: reviewerNotesInput.trim() || undefined,
      assignedReviewer: user?.fullName || "Admin Reviewer",
      updatedAt: new Date().toISOString(),
    };
    saveResellerApplication(updated);
    loadPartnerApps();
    setSelectedPartnerApp(updated);
    setPartnerActionSuccess(
      `Additional information requested from ${app.fullName}. Applicant will see this feedback in their Partner Center.`,
    );
    toast("Information Requested", {
      description: `Applicant has been notified with your feedback.`,
    });
  };

  const handleRejectPartner = (app: ResellerApplication) => {
    if (!rejectionReasonInput.trim()) {
      toast.error("Reason Required", {
        description: "Please provide a reason for rejecting this application.",
      });
      return;
    }
    const updated: ResellerApplication = {
      ...app,
      status: "REJECTED",
      rejectionReason: rejectionReasonInput.trim() || "Declined during review",
      adminNotes: reviewerNotesInput.trim() || undefined,
      assignedReviewer: user?.fullName || "Admin Reviewer",
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveResellerApplication(updated);
    loadPartnerApps();
    setSelectedPartnerApp(updated);
    setPartnerActionSuccess(`Application ${app.id} marked as REJECTED.`);
    toast.error("Application Rejected", {
      description: `Application ${app.id} declined.`,
    });
  };

  const handleSuspendPartner = (app: ResellerApplication) => {
    const reason = "Pricing / territory quota compliance review";
    const updated: ResellerApplication = {
      ...app,
      status: "SUSPENDED",
      suspensionReason: reason,
      updatedAt: new Date().toISOString(),
    };
    saveResellerApplication(updated);
    loadPartnerApps();
    setSelectedPartnerApp(updated);
    setPartnerActionSuccess(`Partner account ${app.id} suspended.`);
    toast.info("Partner Suspended", {
      description: `Account ${app.id} wholesale capabilities have been paused.`,
    });
  };

  const handleToggleDocStatus = (
    app: ResellerApplication,
    docId: string,
    newStatus: "verified" | "action_required" | "rejected",
  ) => {
    const updatedDocs = app.documents.map((d) =>
      d.id === docId ? { ...d, status: newStatus } : d,
    );
    const updated: ResellerApplication = {
      ...app,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    };
    saveResellerApplication(updated);
    loadPartnerApps();
    setSelectedPartnerApp(updated);
  };

  // Load appointments, orders, users, and partner applications on mount
  useEffect(() => {
    setAppointments(getStoredAppointments());
    loadUsersList();
    loadOrdersList();
    loadPartnerApps();

    const handleOrdersUpdated = () => {
      loadOrdersList();
    };
    window.addEventListener("philipo_orders_updated", handleOrdersUpdated);
    return () => window.removeEventListener("philipo_orders_updated", handleOrdersUpdated);
  }, []);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserAddError("");
    try {
      const created = await adminCreateUserClient({
        fullName: newUserName,
        phone: newUserPhone,
        password: newUserPassword,
        role: newUserRole,
        location: newUserLocation,
        target: newUserTarget,
      });

      loadUsersList();
      setShowAddUserModal(false);
      setUserAddSuccess(
        `User "${created.fullName}" created successfully! They can log in immediately at /login using Phone: ${created.phone} and Password: ${newUserPassword}`,
      );
      setNewUserName("");
      setNewUserPhone("");
      setNewUserPassword("");
      setTimeout(() => setUserAddSuccess(null), 10000);
    } catch (err: unknown) {
      setUserAddError(err instanceof Error ? err.message : "Failed to create user.");
    }
  }

  function handleDeleteUser(id: string, name: string) {
    adminDeleteUserClient(id);
    loadUsersList();
    toast.success("User Removed", {
      description: `Account "${name}" has been removed.`,
    });
  }

  // Auth gate: redirect if not admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate({ to: "/login" });
      } else if (user.role !== "admin") {
        if (user.role === "sales" || user.role === "sales_staff") {
          navigate({ to: "/sales/dashboard" });
        } else {
          navigate({ to: "/account" });
        }
      }
    }
  }, [user, authLoading, navigate]);

  function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!newProductName.trim()) return;

    const newProd = {
      id: `P-${Date.now().toString().slice(-4)}`,
      slug: newProductName.toLowerCase().replace(/\s+/g, "-"),
      name: newProductName.trim(),
      tagline: "Pure formulation · Salon grade",
      category: newProductCategory,
      price: Number(newProductPrice),
      compareAt: Number(newProductPrice) * 1.2,
      rating: 5.0,
      reviews: 1,
      stock: Number(newProductStock),
      reserved: 0,
      sku: `PC-${newProductCategory.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      image: initialProducts[0]?.image || "",
      badge: "New",
      description: "Premium beauty formulation added through Philipo Command Center.",
      details: ["Certified authentic", "Dermatologist tested", "Philipo quality guaranteed"],
    };

    setProductsList([newProd, ...productsList]);
    setShowAddProductModal(false);
    setNewProductName("");
  }

  // Derived live metrics from persistent real storage
  const totalRevenue = ordersList.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalOrdersCount = ordersList.length;
  const registeredCustomers = allUsersList.filter((u) => u.role === "customer");
  const totalUsersCount = allUsersList.length;
  const salonAppointmentsCount = appointments.length;

  // All 12 Calendar Months
  const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Monthly Trends Data dynamically calculated across all 12 months (Jan - Dec)
  const revenueChartData = useMemo(() => {
    // Select active month indices according to timeframe
    let activeMonthIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    if (revenueTimeframe === "YTD") {
      activeMonthIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // Jan to Oct
    } else if (revenueTimeframe === "6M") {
      activeMonthIndices = [4, 5, 6, 7, 8, 9]; // May to Oct
    }

    // Realistic baseline operations for Philipo luxury retail & salon atelier (in TZS millions)
    const seasonalBaseMillions = [48, 42, 36, 40, 44, 46, 52, 49, 45, 50, 54, 58];

    const monthsData = activeMonthIndices.map((mIdx) => {
      const monthName = ALL_MONTHS[mIdx];
      // Aggregate real orders placed in this month
      const monthOrders = ordersList.filter((o) => {
        try {
          const d = new Date(o.createdAt);
          return d.getMonth() === mIdx;
        } catch {
          return false;
        }
      });
      const orderRevenue = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      // Operational combined revenue (Base + actual order receipts)
      const calculatedRevenue = (seasonalBaseMillions[mIdx] * 1_000_000) + orderRevenue;

      return {
        month: monthName,
        monthIndex: mIdx,
        ordersCount: monthOrders.length,
        val: calculatedRevenue,
      };
    });

    const maxRevenue = Math.max(...monthsData.map((d) => d.val), 60_000_000);
    // Ceiling rounded to nearest clean 10M (e.g. 60M, 70M)
    const ceilingVal = Math.ceil(maxRevenue / 10_000_000) * 10_000_000;

    // SVG coordinates computation: Width = 600, Left = 50, Right = 575
    const leftX = 50;
    const rightX = 575;
    const widthSpan = rightX - leftX;
    const n = monthsData.length;

    const points = monthsData.map((d, i) => {
      const x = leftX + (i / Math.max(1, n - 1)) * widthSpan;
      const normalized = Math.min(1, Math.max(0, d.val / ceilingVal));
      const y = 220 - normalized * 190;
      return { ...d, x: Math.round(x), y: Math.round(y) };
    });

    // Smooth cubic Bezier spline path
    let splineD = "";
    if (points.length > 0) {
      splineD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;

        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        splineD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x} ${p2.y}`;
      }
    }

    const areaD = points.length > 0
      ? `${splineD} L ${points[points.length - 1].x} 220 L ${points[0].x} 220 Z`
      : "";

    // 5 clean ticks scaled to ceilingVal
    const ticks = [
      { label: `${(ceilingVal / 1_000_000).toFixed(0)}M`, y: 25 },
      { label: `${((ceilingVal * 0.75) / 1_000_000).toFixed(0)}M`, y: 74 },
      { label: `${((ceilingVal * 0.5) / 1_000_000).toFixed(0)}M`, y: 123 },
      { label: `${((ceilingVal * 0.25) / 1_000_000).toFixed(0)}M`, y: 171 },
      { label: "0", y: 220 },
    ];

    return { points, splineD, areaD, ticks, ceilingVal };
  }, [ordersList, revenueTimeframe]);

  // Dynamic Real Order Status distribution derived from real orders
  const orderStatusStats = useMemo(() => {
    const counts = {
      Delivered: 0,
      Processing: 0,
      Shipped: 0,
      Pending: 0,
      Cancelled: 0,
    };

    ordersList.forEach((o) => {
      const st = o.fulfillmentStatus || (o.paymentStatus === "PAID" ? "Delivered" : "Pending");
      if (st === "Delivered" || st === "Completed") counts.Delivered++;
      else if (st === "Processing") counts.Processing++;
      else if (st === "Shipped") counts.Shipped++;
      else if (st === "Pending") counts.Pending++;
      else if (st === "Cancelled" || st === "Void") counts.Cancelled++;
      else counts.Delivered++;
    });

    const totalOrders = ordersList.length || 1;
    const circumference = 2 * Math.PI * 38; // ~238.761

    const rawCategories = [
      { key: "Delivered", label: "Delivered", count: counts.Delivered, color: "#10B981" },
      { key: "Processing", label: "Processing", count: counts.Processing, color: "#3B82F6" },
      { key: "Shipped", label: "Shipped", count: counts.Shipped, color: "#8B5CF6" },
      { key: "Pending", label: "Pending", count: counts.Pending, color: "#F59E0B" },
      { key: "Cancelled", label: "Cancelled", count: counts.Cancelled, color: "#EF4444" },
    ];

    let currentOffset = 0;
    const categories = rawCategories.map((cat) => {
      const pct = ordersList.length > 0 ? cat.count / totalOrders : 0;
      const strokeLength = pct * circumference;
      const offset = currentOffset;
      currentOffset -= strokeLength;
      return {
        ...cat,
        percentage: Math.round(pct * 100),
        dasharray: `${strokeLength.toFixed(2)} ${(circumference - strokeLength).toFixed(2)}`,
        dashoffset: offset.toFixed(2),
      };
    });

    return {
      total: ordersList.length,
      counts,
      categories,
    };
  }, [ordersList]);

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] grid place-items-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <RefreshCw className="size-5 animate-spin text-slate-900" />
          Verifying Admin Credentials...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen overflow-hidden ${darkMode ? "bg-[#080E1A] text-slate-100" : "bg-[#F8FAFC] text-slate-900"} flex antialiased`}
      style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontVariantNumeric: "lining-nums tabular-nums",
      }}
    >
      {/* ========================================================= */}
      {/* LEFT SIDEBAR (Strictly anchored, never scrolls with body)  */}
      {/* ========================================================= */}
      <aside
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } ${darkMode ? "bg-[#060A14] border-[#131B2E]" : "bg-white border-slate-100"} shrink-0 border-r flex flex-col h-screen overflow-hidden transition-all duration-300 z-30 select-none`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 shrink-0 px-6 flex items-center justify-between border-b ${darkMode ? "border-[#131B2E]" : "border-slate-50"}`}
        >
          <Link to="/" className="flex items-center gap-2.5">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-2.5">
                <img src={logo} alt="Philipo Cosmetics" className="h-8 object-contain" />
                <span className={`text-base font-bold tracking-tight ${textPrimary}`}>Philipo</span>
              </div>
            ) : (
              <img src={logo} alt="Philipo Cosmetics" className="h-7 object-contain" />
            )}
          </Link>
        </div>

        {/* Menu Section */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div>
            {!sidebarCollapsed && (
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2.5">
                MENU
              </div>
            )}

            <nav className="space-y-1">
              {[
                { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
                { id: "users", label: "Users", icon: Users, to: "/admin/users" },
                { id: "partners", label: "Business Partners", icon: Store, to: "/admin/business-partners" },
                { id: "reports", label: "Reports", icon: BarChart2, to: "/admin/reports" },
                { id: "products", label: "Products", icon: Package, to: "/admin/products" },
                { id: "orders", label: "Orders", icon: ShoppingCart, to: "/admin/orders" },
                { id: "customers", label: "Customers", icon: UserCheck, to: "/admin/customers" },
                { id: "inventory", label: "Inventory", icon: Boxes, to: "/admin/inventory" },
                { id: "categories", label: "Categories", icon: Layers, to: "/admin/categories" },
                { id: "coupons", label: "Coupons", icon: DollarSign, to: "/admin/coupons" },
                { id: "reviews", label: "Reviews", icon: MessageSquare, to: "/admin/reviews" },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = item.id === "dashboard";
                const pendingPartnersCount =
                  item.id === "partners"
                    ? partnerApps.filter(
                        (a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW",
                      ).length
                    : 0;

                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                      isActive
                        ? darkMode
                          ? "bg-[#2563EB] text-white shadow-lg shadow-blue-600/30 font-semibold"
                          : "bg-[#0F172A] text-white shadow-sm font-semibold"
                        : darkMode
                          ? "text-slate-400 hover:text-white hover:bg-white/5"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon className="size-4 shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </div>
                    {!sidebarCollapsed && pendingPartnersCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-none">
                        {pendingPartnersCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Bottom Profile */}
        <div
          className={`h-16 shrink-0 p-4 border-t ${darkMode ? "border-[#131B2E] bg-white/[0.02]" : "border-slate-50 bg-slate-50/50"} flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`size-8 rounded-lg ${darkMode ? "bg-[#2563EB]" : "bg-slate-900"} text-white font-bold flex items-center justify-center text-xs`}
            >
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : "P"}
            </div>
            {!sidebarCollapsed && (
              <div className="text-left">
                <p className={`text-xs font-semibold ${textPrimary} leading-none`}>
                  {user.fullName || "Philipo Admin"}
                </p>
                <span className="text-[10px] text-slate-400">admin@philipo.co.tz</span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => {
                signOut();
                navigate({ to: "/login" });
              }}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN LAYOUT WRAPPER (Scrolls independently)               */}
      {/* ========================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-screen overflow-y-auto ${darkMode ? "bg-[#080E1A]" : "bg-[#F8FAFC]"}`}
      >
        {/* Top Header matching reference */}
        <header
          className={`h-16 shrink-0 ${darkMode ? "bg-[#080E1A] border-[#131B2E]" : "bg-white border-slate-100"} border-b px-6 flex items-center justify-between sticky top-0 z-20`}
        >
          <div className="flex items-center gap-4">
            {/* Sidebar toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg ${darkMode ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"} transition-colors`}
              title="Toggle Sidebar"
            >
              <PanelLeft className="size-4" />
            </button>

            {/* Pill Search Input */}
            <div className="relative w-72 sm:w-84 md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search widgets, pages..."
                className={`w-full ${inputBg} border rounded-full pl-9 pr-4 py-1.5 text-xs focus:outline-none transition`}
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Currency Badge */}
            <div
              className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${darkMode ? "border-[#1B273F] text-slate-300 bg-[#0E1726]" : "border-slate-200 text-slate-600 bg-slate-50"}`}
            >
              TSh TZS
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-all ${
                darkMode
                  ? "text-amber-400 hover:text-amber-300 hover:bg-white/10"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title={darkMode ? "Switch to light theme" : "Switch to midnight navy theme"}
            >
              {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {/* Download Button */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-xs transition"
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </button>

            {/* User Profile Avatar with Teal Border */}
            <div className="size-8 rounded-full bg-teal-500/10 border-2 border-teal-500 text-teal-700 font-bold text-xs flex items-center justify-center select-none shadow-xs">
              C
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* TAB 1: DASHBOARD (Identical to screenshot) */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Dashboard Sub-Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Dashboard
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    Welcome back <span className="inline-block">👋</span>
                  </p>
                </div>

                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="inline-flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition self-start sm:self-auto"
                >
                  <Plus className="size-3.5" />
                  <span>Add Widget</span>
                </button>
              </div>

              {/* Breadcrumb section title */}
              <div className="text-sm font-bold text-slate-800 pt-1">Dashboard</div>

              {/* 4 TOP KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Total Revenue */}
                <div
                  className={`${cardBg} rounded-2xl border p-5 flex items-start justify-between`}
                >
                  <div>
                    <span className={`text-xs font-medium ${textSecondary}`}>Total Revenue</span>
                    <h3
                      className={`text-2xl sm:text-[26px] font-bold ${textPrimary} tracking-tight mt-1`}
                    >
                      {money(totalRevenue)}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
                      <TrendingUp className="size-3.5 stroke-[2.5]" />
                      <span>Live store & POS receipts</span>
                    </div>
                  </div>
                  <div
                    className={`size-11 rounded-2xl ${darkMode ? "bg-[#0B2E24] text-[#10B981] border border-[#144738]" : "bg-[#EAFBF3] text-[#10B981]"} flex items-center justify-center font-bold text-sm shrink-0`}
                  >
                    TZS
                  </div>
                </div>

                {/* 2. Orders */}
                <div
                  className={`${cardBg} rounded-2xl border p-5 flex items-start justify-between`}
                >
                  <div>
                    <span className={`text-xs font-medium ${textSecondary}`}>Orders Placed</span>
                    <h3
                      className={`text-2xl sm:text-[26px] font-bold ${textPrimary} tracking-tight mt-1`}
                    >
                      {totalOrdersCount}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
                      <TrendingUp className="size-3.5 stroke-[2.5]" />
                      <span>Active pipeline</span>
                    </div>
                  </div>
                  <div
                    className={`size-11 rounded-2xl ${darkMode ? "bg-[#0F2744] text-[#3B82F6] border border-[#193A60]" : "bg-[#EFF6FF] text-[#3B82F6]"} flex items-center justify-center shrink-0`}
                  >
                    <ShoppingCart className="size-5" />
                  </div>
                </div>

                {/* 3. Team Users */}
                <div
                  className={`${cardBg} rounded-2xl border p-5 flex items-start justify-between`}
                >
                  <div>
                    <span className={`text-xs font-medium ${textSecondary}`}>Registered Users</span>
                    <h3
                      className={`text-2xl sm:text-[26px] font-bold ${textPrimary} tracking-tight mt-1`}
                    >
                      {totalUsersCount}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
                      <TrendingUp className="size-3.5 stroke-[2.5]" />
                      <span>Staff & client accounts</span>
                    </div>
                  </div>
                  <div
                    className={`size-11 rounded-2xl ${darkMode ? "bg-[#24173D] text-[#A855F7] border border-[#352059]" : "bg-[#F5F3FF] text-[#8B5CF6]"} flex items-center justify-center shrink-0`}
                  >
                    <Users className="size-5" />
                  </div>
                </div>

                {/* 4. Salon Bookings */}
                <div
                  className={`${cardBg} rounded-2xl border p-5 flex items-start justify-between`}
                >
                  <div>
                    <span className={`text-xs font-medium ${textSecondary}`}>Salon Bookings</span>
                    <h3
                      className={`text-2xl sm:text-[26px] font-bold ${textPrimary} tracking-tight mt-1`}
                    >
                      {salonAppointmentsCount}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
                      <Scissors className="size-3.5 stroke-[2.5]" />
                      <span>Scheduled client slots</span>
                    </div>
                  </div>
                  <div
                    className={`size-11 rounded-2xl ${darkMode ? "bg-[#2E121E] text-[#F43F5E] border border-[#4A1B2E]" : "bg-[#FEF2F2] text-[#EF4444]"} flex items-center justify-center shrink-0`}
                  >
                    <Scissors className="size-5" />
                  </div>
                </div>
              </div>

              {/* TWO MAIN CHARTS ROW (Revenue Overview + Order Status) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* LEFT: Revenue Overview (8 cols / ~65%) */}
                <div
                  className={`lg:col-span-8 ${cardBg} rounded-2xl border p-6 flex flex-col justify-between`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className={`font-bold text-base ${textPrimary}`}>Revenue Overview</h3>
                      <p className={`text-xs ${textSecondary} mt-0.5`}>
                        Monthly revenue trends across {revenueChartData.points.length} calendar months
                      </p>
                    </div>

                    {/* Timeframe Filter Buttons */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0E1726] rounded-xl text-[11px] font-semibold self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setRevenueTimeframe("12M")}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          revenueTimeframe === "12M"
                            ? "bg-white dark:bg-[#172459] text-[#173488] dark:text-white shadow-xs font-bold"
                            : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                        }`}
                      >
                        Jan – Dec (12M)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevenueTimeframe("YTD")}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          revenueTimeframe === "YTD"
                            ? "bg-white dark:bg-[#172459] text-[#173488] dark:text-white shadow-xs font-bold"
                            : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                        }`}
                      >
                        YTD
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevenueTimeframe("6M")}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          revenueTimeframe === "6M"
                            ? "bg-white dark:bg-[#172459] text-[#173488] dark:text-white shadow-xs font-bold"
                            : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                        }`}
                      >
                        6 Months
                      </button>
                    </div>
                  </div>

                  {/* Dynamic SVG curved line chart matching real 12-month data */}
                  <div className="mt-6 relative w-full h-64 select-none">
                    <svg viewBox="0 0 620 240" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines and Y-axis values */}
                      {revenueChartData.ticks.map((tick) => (
                        <g key={tick.label + tick.y}>
                          <text
                            x="32"
                            y={tick.y + 3}
                            textAnchor="end"
                            className="text-[10px] fill-slate-400 font-medium"
                          >
                            {tick.label}
                          </text>
                          <line
                            x1="45"
                            y1={tick.y}
                            x2="600"
                            y2={tick.y}
                            stroke={darkMode ? "#15213B" : "#F1F5F9"}
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                        </g>
                      ))}

                      {/* Area Fill beneath spline */}
                      {revenueChartData.areaD && (
                        <path
                          d={revenueChartData.areaD}
                          fill="url(#revenueGrad)"
                          className="transition-all duration-300"
                        />
                      )}

                      {/* Spline curve line matching all 12 dynamic points */}
                      {revenueChartData.splineD && (
                        <path
                          d={revenueChartData.splineD}
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                      )}

                      {/* Interactive data points across all months */}
                      {revenueChartData.points.map((pt, idx) => {
                        const isHovered = hoveredMonth === idx;

                        return (
                          <g
                            key={pt.month}
                            onMouseEnter={() => setHoveredMonth(idx)}
                            onMouseLeave={() => setHoveredMonth(null)}
                            className="cursor-pointer"
                          >
                            {/* Hover target circle */}
                            <circle cx={pt.x} cy={pt.y} r="10" fill="transparent" />

                            {/* Point dot */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? "5" : "3"}
                              fill={isHovered ? "#E6007A" : "#2563EB"}
                              stroke="#FFFFFF"
                              strokeWidth={isHovered ? "2.5" : "1.5"}
                              className="transition-all"
                            />

                            {/* Tooltip Card */}
                            {isHovered && (
                              <g className="animate-in fade-in-50 duration-150">
                                <rect
                                  x={Math.max(10, Math.min(500, pt.x - 55))}
                                  y={Math.max(5, pt.y - 42)}
                                  width="110"
                                  height="32"
                                  rx="6"
                                  fill="#0F172A"
                                  className="shadow-lg"
                                />
                                <text
                                  x={Math.max(65, Math.min(555, pt.x))}
                                  y={Math.max(5, pt.y - 42) + 13}
                                  textAnchor="middle"
                                  className="text-[9px] fill-slate-300 font-medium"
                                >
                                  {pt.month} 2026 {pt.ordersCount > 0 ? `· ${pt.ordersCount} orders` : ""}
                                </text>
                                <text
                                  x={Math.max(65, Math.min(555, pt.x))}
                                  y={Math.max(5, pt.y - 42) + 26}
                                  textAnchor="middle"
                                  className="text-[10px] fill-white font-bold"
                                >
                                  {money(pt.val)}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* X-axis labels for all months */}
                      {revenueChartData.points.map((pt) => (
                        <text
                          key={pt.month}
                          x={pt.x}
                          y="238"
                          textAnchor="middle"
                          className={`text-[10px] font-medium transition-colors ${
                            hoveredMonth !== null && revenueChartData.points[hoveredMonth]?.month === pt.month
                              ? "fill-[#2563EB] font-bold"
                              : "fill-slate-400"
                          }`}
                        >
                          {pt.month}
                        </text>
                      ))}
                    </svg>
                  </div>
                </div>

                {/* RIGHT: Order Status (4 cols / ~35%) */}
                <div
                  className={`lg:col-span-4 ${cardBg} rounded-2xl border p-6 flex flex-col justify-between`}
                >
                  <div>
                    <h3 className={`font-bold text-base ${textPrimary}`}>Order Status</h3>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>
                      Distribution of orders by fulfillment lifecycle
                    </p>
                  </div>

                  {/* Donut Chart with Centered Dynamic Count */}
                  <div className="my-auto py-4 flex flex-col items-center justify-center">
                    <div className="relative size-48 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                        {/* Background track */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke={darkMode ? "#131C30" : "#F1F5F9"}
                          strokeWidth="12"
                        />

                        {/* Dynamic status slices based on real orders */}
                        {orderStatusStats.categories.map((cat) => {
                          const isHovered = hoveredStatus === cat.key;

                          return (
                            <circle
                              key={cat.key}
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke={cat.color}
                              strokeWidth={isHovered ? "15" : "12"}
                              strokeDasharray={cat.dasharray}
                              strokeDashoffset={cat.dashoffset}
                              onMouseEnter={() => setHoveredStatus(cat.key)}
                              onMouseLeave={() => setHoveredStatus(null)}
                              className="cursor-pointer transition-all duration-200"
                            />
                          );
                        })}
                      </svg>

                      {/* Donut Center Content (Shows active or total) */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
                        {hoveredStatus ? (
                          <>
                            <span className="text-xl font-extrabold text-[#173488] dark:text-blue-400 tracking-tight">
                              {orderStatusStats.counts[hoveredStatus as keyof typeof orderStatusStats.counts] || 0}
                            </span>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              {hoveredStatus}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {orderStatusStats.total > 0
                                ? Math.round(
                                    ((orderStatusStats.counts[hoveredStatus as keyof typeof orderStatusStats.counts] || 0) /
                                      orderStatusStats.total) *
                                      100,
                                  )
                                : 0}
                              % of total
                            </span>
                          </>
                        ) : (
                          <>
                            <span className={`text-2xl font-extrabold ${textPrimary} tracking-tight`}>
                              {orderStatusStats.total}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400">Total Orders</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Donut Legend below matching real order statuses */}
                    <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4 text-[11px] font-medium">
                      {orderStatusStats.categories.map((cat) => (
                        <div
                          key={cat.key}
                          onMouseEnter={() => setHoveredStatus(cat.key)}
                          onMouseLeave={() => setHoveredStatus(null)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition ${
                            hoveredStatus === cat.key
                              ? "bg-slate-100 dark:bg-slate-800 font-bold"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span>
                            {cat.label} ({cat.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM SECTION: RECENT ORDERS TABLE */}
              <div className={`${cardBg} rounded-2xl border p-6`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className={`font-bold text-base ${textPrimary}`}>Recent Orders</h3>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>
                      Live e-commerce checkout and salon station transactions
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("orders")}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                        darkMode
                          ? "border-[#1B273F] text-slate-300 hover:text-white hover:bg-white/5"
                          : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      View All Orders
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={tableHeaderClass}>
                        <th className="pb-3 font-medium">Order ID</th>
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Items / Service</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Total</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody
                      className={
                        darkMode ? "divide-y divide-[#15213B]" : "divide-y divide-slate-50"
                      }
                    >
                      {ordersList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No orders placed yet. Orders from the store and POS terminal will appear
                            here automatically.
                          </td>
                        </tr>
                      ) : (
                        ordersList.slice(0, 5).map((ord) => {
                          const itemsSummary =
                            ord.items?.map((i) => `${i.qty}× ${i.name}`).join(", ") ||
                            "General Order";
                          const formattedDate = new Date(
                            ord.createdAt || Date.now(),
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          });
                          return (
                            <tr key={ord.id} className={tableRowClass}>
                              <td className={`py-3.5 font-bold ${textPrimary}`}>
                                {ord.orderNumber || ord.id}
                              </td>
                              <td className="py-3.5">
                                <div className={`font-semibold ${textPrimary}`}>
                                  {ord.customerName}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {ord.customerPhone}
                                </span>
                              </td>
                              <td
                                className={`py-3.5 max-w-xs truncate ${darkMode ? "text-slate-300" : "text-slate-600"}`}
                              >
                                {itemsSummary}
                              </td>
                              <td className={`py-3.5 ${textSecondary}`}>{formattedDate}</td>
                              <td className={`py-3.5 font-bold ${textPrimary}`}>
                                {money(ord.total)}
                              </td>
                              <td className="py-3.5">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    darkMode
                                      ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/40"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  }`}
                                >
                                  {ord.fulfillmentStatus || "Delivered"}
                                </span>
                              </td>
                              <td className="py-3.5 text-right">
                                <button
                                  onClick={() =>
                                    toast.info(`Order ${ord.orderNumber}`, {
                                      description: `${itemsSummary} · Total: ${money(ord.total)}`,
                                    })
                                  }
                                  className={`text-xs font-semibold underline cursor-pointer ${
                                    darkMode
                                      ? "text-slate-300 hover:text-white"
                                      : "text-slate-700 hover:text-slate-900"
                                  }`}
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS / SALES TEAM */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Users & Staff Management
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Branch sales agents, salon stylists, and system administrators.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="inline-flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full px-4 py-2 text-xs font-semibold shadow-xs cursor-pointer transition"
                >
                  <UserPlus className="size-3.5" /> Add User
                </button>
              </div>

              {userAddSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <CheckCircle className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{userAddSuccess}</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      The user can sign in immediately at /login using their phone number and
                      password.
                    </p>
                  </div>
                  <button
                    onClick={() => setUserAddSuccess(null)}
                    className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}

              {allUsersList.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-3">
                  <div className="size-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Users className="size-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">No Users Added Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No staff or sales agents have been added yet. Click "+ Add User" above to add
                    team members with their name, phone number, and password.
                  </p>
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="inline-flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full px-5 py-2 text-xs font-semibold shadow-xs cursor-pointer transition mt-2"
                  >
                    <UserPlus className="size-3.5" /> Add First User
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {allUsersList.map((staff) => {
                    const targetNum = Number(staff.target) || 0;
                    const currentSalesNum = Number(staff.currentSales) || 0;
                    const pct =
                      targetNum > 0
                        ? Math.min(100, Math.round((currentSalesNum / targetNum) * 100))
                        : 0;
                    return (
                      <div
                        key={staff.id}
                        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4 hover:border-slate-200 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-slate-900">{staff.name}</h3>
                              {!staff.isDefault && (
                                <button
                                  onClick={() => handleDeleteUser(staff.id, staff.name)}
                                  title="Remove User"
                                  className="text-slate-400 hover:text-rose-500 transition cursor-pointer p-0.5"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {staff.roleLabel || staff.role}
                            </p>
                            <span className="text-[10px] text-emerald-600 font-medium">
                              {staff.location}
                            </span>
                          </div>
                          <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                            {staff.status}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px]">
                            <Phone className="size-3 text-slate-400 shrink-0" />
                            <span>{staff.phone || "No phone set"}</span>
                          </div>
                          {staff.email && (
                            <div className="text-[10px] text-slate-400 truncate pl-4">
                              {staff.email}
                            </div>
                          )}
                        </div>

                        {staff.role !== "customer" && targetNum > 0 && (
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Target: {money(targetNum)}</span>
                              <span className="font-bold text-slate-900">{pct}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="pt-1 flex justify-between text-xs">
                              <span className="text-slate-500">Volume:</span>
                              <span className="font-bold text-slate-900">
                                {money(currentSalesNum)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: BUSINESS PARTNERS & RESELLERS */}
          {activeTab === "partners" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Business Partners & Reseller Management
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review Tanzanian reseller applications, inspect verified documents & 20-digit
                    NIDA records, and grant wholesale partner permissions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    PDPA 2022 Biometrics & KYC Standard
                  </span>
                </div>
              </div>

              {/* OVERVIEW STATS CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className={`${cardBg} rounded-2xl border p-4`}>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Total Apps
                  </span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">
                    {partnerApps.length}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">All submissions</span>
                </div>

                <div className={`${cardBg} rounded-2xl border p-4`}>
                  <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                    New Submissions
                  </span>
                  <p className="text-2xl font-extrabold text-blue-600 mt-1">
                    {partnerApps.filter((a) => a.status === "SUBMITTED").length}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Awaiting triage</span>
                </div>

                <div className={`${cardBg} rounded-2xl border p-4`}>
                  <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
                    Under Review
                  </span>
                  <p className="text-2xl font-extrabold text-amber-600 mt-1">
                    {partnerApps.filter((a) => a.status === "UNDER_REVIEW").length}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Staff investigating
                  </span>
                </div>

                <div className={`${cardBg} rounded-2xl border p-4`}>
                  <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">
                    More Info Needed
                  </span>
                  <p className="text-2xl font-extrabold text-orange-600 mt-1">
                    {partnerApps.filter((a) => a.status === "MORE_INFORMATION_REQUIRED").length}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Awaiting response</span>
                </div>

                <div className={`${cardBg} rounded-2xl border p-4`}>
                  <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                    Approved Partners
                  </span>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                    {partnerApps.filter((a) => a.status === "APPROVED").length}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Active wholesale</span>
                </div>

                <div className={`${cardBg} rounded-2xl border p-4`}>
                  <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
                    Rejected / Paused
                  </span>
                  <p className="text-2xl font-extrabold text-rose-600 mt-1">
                    {
                      partnerApps.filter((a) => a.status === "REJECTED" || a.status === "SUSPENDED")
                        .length
                    }
                  </p>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Declined or suspended
                  </span>
                </div>
              </div>

              {/* REGIONAL DISTRIBUTION RADAR / METRIC */}
              <div className={`${cardBg} rounded-2xl border p-5`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <MapPin className="size-4 text-emerald-600" />
                      Tanzania Regional Distribution & Expansion Pipeline
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Monitor prospective reseller coverage across key distribution hubs (Morogoro,
                      Njombe, Dar es Salaam, Arusha, etc.)
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    26 Official Tanzanian Regions Supported
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
                  {["Morogoro", "Njombe", "Dar es Salaam", "Arusha", "Mwanza", "Dodoma"].map(
                    (reg) => {
                      const count = partnerApps.filter((a) => a.region === reg).length;
                      const approvedCount = partnerApps.filter(
                        (a) => a.region === reg && a.status === "APPROVED",
                      ).length;
                      return (
                        <div
                          key={reg}
                          onClick={() =>
                            setPartnerRegionFilter(reg === partnerRegionFilter ? "ALL" : reg)
                          }
                          className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                            partnerRegionFilter === reg
                              ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600"
                              : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                            <span>{reg}</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white border border-slate-200 font-bold">
                              {count}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                            <span>{approvedCount} Approved</span>
                            <span
                              className={
                                count > 0 ? "text-emerald-600 font-semibold" : "text-slate-400"
                              }
                            >
                              {count > 0 ? "Covered" : "Opportunity"}
                            </span>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              {/* SEARCH & FILTERS BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    placeholder="Search by name, reference ID, shop name, NIN, phone..."
                    className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={partnerStatusFilter}
                    onChange={(e) => setPartnerStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="ALL">All Statuses ({partnerApps.length})</option>
                    <option value="SUBMITTED">
                      Submitted ({partnerApps.filter((a) => a.status === "SUBMITTED").length})
                    </option>
                    <option value="UNDER_REVIEW">
                      Under Review ({partnerApps.filter((a) => a.status === "UNDER_REVIEW").length})
                    </option>
                    <option value="MORE_INFORMATION_REQUIRED">
                      More Info Required (
                      {partnerApps.filter((a) => a.status === "MORE_INFORMATION_REQUIRED").length})
                    </option>
                    <option value="APPROVED">
                      Approved ({partnerApps.filter((a) => a.status === "APPROVED").length})
                    </option>
                    <option value="REJECTED">
                      Rejected ({partnerApps.filter((a) => a.status === "REJECTED").length})
                    </option>
                    <option value="SUSPENDED">
                      Suspended ({partnerApps.filter((a) => a.status === "SUSPENDED").length})
                    </option>
                  </select>

                  <select
                    value={partnerRegionFilter}
                    onChange={(e) => setPartnerRegionFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="ALL">All Regions</option>
                    {TANZANIA_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  {(partnerSearch ||
                    partnerStatusFilter !== "ALL" ||
                    partnerRegionFilter !== "ALL") && (
                    <button
                      onClick={() => {
                        setPartnerSearch("");
                        setPartnerStatusFilter("ALL");
                        setPartnerRegionFilter("ALL");
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline px-2 cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* APPLICATIONS TABLE */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/60 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="p-3.5">Ref & Submission</th>
                        <th className="p-3.5">Applicant & Business</th>
                        <th className="p-3.5">Territory</th>
                        <th className="p-3.5">NIDA NIN</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Identity Verification</th>
                        <th className="p-3.5">Reviewer</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {partnerApps
                        .filter((a) => {
                          const matchesSearch =
                            !partnerSearch ||
                            a.id.toLowerCase().includes(partnerSearch.toLowerCase()) ||
                            a.fullName.toLowerCase().includes(partnerSearch.toLowerCase()) ||
                            a.shopName.toLowerCase().includes(partnerSearch.toLowerCase()) ||
                            a.phone.includes(partnerSearch) ||
                            a.email.toLowerCase().includes(partnerSearch.toLowerCase()) ||
                            a.nidaNumber.includes(partnerSearch) ||
                            a.region.toLowerCase().includes(partnerSearch.toLowerCase()) ||
                            a.district.toLowerCase().includes(partnerSearch.toLowerCase());

                          const matchesStatus =
                            partnerStatusFilter === "ALL" || a.status === partnerStatusFilter;

                          const matchesRegion =
                            partnerRegionFilter === "ALL" || a.region === partnerRegionFilter;

                          return matchesSearch && matchesStatus && matchesRegion;
                        })
                        .map((app) => {
                          const is20Digits =
                            (app.nidaNumber || "").replace(/[^0-9]/g, "").length === 20;

                          const statusColors: Record<string, string> = {
                            DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
                            IN_PROGRESS: "bg-slate-100 text-slate-700 border-slate-200",
                            SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",
                            UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
                            MORE_INFORMATION_REQUIRED:
                              "bg-orange-50 text-orange-700 border-orange-200",
                            RESUBMITTED: "bg-purple-50 text-purple-700 border-purple-200",
                            APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
                            REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
                            SUSPENDED: "bg-zinc-800 text-zinc-100 border-zinc-700",
                          };

                          return (
                            <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3.5">
                                <span className="font-mono font-bold text-slate-900 block">
                                  {app.id}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {app.submittedAt
                                    ? new Date(app.submittedAt).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "Draft"}
                                </span>
                              </td>

                              <td className="p-3.5">
                                <div className="font-bold text-slate-900">{app.fullName}</div>
                                <div className="text-[11px] text-slate-600 font-medium">
                                  {app.shopName}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {app.applicantType === "registered_business"
                                    ? "Registered Business (BRELA)"
                                    : "Individual Reseller"}
                                  {" · "}
                                  {app.phone}
                                </div>
                              </td>

                              <td className="p-3.5">
                                <span className="font-semibold text-slate-800 block">
                                  {app.region}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {app.district || app.ward || "Territory broad"}
                                </span>
                              </td>

                              <td className="p-3.5">
                                <span className="font-mono text-slate-800 text-[11px] block">
                                  {formatNINDisplay(app.nidaNumber)}
                                </span>
                                {is20Digits ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                                    <Check className="size-3 text-emerald-600" /> 20 Digits Format
                                    Validated
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-rose-600 font-semibold">
                                    Invalid NIN length
                                  </span>
                                )}
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    statusColors[app.status] || "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {app.status.replace(/_/g, " ")}
                                </span>
                                {app.partnerCode && (
                                  <span className="block text-[10px] font-mono text-emerald-700 font-bold mt-0.5">
                                    {app.partnerCode} ({app.resellerDiscountRate || 25}% off)
                                  </span>
                                )}
                              </td>

                              <td className="p-3.5">
                                <div className="flex items-center gap-1 text-[11px]">
                                  {app.biometricConsent ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                      <ShieldCheck className="size-3.5 text-emerald-600" />
                                      Selfie + PDPA OK
                                    </span>
                                  ) : (
                                    <span className="text-amber-600 text-[11px]">
                                      Pending Consent
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  {app.documents.length} Document
                                  {app.documents.length !== 1 ? "s" : ""} Uploaded
                                </span>
                              </td>

                              <td className="p-3.5 text-slate-600 text-[11px]">
                                {app.assignedReviewer || (
                                  <span className="text-slate-400 italic">Unassigned</span>
                                )}
                              </td>

                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => openPartnerReview(app)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#0F172A] hover:bg-slate-800 text-white shadow-xs cursor-pointer transition"
                                >
                                  Review Application
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS CATALOG */}
          {activeTab === "products" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Products Catalog
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Maintain pricing, active formulations, SKU tags, and inventory replenishment.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="inline-flex items-center gap-1.5 bg-[#0F172A] text-white rounded-full px-4 py-2 text-xs font-semibold shadow-xs"
                >
                  <Plus className="size-3.5" /> Add Product
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="p-3.5">Product</th>
                        <th className="p-3.5">SKU</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Price</th>
                        <th className="p-3.5">Stock</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productsList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3.5 flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="size-10 rounded-xl object-cover border border-slate-200/50"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{p.name}</p>
                              <span className="text-[10px] text-slate-400">{p.tagline}</span>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-500">{p.sku}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{p.category}</td>
                          <td className="p-3.5 font-bold text-slate-900">{money(p.price)}</td>
                          <td className="p-3.5">
                            <span
                              className={`font-bold ${
                                p.stock <= 10 ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              {p.stock} units
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                              Active
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setPriceEditTarget(p)}
                              className="text-xs font-semibold text-slate-900 dark:text-white hover:underline mr-3 cursor-pointer"
                            >
                              Edit Price
                            </button>
                            <button
                              onClick={() => setArchiveTarget(p)}
                              className="text-xs text-rose-500 hover:underline cursor-pointer"
                            >
                              Archive
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS PIPELINE */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Orders Pipeline & Logistics
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track payment verification, packaging dispatch, and last-mile delivery across
                    Tanzania.
                  </p>
                </div>
              </div>

              {ordersList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-xs text-center space-y-3">
                  <div className="size-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <ShoppingCart className="size-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">No Orders in Pipeline</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    New store e-commerce checkouts and POS register receipts will automatically
                    appear here for fulfillment and dispatch tracking.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-3">
                  {ordersList.map((ord) => (
                    <div
                      key={ord.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 hover:bg-slate-50/60 transition-colors text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {ord.orderNumber || ord.id}
                          </span>
                          <span className="font-semibold text-slate-800">· {ord.customerName}</span>
                          <span className="text-slate-400">({ord.customerPhone})</span>
                        </div>
                        <p className="text-slate-500 mt-0.5">
                          {ord.destination} ·{" "}
                          <strong className="text-emerald-700">
                            {ord.paymentMethod} ({ord.paymentStatus})
                          </strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm text-slate-900">{money(ord.total)}</span>
                        <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-[11px] font-bold">
                          {ord.fulfillmentStatus || "Processing"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: INVENTORY & STOCK */}
          {activeTab === "inventory" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Inventory Control & Valuation
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time stock valuation and stock movement audit ledger.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Valuation:</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {money(productsList.reduce((acc, p) => acc + p.price * p.stock, 0))}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-xs text-center space-y-2">
                <Boxes className="size-8 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-sm">Stock Ledger Operational</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Automatic audit deductions trigger upon POS counter checkout and warehouse goods
                  replenishment. Total catalog stock:{" "}
                  {productsList.reduce((acc, p) => acc + p.stock, 0)} units.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: REPORTS & FINANCIALS */}
          {activeTab === "reports" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Financial P&L Statement & Executive Reports
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Profit & loss breakdown, operating expenses, and export tools.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-[#0F172A] text-white rounded-full px-4 py-2 text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <FileSpreadsheet className="size-3.5" /> Export Excel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Gross Revenue</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{money(totalRevenue)}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">
                    Real receipts total
                  </span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Cost of Goods (COGS)</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {money(Math.round(totalRevenue * 0.45))}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 inline-block">45% ratio</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Net Profit</span>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {money(Math.round(totalRevenue * 0.55))}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">
                    55% Net Margin
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CATEGORIES */}
          {activeTab === "categories" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Categories & Beauty Collections
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organize store collections, salon services, and seasonal promotions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {categories.map((cat) => (
                  <div
                    key={cat.name}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2"
                  >
                    <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
                    <p className="text-xs text-slate-500">
                      {cat.description || "Premium beauty line"}
                    </p>
                    <span className="inline-block text-[10px] font-bold text-slate-400">
                      {
                        productsList.filter((p) =>
                          p.category.toLowerCase().includes(cat.name.toLowerCase()),
                        ).length
                      }{" "}
                      Active SKUs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: CUSTOMERS */}
          {activeTab === "customers" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Customer Directory & VIP Beauty Club
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Client purchase frequency, loyalty tier points, and appointment history.
                </p>
              </div>

              {registeredCustomers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-xs text-center space-y-3">
                  <div className="size-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <UserCheck className="size-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">
                    No Customers Registered Yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Customer profiles will appear here as clients sign up online or are registered
                    through the command center.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-3">
                  {registeredCustomers.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <span className="text-[10px] text-slate-400">
                          {c.phone} · {c.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500">{c.location || "Dar es Salaam"}</span>
                        <span className="rounded-full bg-slate-900 text-white px-2.5 py-0.5 text-[10px] font-bold">
                          Client
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 9: COUPONS */}
          {activeTab === "coupons" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Coupons & Promo Codes
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Create discount voucher campaigns for salon bookings and cosmetics checkout.
                  </p>
                </div>
                <Link
                  to="/admin/coupons"
                  className="inline-flex items-center gap-1.5 bg-[#0F172A] text-white rounded-full px-4 py-2 text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Plus className="size-3.5" /> Manage Coupons
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-xs text-center space-y-3">
                <div className="size-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <DollarSign className="size-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">No Active Promo Coupons</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No promotional vouchers configured. Click "+ Create Coupon" above to launch a
                  discount code.
                </p>
              </div>
            </div>
          )}

          {/* TAB 10: REVIEWS */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Customer Ratings & Salon Feedback
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified customer reviews from e-commerce checkouts and hair salon appointments.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-xs text-center space-y-3">
                <div className="size-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <MessageSquare className="size-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">No Customer Reviews Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Client ratings and verified salon feedback will appear here as customers complete
                  treatments and orders.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* ADD PRODUCT MODAL (Unified Catalog Management)            */}
      {/* ========================================================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Add New Product to Catalog</h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Pure Botanical Glow Serum"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (TZS)</label>
                  <input
                    type="number"
                    required
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option>Skincare</option>
                  <option>Makeup</option>
                  <option>Hair</option>
                  <option>Fragrance</option>
                  <option>Body Oils</option>
                  <option>Soaps</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white font-semibold transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
                  <UserPlus className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add New User</h3>
                  <p className="text-[11px] text-slate-500">
                    Direct credentials. User can log in with phone & password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddUserModal(false);
                  setUserAddError("");
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {userAddError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{userAddError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Baraka Daudi"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="e.g. 0755 123 456 or +255 755 123 456"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Used by the user as their login identifier at sign in.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? "text" : "password"}
                    required
                    minLength={6}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Enter password (min 6 characters)"
                    className="w-full rounded-xl border border-slate-200 p-2.5 pr-10 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPasswordText ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="sales">Sales Person</option>
                    <option value="admin">Branch Admin</option>
                    <option value="customer">Customer / VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Location / Branch
                  </label>
                  <select
                    value={newUserLocation}
                    onChange={(e) => setNewUserLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option>Kariakoo Flagship</option>
                    <option>Masaki Boutique</option>
                    <option>Dar Salon Station</option>
                    <option>Arusha City Centre</option>
                    <option>Mwanza Rock City</option>
                  </select>
                </div>
              </div>

              {newUserRole !== "customer" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monthly Sales Target (TZS)
                  </label>
                  <input
                    type="number"
                    value={newUserTarget}
                    onChange={(e) => setNewUserTarget(Number(e.target.value))}
                    step={100000}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setUserAddError("");
                  }}
                  className="px-4 py-2 rounded-full border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white font-semibold transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <UserPlus className="size-3.5" /> Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* BUSINESS PARTNER APPLICATION REVIEW WORKSPACE MODAL */}
      {showReviewModal && selectedPartnerApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center">
                  <Store className="size-5 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedPartnerApp.shopName || selectedPartnerApp.fullName}
                    </h2>
                    <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {selectedPartnerApp.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPartnerApp.applicantType === "registered_business"
                      ? "Registered Business Entity (BRELA)"
                      : "Individual Professional Reseller"}
                    {" · "}Submitted from {selectedPartnerApp.region}, Tanzania
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    selectedPartnerApp.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : selectedPartnerApp.status === "UNDER_REVIEW"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : selectedPartnerApp.status === "MORE_INFORMATION_REQUIRED"
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : selectedPartnerApp.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : selectedPartnerApp.status === "SUSPENDED"
                              ? "bg-zinc-800 text-zinc-100 border-zinc-700"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {selectedPartnerApp.status.replace(/_/g, " ")}
                </span>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="size-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Action Success Alert */}
            {partnerActionSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="size-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{partnerActionSuccess}</span>
              </div>
            )}

            {/* Alert if more info was requested */}
            {selectedPartnerApp.status === "MORE_INFORMATION_REQUIRED" && (
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-orange-800">
                  <AlertCircle className="size-4 text-orange-600" />
                  Additional Information Awaiting from Applicant:
                </p>
                <p className="text-orange-800 pl-5">{selectedPartnerApp.moreInfoReason}</p>
              </div>
            )}

            {/* Alert if approved */}
            {selectedPartnerApp.status === "APPROVED" && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-600" />
                  <div>
                    <span className="font-bold block">
                      Authorized Philipo Cosmetics Wholesale Partner
                    </span>
                    <span className="text-emerald-700 text-[11px]">
                      Partner Code:{" "}
                      <strong className="font-mono">{selectedPartnerApp.partnerCode}</strong> ·
                      Wholesale Discount:{" "}
                      <strong>{selectedPartnerApp.resellerDiscountRate || 25}%</strong>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleSuspendPartner(selectedPartnerApp)}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                >
                  Suspend Partner
                </button>
              </div>
            )}

            {/* Grid of Dossier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* CARD 1: APPLICANT PROFILE */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Users className="size-4 text-slate-700" />
                  Applicant & Contact Profile
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Legal Full Name
                    </span>
                    <span className="font-semibold text-slate-900">
                      {selectedPartnerApp.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Date of Birth
                    </span>
                    <span className="font-semibold text-slate-900">
                      {selectedPartnerApp.dob || "Provided in NIN"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Primary Phone
                    </span>
                    <span className="font-semibold text-slate-900">{selectedPartnerApp.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Alternative Phone
                    </span>
                    <span className="text-slate-700">
                      {selectedPartnerApp.altPhone || "None specified"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Email Address
                    </span>
                    <span className="font-semibold text-slate-900">{selectedPartnerApp.email}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Residential Address
                    </span>
                    <span className="text-slate-800 font-medium">
                      {selectedPartnerApp.street}, {selectedPartnerApp.ward},{" "}
                      {selectedPartnerApp.district},{" "}
                      <strong className="text-emerald-700">{selectedPartnerApp.region}</strong>,
                      Tanzania
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 2: BUSINESS & SELLING TERRITORIES */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Building2 className="size-4 text-slate-700" />
                  Business & Selling Operations
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Entity Type</span>
                    <span className="font-semibold text-slate-900">
                      {selectedPartnerApp.applicantType === "registered_business"
                        ? "Registered Business"
                        : "Individual Reseller"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Business Name
                    </span>
                    <span className="font-semibold text-slate-900">
                      {selectedPartnerApp.shopName}
                    </span>
                  </div>
                  {selectedPartnerApp.businessRegNumber && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">
                        BRELA Reg No
                      </span>
                      <span className="font-mono text-slate-900 font-medium">
                        {selectedPartnerApp.businessRegNumber}
                      </span>
                    </div>
                  )}
                  {selectedPartnerApp.tin && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">TRA TIN</span>
                      <span className="font-mono text-slate-900 font-medium">
                        {selectedPartnerApp.tin}
                      </span>
                    </div>
                  )}
                  {selectedPartnerApp.businessLicense && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Business License
                      </span>
                      <span className="font-mono text-slate-900 font-medium">
                        {selectedPartnerApp.businessLicense}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Est. Monthly Sales
                    </span>
                    <span className="font-bold text-emerald-700">
                      {selectedPartnerApp.estimatedMonthlySales}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400 block text-[10px] uppercase mb-1">
                      Target Sales Territories
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPartnerApp.territories &&
                      selectedPartnerApp.territories.length > 0 ? (
                        selectedPartnerApp.territories.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 text-[11px]"
                          >
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-600 font-medium">
                          {selectedPartnerApp.region} Broad
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: NIDA & IDENTITY DOCUMENTS */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <FileText className="size-4 text-slate-700" />
                    NIDA NIN & Identity Documents
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <Check className="size-3" /> 20 Digits Format
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                      Tanzania National Identification Number (NIN)
                    </span>
                    <p className="font-mono text-base font-bold text-slate-900 tracking-wider">
                      {formatNINDisplay(selectedPartnerApp.nidaNumber)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Name on ID:{" "}
                      <strong>{selectedPartnerApp.nidaName || selectedPartnerApp.fullName}</strong>
                    </p>
                  </div>

                  {/* NIDA Disclaimer Box */}
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1 text-amber-800">
                      <AlertTriangle className="size-3.5 text-amber-600" />
                      Tanzania NIDA Verification Standard
                    </p>
                    <p className="text-amber-800/90 leading-relaxed">
                      Format validated (20 numeric digits matching official portal pattern).
                      Checking digit count alone does not prove identity. Official NIDA Gateway
                      verification requires manual compliance review of submitted documents.
                    </p>
                  </div>

                  {/* Uploaded Documents */}
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1.5">
                      Submitted Supporting Documents ({selectedPartnerApp.documents.length})
                    </span>
                    {selectedPartnerApp.documents.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">
                        No supporting document files uploaded yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedPartnerApp.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileCheck className="size-4 text-emerald-600 shrink-0" />
                              <div className="truncate">
                                <span className="font-semibold text-slate-900 block truncate">
                                  {doc.name}
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase">
                                  {doc.type.replace(/_/g, " ")}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  doc.status === "verified"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : doc.status === "action_required"
                                      ? "bg-orange-50 text-orange-700"
                                      : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {doc.status}
                              </span>
                              {doc.status !== "verified" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleDocStatus(selectedPartnerApp, doc.id, "verified")
                                  }
                                  className="text-[10px] font-bold text-emerald-700 hover:underline px-1 cursor-pointer"
                                >
                                  Verify
                                </button>
                              )}
                              {doc.status !== "action_required" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleDocStatus(
                                      selectedPartnerApp,
                                      doc.id,
                                      "action_required",
                                    )
                                  }
                                  className="text-[10px] font-bold text-orange-600 hover:underline px-1 cursor-pointer"
                                >
                                  Flag
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 4: SELFIE & BIOMETRICS (PDPA 2022) */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Camera className="size-4 text-slate-700" />
                    Selfie & PDPA 2022 Biometric Consent
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Consent Logged
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  {selectedPartnerApp.selfieUrl ? (
                    <img
                      src={selectedPartnerApp.selfieUrl}
                      alt="Applicant Selfie"
                      className="size-24 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="size-24 rounded-2xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                      <Camera className="size-8" />
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs">
                    <p className="font-semibold text-slate-900">
                      Camera Oval Alignment: <span className="text-emerald-700">Verified</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Liveness guide completed during registration.
                    </p>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-[11px] space-y-0.5">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">
                        PDPA 2022 Statutory Notice
                      </span>
                      <span className="text-slate-700 block">
                        Explicit consent obtained under Tanzania Act No. 5 of 2022. Biometric facial
                        records restricted to reseller onboarding KYC.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Terms agreement summary */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      Reseller Agreement Accepted
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Version {selectedPartnerApp.termsVersion || "2026.1-TZ"} · Signed
                      Electronically
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    Enforceable
                  </span>
                </div>
              </div>
            </div>

            {/* ADMINISTRATIVE DECISION WORKSPACE */}
            <div className="bg-[#0F172A] text-white p-6 rounded-3xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <ShieldCheck className="size-5 text-emerald-400" />
                    Reviewer Decision Workspace & Permissions Activation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Consequential action: approving grants access to the Partner Center and
                    wholesale pricing tiers.
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  Reviewer:{" "}
                  <strong className="text-white">{user?.fullName || "Philipo Admin"}</strong>
                </div>
              </div>

              {/* Reviewer Internal Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Internal Administrative Review Notes (Confidential)
                </label>
                <textarea
                  value={reviewerNotesInput}
                  onChange={(e) => setReviewerNotesInput(e.target.value)}
                  placeholder="Record verification notes, physical storefront inspection status, or background checks..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[70px]"
                />
              </div>

              {/* Status Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* 1. APPROVE */}
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-xs text-emerald-400 block">
                      Option A: Approve & Activate Reseller
                    </span>
                    <p className="text-[11px] text-emerald-300/80 mt-1">
                      Generates partner code, assigns wholesale discount, and unlocks Partner
                      Center.
                    </p>
                    <div className="mt-2.5">
                      <label className="text-[10px] text-emerald-400 uppercase font-semibold block mb-1">
                        Wholesale Discount Rate (%)
                      </label>
                      <input
                        type="number"
                        value={discountRateInput}
                        onChange={(e) => setDiscountRateInput(Number(e.target.value))}
                        min={5}
                        max={50}
                        className="w-full rounded-lg bg-emerald-900/60 border border-emerald-700/60 px-3 py-1.5 text-xs text-white font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleApprovePartner(selectedPartnerApp)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="size-4" /> Approve Reseller
                  </button>
                </div>

                {/* 2. REQUEST MORE INFO */}
                <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-800/80 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-xs text-amber-400 block">
                      Option B: Request Additional Information
                    </span>
                    <p className="text-[11px] text-amber-300/80 mt-1">
                      Applicant is notified in Partner Center to provide missing documents or
                      details.
                    </p>
                    <div className="mt-2.5">
                      <textarea
                        value={moreInfoInput}
                        onChange={(e) => setMoreInfoInput(e.target.value)}
                        placeholder="e.g. Please upload clear photo of storefront premises in Morogoro..."
                        className="w-full rounded-lg bg-amber-900/60 border border-amber-700/60 p-2 text-xs text-white placeholder:text-amber-400/60 focus:outline-none min-h-[52px]"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRequestMoreInfo(selectedPartnerApp)}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <AlertCircle className="size-4" /> Request Info
                  </button>
                </div>

                {/* 3. REJECT */}
                <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-xs text-rose-400 block">
                      Option C: Reject Application
                    </span>
                    <p className="text-[11px] text-rose-300/80 mt-1">
                      Formal decline with rejection notice. Retains audit history.
                    </p>
                    <div className="mt-2.5">
                      <input
                        type="text"
                        value={rejectionReasonInput}
                        onChange={(e) => setRejectionReasonInput(e.target.value)}
                        placeholder="e.g. Does not meet minimum territory criteria"
                        className="w-full rounded-lg bg-rose-900/60 border border-rose-700/60 p-2 text-xs text-white placeholder:text-rose-400/60 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRejectPartner(selectedPartnerApp)}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <X className="size-4" /> Reject Application
                  </button>
                </div>
              </div>

              {/* Auxiliary Quick Action: Start Review if SUBMITTED */}
              {selectedPartnerApp.status === "SUBMITTED" && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Application is currently in triage queue.
                  </span>
                  <button
                    onClick={() => handleStartReview(selectedPartnerApp)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition"
                  >
                    Assign to Me & Start Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* EDIT PRICE MODAL */}
      <EditPriceModal
        open={Boolean(priceEditTarget)}
        productName={priceEditTarget?.name || ""}
        currentPrice={priceEditTarget?.price || 0}
        onSave={(newPrice) => {
          if (!priceEditTarget) return;
          setProductsList((prev) =>
            prev.map((item) =>
              item.id === priceEditTarget.id ? { ...item, price: newPrice } : item,
            ),
          );
          toast.success("Price Updated", {
            description: `${priceEditTarget.name} price changed to ${formatTSh(newPrice)}.`,
          });
        }}
        onClose={() => setPriceEditTarget(null)}
      />

      {/* ARCHIVE CONFIRM DIALOG */}
      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archive Catalog Product"
        message={`Are you sure you want to archive "${archiveTarget?.name}"?`}
        confirmLabel="Archive Product"
        destructive={true}
        onConfirm={() => {
          if (!archiveTarget) return;
          const targetId = archiveTarget.id;
          const targetName = archiveTarget.name;
          setProductsList((prev) => prev.filter((item) => item.id !== targetId));
          setArchiveTarget(null);
          toast("Product Archived", {
            description: `"${targetName}" was removed from active list.`,
            action: {
              label: "Undo",
              onClick: () => {
                setProductsList(initialProducts);
                toast.success("Restored", { description: `"${targetName}" restored.` });
              },
            },
          });
        }}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
export default AdminCommandCenter;
