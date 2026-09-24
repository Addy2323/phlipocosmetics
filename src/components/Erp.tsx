import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  ScanBarcode,
  Boxes,
  CalendarHeart,
  ScrollText,
  Store,
  Bell,
} from "lucide-react";
import type { ReactNode } from "react";
import { BRAND } from "@/data/shop";

const sections = [
  { to: "/erp", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/erp/orders", label: "Orders", icon: ShoppingCart },
  { to: "/erp/pos", label: "Point of sale", icon: ScanBarcode },
  { to: "/erp/inventory", label: "Inventory", icon: Boxes },
  { to: "/erp/salon", label: "Salon ops", icon: CalendarHeart },
  { to: "/erp/audit", label: "Audit log", icon: ScrollText },
] as const;

export function ErpShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-muted/60">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-deep text-deep-foreground md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-display text-xl leading-none">PHILIPO</p>
          <p className="eyebrow mt-1 text-gold">Staff ERP</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {sections.map(({ to, label, icon: Icon, ...rest }) => {
            const active = "exact" in rest && rest.exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-deep-foreground/70 hover:bg-sidebar-accent/60 hover:text-white"
                }`}
              >
                <Icon className="size-4.5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-3 py-4">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-deep-foreground/70 hover:bg-sidebar-accent/60 hover:text-white"
          >
            <Store className="size-4.5" />
            Back to storefront
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-md sm:px-6">
          <p className="font-display text-lg text-primary md:hidden">PHILIPO ERP</p>
          <p className="hidden text-sm text-muted-foreground md:block">
            {BRAND.full} · {BRAND.city} branch
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="relative grid size-10 place-items-center rounded-full hover:bg-secondary"
            >
              <Bell className="size-4.5" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose" />
            </button>
            <div className="grid size-9 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              AM
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium leading-tight">Amina Mushi</p>
              <p className="text-[11px] text-muted-foreground">Store manager</p>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
        <nav className="sticky bottom-0 z-30 grid grid-cols-5 border-t bg-background/95 backdrop-blur-md md:hidden">
          {sections.slice(0, 5).map(({ to, label, icon: Icon, ...rest }) => {
            const active = "exact" in rest && rest.exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] ${
                  active ? "text-primary" : "text-muted-foreground"
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
    status === "Delivered" || status === "Completed" || status === "Confirmed"
      ? "bg-success/10 text-success"
      : status === "Refunded" || status === "Deposit due"
        ? "bg-destructive/10 text-destructive"
        : status === "Dispatched" || status === "In chair"
          ? "bg-info/10 text-info"
          : "bg-warning/15 text-foreground";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>
  );
}
