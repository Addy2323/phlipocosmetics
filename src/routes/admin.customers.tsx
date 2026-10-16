import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  UserCheck,
  Search,
  Phone,
  Mail,
  ShoppingBag,
  Award,
  Sparkles,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getStoredOrders } from "@/lib/orders-store";
import { getStoredAccounts, type StoredAccount } from "@/lib/auth-client";
import { formatTSh } from "@/data/shop";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({
    meta: [
      { title: "Customers Directory & Spending — Philipo Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCustomersRoute,
});

interface CustomerProfile {
  name: string;
  phone: string;
  email?: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  city: string;
}

export function AdminCustomersRoute() {
  const [searchQuery, setSearchQuery] = useState("");

  const customers = useMemo(() => {
    const orders = getStoredOrders();
    const accounts = getStoredAccounts();

    const customerMap: Record<string, CustomerProfile> = {};

    // Populate from orders
    orders.forEach((o) => {
      const key = o.customerPhone || o.customerName || "Unknown";
      if (!customerMap[key]) {
        customerMap[key] = {
          name: o.customerName || "Valued Client",
          phone: o.customerPhone || "—",
          email: undefined,
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: o.createdAt || new Date().toISOString(),
          city: o.destination ? o.destination.split(",").pop()?.trim() || "Dar es Salaam" : "Dar es Salaam",
        };
      }

      customerMap[key].ordersCount += 1;
      customerMap[key].totalSpent += o.total || 0;
      if (new Date(o.createdAt || 0) > new Date(customerMap[key].lastOrderDate)) {
        customerMap[key].lastOrderDate = o.createdAt || customerMap[key].lastOrderDate;
      }
    });

    // Merge registered accounts
    accounts
      .filter((a: StoredAccount) => a.role === "customer")
      .forEach((a: StoredAccount) => {
        const key = a.phone || a.fullName;
        if (!customerMap[key]) {
          customerMap[key] = {
            name: a.fullName,
            phone: a.phone,
            email: a.email,
            ordersCount: 0,
            totalSpent: 0,
            lastOrderDate: a.createdAt,
            city: "Dar es Salaam",
          };
        } else {
          customerMap[key].email = a.email;
        }
      });

    return Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.city.toLowerCase().includes(q),
    );
  }, [customers, searchQuery]);

  return (
    <AdminLayout
      title="Customers Directory & Loyalty"
      subtitle="Comprehensive view of cosmetic shoppers, salon appointment repeat guests, and lifetime customer value."
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Shoppers
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {customers.length} Clients
            </div>
            <p className="text-[11px] text-slate-500">
              Purchasing via storefront, POS, and mobile portal
            </p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Average Spend Per Client
            </span>
            <div className="text-xl font-bold text-emerald-600">
              {customers.length > 0
                ? formatTSh(
                    Math.round(
                      customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length,
                    ),
                  )
                : "TZS 0"}
            </div>
            <p className="text-[11px] text-slate-500">Strong luxury cosmetics basket size</p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Repeat Buyers
            </span>
            <div className="text-xl font-bold text-blue-600">
              {customers.filter((c) => c.ordersCount > 1).length} VIP Guests
            </div>
            <p className="text-[11px] text-slate-500">More than 1 completed purchase</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-[#0B1326] p-4 rounded-2xl border border-slate-200 dark:border-[#15213B] shadow-xs flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, phone, city..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
            />
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredCustomers.length} clients
          </span>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#0B1326] p-6 rounded-3xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#15213B] text-slate-400 font-semibold">
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">City / Area</th>
                  <th className="py-3 px-3 text-center">Orders</th>
                  <th className="py-3 px-3">Lifetime Spend</th>
                  <th className="py-3 px-3">Last Active</th>
                  <th className="py-3 px-3 text-right">Loyalty Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-[#15213B]">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No customer records match search.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#0E1A33] transition-colors"
                    >
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 space-y-0.5 text-slate-600 dark:text-slate-400">
                        <p className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Phone className="size-3 text-slate-400" /> {c.phone}
                        </p>
                        {c.email && (
                          <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Mail className="size-3 text-slate-400" /> {c.email}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {c.city}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                        {c.ordersCount}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {formatTSh(c.totalSpent)}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(c.lastOrderDate).toLocaleDateString("en-TZ", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {c.totalSpent >= 200000 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Sparkles className="size-3" /> VIP Gold
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Standard
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
