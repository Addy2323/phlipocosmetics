import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  CalendarHeart,
  Heart,
  MapPin,
  Lock,
  Bell,
  Search,
  PanelLeft,
  Sun,
  Moon,
  Download,
  Plus,
  TrendingUp,
  LogOut,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  ExternalLink,
  Users,
  Scissors,
  Crown,
  Store,
  Briefcase,
  Award,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Receipt,
  FileText,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { money, products } from "@/data/shop";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { updateUserProfileClient } from "@/lib/auth-client";
import { useWishlist } from "@/lib/wishlist";
import { getStoredAppointments, SalonAppointmentRecord } from "@/lib/salon-data";
import { getStoredOrders, StoreOrder } from "@/lib/orders-store";
import { getInvoicesByCustomer, Invoice } from "@/lib/invoices-store";
import { downloadInvoicePDF } from "@/lib/invoice-pdf";
import { InvoiceModal } from "@/components/admin/InvoiceModal";
import {
  getResellerApplicationByUserId,
  ResellerApplication,
  formatNINDisplay,
} from "@/lib/reseller-store";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Philipo — Customer AI Dashboard" },
      {
        name: "description",
        content: "Orders, salon bookings, wishlist, addresses and loyalty points in one place.",
      },
    ],
  }),
  component: AccountDashboard,
});

type CustomerTab =
  | "dashboard"
  | "orders"
  | "bookings"
  | "invoices"
  | "wishlist"
  | "partner"
  | "addresses"
  | "security"
  | "notifications";

type Address = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  street: string;
  city: string;
  is_default: boolean;
};

