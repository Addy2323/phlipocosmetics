import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Truck, CheckCircle, RefreshCw } from "lucide-react";
import { ErpPage, StatusPill } from "@/components/Erp";
import { money } from "@/data/shop";
import { getOrdersList, updateOrderStatus } from "@/lib/erp-service";
import type { schema } from "@/lib/db";

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

const filters = [
  "All",
  "Paid",
  "Processing",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;

function Orders() {
  const [orders, setOrders] = useState<Array<typeof schema.orders.$inferSelect>>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadOrders() {
    setLoading(true);
    try {
      const list = await getOrdersList();
      setOrders(list);
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleFulfillment(orderId: string, nextStatus: string) {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, { fulfillmentStatus: nextStatus });
      await loadOrders();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  const rows = orders.filter(
    (o) =>
      (filter === "All" || o.fulfillmentStatus === filter || o.paymentStatus === filter) &&
      (o.customerName.toLowerCase().includes(query.toLowerCase()) ||
        o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
        o.customerPhone.includes(query)),
  );

  return (
    <ErpPage
      title="Order Management Queue"
      subtitle="Nationwide delivery tracking, payment validation, and fulfillment dispatcher."
      actions={
        <button onClick={loadOrders} className="btn-base btn-outline h-10">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh Queue
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex h-10 flex-1 items-center gap-2 rounded-full border bg-card px-4 sm:max-w-xs">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order #, customer, or phone"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border hover:bg-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card-surface overflow-x-auto p-2 sm:p-4">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-2.5 font-medium">Order #</th>
              <th className="p-2.5 font-medium">Customer & Contact</th>
              <th className="p-2.5 font-medium">Delivery Destination</th>
              <th className="p-2.5 font-medium">Channel</th>
              <th className="p-2.5 font-medium">Total</th>
              <th className="p-2.5 font-medium">Payment</th>
              <th className="p-2.5 font-medium">Fulfillment</th>
              <th className="p-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr
                key={o.id}
                className="border-b last:border-0 hover:bg-secondary/40 transition-colors"
              >
                <td className="p-2.5 font-medium">{o.orderNumber}</td>
                <td className="p-2.5">
                  <p className="font-medium">{o.customerName}</p>
                  <p className="text-xs text-muted-foreground">{o.customerPhone}</p>
                </td>
                <td className="p-2.5">
                  <p className="text-xs font-medium">{o.deliveryCity}</p>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                    {o.deliveryArea}
                  </p>
                </td>
                <td className="p-2.5 text-muted-foreground">{o.channel}</td>
                <td className="p-2.5 font-medium">{money(o.total)}</td>
                <td className="p-2.5">
                  <StatusPill status={o.paymentStatus} />
                </td>
                <td className="p-2.5">
                  <StatusPill status={o.fulfillmentStatus} />
                </td>
                <td className="p-2.5 text-right space-x-1">
                  {o.fulfillmentStatus === "Processing" && (
                    <button
                      disabled={updatingId === o.id}
                      onClick={() => handleFulfillment(o.id, "Preparing")}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium hover:bg-secondary/80"
                    >
                      Prepare
                    </button>
                  )}
                  {o.fulfillmentStatus === "Preparing" && (
                    <button
                      disabled={updatingId === o.id}
                      onClick={() => handleFulfillment(o.id, "Out for Delivery")}
                      className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-400 px-2.5 py-1 text-xs font-medium hover:bg-sky-500/20"
                    >
                      <Truck className="size-3" /> Dispatch
                    </button>
                  )}
                  {o.fulfillmentStatus === "Out for Delivery" && (
                    <button
                      disabled={updatingId === o.id}
                      onClick={() => handleFulfillment(o.id, "Delivered")}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 text-xs font-medium hover:bg-emerald-500/20"
                    >
                      <CheckCircle className="size-3" /> Delivered
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                  {loading ? "Loading database orders..." : "No orders match this query."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ErpPage>
  );
}
