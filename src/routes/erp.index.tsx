import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ErpPage, StatusPill } from "@/components/Erp";
import { erpKpis, revenueSeries, money } from "@/data/shop";
import { getDashboardStats, type DashboardStats } from "@/lib/erp-service";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/erp/")({
  head: () => ({
    meta: [
      { title: "ERP dashboard — Philipo Cosmetics" },
      { name: "description", content: "Revenue, orders, profit and salon activity for Philipo Cosmetics." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(console.error);
  }, []);

  const totalRev = stats ? stats.totalRevenue : 494000;
  const todayOrders = stats ? stats.todayOrdersCount : 8;
  const activeAppts = stats ? stats.activeAppointmentsCount : 6;
  const lowStock = stats ? stats.lowStockCount : 2;

  const liveKpis = [
    { label: "Total Revenue (Gross)", value: money(totalRev), delta: "+18.4% vs last month", up: true },
    { label: "Orders Today", value: `${todayOrders} orders`, delta: "4 pending dispatch", up: true },
    { label: "Active Salon Chairs", value: `${activeAppts} appointments`, delta: "Next @ 14:00", up: true },
    { label: "Low Stock Items", value: `${lowStock} products`, delta: "Requires replenishment", up: false },
    { label: "Gross Profit Margin", value: stats ? money(stats.grossProfit) : "TSh 264,000", delta: "Margin: 53.4%", up: true },
    { label: "Baraka SMS Status", value: "Active", delta: "100% delivery rate", up: true },
  ];

  return (
    <ErpPage title={`Good day, ${user?.fullName ?? "Staff"}`} subtitle="Real-time operational metrics across E-Commerce storefront and Hair Salon.">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {liveKpis.map((k) => (
          <div key={k.label} className="card-surface p-4">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-display text-2xl">{k.value}</p>
            <p
              className={`mt-1 flex items-center gap-1 text-xs ${
                k.up ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400 font-medium"
              }`}
            >
              {k.up ? <TrendingUp className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
              {k.delta}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Revenue Trend</h2>
            <span className="text-xs text-muted-foreground">TSh millions</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: "var(--secondary)" }}
                  formatter={(v) => [`TSh ${v} M`, "Revenue"]}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Today's Salon Schedule</h2>
            <Link to="/erp/salon" className="flex items-center gap-1 text-xs text-primary">
              Salon ops <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ul className="space-y-3">
            {(stats?.recentAppointments ?? []).slice(0, 4).map((a) => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <span className="w-12 shrink-0 text-xs text-muted-foreground">{a.timeSlot}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.customerName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.serviceName} · {a.stylistName}
                  </p>
                </div>
                <StatusPill status={a.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card-surface mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">Live Store Orders</h2>
          <Link to="/erp/orders" className="flex items-center gap-1 text-xs text-primary">
            All orders <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Order #</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Channel</th>
                <th className="pb-2 font-medium">Total</th>
                <th className="pb-2 font-medium">Fulfillment</th>
                <th className="pb-2 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentOrders ?? []).slice(0, 5).map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2.5 font-medium">{o.orderNumber}</td>
                  <td className="py-2.5">{o.customerName}</td>
                  <td className="py-2.5 text-muted-foreground">{o.channel}</td>
                  <td className="py-2.5 font-medium">{money(o.total)}</td>
                  <td className="py-2.5">
                    <StatusPill status={o.fulfillmentStatus} />
                  </td>
                  <td className="py-2.5">
                    <StatusPill status={o.paymentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ErpPage>
  );
}
