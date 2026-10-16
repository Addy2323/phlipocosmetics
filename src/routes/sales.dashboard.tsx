import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Receipt,
  Boxes,
  Users,
  Scissors,
  TrendingUp,
  Search,
  PanelLeft,
  Sun,
  Moon,
  Download,
  Plus,
  Minus,
  Trash2,
  Printer,
  Smartphone,
  Banknote,
  CreditCard,
  LogOut,
  RefreshCw,
  Bell,
  X,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/auth";
import { money, products as initialProducts, categories } from "@/data/shop";
import { SALON_STYLISTS, getStoredAppointments, SalonAppointmentRecord } from "@/lib/salon-data";
import { saveStoredOrder } from "@/lib/orders-store";
import { createInvoiceFromPOS, getInvoiceById } from "@/lib/invoices-store";
import { downloadInvoicePDF } from "@/lib/invoice-pdf";
import { getStoredProducts, PRODUCTS_UPDATE_EVENT, StoredProduct } from "@/lib/products-store";

export const Route = createFileRoute("/sales/dashboard")({
  head: () => ({
    meta: [
      { title: "Sales Hub — Philipo AI Operations" },
      {
        name: "description",
        content: "Fast retail checkout, shift reconciliation, and customer operations.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SalesHubDashboard,
});

type SalesTab = "dashboard" | "pos" | "orders" | "shift" | "salon" | "customers" | "performance";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  sku: string;
}

interface CompletedReceipt {
  ref: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  payMethod: string;
  customerName: string;
  salesPerson: string;
}

export function SalesHubDashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Active navigation tab matching Dashforge AI menu
  const [activeTab, setActiveTab] = useState<SalesTab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
        console.error("Failed to save theme:", err);
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

  // POS State
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [basket, setBasket] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in Client");
  const [customerPhone, setCustomerPhone] = useState("+255 700 000 000");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | "airtel" | "card">("mpesa");
  const [discountAmount, setDiscountAmount] = useState(0);

  // Completed Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<CompletedReceipt | null>(null);

  // Shift Management State
  const [shiftOpened, setShiftOpened] = useState(true);
  const [openingCash, setOpeningCash] = useState(150000);
  const [actualCashCounted, setActualCashCounted] = useState(150000);
  const [shiftSubmitted, setShiftSubmitted] = useState(false);

  // Interactive Spline Chart Hover Point
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Shift Sales
  const [shiftSales, setShiftSales] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem("philipo_shift_sales_v1");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Appointments for Salon Queue
  const [appointments, setAppointments] = useState<SalonAppointmentRecord[]>([]);

  useEffect(() => {
    setAppointments(getStoredAppointments());
  }, []);

  // Auth Guard: Only accessible to sales, sales_staff, and admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate({ to: "/login" });
      } else if (user.role === "customer") {
        navigate({ to: "/account" });
      }
    }
  }, [user, authLoading, navigate]);

  // Basket Calculations
  const basketSubtotal = basket.reduce((sum, item) => sum + item.price * item.qty, 0);
  const basketTotal = Math.max(0, basketSubtotal - discountAmount);

  // Shift Financial Totals
  const totalShiftSalesAmount = shiftSales.reduce((sum, tx) => sum + tx.total, 0);
  const totalCashSales = shiftSales
    .filter((s) => s.method === "Cash")
    .reduce((sum, s) => sum + s.total, 0);
  const expectedClosingCash = openingCash + totalCashSales;
  const cashDifference = actualCashCounted - expectedClosingCash;

  const [posProducts, setPosProducts] = useState<StoredProduct[]>(() => getStoredProducts());

  useEffect(() => {
    const handleUpdate = () => {
      setPosProducts(getStoredProducts());
    };
    window.addEventListener(PRODUCTS_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Filtered Products for POS
  const filteredProducts = posProducts
    .filter((p) => !p.isArchived)
    .filter((p) => {
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
      if (productSearch) {
        const q = productSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
      }
      return true;
    });

  // POS Actions
  function addToBasket(product: StoredProduct) {
    setBasket((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          qty: 1,
          image: product.image,
          sku: product.sku,
        },
      ];
    });
  }

  function updateQty(id: string, delta: number) {
    setBasket(
      (prev) =>
        prev
          .map((item) => {
            if (item.id === id) {
              const newQty = item.qty + delta;
              return newQty > 0 ? { ...item, qty: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[],
    );
  }

  function completeSale() {
    if (basket.length === 0) return;

    const receiptRef = `RCP-${Math.floor(100000 + Math.random() * 900000)}`;
    const receipt: CompletedReceipt = {
      ref: receiptRef,
      date: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      items: [...basket],
      subtotal: basketSubtotal,
      discount: discountAmount,
      total: basketTotal,
      payMethod:
        paymentMethod === "mpesa"
          ? "M-Pesa"
          : paymentMethod === "airtel"
            ? "Airtel Money"
            : paymentMethod === "cash"
              ? "Cash"
              : "Card",
      customerName,
      salesPerson: user?.fullName || "Sales Agent",
    };

    setActiveReceipt(receipt);
    const newTx = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      time: receipt.date,
      customer: customerName,
      items: basket.length,
      total: basketTotal,
      method: receipt.payMethod,
    };

    const updatedShift = [newTx, ...shiftSales];
    setShiftSales(updatedShift);
    try {
      localStorage.setItem("philipo_shift_sales_v1", JSON.stringify(updatedShift));
    } catch {
      // ignore
    }

    // Persist to unified store orders ledger
    saveStoredOrder({
      id: receiptRef,
      orderNumber: receiptRef,
      customerName,
      customerPhone: customerPhone || "+255 700 000 000",
      destination: "Store POS Counter",
      items: basket.map((b) => ({ name: b.name, qty: b.qty, price: b.price })),
      total: basketTotal,
      paymentMethod: receipt.payMethod,
      paymentStatus: "Paid",
      fulfillmentStatus: "Delivered",
      channel: "POS",
      createdAt: new Date().toISOString(),
    });

    // Generate electronic Tax Invoice
    createInvoiceFromPOS({
      ref: receiptRef,
      customerName,
      customerPhone,
      items: basket.map((b) => ({ name: b.name, qty: b.qty, price: b.price, sku: b.sku })),
      subtotal: basketTotal + discountAmount,
      discount: discountAmount,
      total: basketTotal,
      payMethod: receipt.payMethod,
      salesPerson: user?.fullName || "Staff",
    });

    setBasket([]);
    setDiscountAmount(0);
    setCustomerName("Walk-in Client");
  }

  // Hourly Pace Data for Spline Chart (in Tanzanian Shillings TSh)
  const salesHourlyData = [
    { label: "10 AM", val: "540,000", x: 50, y: 170 },
    { label: "12 PM", val: "1,200,000", x: 175, y: 110 },
    { label: "2 PM", val: "860,000", x: 300, y: 145 },
    { label: "4 PM", val: "1,980,000", x: 425, y: 55 },
    { label: "6 PM", val: "1,840,000", x: 550, y: 65 },
  ];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] grid place-items-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <RefreshCw className="size-5 animate-spin text-slate-900" />
          Loading Sales Hub...
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
                { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                { id: "pos", label: "Point of Sale", icon: Store },
                { id: "orders", label: "Orders", icon: ShoppingCart },
                { id: "shift", label: "Shift Cash", icon: Banknote },
                { id: "salon", label: "Salon Desk", icon: Scissors },
                { id: "customers", label: "Customers", icon: Users },
                { id: "performance", label: "Performance", icon: TrendingUp },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SalesTab)}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
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
                    <Icon className="size-4 shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
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
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : "S"}
            </div>
            {!sidebarCollapsed && (
              <div className="text-left">
                <p className={`text-xs font-semibold ${textPrimary} leading-none`}>
                  {user.fullName || "Sales Agent"}
                </p>
                <span className="text-[10px] text-emerald-500 font-medium">Counter 1 · Open</span>
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

      {/* MAIN CONTENT WRAPPER (Scrolls independently) */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-screen overflow-y-auto ${darkMode ? "bg-[#080E1A]" : "bg-[#F8FAFC]"}`}
      >
        {/* Top Header */}
        <header
          className={`h-16 shrink-0 ${darkMode ? "bg-[#080E1A] border-[#131B2E]" : "bg-white border-slate-100"} border-b px-6 flex items-center justify-between sticky top-0 z-20`}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg ${darkMode ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"} transition-colors`}
              title="Toggle Sidebar"
            >
              <PanelLeft className="size-4" />
            </button>

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

          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${darkMode ? "border-[#1B273F] text-slate-300 bg-[#0E1726]" : "border-slate-200 text-slate-600 bg-slate-50"}`}
            >
              TSh TZS
            </div>

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

            <button
              onClick={() => setActiveTab("pos")}
              className="inline-flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-xs transition"
            >
              <Store className="size-3.5" />
              <span>Open POS</span>
            </button>

            <div className="size-8 rounded-full bg-teal-500/10 border-2 border-teal-500 text-teal-700 font-bold text-xs flex items-center justify-center select-none shadow-xs">
              S
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* TAB 1: DASHBOARD (Sales Overview) */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
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
                  onClick={() => setActiveTab("pos")}
                  className="inline-flex items-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition self-start sm:self-auto"
                >
                  <Plus className="size-3.5" />
                  <span>New Sale</span>
                </button>
              </div>

              <div className="text-sm font-bold text-slate-800 pt-1">Dashboard</div>

              {/* 4 TOP KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div
                  className={`${cardBg} rounded-2xl border p-5 flex items-start justify-between`}
                >
                  <div>
                    <span className={`text-xs font-medium ${textSecondary}`}>Today's Revenue</span>
                    <h3
                      className={`text-2xl sm:text-[26px] font-bold ${textPrimary} tracking-tight mt-1`}
                    >
                      {money(4784000)}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
                      <TrendingUp className="size-3.5 stroke-[2.5]" />
                      <span>4.2% vs yesterday</span>
                    </div>
                  </div>
                  <div
                    className={`size-11 rounded-2xl ${darkMode ? "bg-[#0B2E24] text-[#10B981] border border-[#144738]" : "bg-[#EAFBF3] text-[#10B981]"} flex items-center justify-center font-bold text-sm shrink-0`}
                  >
                    TZS
                  </div>
                </div>

                <div
                  className={`${cardBg} rounded-2xl border p-5 flex items-start justify-between`}
                >
                  <div>
                    <span className={`text-xs font-medium ${textSecondary}`}>Transactions</span>
                    <h3
                      className={`text-2xl sm:text-[26px] font-bold ${textPrimary} tracking-tight mt-1`}
                    >
                      38
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
                      <TrendingUp className="size-3.5 stroke-[2.5]" />
                      <span>8.5% growth</span>
                    </div>
                  </div>
                  <div
                    className={`size-11 rounded-2xl ${darkMode ? "bg-[#0F2744] text-[#3B82F6] border border-[#193A60]" : "bg-[#EFF6FF] text-[#3B82F6]"} flex items-center justify-center shrink-0`}
                  >
                    <ShoppingCart className="size-5" />
                  </div>
                </div>

                <div
                  className={`${cardBg} rounded-2xl border p-5 flex items-start justify-between`}
                >
                  <div>
                    <span className={`text-xs font-medium ${textSecondary}`}>Salon Clients</span>
                    <h3
                      className={`text-2xl sm:text-[26px] font-bold ${textPrimary} tracking-tight mt-1`}
                    >
                      12
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
                      <TrendingUp className="size-3.5 stroke-[2.5]" />
                      <span>100% chairs active</span>
                    </div>
                  </div>
                  <div
                    className={`size-11 rounded-2xl ${darkMode ? "bg-[#24173D] text-[#A855F7] border border-[#352059]" : "bg-[#F5F3FF] text-[#8B5CF6]"} flex items-center justify-center shrink-0`}
                  >
                    <Users className="size-5" />
                  </div>
                </div>

                <div
                  className={`${cardBg} rounded-2xl border p-5 flex items-start justify-between`}
                >
                  <div>
                    <span className={`text-xs font-medium ${textSecondary}`}>Cash in Register</span>
                    <h3
                      className={`text-2xl sm:text-[26px] font-bold ${textPrimary} tracking-tight mt-1`}
                    >
                      {money(expectedClosingCash)}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
                      <TrendingUp className="size-3.5 stroke-[2.5]" />
                      <span>Drawer balanced</span>
                    </div>
                  </div>
                  <div
                    className={`size-11 rounded-2xl ${darkMode ? "bg-[#2E121E] text-[#F43F5E] border border-[#4A1B2E]" : "bg-[#FEF2F2] text-[#EF4444]"} flex items-center justify-center shrink-0`}
                  >
                    <Banknote className="size-5" />
                  </div>
                </div>
              </div>

              {/* TWO MAIN CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div
                  className={`lg:col-span-8 ${cardBg} rounded-2xl border p-6 flex flex-col justify-between`}
                >
                  <div>
                    <h3 className={`font-bold text-base ${textPrimary}`}>Shift Sales Pace</h3>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>
                      Hourly store transaction velocity
                    </p>
                  </div>

                  <div className="mt-6 relative w-full h-64 select-none">
                    <svg viewBox="0 0 600 240" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {[
                        { val: "2.0M", y: 20 },
                        { val: "1.5M", y: 70 },
                        { val: "1.0M", y: 120 },
                        { val: "500K", y: 170 },
                        { val: "0", y: 220 },
                      ].map((tick) => (
                        <g key={tick.val}>
                          <text
                            x="25"
                            y={tick.y + 3}
                            textAnchor="end"
                            className="text-[10px] fill-slate-400 font-medium"
                          >
                            {tick.val}
                          </text>
                          <line
                            x1="45"
                            y1={tick.y}
                            x2="585"
                            y2={tick.y}
                            stroke={darkMode ? "#15213B" : "#F1F5F9"}
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                        </g>
                      ))}

                      <path
                        d="M 50 170 C 100 170, 130 110, 175 110 C 230 110, 260 145, 300 145 C 360 145, 380 55, 425 55 C 470 55, 500 65, 550 65 L 550 220 L 50 220 Z"
                        fill="url(#salesGrad)"
                      />

                      <path
                        d="M 50 170 C 100 170, 130 110, 175 110 C 230 110, 260 145, 300 145 C 360 145, 380 55, 425 55 C 470 55, 500 65, 550 65"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {salesHourlyData.map((pt, idx) => (
                        <g
                          key={pt.label}
                          onMouseEnter={() => setHoveredHour(idx)}
                          onMouseLeave={() => setHoveredHour(null)}
                          className="cursor-pointer"
                        >
                          <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
                          {hoveredHour === idx && (
                            <>
                              <circle cx={pt.x} cy={pt.y} r="6" fill="#3B82F6" fillOpacity="0.2" />
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="4"
                                fill="#2563EB"
                                stroke="#FFFFFF"
                                strokeWidth="2"
                              />
                              <rect
                                x={pt.x - 44}
                                y={pt.y - 32}
                                width="88"
                                height="22"
                                rx="4"
                                fill="#0F172A"
                              />
                              <text
                                x={pt.x}
                                y={pt.y - 18}
                                textAnchor="middle"
                                className="text-[10px] fill-white font-bold"
                              >
                                TSh {pt.val}
                              </text>
                            </>
                          )}
                          <text
                            x={pt.x}
                            y="238"
                            textAnchor="middle"
                            className="text-[11px] fill-slate-400 font-medium"
                          >
                            {pt.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>

                <div
                  className={`lg:col-span-4 ${cardBg} rounded-2xl border p-6 flex flex-col justify-between`}
                >
                  <div>
                    <h3 className={`font-bold text-base ${textPrimary}`}>Payment Methods</h3>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>Shift collection split</p>
                  </div>

                  <div className="my-auto py-4 flex flex-col items-center justify-center">
                    <div className="relative size-48 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                        {/* M-Pesa 55% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="13"
                          strokeDasharray="132 108"
                          strokeDashoffset="0"
                        />
                        {/* Cash 25% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="13"
                          strokeDasharray="60 180"
                          strokeDashoffset="-132"
                        />
                        {/* Card 15% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="13"
                          strokeDasharray="36 204"
                          strokeDashoffset="-192"
                        />
                        {/* Airtel 5% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="13"
                          strokeDasharray="12 228"
                          strokeDashoffset="-228"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={`text-2xl font-extrabold ${textPrimary} tracking-tight`}>
                          100%
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">Reconciled</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-[11px] text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-[#10B981]" />
                        <span>M-Pesa</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-[#3B82F6]" />
                        <span>Cash</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-[#8B5CF6]" />
                        <span>Card</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-[#EF4444]" />
                        <span>Airtel</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RECENT SALES TABLE */}
              <div className={`${cardBg} rounded-2xl border p-6`}>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className={`font-bold text-base ${textPrimary}`}>
                      Recent Shift Transactions
                    </h3>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>
                      Counter 1 live register receipts
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("pos")}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                      darkMode
                        ? "border-[#1B273F] text-slate-300 hover:text-white hover:bg-white/5"
                        : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Open Counter
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={tableHeaderClass}>
                        <th className="pb-3 font-medium">Receipt ID</th>
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Items</th>
                        <th className="pb-3 font-medium">Time</th>
                        <th className="pb-3 font-medium">Method</th>
                        <th className="pb-3 font-medium">Total</th>
                        <th className="pb-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody
                      className={
                        darkMode ? "divide-y divide-[#15213B]" : "divide-y divide-slate-50"
                      }
                    >
                      {shiftSales.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No shift receipts recorded yet. Complete a sale in the POS Counter to
                            view transactions.
                          </td>
                        </tr>
                      ) : (
                        shiftSales.map((s) => (
                          <tr key={s.id} className={tableRowClass}>
                            <td className={`py-3.5 font-bold ${textPrimary}`}>{s.id}</td>
                            <td className={`py-3.5 font-semibold ${textPrimary}`}>{s.customer}</td>
                            <td className={`py-3.5 ${textSecondary}`}>{s.items} items</td>
                            <td className="py-3.5 text-slate-400">{s.time}</td>
                            <td className="py-3.5">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  darkMode
                                    ? "bg-slate-800 text-slate-200 border border-slate-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {s.method}
                              </span>
                            </td>
                            <td className={`py-3.5 font-bold ${textPrimary}`}>{money(s.total)}</td>
                            <td className="py-3.5 text-right">
                              <button
                                onClick={() => setActiveReceipt(s)}
                                className={`text-xs font-semibold underline ${
                                  darkMode
                                    ? "text-slate-300 hover:text-white"
                                    : "text-slate-700 hover:text-slate-900"
                                }`}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POINT OF SALE TERMINAL */}
          {activeTab === "pos" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in-50 duration-200">
              {/* Product Catalog Picker (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search product name or scan SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {["All", "Skincare", "Makeup", "Hair", "Fragrance", "Body Oils", "Soaps"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                          selectedCategory === cat
                            ? "bg-[#0F172A] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto p-1">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addToBasket(p)}
                      className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-50 mb-2.5">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="size-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{p.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{money(p.price)}</span>
                        <button className="size-7 rounded-lg bg-slate-100 hover:bg-[#0F172A] hover:text-white transition grid place-items-center text-slate-700">
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Basket / Checkout Register (5 cols) */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between h-[680px]">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <Store className="size-4" /> Current Register
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      {basket.length} items
                    </span>
                  </div>

                  <div className="py-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Customer
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 mt-0.5"
                      />
                    </div>
                  </div>

                  <div className="h-56 overflow-y-auto divide-y divide-slate-100 pr-1">
                    {basket.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                        <ShoppingCart className="size-8 stroke-1 mb-2 opacity-50" />
                        Register basket empty. Click products to add.
                      </div>
                    ) : (
                      basket.map((item) => (
                        <div
                          key={item.id}
                          className="py-2.5 flex items-center justify-between text-xs"
                        >
                          <div className="flex-1 pr-2">
                            <p className="font-bold text-slate-900 line-clamp-1">{item.name}</p>
                            <span className="text-[10px] text-slate-400">
                              {money(item.price)} each
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(item.id, -1)}
                              className="size-6 rounded-md bg-slate-100 hover:bg-slate-200 grid place-items-center"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="font-bold w-4 text-center">{item.qty}</span>
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              className="size-6 rounded-md bg-slate-100 hover:bg-slate-200 grid place-items-center"
                            >
                              <Plus className="size-3" />
                            </button>
                            <span className="font-bold text-slate-900 w-16 text-right">
                              {money(item.price * item.qty)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "mpesa", label: "M-Pesa", icon: Smartphone },
                      { id: "cash", label: "Cash", icon: Banknote },
                      { id: "airtel", label: "Airtel", icon: Smartphone },
                      { id: "card", label: "Card", icon: CreditCard },
                    ].map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`p-2 rounded-xl text-center flex flex-col items-center gap-1 text-[11px] font-semibold border transition ${
                            paymentMethod === m.id
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="size-3.5" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1 text-xs pt-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-medium text-slate-900">{money(basketSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Discount</span>
                      <span className="font-medium text-emerald-600">-{money(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100">
                      <span>Payable</span>
                      <span>{money(basketTotal)}</span>
                    </div>
                  </div>

                  <button
                    disabled={basket.length === 0}
                    onClick={completeSale}
                    className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition"
                  >
                    Complete Checkout · {money(basketTotal)}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SHIFT RECONCILIATION */}
          {activeTab === "shift" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Shift Cash Reconciliation & Float Audit
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    End-of-shift drawer count and variance sign-off.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-xs text-slate-400 font-medium">Opening Float</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{money(openingCash)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-xs text-slate-400 font-medium">Total Cash Collected</span>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {money(totalCashSales)}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-xs text-slate-400 font-medium">
                    Expected Closing Balance
                  </span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {money(expectedClosingCash)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SALON QUEUE */}
          {activeTab === "salon" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Salon Front Desk & Active Chairs
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live appointments schedule and station check-ins.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-3">
                {appointments.length > 0 ? (
                  appointments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 text-xs"
                    >
                      <div>
                        <span className="font-bold text-emerald-600">{a.timeSlot}</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {a.customerName} · {a.serviceName}
                        </p>
                        <span className="text-[10px] text-slate-400">Stylist: {a.stylistName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{money(a.price)}</span>
                        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 font-bold">
                          {a.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-slate-400 text-xs">
                    No active salon bookings in queue.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* FALLBACK TABS */}
          {activeTab !== "dashboard" &&
            activeTab !== "pos" &&
            activeTab !== "shift" &&
            activeTab !== "salon" && (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-3 animate-in fade-in-50 duration-200">
                <h2 className="text-xl font-bold text-slate-900 uppercase">{activeTab}</h2>
                <p className="text-xs text-slate-400">
                  All data synchronized with Philipo Central Engine.
                </p>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="mt-2 px-4 py-2 rounded-full bg-[#0F172A] text-white text-xs font-semibold"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
        </main>
      </div>

      {/* RECEIPT MODAL */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full p-6 shadow-xl space-y-4 text-xs">
            <div className="text-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Philipo Cosmetics & Salon</h3>
              <p className="text-[10px] text-slate-400">Receipt Ref: {activeReceipt.ref}</p>
              <span className="text-[10px] text-slate-400">
                {activeReceipt.date} · {activeReceipt.salesPerson}
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeReceipt.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span>
                    {it.name} x{it.qty}
                  </span>
                  <span className="font-bold">{money(it.price * it.qty)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="flex justify-between font-bold text-sm text-slate-900">
                <span>Total Paid</span>
                <span>{money(activeReceipt.total)}</span>
              </div>
              <span className="text-[10px] text-slate-400">Method: {activeReceipt.payMethod}</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 rounded-full bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
                >
                  Print Slip
                </button>
                <button
                  onClick={() => {
                    const inv = getInvoiceById(activeReceipt.ref);
                    if (inv) {
                      downloadInvoicePDF(inv);
                    }
                  }}
                  className="flex-1 py-2 rounded-full bg-[#174A35] hover:bg-[#0F3326] text-white font-semibold flex items-center justify-center gap-1.5"
                >
                  <Download className="size-3.5" />
                  <span>Tax Invoice PDF</span>
                </button>
              </div>
              <button
                onClick={() => setActiveReceipt(null)}
                className="w-full py-2 rounded-full bg-slate-900 text-white font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default SalesHubDashboard;
