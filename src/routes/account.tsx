import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Package,
  CalendarHeart,
  Heart,
  MapPin,
  Bell,
  Crown,
  MessageCircle,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { Site } from "@/components/Site";
import { money, products, BRAND } from "@/data/shop";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { updateUserProfileClient } from "@/lib/auth-client";
import { useWishlist } from "@/lib/wishlist";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My account — Philipo Cosmetics" },
      { name: "description", content: "Your orders, salon bookings, wishlist, addresses and loyalty points." },
      { property: "og:title", content: "My account — Philipo Cosmetics" },
      { property: "og:description", content: "Orders, bookings, wishlist and loyalty in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

type Address = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  street: string;
  city: string;
  is_default: boolean;
};

const input =
  "h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary";

function Account() {
  const { user, loading, updateUser } = useAuth();
  const wishlist = useWishlist();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("orders");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addr, setAddr] = useState({ label: "Home", recipient: "", phone: "", street: "", city: "Dar es Salaam" });

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

  if (!loading && !user) {
    return (
      <Site>
        <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
          <div className="card-surface rise-in p-10">
            <h1 className="font-display text-3xl">Sign in to your account</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              See your orders, bookings, wishlist and saved addresses — and keep your bag in sync
              across devices.
            </p>
            <div className="mt-8 flex flex-col gap-2.5">
              <Link to="/login" className="btn-base btn-primary h-12 w-full">
                Sign In
              </Link>
              <Link to="/register" className="btn-base btn-outline h-12 w-full">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </Site>
    );
  }

  const displayName = fullName || user?.email?.split("@")[0] || "…";
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function saveProfile() {
    if (!user) return;
    try {
      const updated = await updateUserProfileClient(user.id, { fullName, phone });
      updateUser(updated);
      setEditingProfile(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      // Fallback
      setEditingProfile(false);
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
  }

  async function removeAddress(id: string) {
    if (!user) return;
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("addresses").delete().eq("user_id", user.id).eq("id", id);
  }

  const wished = products.filter((p) => wishlist.has(p.id));

  return (
    <Site>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="card-surface flex flex-wrap items-center gap-6 overflow-hidden p-6">
          <div className="grid size-16 place-items-center rounded-full bg-hero-gradient font-display text-2xl text-white">
            {initials}
          </div>
          <div className="mr-auto">
            {editingProfile ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className={`${input} w-44`}
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone"
                  className={`${input} w-44`}
                />
                <button onClick={saveProfile} className="btn-base btn-primary h-11">
                  Save
                </button>
                <button onClick={() => setEditingProfile(false)} className="btn-base btn-outline h-11">
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <h1 className="flex items-center gap-2 font-display text-3xl">
                  {displayName}
                  <button
                    onClick={() => setEditingProfile(true)}
                    aria-label="Edit profile"
                    className="grid size-8 place-items-center rounded-full hover:bg-secondary"
                  >
                    <Pencil className="size-4 text-muted-foreground" />
                  </button>
                </h1>
                <p className="text-sm text-muted-foreground">
                  {user?.email}
                  {phone ? ` · ${phone}` : ""}
                  {profileSaved && <span className="ml-2 text-primary">Saved ✓</span>}
                </p>
              </>
            )}
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

          {tab === "wishlist" &&
            (wished.length === 0 ? (
              <div className="card-surface p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Nothing saved yet — tap the heart on any product to keep it here.
                </p>
                <Link to="/shop" search={{ category: "All" }} className="btn-base btn-outline mt-6 h-10">
                  Browse products
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {wished.map((p) => (
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
                    <button
                      onClick={() => wishlist.toggle(p.id)}
                      aria-label={`Remove ${p.name} from wishlist`}
                      className="grid size-10 place-items-center rounded-full hover:bg-secondary"
                    >
                      <Trash2 className="size-4 text-muted-foreground" />
                    </button>
                    <Link to="/product/$slug" params={{ slug: p.slug }} className="btn-base btn-outline h-10">
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ))}

          {tab === "addresses" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {addresses.map((a) => (
                  <div key={a.id} className="card-surface p-5">
                    <div className="flex items-center justify-between">
                      <p className="eyebrow text-rose">
                        {a.label}
                        {a.is_default && <span className="ml-2 text-gold">Default</span>}
                      </p>
                      <button
                        onClick={() => removeAddress(a.id)}
                        aria-label={`Delete ${a.label} address`}
                        className="grid size-8 place-items-center rounded-full hover:bg-secondary"
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-medium">{a.recipient}</p>
                    <p className="text-sm">{a.street}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.city}, {BRAND.country}
                      {a.phone ? ` · ${a.phone}` : ""}
                    </p>
                  </div>
                ))}
              </div>
              {addingAddress ? (
                <div className="card-surface space-y-3 p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={addr.label}
                      onChange={(e) => setAddr({ ...addr, label: e.target.value })}
                      placeholder="Label e.g. Home, Office"
                      className={input}
                    />
                    <input
                      value={addr.recipient}
                      onChange={(e) => setAddr({ ...addr, recipient: e.target.value })}
                      placeholder="Recipient name"
                      className={input}
                    />
                    <input
                      value={addr.phone}
                      onChange={(e) => setAddr({ ...addr, phone: e.target.value })}
                      placeholder="Phone"
                      className={input}
                    />
                    <input
                      value={addr.city}
                      onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                      placeholder="City"
                      className={input}
                    />
                    <input
                      value={addr.street}
                      onChange={(e) => setAddr({ ...addr, street: e.target.value })}
                      placeholder="Street / area"
                      className={`${input} sm:col-span-2`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addAddress} className="btn-base btn-primary h-11">
                      Save address
                    </button>
                    <button onClick={() => setAddingAddress(false)} className="btn-base btn-outline h-11">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingAddress(true)} className="btn-base btn-outline h-11">
                  <Plus className="size-4" /> Add an address
                </button>
              )}
            </>
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
