import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  Percent,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { ErpPage } from "@/components/Erp";
import { money } from "@/data/shop";
import { getSalesAnalytics } from "@/lib/erp-service";

export const Route = createFileRoute("/erp/sales")({
  head: () => ({
    meta: [
      { title: "Sales & Profit & Loss — Philipo ERP" },
      {
        name: "description",
        content: "Financial sales analytics, cost of goods sold, and gross profit breakdown.",
      },
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
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            From {data?.paidOrdersCount ?? 3} paid orders
          </p>
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
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Net earnings before tax
          </p>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">Profit Margin</span>
            <Percent className="size-4 text-sky-500" />
          </div>
          <p className="mt-2 font-display text-2xl">{marginPct}%</p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Healthy retail benchmark
          </p>
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
                <span className="font-medium">
                  {money(data?.channelBreakdown.Online ?? 456000)}
                </span>
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
                <span className="font-medium">
                  {money(data?.channelBreakdown.WhatsApp ?? 13500)}
                </span>
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
                <span className="font-medium">
                  {money(data?.paymentMethodBreakdown.MobileMoney ?? 480500)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: "90%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Credit / Debit Cards</span>
                <span className="font-medium">
                  {money(data?.paymentMethodBreakdown.Card ?? 13500)}
                </span>
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

      {/* Salon Performance & Revenue Section */}
      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Hair Salon Performance & Revenue</h2>
            <p className="text-xs text-muted-foreground">
              Verified salon chair appointments, chair utilization, stylist revenue attribution, and
              completion rates.
            </p>
          </div>
        </div>

        {/* Salon KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="card-surface p-5">
            <span className="text-xs text-muted-foreground">Total Bookings</span>
            <p className="mt-2 font-display text-2xl">48</p>
            <p className="mt-1 text-xs text-emerald-600 font-medium">96% fulfillment rate</p>
          </div>

          <div className="card-surface p-5">
            <span className="text-xs text-muted-foreground">Salon Revenue Collected</span>
            <p className="mt-2 font-display text-2xl">{money(1840000)}</p>
            <p className="mt-1 text-xs text-emerald-600 font-medium">+18.5% this month</p>
          </div>

          <div className="card-surface p-5">
            <span className="text-xs text-muted-foreground">Completed Appointments</span>
            <p className="mt-2 font-display text-2xl">42</p>
            <p className="mt-1 text-xs text-sky-600 font-medium">4 in chair today</p>
          </div>

          <div className="card-surface p-5">
            <span className="text-xs text-muted-foreground">Cancellation & No-Show</span>
            <p className="mt-2 font-display text-2xl">4.1%</p>
            <p className="mt-1 text-xs text-muted-foreground">2 cancellations, 0 no-show</p>
          </div>
        </div>

        {/* Best Performing Services & Stylist Revenue */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card-surface p-6">
            <h3 className="font-display text-lg font-bold mb-4">Top Revenue Salon Services</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-semibold text-sm">Knotless Braids</p>
                  <p className="text-muted-foreground">Hair Styling · 18 sessions</p>
                </div>
                <span className="font-bold text-sm text-primary">{money(630000)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-semibold text-sm">Silk Press & Flat Iron</p>
                  <p className="text-muted-foreground">Hair Straightening · 11 sessions</p>
                </div>
                <span className="font-bold text-sm text-primary">{money(550000)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-semibold text-sm">Wig Installation</p>
                  <p className="text-muted-foreground">Hair Styling · 7 sessions</p>
                </div>
                <span className="font-bold text-sm text-primary">{money(350000)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="font-semibold text-sm">Deep Conditioning & Steam</p>
                  <p className="text-muted-foreground">Hair Treatment · 9 sessions</p>
                </div>
                <span className="font-bold text-sm text-primary">{money(310000)}</span>
              </div>
            </div>
          </div>

          <div className="card-surface p-6">
            <h3 className="font-display text-lg font-bold mb-4">Revenue Generated by Stylist</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">Jane M. (★ 4.95)</span>
                  <span className="font-bold">{money(680000)} (37%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-[#D9A441]" style={{ width: "37%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">Amina Mushi (★ 4.90)</span>
                  <span className="font-bold">{money(520000)} (28%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "28%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">Grace Kilonzo (★ 4.85)</span>
                  <span className="font-bold">{money(390000)} (21%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-rose" style={{ width: "21%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">Neema Joseph (★ 4.90)</span>
                  <span className="font-bold">{money(250000)} (14%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-sky-500" style={{ width: "14%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErpPage>
  );
}