export function AccountDashboard() {
  const { user, loading, updateUser } = useAuth();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active navigation tab matching Dashforge AI menu
  const [activeTab, setActiveTab] = useState<CustomerTab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("philipo_dashboard_theme") === "dark";
    } catch {
      return false;
    }
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("philipo_dashboard_theme", next ? "dark" : "light");
      } catch (err) {
        console.error("Failed to save account dashboard theme:", err);
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

  // Customer Profile state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password update state
  const [newPassword, setNewPassword] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addr, setAddr] = useState({
    label: "Home",
    recipient: "",
    phone: "",
    street: "",
    city: "Dar es Salaam",
  });

  // Interactive Spline Chart Hover Point
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Dynamic Real Orders & Salon Appointments
  interface CustomerOrderView {
    id: string;
    date: string;
    total: number;
    items: string;
    status: string;
    color: string;
  }
  const [customerOrders, setCustomerOrders] = useState<CustomerOrderView[]>([]);
  const [customerBookings, setCustomerBookings] = useState<SalonAppointmentRecord[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Reseller / Partner Application state
  const [resellerApp, setResellerApp] = useState<ResellerApplication | null>(null);

  useEffect(() => {
    if (!user) return;
    setResellerApp(getResellerApplicationByUserId(user.id));
    const loadUserData = () => {
      const storedOrders = getStoredOrders();
      const userPhoneClean = (user.phone || "").replace(/\D/g, "").slice(-9);

      const userOrders = storedOrders
        .filter((o) => {
          const orderPhoneClean = (o.customerPhone || "").replace(/\D/g, "").slice(-9);
          const phoneMatch = userPhoneClean && orderPhoneClean && userPhoneClean === orderPhoneClean;
          const emailMatch =
            user.email && o.customerEmail && user.email.toLowerCase() === o.customerEmail.toLowerCase();
          const nameMatch =
            user.fullName && o.customerName && user.fullName.toLowerCase() === o.customerName.toLowerCase();
          const idMatch = (o as any).userId && (o as any).userId === user.id;
          return phoneMatch || emailMatch || nameMatch || idMatch;
        })
        .map((o) => ({
          id: o.orderNumber || o.id,
          date: new Date(o.createdAt || Date.now()).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          total: o.total,
          items: o.items?.map((i) => `${i.qty}× ${i.name}`).join(", ") || "Cosmetics Order",
          status: o.fulfillmentStatus || "Processing",
          color:
            o.fulfillmentStatus === "Delivered"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-blue-50 text-blue-700 border-blue-200",
        }));
      setCustomerOrders(userOrders);

      const storedAppts = getStoredAppointments();
      const userAppts = storedAppts.filter(
        (a) =>
          (user.phone && a.customerPhone && (user.phone.replace(/\D/g, "").slice(-9) === a.customerPhone.replace(/\D/g, "").slice(-9))) ||
          (user.fullName && a.customerName && user.fullName.toLowerCase() === a.customerName.toLowerCase()),
      );
      setCustomerBookings(userAppts);

      const userInvs = getInvoicesByCustomer(user.id, user.phone, user.email);
      setCustomerInvoices(userInvs);
    };

    loadUserData();
    window.addEventListener("philipo_orders_updated", loadUserData);
    window.addEventListener("storage", loadUserData);
    return () => {
      window.removeEventListener("philipo_orders_updated", loadUserData);
      window.removeEventListener("storage", loadUserData);
    };
  }, [user]);

  // Spending Trends Data for Spline Chart (Derived from real orders)
  const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const customerMonthlyData = [
    { month: "Jan", val: Math.round((totalSpent * 0.15) / 1000), x: 50, y: 155 },
    { month: "Feb", val: Math.round((totalSpent * 0.2) / 1000), x: 175, y: 180 },
    { month: "Mar", val: Math.round((totalSpent * 0.18) / 1000), x: 300, y: 215 },
    { month: "Apr", val: Math.round((totalSpent * 0.22) / 1000), x: 425, y: 90 },
    { month: "May", val: Math.round((totalSpent * 0.25) / 1000), x: 550, y: 70 },
  ];

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setFullName(data?.full_name ?? "");
        setPhone(data?.phone ?? "");
      });
    supabase
      .from("addresses")
      .select("id, label, recipient, phone, street, city, is_default")
      .eq("user_id", user.id)
      .order("created_at")
      .then(({ data }) => setAddresses(data ?? []));
  }, [user]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  async function saveProfile() {
    if (!user) return;
    try {
      const updated = await updateUserProfileClient(user.id, { fullName, phone });
      updateUser(updated);
      setEditingProfile(false);
      setProfileSaved(true);
      toast("Saved", { description: "Profile information updated." });
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      setEditingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    setChangingPassword(true);
    setPasswordError("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordChanged(true);
      setNewPassword("");
      toast.success("Password Updated", { description: "Your account password has been changed." });
      setTimeout(() => setPasswordChanged(false), 3000);
    }
  }

  async function addAddress() {
    if (!user) return;
    const { data } = await supabase
      .from("addresses")
      .insert({ user_id: user.id, ...addr, is_default: addresses.length === 0 })
      .select("id, label, recipient, phone, street, city, is_default")
      .single();
    if (data) setAddresses((prev) => [...prev, data]);
    setAddingAddress(false);
    setAddr({ label: "Home", recipient: "", phone: "", street: "", city: "Dar es Salaam" });
    toast("Saved", { description: "Delivery address added." });
  }

  async function removeAddress(id: string) {
    if (!user) return;
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("addresses").delete().eq("user_id", user.id).eq("id", id);
    toast("Address removed");
  }

  const wished = products.filter((p) => wishlist.has(p.id));
  const displayName = fullName || user?.email?.split("@")[0] || "Client";
  const userInitial = displayName.charAt(0).toUpperCase();

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] grid place-items-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="size-14 rounded-2xl bg-slate-900 text-white font-bold text-xl flex items-center justify-center mx-auto">
            C
          </div>
          <h1 className="text-xl font-bold text-slate-900">Sign in to My Philipo</h1>
          <p className="text-xs text-slate-500">
            Access your orders, salon bookings, wishlist and saved addresses.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full py-2.5 rounded-full bg-[#0F172A] text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="w-full py-2.5 rounded-full border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Create Account
            </Link>
          </div>
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
                <span
                  className={`text-base font-bold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}
                >
                  Philipo
                </span>
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
                { id: "orders", label: "Orders", icon: Package },
                { id: "bookings", label: "Salon Bookings", icon: CalendarHeart },
                { id: "invoices", label: "My Invoices", icon: Receipt },
                { id: "wishlist", label: "Wishlist", icon: Heart },
                { id: "partner", label: "Partner Center", icon: Store },
                { id: "addresses", label: "Addresses", icon: MapPin },
                { id: "security", label: "Security", icon: Lock },
                { id: "notifications", label: "Notifications", icon: Bell },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as CustomerTab)}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                      isActive
                        ? "bg-[#2563EB] text-white shadow-lg shadow-blue-600/30 font-semibold"
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
          className={`h-16 shrink-0 p-4 border-t ${darkMode ? "border-[#131B2E]" : "border-slate-50"} flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs">
              {userInitial}
            </div>
            {!sidebarCollapsed && (
              <div className="text-left">
                <p
                  className={`text-xs font-semibold leading-none truncate max-w-[120px] ${darkMode ? "text-white" : "text-slate-900"}`}
                >
                  {displayName}
                </p>
                <span className="text-[10px] text-amber-500 font-medium">Gold Member</span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT WRAPPER (Scrolls independently)              */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
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
                className={`w-full rounded-full pl-9 pr-4 py-1.5 text-xs transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${inputBg}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                darkMode
                  ? "border-[#1E293B] text-slate-300 bg-[#0E1726]"
                  : "border-slate-200 text-slate-600 bg-slate-50"
              }`}
            >
              TSh TZS
            </div>

            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition ${
                darkMode
                  ? "text-amber-400 hover:bg-white/10"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
              title={darkMode ? "Switch to light theme" : "Switch to midnight navy theme"}
            >
              {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <Link
              to="/salon"
              className={`inline-flex items-center gap-1.5 ${
                darkMode
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-[#0F172A] hover:bg-slate-800 text-white"
              } rounded-full px-4 py-1.5 text-xs font-semibold shadow-xs transition`}
            >
              <Scissors className="size-3.5" />
              <span>Book Salon</span>
            </Link>

            <div className="size-8 rounded-full bg-teal-500/10 border-2 border-teal-500 text-teal-500 font-bold text-xs flex items-center justify-center select-none shadow-xs">
              {userInitial}
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* TAB 1: DASHBOARD (Overview) */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${textPrimary}`}>
                    Dashboard
                  </h1>
                  <p className={`text-xs ${textSecondary} mt-0.5 flex items-center gap-1`}>
                    Welcome back <span className="inline-block">👋</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/shop"
                    search={{ category: undefined }}
                    className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-full px-4 py-2 text-xs font-semibold shadow-lg shadow-blue-600/20 transition self-start sm:self-auto"
                  >
                    <Plus className="size-3.5" />
                    <span>Shop Catalog</span>
                  </Link>
                </div>
              </div>

              <div className={`text-sm font-bold ${textPrimary} pt-1`}>Dashboard</div>

              {/* 4 TOP KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div
                  className={`${cardBg} rounded-2xl border p-5 flex items-start justify-between`}
                >
                  <div>
                    <span className={`text-xs font-medium ${textSecondary}`}>Beauty Points</span>
                    <h3
                      className={`text-2xl sm:text-[26px] font-bold ${textPrimary} tracking-tight mt-1`}
                    >
                      2,480
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
                      <TrendingUp className="size-3.5 stroke-[2.5]" />
                      <span>Gold Tier VIP</span>
                    </div>
                  </div>
                  <div
                    className={`size-11 rounded-2xl ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-[#EAFBF3] text-[#10B981]"} flex items-center justify-center font-bold text-sm shrink-0`}
                  >
                    TZS
                  </div>
                </div>

                <div
                  className={`${cardBg} rounded-2xl border p-5 flex items-start justify-between`}
                >
                  <div>
                    <span className={`text-xs font-medium ${textSecondary}`}>Total Orders</span>
                    <h3
                      className={`text-2xl sm:text-[26px] font-bold ${textPrimary} tracking-tight mt-1`}
                    >
                      14
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
                      <TrendingUp className="size-3.5 stroke-[2.5]" />
                      <span>1 out for delivery</span>
                    </div>
                  </div>
                  <div
                    className={`size-11 rounded-2xl ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]"} flex items-center justify-center shrink-0`}
                  >
                    <ShoppingCart className="size-5" />
                  </div>
                </div>

                <div
                  className={`${cardBg} rounded-2xl border p-5 flex items-start justify-between`}
                >
                  <div>
                    <span className={`text-xs font-medium ${textSecondary}`}>Salon Visits</span>
                    <h3
                      className={`text-2xl sm:text-[26px] font-bold ${textPrimary} tracking-tight mt-1`}
                    >
                      6
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
                      <TrendingUp className="size-3.5 stroke-[2.5]" />
                      <span>Sat 10:30 confirmed</span>
                    </div>
                  </div>
                  <div
                    className={`size-11 rounded-2xl ${darkMode ? "bg-purple-500/10 text-purple-400" : "bg-[#F5F3FF] text-[#8B5CF6]"} flex items-center justify-center shrink-0`}
                  >
                    <Users className="size-5" />
                  </div>
                </div>

                <div
                  className={`${cardBg} rounded-2xl border p-5 flex items-start justify-between`}
                >
                  <div>
                    <span className={`text-xs font-medium ${textSecondary}`}>Wishlist Items</span>
                    <h3
                      className={`text-2xl sm:text-[26px] font-bold ${textPrimary} tracking-tight mt-1`}
                    >
                      {wished.length || 8}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 mt-2">
                      <TrendingUp className="size-3.5 stroke-[2.5]" />
                      <span>2 in stock now</span>
                    </div>
                  </div>
                  <div
                    className={`size-11 rounded-2xl ${darkMode ? "bg-rose-500/10 text-rose-400" : "bg-[#FEF2F2] text-[#EF4444]"} flex items-center justify-center shrink-0`}
                  >
                    <Bell className="size-5" />
                  </div>
                </div>
              </div>

              {/* TWO MAIN CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div
                  className={`lg:col-span-8 ${cardBg} rounded-2xl border p-6 flex flex-col justify-between`}
                >
                  <div>
                    <h3 className={`font-bold text-base ${textPrimary}`}>
                      Beauty Spending Overview
                    </h3>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>
                      Monthly orders & salon loyalty points trends
                    </p>
                  </div>

                  <div className="mt-6 relative w-full h-64 select-none">
                    <svg viewBox="0 0 600 240" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="#2563EB"
                            stopOpacity={darkMode ? "0.25" : "0.12"}
                          />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {[
                        { val: "800K", y: 20 },
                        { val: "600K", y: 70 },
                        { val: "400K", y: 120 },
                        { val: "200K", y: 170 },
                        { val: "0", y: 220 },
                      ].map((tick) => (
                        <g key={tick.val}>
                          <text
                            x="25"
                            y={tick.y + 3}
                            textAnchor="end"
                            className={`text-[10px] ${darkMode ? "fill-[#8899A6]" : "fill-slate-400"} font-medium`}
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
                        d="M 50 155 C 100 155, 130 180, 175 180 C 230 180, 260 215, 300 215 C 360 215, 380 90, 425 90 C 470 90, 500 70, 550 70 L 550 220 L 50 220 Z"
                        fill="url(#custGrad)"
                      />

                      <path
                        d="M 50 155 C 100 155, 130 180, 175 180 C 230 180, 260 215, 300 215 C 360 215, 380 90, 425 90 C 470 90, 500 70, 550 70"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {customerMonthlyData.map((pt, idx) => (
                        <g
                          key={pt.month}
                          onMouseEnter={() => setHoveredMonth(idx)}
                          onMouseLeave={() => setHoveredMonth(null)}
                          className="cursor-pointer"
                        >
                          <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
                          {hoveredMonth === idx && (
                            <>
                              <circle cx={pt.x} cy={pt.y} r="6" fill="#3B82F6" fillOpacity="0.25" />
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
                                fill={darkMode ? "#0F172A" : "#0F172A"}
                                stroke={darkMode ? "#1E293B" : "none"}
                                strokeWidth="1"
                              />
                              <text
                                x={pt.x}
                                y={pt.y - 18}
                                textAnchor="middle"
                                className="text-[10px] fill-white font-bold"
                              >
                                {money(pt.val * 1000)}
                              </text>
                            </>
                          )}
                          <text
                            x={pt.x}
                            y="238"
                            textAnchor="middle"
                            className={`text-[11px] ${darkMode ? "fill-[#8899A6]" : "fill-slate-400"} font-medium`}
                          >
                            {pt.month}
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
                    <h3 className={`font-bold text-base ${textPrimary}`}>Order & Booking Mix</h3>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>Fulfillment status ratio</p>
                  </div>

                  <div className="my-auto py-4 flex flex-col items-center justify-center">
                    <div className="relative size-48 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                        {/* Delivered 60% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="13"
                          strokeDasharray="144 96"
                          strokeDashoffset="0"
                        />
                        {/* Confirmed Salon 25% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="13"
                          strokeDasharray="60 180"
                          strokeDashoffset="-144"
                        />
                        {/* In Transit 15% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="13"
                          strokeDasharray="36 204"
                          strokeDashoffset="-204"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={`text-2xl font-extrabold ${textPrimary} tracking-tight`}>
                          20
                        </span>
                        <span className={`text-[11px] font-medium ${textSecondary}`}>
                          Total Done
                        </span>
                      </div>
                    </div>

                    <div
                      className={`flex flex-wrap items-center justify-center gap-3 mt-4 text-[11px] ${textSecondary} font-medium`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-[#10B981]" />
                        <span>Delivered</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-[#3B82F6]" />
                        <span>Salon</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-[#8B5CF6]" />
                        <span>In Transit</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RECENT ORDERS TABLE */}
              <div className={`${cardBg} rounded-2xl border p-6`}>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className={`font-bold text-base ${textPrimary}`}>
                      Recent Orders & Appointments
                    </h3>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>
                      Your recent beauty checkouts and confirmed salon bookings
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                      darkMode
                        ? "border-[#1E293B] text-slate-300 hover:bg-[#15213B]"
                        : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    View All Orders
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={tableHeaderClass}>
                        <th className="pb-3 font-medium">Order ID</th>
                        <th className="pb-3 font-medium">Items / Service</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody
                      className={
                        darkMode ? "divide-y divide-[#15213B]" : "divide-y divide-slate-50"
                      }
                    >
                      {customerOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className={`py-8 text-center ${textSecondary}`}>
                            No orders placed yet. Products you purchase from the store will appear
                            here.
                          </td>
                        </tr>
                      ) : (
                        customerOrders.map((ord) => (
                          <tr key={ord.id} className={tableRowClass}>
                            <td className={`py-3.5 font-bold ${textPrimary}`}>{ord.id}</td>
                            <td
                              className={`py-3.5 ${darkMode ? "text-slate-300" : "text-slate-700"} max-w-xs truncate`}
                            >
                              {ord.items}
                            </td>
                            <td className={`py-3.5 ${textSecondary}`}>{ord.date}</td>
                            <td className={`py-3.5 font-bold ${textPrimary}`}>
                              {money(ord.total)}
                            </td>
                            <td className="py-3.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${ord.color}`}
                              >
                                {ord.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <Link
                                to="/track"
                                className={`text-xs font-semibold ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-slate-900"} hover:underline`}
                              >
                                Track
                              </Link>
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

          {/* TAB 2: ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${textPrimary}`}>
                  My Orders & Shipment Tracking
                </h1>
                <p className={`text-xs ${textSecondary} mt-0.5`}>
                  Track every parcel from fulfillment at Philipo Flagship to your doorstep.
                </p>
              </div>

              {customerOrders.length === 0 ? (
                <div className={`${cardBg} p-12 rounded-2xl border text-center space-y-3`}>
                  <div
                    className={`size-12 rounded-full ${darkMode ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-400"} mx-auto flex items-center justify-center`}
                  >
                    <Package className="size-6" />
                  </div>
                  <h3 className={`font-bold ${textPrimary} text-base`}>No Orders Yet</h3>
                  <p className={`text-xs ${textSecondary} max-w-sm mx-auto`}>
                    You haven't placed any cosmetics or beauty orders yet. Browse our store to make
                    your first order.
                  </p>
                  <Link
                    to="/shop"
                    search={{ category: undefined }}
                    className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-full px-5 py-2 text-xs font-semibold shadow-xs transition mt-2"
                  >
                    Explore Shop
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((o) => (
                    <div
                      key={o.id}
                      className={`${cardBg} p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${textPrimary} text-sm`}>{o.id}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${o.color}`}
                          >
                            {o.status}
                          </span>
                        </div>
                        <p className={`${darkMode ? "text-slate-300" : "text-slate-600"} mt-1`}>
                          {o.items}
                        </p>
                        <span className={`text-[10px] ${textSecondary}`}>{o.date}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`font-bold text-sm ${textPrimary}`}>{money(o.total)}</span>
                        <Link
                          to="/track"
                          className={`px-3.5 py-1.5 rounded-full border ${
                            darkMode
                              ? "border-[#1E293B] text-slate-300 hover:bg-[#15213B]"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          } font-semibold transition`}
                        >
                          Live Tracking
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SALON BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${textPrimary}`}>
                    Salon Appointments
                  </h1>
                  <p className={`text-xs ${textSecondary} mt-0.5`}>
                    Your confirmed hair salon visits and stylist reservations.
                  </p>
                </div>
                <Link
                  to="/salon"
                  className="px-4 py-2 rounded-full bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs"
                >
                  Book New Session
                </Link>
              </div>

              {customerBookings.length === 0 ? (
                <div className={`${cardBg} p-12 rounded-2xl border text-center space-y-3`}>
                  <div
                    className={`size-12 rounded-full ${darkMode ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-400"} mx-auto flex items-center justify-center`}
                  >
                    <Scissors className="size-6" />
                  </div>
                  <h3 className={`font-bold ${textPrimary} text-base`}>
                    No Salon Appointments Yet
                  </h3>
                  <p className={`text-xs ${textSecondary} max-w-sm mx-auto`}>
                    You have no scheduled salon sessions. Choose a hair styling, braiding, or
                    treatment appointment with our stylists.
                  </p>
                  <Link
                    to="/salon"
                    className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-full px-5 py-2 text-xs font-semibold shadow-xs transition mt-2"
                  >
                    Book Salon Session
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerBookings.map((b) => (
                    <div
                      key={b.id}
                      className={`${cardBg} p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${textPrimary} text-sm`}>
                            {b.serviceName}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${darkMode ? "bg-purple-500/10 text-purple-400 border-purple-500/30" : "bg-purple-50 text-purple-700 border-purple-200"}`}
                          >
                            {b.status || "Confirmed"}
                          </span>
                        </div>
                        <p className={`${textSecondary} mt-0.5`}>
                          Stylist: <strong className={textPrimary}>{b.stylistName}</strong> ·{" "}
                          {b.appointmentDate} at {b.timeSlot}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`font-bold text-sm ${textPrimary}`}>
                          {money(b.price || 35000)}
                        </span>
                        <Link
                          to="/salon"
                          className={`px-3.5 py-1.5 rounded-full border ${
                            darkMode
                              ? "border-[#1E293B] text-slate-300 hover:bg-[#15213B]"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          } font-semibold transition`}
                        >
                          Reschedule
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: MY INVOICES */}
          {activeTab === "invoices" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${textPrimary}`}>
                    My Invoices & Receipts
                  </h1>
                  <p className={`text-xs ${textSecondary} mt-0.5`}>
                    Download official full-color PDF tax invoices for your cosmetics orders and salon sessions.
                  </p>
                </div>
              </div>

              <div className={`${cardBg} rounded-2xl border p-6`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={tableHeaderClass}>
                        <th className="pb-3 font-medium">Invoice #</th>
                        <th className="pb-3 font-medium">Issue Date</th>
                        <th className="pb-3 font-medium">Type & Ref</th>
                        <th className="pb-3 font-medium text-right">Total Amount</th>
                        <th className="pb-3 font-medium text-right">Paid</th>
                        <th className="pb-3 font-medium text-center">Payment Status</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={darkMode ? "divide-y divide-[#15213B]" : "divide-y divide-slate-50"}>
                      {customerInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className={`py-12 text-center ${textSecondary}`}>
                            No tax invoices on file yet. Once you complete checkout or salon appointments, official invoices appear here.
                          </td>
                        </tr>
                      ) : (
                        customerInvoices.map((inv) => (
                          <tr key={inv.id} className={tableRowClass}>
                            <td className={`py-3.5 font-mono font-bold ${textPrimary}`}>
                              {inv.invoiceNumber}
                            </td>
                            <td className={`py-3.5 ${textSecondary}`}>
                              {new Date(inv.issuedAt).toLocaleDateString("en-TZ", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-3.5">
                              <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                                {inv.type}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400 block">
                                #{inv.orderId || inv.appointmentId || inv.paymentReference}
                              </span>
                            </td>
                            <td className={`py-3.5 text-right font-mono font-bold ${textPrimary}`}>
                              TZS {inv.total.toLocaleString()}
                            </td>
                            <td className="py-3.5 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                              TZS {inv.amountPaid.toLocaleString()}
                            </td>
                            <td className="py-3.5 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.status === "PAID"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedInvoice(inv);
                                    setInvoiceModalOpen(true);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                    darkMode
                                      ? "border-[#1E293B] text-slate-300 hover:bg-[#15213B]"
                                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => {
                                    downloadInvoicePDF(inv);
                                    toast.success("PDF Downloaded", {
                                      description: `Saved Philipo_Invoice_${inv.invoiceNumber}.pdf`,
                                    });
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#174A35] hover:bg-[#0F3326] text-white shadow-xs transition inline-flex items-center gap-1"
                                >
                                  <Download className="size-3" />
                                  <span>PDF</span>
                                </button>
                              </div>
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

          {/* TAB 4: WISHLIST */}
          {activeTab === "wishlist" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${textPrimary}`}>
                  Saved Wishlist
                </h1>
                <p className={`text-xs ${textSecondary} mt-0.5`}>
                  Your curated favorite skincare and hair formulations.
                </p>
              </div>

              {wished.length === 0 ? (
                <div className={`${cardBg} p-12 rounded-2xl border text-center space-y-3`}>
                  <Heart className="size-10 stroke-1 text-slate-400 mx-auto" />
                  <p className={`text-xs ${textSecondary}`}>Your wishlist is currently empty.</p>
                  <Link
                    to="/shop"
                    search={{ category: undefined }}
                    className="inline-block px-4 py-2 rounded-full bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold"
                  >
                    Explore Shop
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {wished.map((p) => (
                    <div
                      key={p.id}
                      className={`${cardBg} p-4 rounded-2xl border flex flex-col justify-between space-y-3`}
                    >
                      <div>
                        <img
                          src={p.image}
                          alt={p.name}
                          className="aspect-square w-full rounded-xl object-cover"
                        />
                        <h4 className={`font-bold text-xs ${textPrimary} mt-2 line-clamp-1`}>
                          {p.name}
                        </h4>
                        <span className={`text-[10px] ${textSecondary}`}>{p.category}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className={`font-bold text-xs ${textPrimary}`}>{money(p.price)}</span>
                        <button
                          onClick={() => wishlist.toggle(p.id)}
                          className="text-xs text-rose-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PARTNER CENTER (Business Partner & Reseller) */}
          {activeTab === "partner" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${textPrimary}`}>
                  {resellerApp?.status === "APPROVED"
                    ? "Philipo Partner Center™ — Authorized Reseller Hub"
                    : "Business Partner & Regional Reseller Program"}
                </h1>
                <p className={`text-xs ${textSecondary} mt-0.5`}>
                  {resellerApp?.status === "APPROVED"
                    ? "Manage wholesale stock orders, regional territory allocation, and distributor benefits."
                    : "Official onboarding for retail outlets, beauty salons, and cosmetics distributors across Tanzania."}
                </p>
              </div>

              {!resellerApp || resellerApp.status === "DRAFT" ? (
                /* Card: Apply to become a reseller */
                <div className={`${cardBg} p-8 rounded-3xl border space-y-6 shadow-sm`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                        <Sparkles className="size-3.5" />
                        <span>Now Onboarding: Morogoro, Njombe, Dar es Salaam & Nationwide</span>
                      </div>
                      <h2 className={`text-xl font-bold ${textPrimary}`}>
                        Become an Authorized Philipo Cosmetics Reseller
                      </h2>
                      <p className={`text-xs ${textSecondary} leading-relaxed`}>
                        Expand your beauty salon, cosmetic shop, or online distribution business
                        with Tanzania's premium luxury beauty brand. Access exclusive wholesale
                        margins, authentic TBS-certified products, priority logistics, and official
                        Philipo marketing collateral.
                      </p>
                    </div>

                    <Link
                      to="/partner-apply"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0F4D32] hover:bg-[#0B3B26] text-white font-bold text-xs shadow-lg shadow-[#0F4D32]/25 shrink-0 transition"
                    >
                      <Store className="size-4" />
                      <span>Start Reseller Application</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>

                  {/* 4 Pillars of Reseller Program */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-xs">
                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                      <div className="size-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        25%
                      </div>
                      <h4 className={`font-bold ${textPrimary}`}>Wholesale Margins</h4>
                      <p className={`text-[11px] ${textSecondary}`}>
                        Guaranteed wholesale discount tiers with high return on investment.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-1.5">
                      <div className="size-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                        <MapPin className="size-4" />
                      </div>
                      <h4 className={`font-bold ${textPrimary}`}>Territory Allocation</h4>
                      <p className={`text-[11px] ${textSecondary}`}>
                        Sell in designated regional zones like Morogoro Urban, Makambako, or Njombe.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-1.5">
                      <div className="size-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                        <ShieldCheck className="size-4" />
                      </div>
                      <h4 className={`font-bold ${textPrimary}`}>NIDA Verified</h4>
                      <p className={`text-[11px] ${textSecondary}`}>
                        Fast KYC onboarding and full compliance with Tanzania PDPA 2022.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-1.5">
                      <div className="size-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                        <Package className="size-4" />
                      </div>
                      <h4 className={`font-bold ${textPrimary}`}>Intercity Dispatch</h4>
                      <p className={`text-[11px] ${textSecondary}`}>
                        Fast cargo freight from Kariakoo Flagship to your local depot.
                      </p>
                    </div>
                  </div>
                </div>
              ) : resellerApp.status === "APPROVED" ? (
                /* Card: Approved Partner Center */
                <div className="space-y-6">
                  <div className={`${cardBg} p-6 rounded-3xl border shadow-sm space-y-4`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                            <CheckCircle className="size-3.5" />
                            Official Verified Reseller
                          </span>
                          <span className="text-xs font-mono font-bold text-gray-500">
                            Partner Code: {resellerApp.partnerCode || "PHL-PARTNER-ACTIVE"}
                          </span>
                        </div>
                        <h2 className={`text-xl font-bold ${textPrimary} mt-2`}>
                          {resellerApp.shopName}
                        </h2>
                        <p className={`text-xs ${textSecondary} mt-0.5`}>
                          Authorized Distributor · {resellerApp.fullName} ({resellerApp.phone})
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          to="/shop"
                          search={{ category: undefined }}
                          className="px-5 py-2.5 rounded-full bg-[#0F4D32] hover:bg-[#0B3B26] text-white text-xs font-bold shadow-md shadow-[#0F4D32]/20 transition flex items-center gap-1.5"
                        >
                          <Package className="size-3.5" />
                          <span>Order Wholesale Stock</span>
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className={textSecondary}>Reseller Wholesale Margin:</span>
                        <p className="text-lg font-bold text-emerald-600">
                          {resellerApp.resellerDiscountRate || 25}% Active Discount
                        </p>
                      </div>

                      <div>
                        <span className={textSecondary}>Authorized Operating Territory:</span>
                        <p className={`font-bold ${textPrimary} text-xs mt-0.5`}>
                          {resellerApp.territories.join(", ") || resellerApp.region}
                        </p>
                      </div>

                      <div>
                        <span className={textSecondary}>NIDA NIN (Verified):</span>
                        <p className={`font-mono font-bold ${textPrimary} text-xs mt-0.5`}>
                          {formatNINDisplay(resellerApp.nidaNumber)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Card: Application In Progress / Under Review / More Info */
                <div className={`${cardBg} p-6 sm:p-8 rounded-3xl border shadow-sm space-y-6`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            resellerApp.status === "MORE_INFORMATION_REQUIRED"
                              ? "bg-orange-100 text-orange-800 border border-orange-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {resellerApp.status.replace(/_/g, " ")}
                        </span>
                        <span className="font-mono text-xs text-gray-500">
                          Ref: {resellerApp.id}
                        </span>
                      </div>
                      <h2 className={`text-lg font-bold ${textPrimary} mt-2`}>
                        {resellerApp.shopName || "Reseller Application"}
                      </h2>
                      <p className={`text-xs ${textSecondary} mt-0.5`}>
                        Submitted for {resellerApp.territories.join(", ") || resellerApp.region}{" "}
                        region
                      </p>
                    </div>

                    <Link
                      to="/partner-apply"
                      className="px-5 py-2.5 rounded-full bg-[#0F4D32] hover:bg-[#0B3B26] text-white text-xs font-bold shadow-md shadow-[#0F4D32]/20 transition flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <span>Resume / Edit Application</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>

                  {resellerApp.status === "MORE_INFORMATION_REQUIRED" && (
                    <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 text-xs space-y-1">
                      <strong className="block text-orange-800 font-bold">
                        Action Needed from Reviewer:
                      </strong>
                      <p className="leading-relaxed">
                        "
                        {resellerApp.moreInfoReason ||
                          "Please review and upload the requested documentation."}
                        "
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className={textSecondary}>Applicant:</span>
                      <p className={`font-bold ${textPrimary}`}>{resellerApp.fullName}</p>
                    </div>
                    <div>
                      <span className={textSecondary}>NIDA NIN:</span>
                      <p className={`font-mono font-bold ${textPrimary}`}>
                        {formatNINDisplay(resellerApp.nidaNumber)}
                      </p>
                    </div>
                    <div>
                      <span className={textSecondary}>Target Territory:</span>
                      <p className={`font-bold ${textPrimary}`}>
                        {resellerApp.territories.join(", ")}
                      </p>
                    </div>
                    <div>
                      <span className={textSecondary}>Submission Date:</span>
                      <p className={`font-bold ${textPrimary}`}>
                        {resellerApp.submittedAt
                          ? new Date(resellerApp.submittedAt).toLocaleDateString("en-GB")
                          : "Draft"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${textPrimary}`}>
                    Saved Delivery Addresses
                  </h1>
                  <p className={`text-xs ${textSecondary} mt-0.5`}>
                    Locations for express doorstep courier deliveries across Tanzania.
                  </p>
                </div>
                <button
                  onClick={() => setAddingAddress(true)}
                  className="px-4 py-2 rounded-full bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs"
                >
                  Add Address
                </button>
              </div>

              {addingAddress && (
                <div className={`${cardBg} p-5 rounded-2xl border space-y-3 text-xs`}>
                  <h3 className={`font-bold ${textPrimary}`}>New Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Label (e.g. Home, Office)"
                      value={addr.label}
                      onChange={(e) => setAddr({ ...addr, label: e.target.value })}
                      className={`${inputBg} rounded-xl p-2 text-xs`}
                    />
                    <input
                      placeholder="Recipient Name"
                      value={addr.recipient}
                      onChange={(e) => setAddr({ ...addr, recipient: e.target.value })}
                      className={`${inputBg} rounded-xl p-2 text-xs`}
                    />
                    <input
                      placeholder="Phone (+255 ...)"
                      value={addr.phone}
                      onChange={(e) => setAddr({ ...addr, phone: e.target.value })}
                      className={`${inputBg} rounded-xl p-2 text-xs`}
                    />
                    <input
                      placeholder="Street / Landmark"
                      value={addr.street}
                      onChange={(e) => setAddr({ ...addr, street: e.target.value })}
                      className={`${inputBg} rounded-xl p-2 text-xs`}
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => setAddingAddress(false)}
                      className={`px-3 py-1.5 border rounded-full ${darkMode ? "border-[#1E293B] text-slate-300" : "border-slate-200 text-slate-700"}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addAddress}
                      className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-full font-semibold"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className={`${cardBg} p-5 rounded-2xl border flex justify-between text-xs`}
                  >
                    <div>
                      <span className={`font-bold text-sm ${textPrimary}`}>{a.label}</span>
                      <p className={`${darkMode ? "text-slate-300" : "text-slate-600"} mt-1`}>
                        {a.recipient} · {a.phone}
                      </p>
                      <p className={textSecondary}>
                        {a.street}, {a.city}
                      </p>
                    </div>
                    <button
                      onClick={() => removeAddress(a.id)}
                      className="text-rose-500 hover:text-rose-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${textPrimary}`}>
                  Account Security & Password
                </h1>
                <p className={`text-xs ${textSecondary} mt-0.5`}>
                  Update your authentication credentials and login passkeys.
                </p>
              </div>

              <div className={`${cardBg} p-6 rounded-2xl border max-w-md space-y-4 text-xs`}>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className={`block font-semibold ${textPrimary} mb-1`}>
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className={`w-full rounded-xl p-2.5 text-xs ${inputBg}`}
                    />
                  </div>
                  {passwordError && <p className="text-rose-500 font-semibold">{passwordError}</p>}
                  {passwordChanged && (
                    <p className="text-emerald-500 font-bold">Password updated successfully ✓</p>
                  )}
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full py-2.5 rounded-full bg-[#2563EB] hover:bg-blue-600 text-white font-semibold disabled:opacity-50 transition"
                  >
                    {changingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 7: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${textPrimary}`}>
                  Notifications & SMS Alerts
                </h1>
                <p className={`text-xs ${textSecondary} mt-0.5`}>
                  Real-time transactional and salon appointment SMS updates.
                </p>
              </div>

              <div className={`${cardBg} p-6 rounded-2xl border space-y-3 text-xs`}>
                {[
                  {
                    title: "Order #PC-24871 Out for Delivery",
                    time: "1 hour ago",
                    desc: "Our Masaki dispatch courier is en route to Chole Rd.",
                  },
                  {
                    title: "Salon Booking Confirmed",
                    time: "Yesterday",
                    desc: "Your appointment for Signature Braiding with Amina Mushi is confirmed for Sat 10:30.",
                  },
                  {
                    title: "VIP Loyalty Points Added",
                    time: "3 days ago",
                    desc: "You earned +250 points on your last cosmetic order.",
                  },
                ].map((n, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border ${darkMode ? "border-[#15213B] bg-[#0E1726]/40" : "border-slate-100"} space-y-1`}
                  >
                    <div className={`flex justify-between font-bold ${textPrimary}`}>
                      <span>{n.title}</span>
                      <span className={`text-[10px] ${textSecondary} font-normal`}>{n.time}</span>
                    </div>
                    <p className={textSecondary}>{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tax Invoice Modal */}
          <InvoiceModal
            invoice={selectedInvoice}
            isOpen={invoiceModalOpen}
            onClose={() => setInvoiceModalOpen(false)}
          />
        </main>
      </div>
    </div>
  );
}
export default AccountDashboard;
