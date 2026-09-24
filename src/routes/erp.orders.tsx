import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Truck } from "lucide-react";
import { ErpPage, StatusPill } from "@/components/Erp";
import { erpOrders, money, type OrderStatus } from "@/data/shop";

export const Route = createFileRoute("/erp/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Philipo ERP" },
      { name: "description", content: "Manage online, POS and WhatsApp orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Orders,
});

const filters = ["All", "Paid", "Preparing", "Dispatched", "Delivered", "Refunded"] as const;

function Orders() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");

  const rows = erpOrders.filter(
    (o) =>
      (filter === "All" || o.status === (filter as OrderStatus)) &&
      (o.customer.toLowerCase().includes(query.toLowerCase()) || o.id.includes(query)),
  );

  return (
    <ErpPage
      title="Orders"
      subtitle="Online, POS and WhatsApp orders in one queue."
      actions={
        <button className="btn-base btn-outline h-10">
          <Truck className="size-4" /> Dispatch run
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex h-10 flex-1 items-center gap-2 rounded-full border bg-card px-4 sm:max-w-xs">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order or customer"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-card border hover:bg-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card-surface overflow-x-auto p-2 sm:p-4">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-2 font-medium">Order</th>
              <th className="p-2 font-medium">Customer</th>
              <th className="p-2 font-medium">Channel</th>
              <th className="p-2 font-medium">Items</th>
              <th className="p-2 font-medium">Total</th>
              <th className="p-2 font-medium">Placed</th>
              <th className="p-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-secondary/50">
                <td className="p-2 font-medium">{o.id}</td>
                <td className="p-2">{o.customer}</td>
                <td className="p-2 text-muted-foreground">{o.channel}</td>
                <td className="p-2">{o.items}</td>
                <td className="p-2">{money(o.total)}</td>
                <td className="p-2 text-muted-foreground">{o.placed}</td>
                <td className="p-2">
                  <StatusPill status={o.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                  No orders match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ErpPage>
  );
}
