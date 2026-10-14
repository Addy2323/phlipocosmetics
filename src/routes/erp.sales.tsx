import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, PieChart as PieIcon, Percent, CreditCard, ShoppingBag } from "lucide-react";
import { ErpPage } from "@/components/Erp";
import { money } from "@/data/shop";
import { getSalesAnalytics } from "@/lib/erp-service";

export const Route = createFileRoute("/erp/sales")({
  head: () => ({
    meta: [
      { title: "Sales & Profit & Loss — Philipo ERP" },
      { name: "description", content: "Financial sales analytics, cost of goods sold, and gross profit breakdown." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SalesDashboard,
});

function SalesDashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getSalesAnalytics>> | null>(null);

  useEffect(() => {
    getSalesAnalytics().then(setData).catch(console.error);
  }, []);

  const totalRev = data ? data.totalRevenue : 494000;
  const cogs = data ? data.totalCOGS : 230000;
  const netProfit = data ? data.netProfit : 264000;
  const marginPct = data ? data.marginPercent : "53.4";

  return (
    <ErpPage
      title="Sales & Financial Analytics"
      subtitle="Profit & loss accounting, channel distribution, and cost of goods sold (COGS)."
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card-surface p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">Gross Revenue</span>
            <DollarSign className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-display text-2xl">{money(totalRev)}</p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">From {data?.paidOrdersCount ?? 3} paid orders</p>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">Cost of Goods (COGS)</span>
            <ShoppingBag className="size-4 text-amber-500" />
          </div>
          <p className="mt-2 font-display text-2xl">{money(cogs)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Product procurement cost</p>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">Gross Profit</span>
            <TrendingUp className="size-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl">{money(netProfit)}</p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Net earnings before tax</p>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">Profit Margin</span>
            <Percent className="size-4 text-sky-500" />
          </div>
          <p className="mt-2 font-display text-2xl">{marginPct}%</p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Healthy retail benchmark</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="card-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Revenue by Sales Channel</h2>
            <PieIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Online Storefront</span>
                <span className="font-medium">{money(data?.channelBreakdown.Online ?? 456000)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "85%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Salon & Counter POS</span>
                <span className="font-medium">{money(data?.channelBreakdown.POS ?? 24500)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-rose" style={{ width: "10%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>WhatsApp Direct Sales</span>
                <span className="font-medium">{money(data?.channelBreakdown.WhatsApp ?? 13500)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: "5%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Payment Gateway Split</h2>
            <CreditCard className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Mobile Money (M-Pesa / Tigo / Airtel)</span>
                <span className="font-medium">{money(data?.paymentMethodBreakdown.MobileMoney ?? 480500)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: "90%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Credit / Debit Cards</span>
                <span className="font-medium">{money(data?.paymentMethodBreakdown.Card ?? 13500)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: "7%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Cash on Delivery (COD)</span>
                <span className="font-medium">{money(data?.paymentMethodBreakdown.COD ?? 0)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-slate-400" style={{ width: "3%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErpPage>
  );
}
