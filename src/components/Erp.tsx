import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  ScanBarcode,
  Boxes,
  CalendarHeart,
  ScrollText,
  Store,
  Bell,
  LogOut,
  TrendingUp,
  Headphones,
  Settings,
  ShieldAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import { BRAND } from "@/data/shop";
import { useAuth } from "@/lib/auth";
import type { UserRole } from "@/lib/auth-server";

export function ErpShell() {
  const { user, signOut, hasRole } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  // If user is not staff, show Access Denied
  if (!user || user.role === "customer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="card-surface max-w-md p-8 text-center rise-in">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold">Access Denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are signed in as <strong className="text-foreground">{user?.email ?? "Guest"}</strong> (Role: {user?.role ?? "None"}).
            Staff authorization is required to view the ERP & business control center.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="btn-base btn-primary">
              Sign in with staff account
            </Link>
            <Link to="/" className="btn-base btn-outline">
              Go to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dynamic navigation items filtered by RBAC permissions
  const allSections = [
    { to: "/erp", label: "Dashboard", icon: LayoutDashboard, exact: true, roles: ["admin", "sales", "sales_staff"] as UserRole[] },
    { to: "/erp/sales", label: "Sales & P&L", icon: TrendingUp, roles: ["admin", "sales", "sales_staff"] as UserRole[] },
    { to: "/erp/orders", label: "Orders", icon: ShoppingCart, roles: ["admin", "sales", "sales_staff"] as UserRole[] },
    { to: "/erp/pos", label: "Point of sale", icon: ScanBarcode, roles: ["admin", "sales", "sales_staff"] as UserRole[] },
    { to: "/erp/inventory", label: "Inventory", icon: Boxes, roles: ["admin", "sales", "sales_staff"] as UserRole[] },
    { to: "/erp/salon", label: "Salon ops", icon: CalendarHeart, roles: ["admin", "sales", "sales_staff"] as UserRole[] },
    { to: "/erp/support", label: "Customer service", icon: Headphones, roles: ["admin", "sales", "sales_staff"] as UserRole[] },
    { to: "/erp/settings", label: "Settings", icon: Settings, roles: ["admin"] as UserRole[] },
    { to: "/erp/audit", label: "Audit log", icon: ScrollText, roles: ["admin"] as UserRole[] },
  ];

  const allowedSections = allSections.filter((sec) => sec.roles.includes(user.role));

  const roleLabelMap: Record<UserRole, string> = {
    admin: "Administrator",
    sales: "Sales Executive",
    sales_staff: "Sales Executive",
    customer: "Customer",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-muted/60">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-deep text-deep-foreground md:flex">
        <div className="border-b border-white/10 px-5 py-4">
          <Link to="/" className="inline-block rounded-lg bg-white p-1.5 shadow-sm">
            <img src="/logo.png" alt="Philipo Cosmetics" className="h-8 w-auto object-contain" />
          </Link>
          <p className="eyebrow mt-2 text-gold">Staff ERP · {roleLabelMap[user.role]}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {allowedSections.map(({ to, label, icon: Icon, ...rest }) => {
            const active = "exact" in rest && rest.exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-white font-medium shadow-sm"
                    : "text-deep-foreground/70 hover:bg-sidebar-accent/60 hover:text-white"
                }`}
              >
                <Icon className="size-4.5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-deep-foreground/70 hover:bg-sidebar-accent/60 hover:text-white"
          >
            <Store className="size-4" />
            Storefront
          </Link>
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/login" });
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose hover:bg-rose/20 hover:text-rose transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/">
              <img src="/logo.png" alt="Philipo Cosmetics" className="h-7 w-auto object-contain" />
            </Link>
            <span className="text-xs font-semibold text-primary">ERP</span>
          </div>
          <p className="hidden text-xs text-muted-foreground md:block">
            {BRAND.full} · Enterprise Operations Center
          </p>
          <div className="ml-auto flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="relative grid size-9 place-items-center rounded-full hover:bg-secondary"
            >
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose" />
            </button>
            <div className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {getInitials(user.fullName)}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium leading-tight">{user.fullName}</p>
              <p className="text-[11px] text-muted-foreground">{roleLabelMap[user.role]}</p>
            </div>
            <button
              onClick={() => {
                signOut();
                navigate({ to: "/login" });
              }}
              title="Sign out"
              className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive md:hidden"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>

        <nav className="sticky bottom-0 z-30 grid grid-cols-4 border-t bg-background/95 backdrop-blur-md md:hidden">
          {allowedSections.slice(0, 4).map(({ to, label, icon: Icon, ...rest }) => {
            const active = "exact" in rest && rest.exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] ${
                  active ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-4.5" />
                {label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function ErpPage({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Delivered" || status === "Completed" || status === "Confirmed" || status === "Paid"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : status === "Refunded" || status === "Cancelled" || status === "Failed"
        ? "bg-destructive/10 text-destructive"
        : status === "Dispatched" || status === "In chair" || status === "Out for Delivery"
          ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
          : "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>
  );
}
