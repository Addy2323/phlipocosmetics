import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ErpPage, StatusPill } from "@/components/Erp";
import { erpKpis, revenueSeries, erpOrders, erpAppointments, money } from "@/data/shop";

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
  return (
    <ErpPage title="Good morning, Amina" subtitle="Here is today across the shop and the salon.">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {erpKpis.map((k) => (
          <div key={k.label} className="card-surface p-4">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-display text-2xl">{k.value}</p>
            <p
              className={`mt-1 flex items-center gap-1 text-xs ${
                k.up ? "text-success" : "text-muted-foreground"
              }`}
            >
              {k.up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {k.delta}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Revenue this week</h2>
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
            <h2 className="font-display text-xl">Today's salon chairs</h2>
            <Link to="/erp/salon" className="flex items-center gap-1 text-xs text-primary">
              Salon ops <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ul className="space-y-3">
            {erpAppointments.map((a) => (
              <li key={`${a.time}-${a.client}`} className="flex items-center gap-3 text-sm">
                <span className="w-12 shrink-0 text-xs text-muted-foreground">{a.time}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.client}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.service} · {a.stylist}
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
          <h2 className="font-display text-xl">Latest orders</h2>
          <Link to="/erp/orders" className="flex items-center gap-1 text-xs text-primary">
            All orders <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Order</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Channel</th>
                <th className="pb-2 font-medium">Total</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {erpOrders.slice(0, 4).map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2.5 font-medium">{o.id}</td>
                  <td className="py-2.5">{o.customer}</td>
                  <td className="py-2.5 text-muted-foreground">{o.channel}</td>
                  <td className="py-2.5">{money(o.total)}</td>
                  <td className="py-2.5">
                    <StatusPill status={o.status} />
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
