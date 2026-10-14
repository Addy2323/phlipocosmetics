import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Truck, Phone, MapPin, Search } from "lucide-react";
import { Site } from "@/components/Site";
import { deliverySteps, money, BRAND } from "@/data/shop";
import { db, schema } from "@/lib/db";
import { eq, or } from "drizzle-orm";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track your order — Philipo Cosmetics" },
      { name: "description", content: "Follow your Philipo Cosmetics delivery from packing to your door." },
      { property: "og:title", content: "Track your order — Philipo Cosmetics" },
      { property: "og:description", content: "Live delivery status, courier details and estimated arrival." },
    ],
  }),
  component: Track,
});

function Track() {
  const [query, setQuery] = useState("PC-24871");
  const [order, setOrder] = useState<typeof schema.orders.$inferSelect | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    const [found] = await db
      .select()
      .from(schema.orders)
      .where(
        or(
          eq(schema.orders.orderNumber, query.trim().toUpperCase()),
          eq(schema.orders.customerPhone, query.trim())
        )
      );

    setOrder(found ?? null);
    setSearched(true);
  }

  // Calculate step index from fulfillment status
  const getStepIndex = (status?: string) => {
    switch (status) {
      case "Processing":
        return 1;
      case "Preparing":
        return 2;
      case "Out for Delivery":
        return 3;
      case "Delivered":
        return 4;
      default:
        return 4;
    }
  };

  const currentIndex = getStepIndex(order?.fulfillmentStatus);

  return (
    <Site>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="eyebrow text-rose">Nationwide Delivery Tracking</p>
        <h1 className="mt-2 font-display text-4xl">Track Your Order</h1>

        <form onSubmit={handleSearch} className="mt-6 flex gap-3">
          <label className="flex h-12 flex-1 items-center gap-2 rounded-xl border bg-card px-4">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Order # (e.g. PC-24871) or Phone (+255...)"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <button type="submit" className="btn-base btn-primary h-12 px-6">
            Track Order
          </button>
        </form>

        {searched && !order && (
          <div className="card-surface mt-6 p-8 text-center text-sm text-muted-foreground">
            No order found matching <strong className="text-foreground">{query}</strong>. Please check your order confirmation SMS or receipt number.
          </div>
        )}

        <div className="card-surface mt-8 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="font-display text-2xl">Order {order ? order.orderNumber : "PC-24871"}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customer: {order ? order.customerName : "Zawadi Mremi"} ({order ? order.customerPhone : BRAND.phone})
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {order ? order.fulfillmentStatus : "Out for delivery"}
              </span>
              <p className="mt-1 text-sm font-medium">{money(order ? order.total : 142500)}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-xl bg-secondary p-4">
            <Truck className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Status: {order ? order.fulfillmentStatus : "Out for delivery"}</p>
              <p className="text-xs text-muted-foreground">
                Destination: {order ? `${order.deliveryArea}, ${order.deliveryCity}` : `Masaki, Chole Road, ${BRAND.city}`}
              </p>
            </div>
          </div>

          <ol className="mt-8 space-y-6">
            {deliverySteps.map((s, i) => {
              const done = i <= currentIndex;
              return (
                <li key={s.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full border ${
                        done ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="size-4" /> : i + 1}
                    </span>
                    {i < deliverySteps.length - 1 && (
                      <span className={`mt-1 w-px flex-1 ${done ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className={done ? "font-medium" : "text-muted-foreground"}>{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.at}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="card-surface mt-6 p-6">
          <h2 className="font-display text-xl">Assigned Logistics Driver</h2>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Baraka Mwinyi</p>
              <p className="text-xs text-muted-foreground">Philipo Logistics · Express Motorbike T 421 DFA</p>
            </div>
            <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="btn-base btn-outline h-10">
              <Phone className="size-4" /> Call Driver
            </a>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" /> Delivering to {order ? `${order.deliveryArea}, ${order.deliveryCity}` : `Masaki, Chole Road, ${BRAND.city}`}
          </p>
        </div>
      </div>
    </Site>
  );
}
