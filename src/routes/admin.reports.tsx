import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  FileText,
  Scissors,
  Package,
  CreditCard,
  Boxes,
  CheckCircle2,
  Clock,
  Sparkles,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getStoredOrders, StoreOrder } from "@/lib/orders-store";
import { getStoredAppointments, SalonAppointmentRecord } from "@/lib/salon-data";
import { getStoredInvoices } from "@/lib/invoices-store";
import { products, formatTSh } from "@/data/shop";
import { downloadReportPDF, ReportExportData } from "@/lib/report-pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Business Intelligence & Reports — Philipo Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminReportsRoute,
});

type ReportCategory = "sales" | "products" | "salon" | "payments" | "inventory" | "pnl";
type PresetRange = "7d" | "30d" | "90d" | "this_month" | "annual" | "custom";

interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  date: string;
  note: string;
}

const DEFAULT_EXPENSES: ExpenseItem[] = [
  { id: "e-1", category: "Kariakoo Store Rent", amount: 1500000, date: new Date().toISOString().slice(0, 10), note: "Monthly retail premise lease" },
  { id: "e-2", category: "Salon Power & Utilities", amount: 350000, date: new Date().toISOString().slice(0, 10), note: "TANESCO electricity & salon equipment" },
  { id: "e-3", category: "Packaging & Bags", amount: 250000, date: new Date().toISOString().slice(0, 10), note: "Philipo branded silk ribbons and bags" },
];

const BRAND_PALETTE = {
  forestGreen: "#174A35",
  deepEmerald: "#0F3326",
  warmCream: "#F7F3EA",
  champagneGold: "#C9A45C",
  softSage: "#E4EEE6",
  coralRed: "#FCE8E6",
  warmAmber: "#FFF1D6",
  chartColors: ["#174A35", "#C9A45C", "#0F3326", "#8F7034", "#10B981", "#3B82F6", "#EC4899"],
};

