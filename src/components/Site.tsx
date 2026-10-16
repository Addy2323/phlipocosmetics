import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Home,
  Search,
  ShoppingBag,
  User,
  X,
  Minus,
  Plus,
  Phone,
  LogOut,
  Menu,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  MapPin,
  Clock,
  Bell,
  Store,
  Package,
  Filter,
  Heart,
  CalendarHeart,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { BRAND, money, products } from "@/data/shop";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

/* ── Mobile Bottom Navigation: HOME | SHOP | BEAUTY | ORDER | PROFILE ── */
const mobileNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: Store },
  { to: "/salon", label: "Beauty", icon: Sparkles },
  { to: "/track", label: "Order", icon: Package },
  { to: "/account", label: "Profile", icon: User },
] as const;

/* ── Cart Slide-Over Drawer ── */
function CartDrawer() {
  const { drawerOpen, setDrawerOpen, detailed, subtotal, setQty } = useCart();
  if (!drawerOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close cart"
        onClick={() => setDrawerOpen(false)}
        className="absolute inset-0 bg-deep/60 backdrop-blur-sm transition-opacity"
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-card shadow-lift rise-in">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            <h2 className="font-display text-xl font-medium">Your Shopping Bag</h2>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close cart"
            className="grid size-10 place-items-center rounded-full hover:bg-secondary transition-colors"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {detailed.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-secondary text-primary">
                <ShoppingBag className="size-8" />
              </div>
              <p className="mt-4 font-display text-lg">Your bag is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Discover our luxury skincare, makeup, and hair formulas.
              </p>
              <Link
                to="/shop"
                search={{ category: "All" }}
                onClick={() => setDrawerOpen(false)}
                className="btn-base btn-primary mt-6"
              >
                Explore Collection
              </Link>
            </div>
          ) : (
            detailed.map(({ product, qty }) => (
              <div key={product.id} className="flex gap-4 border-b border-border/60 pb-4">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  width={80}
                  height={80}
                  className="size-20 rounded-lg object-cover border border-border"
                />
                <div className="flex-1">
                  <p className="font-display text-base font-medium leading-tight">{product.name}</p>
                  <p className="text-xs text-rose font-medium mt-0.5">{product.category}</p>
                  <p className="text-sm font-semibold text-primary mt-1">{money(product.price)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => setQty(product.id, qty - 1)}
                      className="grid size-7 place-items-center rounded-full border border-border hover:bg-secondary transition-colors"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{qty}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => setQty(product.id, qty + 1)}
                      className="grid size-7 place-items-center rounded-full border border-border hover:bg-secondary transition-colors"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {detailed.length > 0 && (
          <footer className="space-y-3 border-t bg-muted/30 px-6 py-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">{money(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {subtotal >= 150000
                ? "✓ Eligible for Complimentary Nationwide Delivery"
                : `Add ${money(150000 - subtotal)} more for free nationwide delivery`}
            </p>
            <Link
              to="/checkout"
              onClick={() => setDrawerOpen(false)}
              className="btn-base btn-primary w-full text-center"
            >
              Proceed to Checkout
            </Link>
          </footer>
        )}
      </aside>
    </div>
  );
}

/* ── Search Modal ── */
function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  if (!open) return null;

  const matches = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tagline.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <button
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-deep/60 backdrop-blur-sm transition-opacity"
      />
      <div className="relative w-full max-w-2xl rounded-2xl bg-card p-6 shadow-lift rise-in border border-border">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Search className="size-5 text-primary" />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search luxury skincare, lipstick, hair treatments..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="grid size-8 place-items-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 max-h-96 overflow-y-auto">
          {searchQuery.trim() === "" ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Popular Beauty Searches</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {["Radiant Serum", "Berry Lipstick", "Hair Oil", "Silk Press", "Bridal Glam"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : matches.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products found matching "{searchQuery}".
            </p>
          ) : (
            <div className="space-y-2">
              {matches.map((item) => (
                <Link
                  key={item.id}
                  to="/product/$slug"
                  params={{ slug: item.slug }}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-secondary/60 transition-colors"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-12 rounded-lg object-cover border border-border"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground leading-tight">{item.name}</p>
                    <p className="text-xs text-rose">{item.category}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{money(item.price)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Notifications Panel ── */
function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 md:justify-end md:px-6">
      <button
        aria-label="Close notifications"
        onClick={onClose}
        className="absolute inset-0 bg-deep/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-card p-5 shadow-lift rise-in border border-border">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <h3 className="font-display text-lg font-medium">Notifications</h3>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="grid size-8 place-items-center rounded-full hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="py-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-secondary">
            <Bell className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">All caught up!</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You'll be notified about orders, deliveries, and appointment updates here.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main Site Shell ── */
export function Site({ children }: { children: ReactNode }) {
  const { count, setDrawerOpen } = useCart();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const categoryLinks = [
    { to: "/shop", search: { category: "Skincare" }, label: "Skincare" },
    { to: "/shop", search: { category: "Makeup" }, label: "Makeup" },
    { to: "/shop", search: { category: "Hair" }, label: "Hair Care" },
    { to: "/shop", search: { category: "Fragrance" }, label: "Fragrances" },
    { to: "/shop", search: { category: "Body Oils" }, label: "Body Oils" },
    { to: "/shop", search: { category: "Soaps" }, label: "Soaps" },
  ];

  /* Derive first name for greeting */
  const firstName = user?.fullName?.split(" ")[0] ?? null;

  return (
    <div className="flex min-h-screen flex-col pb-[72px] md:pb-0 bg-background text-foreground">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* MOBILE HEADER — visible < md */}
      {/* ═══════════════════════════════════════════════════════ */}
      <header className="philipo-mobile-header sticky top-0 z-40 md:hidden bg-background/98 backdrop-blur-lg border-b border-border/60">
        <div className="flex items-center justify-between px-4 py-2.5">
          {/* Left: Menu + Greeting */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-white border border-border/80 shadow-2xs hover:bg-secondary transition-colors active:scale-95"
            >
              <Menu className="size-5 text-foreground" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate leading-tight flex items-center gap-1 font-medium">
                {firstName ? (
                  <>Hello, {firstName}! ✨</>
                ) : (
                  <>Welcome to Philipo Cosmetics ✨</>
                )}
              </p>
              <h1 className="text-lg font-display font-bold text-[#243B90] leading-tight tracking-tight">
                Discover Beauty
              </h1>
              <p className="text-[10px] text-[#77747C] leading-tight truncate">
                Premium beauty, just for you
              </p>
            </div>
          </div>

          {/* Right: Search, Notifications, Cart */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="grid size-10 place-items-center rounded-xl bg-white border border-border/80 shadow-2xs hover:bg-secondary transition-colors active:scale-95"
            >
              <Search className="size-[18px] text-foreground/80" />
            </button>
            <button
              onClick={() => setNotifOpen(true)}
              aria-label="Notifications"
              className="relative grid size-10 place-items-center rounded-xl bg-white border border-border/80 shadow-2xs hover:bg-secondary transition-colors active:scale-95"
            >
              <Bell className="size-[18px] text-foreground/80" />
              {/* Unread notification indicator dot */}
              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-[#EC008C] ring-2 ring-white" />
            </button>
            <Link
              to="/cart"
              aria-label={`Shopping Cart, ${count} items`}
              className="relative grid size-10 place-items-center rounded-xl bg-white border border-border/80 shadow-2xs hover:bg-secondary transition-colors active:scale-95"
            >
              <ShoppingBag className="size-[18px] text-foreground/80" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#EC008C] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DESKTOP HEADER — visible >= md (unchanged structure) */}
      {/* ═══════════════════════════════════════════════════════ */}

      {/* Top Announcement Bar — desktop only */}
      <div className="hidden md:flex bg-primary border-b border-gold/25 px-4 py-2.5 text-center text-xs font-medium text-white tracking-wide flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 font-semibold text-gold">
          <Sparkles className="size-3.5" /> Luxury Beauty in Tanzania
        </span>
        <span className="hidden sm:inline text-white/40">|</span>
        <span className="text-white/95">Complimentary Nationwide Delivery on orders over TSh 150,000</span>
        <span className="hidden md:inline text-white/40">|</span>
        <a
          href={`tel:${BRAND.phone.replace(/\s/g, "")}`}
          className="inline-flex items-center gap-1 font-semibold hover:underline text-gold transition-colors"
        >
          <Phone className="size-3" /> {BRAND.phone}
        </a>
      </div>

      {/* Main Desktop Sticky Header */}
      <header className="hidden md:block sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Official Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Philipo Cosmetics"
              className="h-12 sm:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:gap-2 md:flex">
            <Link
              to="/"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              activeProps={{ className: "bg-secondary text-primary font-semibold" }}
            >
              Home
            </Link>
            <Link
              to="/shop"
              search={{ category: "All" }}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              activeProps={{ className: "bg-secondary text-primary font-semibold" }}
            >
              Shop All
            </Link>


            <Link
              to="/salon"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              activeProps={{ className: "bg-secondary text-primary font-semibold" }}
            >
              Hair Salon
            </Link>

            <Link
              to="/track"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              activeProps={{ className: "bg-secondary text-primary font-semibold" }}
            >
              Track Order
            </Link>
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search cosmetics and salon services"
              className="grid size-10 place-items-center rounded-full hover:bg-secondary transition-colors"
            >
              <Search className="size-5 text-foreground/80" />
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label={`Open shopping bag, ${count} items`}
              className="relative grid size-10 place-items-center rounded-full hover:bg-secondary transition-colors"
            >
              <ShoppingBag className="size-5 text-foreground/80" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-rose text-[11px] font-bold text-white shadow-sm">
                  {count}
                </span>
              )}
            </button>

            {/* User Account / Sign In */}
            {user ? (
              <div className="flex items-center gap-1">
                <Link
                  to="/account"
                  aria-label="My Account"
                  className="grid size-10 place-items-center rounded-full hover:bg-secondary transition-colors"
                  title="My Account"
                >
                  <User className="size-5 text-primary" />
                </Link>
                <button
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="hidden sm:grid size-10 place-items-center rounded-full hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <User className="size-3.5" /> Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Staff ERP shortcut */}
            {user && (user.role === "admin" || user.role === "sales" || user.role === "sales_staff") && (
              <Link
                to={user.role === "admin" ? "/admin/dashboard" : "/sales/dashboard"}
                className="hidden lg:inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-xs font-medium text-primary hover:bg-primary hover:text-white transition-colors"
              >
                Staff Portal
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MOBILE DRAWER MENU */}
      {/* ═══════════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <button
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-deep/60 backdrop-blur-sm"
          />
          <aside className="relative flex h-full w-full max-w-xs flex-col bg-card p-6 shadow-lift rise-in border-r border-border">
            <div className="flex items-center justify-between border-b pb-4">
              <img src="/logo.png" alt="Philipo Cosmetics" className="h-10 w-auto object-contain" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="grid size-8 place-items-center rounded-full hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* User greeting in drawer */}
            {user && (
              <div className="mt-4 rounded-xl bg-secondary/80 px-4 py-3 border border-border/50">
                <p className="text-sm font-semibold text-foreground">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            )}

            <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
              >
                <Home className="size-4 text-[#EC008C]" /> Home
              </Link>
              <Link
                to="/shop"
                search={{ category: "All" }}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
              >
                <Store className="size-4 text-[#243B90]" /> Shop All Products
              </Link>
              {categoryLinks.map((cat) => (
                <Link
                  key={cat.label}
                  to={cat.to}
                  search={cat.search}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium pl-10 text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
              <Link
                to="/salon"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
              >
                <Sparkles className="size-4 text-[#C6A56B]" /> Beauty Salon
              </Link>
              <Link
                to="/track"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
              >
                <Package className="size-4 text-[#243B90]" /> My Orders
              </Link>
              <Link
                to="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
              >
                <User className="size-4 text-[#EC008C]" /> My Profile
              </Link>

              {/* Wishlist link */}
              <Link
                to="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
              >
                <Heart className="size-4 text-rose" /> Wishlist
              </Link>

              <div className="my-3 border-t border-border" />

              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="size-4" /> Sign Out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-90"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>

            <div className="border-t pt-4 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-primary" /> {BRAND.phone}
              </p>
              <p className="mt-1 flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" /> {BRAND.city}, {BRAND.country}
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PREMIUM LUXURY FOOTER */}
      {/* ═══════════════════════════════════════════════════════ */}
      <footer className="mt-20 border-t border-border bg-gradient-to-b from-[#111a40] to-[#172459] text-deep-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 md:grid-cols-4 lg:gap-12">
            {/* Brand column */}
            <div className="space-y-4">
              <div className="inline-block rounded-xl bg-white p-2.5 shadow-md">
                <img
                  src="/logo.png"
                  alt="Philipo Cosmetics"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <p className="eyebrow text-gold font-semibold tracking-wider">Luxury Cosmetics & Salon</p>
              <p className="max-w-xs text-sm text-deep-foreground/75 leading-relaxed">
                Elevating beauty with pure formulations, salon artistry, and nationwide reliability across Tanzania.
              </p>
              <div className="flex items-center gap-3 pt-2 text-xs text-deep-foreground/80">
                <span className="flex items-center gap-1"><Truck className="size-3.5 text-gold" /> Nationwide</span>
                <span className="flex items-center gap-1"><ShieldCheck className="size-3.5 text-gold" /> 100% Authentic</span>
              </div>
            </div>

            {/* Shop Column */}
            <div>
              <p className="eyebrow text-gold font-semibold tracking-wider">Beauty Collections</p>
              <ul className="mt-4 space-y-2.5 text-sm text-deep-foreground/80">
                <li><Link to="/shop" search={{ category: "All" }} className="hover:text-gold transition-colors">All Products</Link></li>
                <li><Link to="/shop" search={{ category: "Skincare" }} className="hover:text-gold transition-colors">Skincare Rituals</Link></li>
                <li><Link to="/shop" search={{ category: "Makeup" }} className="hover:text-gold transition-colors">Lip & Face Makeup</Link></li>
                <li><Link to="/shop" search={{ category: "Hair" }} className="hover:text-gold transition-colors">Hair Oils & Treatments</Link></li>
                <li><Link to="/shop" search={{ category: "Fragrance" }} className="hover:text-gold transition-colors">Signature Fragrances</Link></li>
                <li><Link to="/shop" search={{ category: "Body Oils" }} className="hover:text-gold transition-colors">Body Oils & Shimmers</Link></li>
                <li><Link to="/shop" search={{ category: "Soaps" }} className="hover:text-gold transition-colors">Artisanal Soaps</Link></li>
              </ul>
            </div>

            {/* Salon Column */}
            <div>
              <p className="eyebrow text-gold font-semibold tracking-wider">Hair Salon Services</p>
              <ul className="mt-4 space-y-2.5 text-sm text-deep-foreground/80">
                <li><Link to="/salon" className="hover:text-gold transition-colors">Book Salon Chair</Link></li>
                <li><Link to="/salon" className="hover:text-gold transition-colors">Signature Braiding</Link></li>
                <li><Link to="/salon" className="hover:text-gold transition-colors">Silk Press & Styling</Link></li>
                <li><Link to="/salon" className="hover:text-gold transition-colors">Deep Conditioning</Link></li>
                <li><Link to="/salon" className="hover:text-gold transition-colors">Bridal Packages</Link></li>
              </ul>
            </div>

            {/* Customer Care Column */}
            <div>
              <p className="eyebrow text-gold font-semibold tracking-wider">Customer Care & Support</p>
              <ul className="mt-4 space-y-2.5 text-sm text-deep-foreground/80">
                <li><Link to="/track" className="hover:text-gold transition-colors">Track Your Delivery</Link></li>
                <li><Link to="/account" className="hover:text-gold transition-colors">My Account & Bookings</Link></li>
                <li className="pt-2">
                  <a
                    href={`tel:${BRAND.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 font-medium text-white hover:text-gold transition-colors"
                  >
                    <Phone className="size-4 text-gold" /> {BRAND.phone}
                  </a>
                </li>
                <li className="flex items-center gap-2 text-xs text-deep-foreground/60">
                  <Clock className="size-3.5 text-gold" /> Mon–Sat: 09:00 – 19:00 EAT
                </li>
                <li className="flex items-center gap-2 text-xs text-deep-foreground/60">
                  <MapPin className="size-3.5 text-gold" /> {BRAND.city}, {BRAND.country}
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-deep-foreground/60 sm:flex-row">
            <p>© {new Date().getFullYear()} {BRAND.full}. All rights reserved.</p>
            <p className="text-center sm:text-right">Prices in Tanzanian Shillings (TSh) · Secured by SSL & Verified Gateway</p>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MOBILE FIXED BOTTOM NAVIGATION: 5 items */}
      {/* HOME | SHOP | BEAUTY | ORDER | PROFILE */}
      {/* ═══════════════════════════════════════════════════════ */}
      <nav
        className="philipo-bottom-nav fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-border/60 bg-white/98 backdrop-blur-lg"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid grid-cols-5 h-[64px]">
          {mobileNav.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative ${
                  active
                    ? "text-[#EC008C] font-bold"
                    : "text-[#77747C] hover:text-foreground"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-[#EC008C]" />
                )}
                <Icon className={`size-[22px] ${active ? "text-[#EC008C]" : ""}`} strokeWidth={active ? 2.2 : 1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Live Drawers & Panels */}
      <CartDrawer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}

/* ── Reusable Section Component ── */
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
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow text-rose font-semibold">{eyebrow}</p>}
          <h2 className="mt-1 font-display text-3xl md:text-4xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
