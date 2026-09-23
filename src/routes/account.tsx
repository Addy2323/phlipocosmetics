import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Package, CalendarHeart, Heart, MapPin, Bell, Crown, MessageCircle } from "lucide-react";
import { Site } from "@/components/Site";
import { money, products, BRAND } from "@/data/shop";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My account — Philipo Cosmetics" },
      { name: "description", content: "Your orders, salon bookings, wishlist, addresses and loyalty points." },
      { property: "og:title", content: "My account — Philipo Cosmetics" },
      { property: "og:description", content: "Orders, bookings, wishlist and loyalty in one place." },
    ],
  }),
  component: Account,
});

const tabs = [
  { id: "orders", label: "Orders", icon: Package },
  { id: "bookings", label: "Bookings", icon: CalendarHeart },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

const orders = [
  { id: "PC-24871", date: "Today", total: 142500, status: "Out for delivery" },
  { id: "PC-24712", date: "12 Sep 2026", total: 68000, status: "Delivered" },
  { id: "PC-24566", date: "28 Aug 2026", total: 213500, status: "Delivered" },
];

const bookings = [
  { id: "B-3312", service: "Signature Braiding", when: "Sat 26 Sep · 10:30", stylist: "Amina Mushi", status: "Confirmed" },
  { id: "B-3180", service: "Silk Press & Style", when: "5 Sep 2026", stylist: "Grace Kilonzo", status: "Completed" },
];

function Account() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("orders");

  return (
    <Site>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="card-surface flex flex-wrap items-center gap-6 overflow-hidden p-6">
          <div className="grid size-16 place-items-center rounded-full bg-hero-gradient font-display text-2xl text-white">
            ZM
          </div>
          <div className="mr-auto">
            <h1 className="font-display text-3xl">Zawadi Mremi</h1>
            <p className="text-sm text-muted-foreground">
              {BRAND.phone} · {BRAND.city}
            </p>
          </div>
          <div className="rounded-xl bg-secondary px-5 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
              <Crown className="size-4 text-gold" /> Gold member
            </p>
            <p className="text-xs text-muted-foreground">2,480 points · 520 to Platinum</p>
          </div>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                tab === id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {tab === "orders" &&
            orders.map((o) => (
              <div key={o.id} className="card-surface flex flex-wrap items-center gap-4 p-5">
                <div className="mr-auto">
                  <p className="font-medium">{o.id}</p>
                  <p className="text-xs text-muted-foreground">{o.date}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                  {o.status}
                </span>
                <p className="font-medium">{money(o.total)}</p>
                <Link to="/track" className="btn-base btn-outline h-10">
                  Track
                </Link>
              </div>
            ))}

          {tab === "bookings" &&
            bookings.map((b) => (
              <div key={b.id} className="card-surface flex flex-wrap items-center gap-4 p-5">
                <div className="mr-auto">
                  <p className="font-medium">{b.service}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.when} · {b.stylist}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                  {b.status}
                </span>
                <Link to="/salon" className="btn-base btn-outline h-10">
                  Rebook
                </Link>
              </div>
            ))}

          {tab === "wishlist" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {products.slice(0, 2).map((p) => (
                <div key={p.id} className="card-surface flex items-center gap-4 p-4">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    width={80}
                    height={80}
                    className="size-20 rounded-lg object-cover"
                  />
                  <div className="mr-auto">
                    <p className="font-display text-lg">{p.name}</p>
                    <p className="text-sm text-primary">{money(p.price)}</p>
                  </div>
                  <Link to="/product/$slug" params={{ slug: p.slug }} className="btn-base btn-outline h-10">
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}

          {tab === "addresses" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Home", value: "Masaki, Chole Road, House 14" },
                { label: "Office", value: "Posta, Ohio Street, 3rd floor" },
              ].map((a) => (
                <div key={a.label} className="card-surface p-5">
                  <p className="eyebrow text-rose">{a.label}</p>
                  <p className="mt-2 text-sm">{a.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {BRAND.city}, {BRAND.country}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === "notifications" && (
            <div className="card-surface divide-y p-2">
              {[
                { label: "SMS on order updates", on: true },
                { label: "SMS on appointment reminders", on: true },
                { label: "Push notifications", on: true },
                { label: "Offers and campaigns", on: false },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between p-4">
                  <span className="text-sm">{n.label}</span>
                  <span
                    className={`h-6 w-11 rounded-full p-0.5 transition-colors ${n.on ? "bg-primary" : "bg-border"}`}
                  >
                    <span
                      className={`block size-5 rounded-full bg-white transition-transform ${n.on ? "translate-x-5" : ""}`}
                    />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-surface mt-8 flex flex-wrap items-center gap-4 p-6">
          <MessageCircle className="size-5 text-primary" />
          <p className="mr-auto text-sm">Need help with an order or a booking?</p>
          <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="btn-base btn-primary h-10">
            Contact support
          </a>
        </div>
      </div>
    </Site>
  );
}
