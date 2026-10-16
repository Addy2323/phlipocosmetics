import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Eye,
  FileText,
  Phone,
  MapPin,
  X,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getStoredOrders, updateStoredOrderStatus, StoreOrder } from "@/lib/orders-store";
import { formatTSh } from "@/data/shop";
import { toast } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Orders Management & Fulfillment — Philipo Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrdersRoute,
});

export function AdminOrdersRoute() {
  const [orders, setOrders] = useState<StoreOrder[]>(() => getStoredOrders());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "ALL") {
        const current = o.fulfillmentStatus || "Delivered";
        if (current.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q) ||
          (o.destination && o.destination.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    updateStoredOrderStatus(orderId, newStatus);
    const refreshed = getStoredOrders();
    setOrders(refreshed);
    if (selectedOrder && selectedOrder.id === orderId) {
      const match = refreshed.find((o) => o.id === orderId);
      if (match) setSelectedOrder(match);
    }
    toast.success("Order Status Updated", {
      description: `Order #${orderId} marked as ${newStatus}.`,
    });
  };

  return (
    <AdminLayout
      title="Orders & Parcel Fulfillment"
      subtitle="Track customer cosmetic purchases, intercity cargo dispatch, and payment verifications."
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {orders.length}
            </div>
            <p className="text-[11px] text-slate-500">Across web shop and direct sales</p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Delivered
            </span>
            <div className="text-xl font-bold text-emerald-600">
              {orders.filter((o) => (o.fulfillmentStatus || "Delivered") === "Delivered").length}
            </div>
            <p className="text-[11px] text-slate-500">Successfully fulfilled</p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              In Transit / Dispatched
            </span>
            <div className="text-xl font-bold text-blue-600">
              {orders.filter((o) => o.fulfillmentStatus === "Dispatched").length}
            </div>
            <p className="text-[11px] text-slate-500">En route to customer</p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Processing
            </span>
            <div className="text-xl font-bold text-amber-500">
              {orders.filter((o) => o.fulfillmentStatus === "Processing").length}
            </div>
            <p className="text-[11px] text-slate-500">Awaiting dispatch</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-[#0B1326] p-4 rounded-2xl border border-slate-200 dark:border-[#15213B] shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer, phone, city..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Fulfillments</option>
              <option value="Delivered">Delivered</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Processing">Processing</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-[#0B1326] p-6 rounded-3xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Orders Ledger ({filteredOrders.length})
            </h3>
            <span className="text-xs text-slate-400">Click inspect to view item breakdown</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#15213B] text-slate-400 font-semibold">
                  <th className="py-3 px-3">Order Ref</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items Summary</th>
                  <th className="py-3 px-3">Total (TZS)</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Fulfillment</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-[#15213B]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No customer orders match criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const status = o.fulfillmentStatus || "Delivered";

                    return (
                      <tr
                        key={o.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-[#0E1A33] transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {o.orderNumber || o.id}
                        </td>
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(o.createdAt || Date.now()).toLocaleDateString("en-TZ", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {o.customerName}
                          </p>
                          <p className="text-[10px] text-slate-400">{o.customerPhone}</p>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {o.items?.map((i) => `${i.qty}× ${i.name}`).join(", ") || "Beauty Products"}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {formatTSh(o.total)}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {o.paymentMethod || "Mobile Money"}
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={status}
                            onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                              status === "Delivered"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : status === "Dispatched"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : status === "Processing"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            <option value="Processing">Processing</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                          >
                            <Eye className="size-3.5" /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ORDER DETAIL DRAWER / MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#15213B] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Order Details
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Order #{selectedOrder.orderNumber || selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0E1726] border border-slate-100 dark:border-[#1B273F] space-y-1">
                <span className="text-[10px] font-bold text-slate-400">Customer</span>
                <p className="font-bold text-slate-900 dark:text-white">{selectedOrder.customerName}</p>
                <p className="text-slate-500 flex items-center gap-1">
                  <Phone className="size-3" /> {selectedOrder.customerPhone}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0E1726] border border-slate-100 dark:border-[#1B273F] space-y-1">
                <span className="text-[10px] font-bold text-slate-400">Destination</span>
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <MapPin className="size-3 text-rose-500" /> {selectedOrder.destination || "Dar es Salaam Flagship"}
                </p>
                <p className="text-slate-500">{selectedOrder.paymentMethod || "Mobile Money"}</p>
              </div>
            </div>

            {/* Items table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Purchased Formulations & Items
              </span>
              <div className="rounded-2xl border border-slate-100 dark:border-[#1B273F] overflow-hidden text-xs">
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-[#1B273F] last:border-0"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <span className="text-[11px] text-slate-400">Qty: {item.qty} units</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatTSh((item.price || 0) * (item.qty || 1))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#15213B]">
              <span className="font-bold text-xs text-slate-500">Gross Total</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {formatTSh(selectedOrder.total)}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 text-white font-semibold text-xs shadow-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
