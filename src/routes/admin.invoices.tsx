import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  FileText,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Settings,
  Plus,
  RefreshCw,
  DollarSign,
  Receipt,
  Sparkles,
  XCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  getStoredInvoices,
  saveStoredInvoices,
  Invoice,
  InvoiceStatus,
  InvoiceType,
  getInvoiceStats,
  getInvoiceSettings,
  saveInvoiceSettings,
  voidInvoice,
} from "@/lib/invoices-store";
import { downloadInvoicePDF, printInvoicePDF } from "@/lib/invoice-pdf";
import { InvoiceModal } from "@/components/admin/InvoiceModal";
import { ConfirmDialog, PromptDialog } from "@/components/admin/AdminModals";
import { formatTSh } from "@/data/shop";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/invoices")({
  head: () => ({
    meta: [
      { title: "Invoice Management & Financial Oversight — Philipo Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminInvoicesRoute,
});

export function AdminInvoicesRoute() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => getStoredInvoices());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");

  // Active viewing invoice
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState(() => getInvoiceSettings());

  // Void confirmation dialog state
  const [voidTarget, setVoidTarget] = useState<Invoice | null>(null);
  const [voidReasonPromptOpen, setVoidReasonPromptOpen] = useState(false);

  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((s, i) => s + (i.total || 0), 0);
    const totalCollected = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + (i.amountPaid || 0), 0);
    const pendingInvoices = invoices.filter((i) => i.status === "PENDING" || i.status === "PARTIALLY_PAID");
    const totalOutstanding = pendingInvoices.reduce((s, i) => s + (i.balanceDue || 0), 0);
    return {
      count: invoices.length,
      paidCount: invoices.filter((i) => i.status === "PAID").length,
      pendingCount: pendingInvoices.length,
      totalInvoiced,
      totalCollected,
      totalOutstanding,
    };
  }, [invoices]);

  // Filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.customerPhone.includes(q) ||
          (inv.orderId && inv.orderId.toLowerCase().includes(q)) ||
          (inv.appointmentId && inv.appointmentId.toLowerCase().includes(q)) ||
          inv.paymentReference.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status
      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false;
      }

      // Type
      if (typeFilter !== "ALL" && inv.type !== typeFilter) {
        return false;
      }

      // Date Range
      if (dateFilter !== "ALL") {
        const invDate = new Date(inv.issuedAt || inv.createdAt);
        const now = new Date();
        if (dateFilter === "7d") {
          const cut = new Date(now.getTime() - 7 * 86400000);
          if (invDate < cut) return false;
        } else if (dateFilter === "30d") {
          const cut = new Date(now.getTime() - 30 * 86400000);
          if (invDate < cut) return false;
        } else if (dateFilter === "90d") {
          const cut = new Date(now.getTime() - 90 * 86400000);
          if (invDate < cut) return false;
        }
      }

      return true;
    });
  }, [invoices, search, statusFilter, typeFilter, dateFilter]);

  const handleOpenInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setModalOpen(true);
  };

  const handleDownload = (inv: Invoice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      downloadInvoicePDF(inv);
      toast.success("Invoice PDF Downloaded", {
        description: `Saved as Philipo_Invoice_${inv.invoiceNumber}.pdf`,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  const handleVoidClick = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (inv.status === "VOID") {
      toast.info("Invoice is already voided");
      return;
    }
    setVoidTarget(inv);
    setVoidReasonPromptOpen(true);
  };

  const handleConfirmVoid = (reason: string) => {
    if (!voidTarget) return;
    const updated = voidInvoice(voidTarget.id, reason);
    if (updated) {
      setInvoices(getStoredInvoices());
      toast.success("Invoice Voided", {
        description: `Invoice #${voidTarget.invoiceNumber} status set to VOID.`,
      });
    }
    setVoidTarget(null);
    setVoidReasonPromptOpen(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveInvoiceSettings(settingsForm);
    setSettingsForm(updated);
    setSettingsOpen(false);
    toast.success("Invoice Settings Updated", {
      description: "Business TIN, address, and legal header defaults saved.",
    });
  };

  return (
    <AdminLayout
      title="Invoice Management & Settlement"
      subtitle="Comprehensive audit oversight, tax invoices, instant vector PDF downloads, and transaction verification."
      headerAction={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs text-slate-700 dark:text-slate-300"
          >
            <Settings className="size-3.5" />
            <span>Invoice Settings</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-surface p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Invoiced
            </span>
            <div className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">
              {formatTSh(stats.totalInvoiced)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {stats.count} total generated invoices
            </p>
          </div>

          <div className="card-surface p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Payments Collected
            </span>
            <div className="mt-1 font-serif text-2xl font-bold text-emerald-800 dark:text-emerald-300">
              {formatTSh(stats.totalCollected)}
            </div>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              {stats.paidCount} fully settled transactions
            </p>
          </div>

          <div className="card-surface p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Outstanding Balances
            </span>
            <div className="mt-1 font-serif text-2xl font-bold text-amber-800 dark:text-amber-300">
              {formatTSh(stats.totalOutstanding)}
            </div>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {stats.pendingCount} pending or partial collections
            </p>
          </div>

          <div className="card-surface p-5 rounded-2xl bg-[#F7F3EA] dark:bg-slate-900/60 border border-[#E8E2D8] dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F7034] dark:text-[#C9A45C]">
              Tax Compliance
            </span>
            <div className="mt-1 font-serif text-2xl font-bold text-[#174A35] dark:text-emerald-400">
              18% VAT
            </div>
            <p className="mt-1 text-xs text-slate-500">
              TIN: 142-890-332 · EFD Verified
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="card-surface p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice #, customer, phone, order ref, or M-Pesa ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#174A35]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid Only</option>
              <option value="PENDING">Pending Only</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="VOID">Voided</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="product">Cosmetic Orders</option>
              <option value="salon">Salon Bookings</option>
              <option value="pos">In-Store POS</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="card-surface rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type & Reference</th>
                  <th className="py-3 px-4 text-right">Amount (TZS)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No invoices found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => handleOpenInvoice(inv)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(inv.issuedAt).toLocaleDateString("en-TZ", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {inv.customerName}
                        </p>
                        <p className="text-[11px] text-slate-400">{inv.customerPhone}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inv.type === "salon"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                : inv.type === "pos"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                            }`}
                          >
                            {inv.type}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            #{inv.orderId || inv.appointmentId || inv.paymentReference}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {inv.total.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            inv.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : inv.status === "VOID"
                                ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 line-through"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
                          }`}
                        >
                          {inv.status === "PAID" && <CheckCircle2 className="size-3" />}
                          {inv.status === "PENDING" && <Clock className="size-3" />}
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenInvoice(inv)}
                            title="View Tax Invoice"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            onClick={(e) => handleDownload(inv, e)}
                            title="Download PDF"
                            className="p-1.5 rounded-lg text-[#174A35] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                          >
                            <Download className="size-4" />
                          </button>
                          {inv.status !== "VOID" && (
                            <button
                              onClick={(e) => handleVoidClick(inv, e)}
                              title="Void Invoice"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            >
                              <XCircle className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Document Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Prompt Reason for Voiding */}
      <PromptDialog
        open={voidReasonPromptOpen}
        title={`Void Invoice #${voidTarget?.invoiceNumber || ""}`}
        description="Enter the legal or operational reason for voiding this invoice (e.g., Customer return, payment reversal, duplicate order)."
        placeholder="Reason for voiding..."
        submitLabel="Confirm Void"
        onSubmit={handleConfirmVoid}
        onCancel={() => {
          setVoidTarget(null);
          setVoidReasonPromptOpen(false);
        }}
      />

      {/* Invoice Settings Modal */}
      {settingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-serif text-lg font-bold">Tax & Invoice Configuration</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={settingsForm.businessName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, businessName: e.target.value })
                    }
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Numbering Prefix
                  </label>
                  <input
                    type="text"
                    value={settingsForm.prefix}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, prefix: e.target.value })
                    }
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Taxpayer TIN
                  </label>
                  <input
                    type="text"
                    value={settingsForm.tin}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, tin: e.target.value })
                    }
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    VAT Reg Number (VRN)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.vrn}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, vrn: e.target.value })
                    }
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400">
                  Registered Premise Address
                </label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, address: e.target.value })
                  }
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Official Contact Phone
                  </label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, phone: e.target.value })
                    }
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Billing Email
                  </label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, email: e.target.value })
                    }
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400">
                  Return & Exchange Policy Text
                </label>
                <textarea
                  rows={2}
                  value={settingsForm.returnPolicy}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, returnPolicy: e.target.value })
                  }
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#174A35] hover:bg-[#0F3326] text-white font-semibold shadow-sm"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