export function AdminReportsRoute() {
  const [category, setCategory] = useState<ReportCategory>("sales");
  const [rangePreset, setRangePreset] = useState<PresetRange>("30d");
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Secondary Filters
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>("ALL");

  // Determine active date boundaries
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let label = "Last 30 Days";

    if (rangePreset === "7d") {
      start.setDate(now.getDate() - 7);
      label = "Last 7 Days";
    } else if (rangePreset === "30d") {
      start.setDate(now.getDate() - 30);
      label = "Last 30 Days";
    } else if (rangePreset === "90d") {
      start.setDate(now.getDate() - 90);
      label = "Last 90 Days";
    } else if (rangePreset === "this_month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      label = "This Month";
    } else if (rangePreset === "annual") {
      start = new Date(now.getFullYear(), 0, 1);
      label = "Year to Date";
    } else {
      start = new Date(customStart || now);
      end = new Date(customEnd || now);
      label = "Custom Range";
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end, periodLabel: label };
  }, [rangePreset, customStart, customEnd]);

  // Real Database Records
  const orders = useMemo(() => getStoredOrders(), []);
  const appointments = useMemo(() => getStoredAppointments(), []);
  const invoices = useMemo(() => getStoredInvoices(), []);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt || Date.now());
      if (orderDate < startDate || orderDate > endDate) return false;
      if (paymentFilter !== "ALL") {
        if (paymentFilter === "PAID" && o.paymentStatus !== "Paid" && o.paymentStatus !== "PAID") return false;
        if (paymentFilter === "PENDING" && (o.paymentStatus === "Paid" || o.paymentStatus === "PAID")) return false;
      }
      return true;
    });
  }, [orders, startDate, endDate, paymentFilter]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const apptDate = new Date(a.appointmentDate || a.createdAt);
      if (apptDate < startDate || apptDate > endDate) return false;
      if (serviceCategoryFilter !== "ALL" && a.categoryName !== serviceCategoryFilter) return false;
      return true;
    });
  }, [appointments, startDate, endDate, serviceCategoryFilter]);

  // Financial Metrics
  const productGrossSales = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [filteredOrders]);

  const salonGrossSales = useMemo(() => {
    return filteredAppointments
      .filter((a) => a.status === "CONFIRMED" || a.status === "COMPLETED")
      .reduce((sum, a) => sum + (a.price || 0), 0);
  }, [filteredAppointments]);

  const totalGrossRevenue = productGrossSales + salonGrossSales;
  const productCOGS = Math.round(productGrossSales * 0.42); // 42% cost of cosmetics
  const salonDirectCost = Math.round(salonGrossSales * 0.20); // 20% stylist materials & consumables
  const totalCOGS = productCOGS + salonDirectCost;

  const daysDiff = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
  const monthlyOpex = DEFAULT_EXPENSES.reduce((sum, e) => sum + e.amount, 0);
  const totalOpEx = Math.round((monthlyOpex / 30) * daysDiff);

  const grossProfit = totalGrossRevenue - totalCOGS;
  const netProfit = grossProfit - totalOpEx;
  const netMargin = totalGrossRevenue > 0 ? Math.round((netProfit / totalGrossRevenue) * 100) : 0;

  // Chart Data: Timeline Area chart
  const timelineChartData = useMemo(() => {
    const isMonthly = daysDiff > 90;
    const buckets: Record<string, { label: string; products: number; salon: number; total: number; netProfit: number }> = {};

    filteredOrders.forEach((o) => {
      const d = new Date(o.createdAt || Date.now());
      const key = isMonthly
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : d.toISOString().slice(0, 10);
      const label = isMonthly
        ? d.toLocaleDateString("en-TZ", { month: "short", year: "2-digit" })
        : d.toLocaleDateString("en-TZ", { day: "numeric", month: "short" });

      if (!buckets[key]) {
        buckets[key] = { label, products: 0, salon: 0, total: 0, netProfit: 0 };
      }
      buckets[key].products += o.total || 0;
      buckets[key].total += o.total || 0;
      buckets[key].netProfit += Math.round((o.total || 0) * 0.58);
    });

    filteredAppointments.forEach((a) => {
      const d = new Date(a.appointmentDate || a.createdAt);
      const key = isMonthly
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : d.toISOString().slice(0, 10);
      const label = isMonthly
        ? d.toLocaleDateString("en-TZ", { month: "short", year: "2-digit" })
        : d.toLocaleDateString("en-TZ", { day: "numeric", month: "short" });

      if (!buckets[key]) {
        buckets[key] = { label, products: 0, salon: 0, total: 0, netProfit: 0 };
      }
      buckets[key].salon += a.price || 0;
      buckets[key].total += a.price || 0;
      buckets[key].netProfit += Math.round((a.price || 0) * 0.75);
    });

    return Object.keys(buckets).sort().map((k) => buckets[k]);
  }, [filteredOrders, filteredAppointments, daysDiff]);

  // Payment method breakdown
  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      const method = o.paymentMethod || "Mobile Money";
      map[method] = (map[method] || 0) + (o.total || 0);
    });
    filteredAppointments.forEach((a) => {
      const method = a.paymentMethod || "Mobile Money";
      map[method] = (map[method] || 0) + (a.price || 0);
    });

    return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
  }, [filteredOrders, filteredAppointments]);

  // Product sales breakdown
  const productPerformanceRows = useMemo(() => {
    const map: Record<string, { sku: string; units: number; revenue: number; cogs: number }> = {};
    filteredOrders.forEach((o) => {
      o.items?.forEach((it) => {
        const name = it.name;
        if (!map[name]) {
          const matchedProd = products.find((p) => p.name === name);
          map[name] = {
            sku: matchedProd?.sku || "SKU-PC-PRD",
            units: 0,
            revenue: 0,
            cogs: 0,
          };
        }
        map[name].units += it.qty || 1;
        const lineTotal = (it.price || 0) * (it.qty || 1);
        map[name].revenue += lineTotal;
        map[name].cogs += Math.round(lineTotal * 0.42);
      });
    });

    return Object.keys(map)
      .map((name) => ({
        name,
        sku: map[name].sku,
        units: map[name].units,
        revenue: map[name].revenue,
        cogs: map[name].cogs,
        profit: map[name].revenue - map[name].cogs,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // Salon service breakdown
  const salonPerformanceRows = useMemo(() => {
    const map: Record<string, { service: string; stylist: string; count: number; revenue: number }> = {};
    filteredAppointments.forEach((a) => {
      const key = `${a.serviceName} (${a.stylistName})`;
      if (!map[key]) {
        map[key] = {
          service: a.serviceName,
          stylist: a.stylistName,
          count: 0,
          revenue: 0,
        };
      }
      map[key].count += 1;
      map[key].revenue += a.price || 0;
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredAppointments]);

  // EXPORT HANDLERS
  const handleExportPDF = () => {
    let title = "Business Intelligence & Sales Report";
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (category === "sales" || category === "pnl") {
      title = category === "pnl" ? "Profit and Loss Statement" : "Executive Sales Performance Report";
      headers = ["Order / Ref #", "Date", "Customer Name", "Channel", "Payment Mode", "Gross Total (TZS)", "Status"];
      rows = filteredOrders.map((o) => [
        o.orderNumber || o.id,
        new Date(o.createdAt || Date.now()).toISOString().slice(0, 10),
        o.customerName,
        o.channel || "Online",
        o.paymentMethod || "M-Pesa",
        o.total || 0,
        o.paymentStatus || "Paid",
      ]);
    } else if (category === "products") {
      title = "Product Performance & SKU Profitability Report";
      headers = ["Product Name", "SKU", "Units Sold", "Gross Revenue (TZS)", "COGS (TZS)", "Gross Profit (TZS)"];
      rows = productPerformanceRows.map((p) => [p.name, p.sku, p.units, p.revenue, p.cogs, p.profit]);
    } else if (category === "salon") {
      title = "Hair Salon Appointment & Stylist Revenue Report";
      headers = ["Service Name", "Assigned Stylist", "Bookings Count", "Total Revenue (TZS)", "Average Ticket (TZS)"];
      rows = salonPerformanceRows.map((s) => [s.service, s.stylist, s.count, s.revenue, Math.round(s.revenue / (s.count || 1))]);
    } else if (category === "payments") {
      title = "Payment Provider & Cash Reconciliation Report";
      headers = ["Payment Method", "Transactions Volume (TZS)", "Share of Total"];
      const sumTotal = paymentMethodData.reduce((acc, curr) => acc + curr.value, 0) || 1;
      rows = paymentMethodData.map((p) => [p.name, p.value, `${Math.round((p.value / sumTotal) * 100)}%`]);
    } else if (category === "inventory") {
      title = "Inventory Valuation & Stock Replenishment Report";
      headers = ["Product Name", "SKU", "Category", "In Stock Units", "Unit Value (TZS)", "Total Valuation (TZS)"];
      rows = products.map((p) => [p.name, p.sku, p.category, p.stock, p.price, p.stock * p.price]);
    }

    const exportPayload: ReportExportData = {
      title,
      category,
      periodLabel,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      currency: "TZS",
      generatedAt: new Date().toISOString(),
      generatedBy: "Philipo Executive Admin",
      kpis: [
        { label: "Gross Revenue", value: formatTSh(totalGrossRevenue), hint: "Cosmetics + Salon" },
        { label: "COGS & Directs", value: formatTSh(totalCOGS), hint: "Material and unit wholesale" },
        { label: "Gross Profit", value: formatTSh(grossProfit), hint: "Before store OpEx" },
        { label: "Net Profit", value: formatTSh(netProfit), hint: `${netMargin}% Net Margin` },
      ],
      headers,
      rows,
    };

    downloadReportPDF(exportPayload);
    toast.success("Branded PDF Report Generated", {
      description: `Saved as Philipo_${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
    });
  };

  const handleExportCSV = () => {
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);
    const filename = `Philipo_${category}_report_${startStr}_to_${endStr}.csv`;

    const rows: string[][] = [
      ["PHILIPO COSMETICS - BUSINESS INTELLIGENCE REPORT"],
      ["Report Category", category.toUpperCase()],
      ["Reporting Period", `${periodLabel} (${startStr} to ${endStr})`],
      ["Gross Revenue", totalGrossRevenue.toString()],
      ["Cost of Goods Sold", totalCOGS.toString()],
      ["Operating Expenses", totalOpEx.toString()],
      ["Net Profit", netProfit.toString()],
      [],
    ];

    if (category === "products") {
      rows.push(["Product Name", "SKU", "Units Sold", "Gross Revenue (TZS)", "COGS (TZS)", "Profit (TZS)"]);
      productPerformanceRows.forEach((p) => {
        rows.push([`"${p.name}"`, p.sku, p.units.toString(), p.revenue.toString(), p.cogs.toString(), p.profit.toString()]);
      });
    } else if (category === "salon") {
      rows.push(["Service Name", "Stylist", "Bookings Count", "Total Revenue (TZS)"]);
      salonPerformanceRows.forEach((s) => {
        rows.push([`"${s.service}"`, `"${s.stylist}"`, s.count.toString(), s.revenue.toString()]);
      });
    } else {
      rows.push(["Order / Ref #", "Date", "Customer Name", "Phone", "Payment Mode", "Total (TZS)", "Status"]);
      filteredOrders.forEach((o) => {
        rows.push([
          o.orderNumber || o.id,
          new Date(o.createdAt || Date.now()).toISOString().slice(0, 10),
          `"${o.customerName}"`,
          `"${o.customerPhone}"`,
          `"${o.paymentMethod || "Mobile Money"}"`,
          (o.total || 0).toString(),
          `"${o.paymentStatus || "Paid"}"`,
        ]);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Excel CSV Report Exported", {
      description: `Downloaded ${filename} successfully.`,
    });
  };

  return (
    <AdminLayout
      title="Business Intelligence & Reports"
      subtitle="Comprehensive revenue audits, salon appointments & cosmetics sales analytics, and multi-format reporting exports."
      headerAction={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#174A35] hover:bg-[#0F3326] text-white text-xs font-semibold shadow-sm transition"
          >
            <FileText className="size-3.5" />
            <span>Export Branded PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-600" />
            <span>Export Excel (CSV)</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Controls: Report Category Selector */}
        <div className="card-surface p-2 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-wrap gap-1.5">
          {[
            { id: "sales", label: "Sales Report", icon: TrendingUp },
            { id: "products", label: "Product Performance", icon: Package },
            { id: "salon", label: "Salon Performance", icon: Scissors },
            { id: "payments", label: "Payment Reconciliation", icon: CreditCard },
            { id: "inventory", label: "Inventory Valuation", icon: Boxes },
            { id: "pnl", label: "Profit & Loss (P&L)", icon: DollarSign },
          ].map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as ReportCategory)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  active
                    ? "bg-[#174A35] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Filters & Period Bar */}
        <div className="card-surface p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Period:
            </span>
            {[
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "90 Days" },
              { id: "this_month", label: "This Month" },
              { id: "annual", label: "YTD" },
              { id: "custom", label: "Custom Range" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setRangePreset(p.id as PresetRange)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  rangePreset === p.id
                    ? "bg-[#0F3326] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {rangePreset === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          <div className="text-xs text-slate-500 font-medium">
            Active: <strong className="text-slate-800 dark:text-slate-200">{periodLabel}</strong> ({startDate.toISOString().slice(0, 10)} to {endDate.toISOString().slice(0, 10)})
          </div>
        </div>

        {/* Dynamic KPI Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-surface p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Gross Revenue
            </span>
            <div className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">
              {formatTSh(totalGrossRevenue)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Products ({formatTSh(productGrossSales)}) + Salon ({formatTSh(salonGrossSales)})
            </p>
          </div>

          <div className="card-surface p-5 rounded-2xl bg-[#E4EEE6] dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#174A35] dark:text-emerald-400">
              Gross Profit
            </span>
            <div className="mt-1 font-serif text-2xl font-bold text-[#174A35] dark:text-emerald-300">
              {formatTSh(grossProfit)}
            </div>
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              COGS Wholesale: {formatTSh(totalCOGS)}
            </p>
          </div>

          <div className="card-surface p-5 rounded-2xl bg-[#F7F3EA] dark:bg-amber-950/20 border border-[#E8E2D8] dark:border-amber-900/40 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F7034] dark:text-[#C9A45C]">
              Net Operating Profit
            </span>
            <div className="mt-1 font-serif text-2xl font-bold text-[#0F3326] dark:text-amber-300">
              {formatTSh(netProfit)}
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Net Margin: <strong>{netMargin}%</strong> (OpEx: {formatTSh(totalOpEx)})
            </p>
          </div>

          <div className="card-surface p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Transactions & Appointments
            </span>
            <div className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">
              {filteredOrders.length + filteredAppointments.length}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {filteredOrders.length} orders · {filteredAppointments.length} salon bookings
            </p>
          </div>
        </div>

        {/* Interactive Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area Timeline Chart */}
          <div className="lg:col-span-2 card-surface p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                  Revenue & Net Profit Trend
                </h3>
                <p className="text-xs text-slate-500">
                  Spline analysis across the selected {periodLabel.toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#174A35]" />
                  Total Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#C9A45C]" />
                  Net Profit
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#174A35" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#174A35" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A45C" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#C9A45C" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`TZS ${Number(val).toLocaleString()}`, ""]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #CBD5E1", fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Revenue"
                    stroke="#174A35"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="netProfit"
                    name="Net Profit"
                    stroke="#C9A45C"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorNet)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="card-surface p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                Payment Channel Mix
              </h3>
              <p className="text-xs text-slate-500">
                Share of collected mobile money vs cards & cash
              </p>
            </div>

            <div className="h-48 w-full my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BRAND_PALETTE.chartColors[index % BRAND_PALETTE.chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatTSh(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {paymentMethodData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{
                        backgroundColor:
                          BRAND_PALETTE.chartColors[idx % BRAND_PALETTE.chartColors.length],
                      }}
                    />
                    <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {formatTSh(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Report Table depending on Active Category */}
        <div className="card-surface rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white capitalize">
              {category === "sales"
                ? "Recent Verified Sales Transactions"
                : category === "products"
                  ? "SKU Performance & Margin Ledger"
                  : category === "salon"
                    ? "Salon Appointment Revenue Audit"
                    : category === "pnl"
                      ? "Operating Cost & P&L Statement"
                      : `${category} Detailed Ledger`}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Displaying active {periodLabel.toLowerCase()}
            </span>
          </div>

          <div className="overflow-x-auto">
            {category === "products" ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 text-center">Units Sold</th>
                    <th className="py-3 px-4 text-right">Revenue (TZS)</th>
                    <th className="py-3 px-4 text-right">COGS (TZS)</th>
                    <th className="py-3 px-4 text-right">Gross Profit (TZS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {productPerformanceRows.map((p) => (
                    <tr key={p.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.sku}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {p.units}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {p.revenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {p.cogs.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {p.profit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : category === "salon" ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Service Name</th>
                    <th className="py-3 px-4">Stylist</th>
                    <th className="py-3 px-4 text-center">Bookings</th>
                    <th className="py-3 px-4 text-right">Total Revenue (TZS)</th>
                    <th className="py-3 px-4 text-right">Average Ticket (TZS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {salonPerformanceRows.map((s) => (
                    <tr key={`${s.service}-${s.stylist}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {s.service}
                      </td>
                      <td className="py-3 px-4 text-[#8F7034] dark:text-[#C9A45C] font-medium">
                        {s.stylist}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {s.count}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {s.revenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {Math.round(s.revenue / (s.count || 1)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Order / Ref</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 text-right">Gross Total (TZS)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {o.orderNumber || o.id}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(o.createdAt || Date.now()).toISOString().slice(0, 10)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {o.customerName}
                        </p>
                        <p className="text-[11px] text-slate-400">{o.customerPhone}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {o.paymentMethod || "Mobile Money"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {(o.total || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                          {o.paymentStatus || "Paid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
