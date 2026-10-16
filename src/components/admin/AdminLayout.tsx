import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Store,
  BarChart2,
  Package,
  ShoppingCart,
  UserCheck,
  Boxes,
  Layers,
  DollarSign,
  MessageSquare,
  Receipt,
  Search,
  Sun,
  Moon,
  Download,
  PanelLeft,
  LogOut,
  RefreshCw,
  X,
  ArrowRight,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/auth";
import { getResellerApplications, type ResellerApplication } from "@/lib/reseller-store";
import { toast } from "@/components/ui/sonner";

export interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

export function AdminLayout({
  children,
  title,
  subtitle,
  headerAction,
}: AdminLayoutProps) {
  const { user, signOut, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [pendingPartnersCount, setPendingPartnersCount] = useState(0);

  // Persistent theme
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
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
        if (next) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch (err) {
        console.error("Failed to save dashboard theme:", err);
      }
      return next;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Load real pending business partners count
  useEffect(() => {
    try {
      const apps = getResellerApplications();
      const pending = apps.filter(
        (a: ResellerApplication) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW",
      ).length;
      setPendingPartnersCount(pending);
    } catch {
      setPendingPartnersCount(0);
    }
  }, [location.pathname]);

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
  }, [authLoading, user, navigate]);

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080E1A] grid place-items-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <RefreshCw className="size-5 animate-spin text-slate-900 dark:text-white" />
          Verifying Admin Credentials...
        </div>
      </div>
    );
  }

  const currentPath = location.pathname;

  const navItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    {
      to: "/admin/business-partners",
      label: "Business Partners",
      icon: Store,
      badge: pendingPartnersCount,
    },
    { to: "/admin/reports", label: "Reports", icon: BarChart2 },
    { to: "/admin/invoices", label: "Invoices", icon: Receipt },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { to: "/admin/customers", label: "Customers", icon: UserCheck },
    { to: "/admin/inventory", label: "Inventory", icon: Boxes },
    { to: "/admin/categories", label: "Categories", icon: Layers },
    { to: "/admin/coupons", label: "Coupons", icon: DollarSign },
    { to: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  ];

  // Quick navigation search results
  const searchResults = navItems.filter((item) =>
    item.label.toLowerCase().includes(globalSearch.toLowerCase().trim()),
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={`h-screen overflow-hidden ${
        darkMode ? "bg-[#080E1A] text-slate-100" : "bg-[#F8FAFC] text-slate-900"
      } flex antialiased`}
      style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontVariantNumeric: "lining-nums tabular-nums",
      }}
    >
      {/* Styles for print output hiding the sidebar & navigation */}
      <style>{`
        @media print {
          aside, header, #sidebar, .no-print, button {
            display: none !important;
          }
          body, main, div {
            overflow: visible !important;
            height: auto !important;
            background: white !important;
            color: black !important;
          }
          .card-surface, .border {
            border: 1px solid #ddd !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* ========================================================= */}
      {/* LEFT SIDEBAR                                              */}
      {/* ========================================================= */}
      <aside
        id="sidebar"
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } ${
          darkMode ? "bg-[#060A14] border-[#131B2E]" : "bg-white border-slate-100"
        } shrink-0 border-r flex flex-col h-screen overflow-hidden transition-all duration-300 z-30 select-none`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 shrink-0 px-6 flex items-center justify-between border-b ${
            darkMode ? "border-[#131B2E]" : "border-slate-50"
          }`}
        >
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-2.5">
                <img src={logo} alt="Philipo Cosmetics" className="h-8 object-contain" />
                <span className="text-base font-bold tracking-tight">Philipo</span>
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
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentPath === item.to ||
                  (item.to !== "/admin/dashboard" && currentPath.startsWith(item.to));

                return (
                  <Link
                    key={item.to}
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
                    {!sidebarCollapsed && item.badge && item.badge > 0 ? (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-none">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Bottom Profile */}
        <div
          className={`h-16 shrink-0 p-4 border-t ${
            darkMode ? "border-[#131B2E] bg-white/[0.02]" : "border-slate-50 bg-slate-50/50"
          } flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`size-8 rounded-lg ${
                darkMode ? "bg-[#2563EB]" : "bg-slate-900"
              } text-white font-bold flex items-center justify-center text-xs`}
            >
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
            </div>
            {!sidebarCollapsed && (
              <div className="text-left overflow-hidden">
                <p className="text-xs font-semibold leading-none truncate">
                  {user.fullName || "System Admin"}
                </p>
                <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                  {user.email || "admin@philipo.co.tz"}
                </span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => {
                signOut();
                toast.info("Signed out successfully");
                navigate({ to: "/login" });
              }}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN LAYOUT WRAPPER                                       */}
      {/* ========================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-screen overflow-y-auto ${
          darkMode ? "bg-[#080E1A]" : "bg-[#F8FAFC]"
        }`}
      >
        {/* Top Header */}
        <header
          className={`h-16 shrink-0 ${
            darkMode ? "bg-[#080E1A] border-[#131B2E]" : "bg-white border-slate-100"
          } border-b px-6 flex items-center justify-between sticky top-0 z-20`}
        >
          <div className="flex items-center gap-4">
            {/* Sidebar toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg ${
                darkMode
                  ? "text-slate-400 hover:text-white hover:bg-white/5"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              } transition-colors`}
              title="Toggle Sidebar"
            >
              <PanelLeft className="size-4" />
            </button>

            {/* Pill Search Input */}
            <div className="relative w-64 sm:w-80 md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="Search widgets, pages, products..."
                className={`w-full pl-9 pr-4 py-2 rounded-full text-xs transition-all outline-hidden border ${
                  darkMode
                    ? "bg-[#0E1726] border-[#1B273F] text-white placeholder:text-slate-500 focus:border-blue-500"
                    : "bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-slate-300"
                }`}
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3" />
                </button>
              )}

              {/* Global search quick dropdown */}
              {searchFocused && globalSearch.trim().length > 0 && (
                <div className="absolute left-0 top-full mt-2 w-full bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
                    Quick Navigation
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-400">No matching pages found</div>
                  ) : (
                    searchResults.map((r) => (
                      <Link
                        key={r.to}
                        to={r.to}
                        onClick={() => setGlobalSearch("")}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <span className="font-semibold">{r.label}</span>
                        <ArrowRight className="size-3 text-slate-400" />
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-3">
            {/* TZS Currency Chip */}
            <div
              title="Official Business Currency: Tanzanian Shilling (TZS)"
              className={`px-3 py-1 rounded-full border text-[11px] font-bold select-none cursor-help ${
                darkMode
                  ? "border-[#1E293B] bg-[#0E1726] text-emerald-400"
                  : "border-slate-200 bg-slate-50 text-emerald-700"
              }`}
            >
              TSh TZS
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full border transition-colors ${
                darkMode
                  ? "border-[#1E293B] bg-[#0E1726] text-amber-400 hover:bg-[#15213B]"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>

            {/* Print / Download Button */}
            <button
              onClick={handlePrint}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition shadow-xs ${
                darkMode
                  ? "border-[#1E293B] bg-[#0E1726] text-slate-200 hover:bg-[#15213B]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </button>

            {/* Admin Profile Circle */}
            <div
              className={`size-8 rounded-full ${
                darkMode ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-emerald-100 text-emerald-800"
              } font-bold text-xs flex items-center justify-center`}
              title={user.fullName || "Admin"}
            >
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-6 sm:p-8 md:p-10 max-w-7xl w-full mx-auto space-y-6">
          {(title || subtitle || headerAction) && (
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
              <div>
                {title && (
                  <h1
                    className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
                )}
              </div>
              {headerAction && <div>{headerAction}</div>}
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
