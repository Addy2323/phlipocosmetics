import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Home, Search, ShoppingBag, CalendarHeart, User, X, Minus, Plus, Phone, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { BRAND, money } from "@/data/shop";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: Search },
  { to: "/salon", label: "Salon", icon: CalendarHeart },
  { to: "/account", label: "Account", icon: User },
] as const;

function CartDrawer() {
  const { drawerOpen, setDrawerOpen, detailed, subtotal, setQty } = useCart();
  if (!drawerOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close cart"
        onClick={() => setDrawerOpen(false)}
        className="absolute inset-0 bg-deep/50 backdrop-blur-sm"
      />
      <aside className="relative flex h-full w-full max-w-sm flex-col bg-card shadow-lift rise-in">
        <header className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-display text-xl">Your bag</h2>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close cart"
            className="grid size-11 place-items-center rounded-full hover:bg-secondary"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {detailed.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Your bag is empty — explore our best sellers.
            </p>
          )}
          {detailed.map(({ product, qty }) => (
            <div key={product.id} className="flex gap-3">
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                width={80}
                height={80}
                className="size-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">{money(product.price)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => setQty(product.id, qty - 1)}
                    className="grid size-8 place-items-center rounded-full border"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm">{qty}</span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => setQty(product.id, qty + 1)}
                    className="grid size-8 place-items-center rounded-full border"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <footer className="space-y-3 border-t px-5 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{money(subtotal)}</span>
          </div>
          <Link
            to="/checkout"
            onClick={() => setDrawerOpen(false)}
            className="btn-base btn-primary w-full"
          >
            Checkout
          </Link>
        </footer>
      </aside>
    </div>
  );
}

export function Site({ children }: { children: ReactNode }) {
  const { count, setDrawerOpen } = useCart();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="mr-auto leading-none">
            <span className="font-display text-xl font-semibold tracking-wide text-primary">
              PHILIPO
            </span>
            <span className="eyebrow ml-2 hidden text-muted-foreground sm:inline">Cosmetics</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {[
              { to: "/shop", label: "Shop" },
              { to: "/salon", label: "Salon" },
              { to: "/track", label: "Track order" },
              user ? { to: "/account", label: "Account" } : { to: "/auth", label: "Sign in" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Link to="/erp" className="btn-base btn-outline hidden h-10 md:inline-flex">
            Staff ERP
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label={`Open bag, ${count} items`}
            className="relative grid size-11 place-items-center rounded-full hover:bg-secondary"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
                {count}
              </span>
            )}
          </button>
          {user && (
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="grid size-11 place-items-center rounded-full hover:bg-secondary"
            >
              <LogOut className="size-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 bg-deep-gradient text-deep-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div>
            <p className="font-display text-2xl">PHILIPO</p>
            <p className="eyebrow mt-1 text-gold">Cosmetics & Beauty Salon</p>
            <p className="mt-4 max-w-xs text-sm text-deep-foreground/70">
              Premium beauty retail and salon craft in {BRAND.city}, {BRAND.country}. Nationwide delivery.
            </p>
          </div>
          <div>
            <p className="eyebrow text-gold">Shop</p>
            <ul className="mt-3 space-y-2 text-sm text-deep-foreground/75">
              <li><Link to="/shop">All products</Link></li>
              <li><Link to="/shop">Skincare</Link></li>
              <li><Link to="/shop">Makeup</Link></li>
              <li><Link to="/track">Track an order</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow text-gold">Salon</p>
            <ul className="mt-3 space-y-2 text-sm text-deep-foreground/75">
              <li><Link to="/salon">Book an appointment</Link></li>
              <li><Link to="/salon">Services & pricing</Link></li>
              <li><Link to="/account">My bookings</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow text-gold">Talk to us</p>
            <a
              href={`tel:${BRAND.phone.replace(/\s/g, "")}`}
              className="mt-3 inline-flex items-center gap-2 text-sm text-deep-foreground/85"
            >
              <Phone className="size-4 text-gold" /> {BRAND.phone}
            </a>
            <p className="mt-2 text-sm text-deep-foreground/60">Mon–Sat, 09:00–19:00 EAT</p>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-deep-foreground/50">
          © {new Date().getFullYear()} {BRAND.full}. Prices in Tanzanian shillings.
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/95 backdrop-blur-md md:hidden">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <CartDrawer />
    </div>
  );
}

export function Section({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow text-rose">{eyebrow}</p>}
          <h2 className="font-display text-3xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
