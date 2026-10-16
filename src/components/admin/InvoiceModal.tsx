import React from "react";
import {
  X,
  Download,
  Printer,
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Invoice } from "@/lib/invoices-store";
import { downloadInvoicePDF, printInvoicePDF } from "@/lib/invoice-pdf";
import { toast } from "sonner";

interface InvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceModal({ invoice, isOpen, onClose }: InvoiceModalProps) {
  if (!isOpen || !invoice) return null;

  const handleCopyLink = () => {
    try {
      const url = `${window.location.origin}/account?tab=invoices&invoice=${invoice.invoiceNumber}`;
      navigator.clipboard.writeText(url);
      toast.success("Invoice Link Copied", {
        description: `Link for invoice #${invoice.invoiceNumber} copied to clipboard.`,
      });
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleDownload = () => {
    try {
      downloadInvoicePDF(invoice);
      toast.success("Invoice Downloaded", {
        description: `Saved as Philipo_Invoice_${invoice.invoiceNumber}.pdf`,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  const handlePrint = () => {
    printInvoicePDF(invoice);
  };

  const isPaid = invoice.status === "PAID";
  const isPending = invoice.status === "PENDING" || invoice.status === "PARTIALLY_PAID";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-3xl my-auto rounded-3xl bg-[#FAF8F5] text-slate-900 shadow-2xl border border-[#FCEAF2] overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Brand Accent Top Stripe: Navy + Philipo Magenta */}
        <div className="h-2 w-full bg-[#173488]" />
        <div className="h-1 w-full bg-[#E6007A]" />

        {/* Modal Controls Bar */}
        <div className="p-4 sm:px-6 bg-white border-b border-[#FCEAF2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-[#E6007A]">
              Electronic Tax Invoice
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-mono font-bold text-slate-700">
              #{invoice.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print Invoice"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFF5F8] text-[#173488] hover:bg-[#FCEAF2] border border-[#FCEAF2] transition"
            >
              <Printer className="size-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownload}
              title="Download Full Color PDF"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#173488] text-white hover:bg-[#0B1A42] shadow-sm transition"
            >
              <Download className="size-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleCopyLink}
              title="Copy Shareable Link"
              className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <Copy className="size-4" />
            </button>
            <button
              onClick={onClose}
              title="Close Modal"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#FCEAF2] pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold tracking-tight text-[#173488]">
                  PHILIPO COSMETICS
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFF5F8] text-[#E6007A] border border-[#FCEAF2]">
                  Official
                </span>
              </div>
              <p className="text-xs font-semibold text-[#E6007A] tracking-wide uppercase mt-0.5">
                Luxury Beauty & Salon Atelier · Tanzania
              </p>
              <div className="mt-3 text-xs text-slate-500 space-y-0.5">
                <p>{invoice.businessDetails.address}</p>
                <p>Phone: {invoice.businessDetails.phone}</p>
                <p>Email: {invoice.businessDetails.email}</p>
                <p className="font-mono text-[11px] text-slate-600 font-medium">
                  TIN: {invoice.businessDetails.tin} · VRN: {invoice.businessDetails.vrn}
                </p>
              </div>
            </div>

            <div className="sm:text-right space-y-2">
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#173488] block">
                TAX INVOICE
              </span>

              {/* Status Badge (Strictly separate from brand magenta: green for paid, amber for pending) */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981] text-white">
                    <CheckCircle2 className="size-3.5 text-white" />
                    PAID IN FULL
                  </span>
                ) : isPending ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B] text-white">
                    <Clock className="size-3.5" />
                    {invoice.status}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EF4444] text-white">
                    <AlertTriangle className="size-3.5" />
                    {invoice.status}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                <p>
                  <strong className="text-slate-700">Date:</strong>{" "}
                  {new Date(invoice.issuedAt).toLocaleDateString("en-TZ", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {invoice.orderId && (
                  <p>
                    <strong className="text-slate-700">Order Ref:</strong> #{invoice.orderId}
                  </p>
                )}
                {invoice.appointmentId && (
                  <p>
                    <strong className="text-slate-700">Salon Booking:</strong> #{invoice.appointmentId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Customer & Payment Meta Card (Cream-pink / blush surface) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-[#FFF5F8] p-5 border border-[#FCEAF2] shadow-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E6007A]">
                Billed To
              </span>
              <h4 className="font-bold text-base text-[#173488] mt-0.5">
                {invoice.customerName}
              </h4>
              <p className="text-xs text-slate-600 mt-1">{invoice.customerPhone}</p>
              {invoice.customerEmail && (
                <p className="text-xs text-slate-500">{invoice.customerEmail}</p>
              )}
              <p className="text-xs text-slate-600 mt-1 font-medium flex items-start gap-1">
                <MapPin className="size-3 text-[#173488] shrink-0 mt-0.5" />
                <span>{invoice.deliveryAddress || "Dar es Salaam, Tanzania"}</span>
              </p>
            </div>

            <div className="sm:border-l sm:border-[#FCEAF2] sm:pl-5 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#173488]">
                Payment Verification
              </span>
              <p className="text-xs font-semibold text-slate-800">
                Method: <span className="font-normal">{invoice.paymentMethod}</span>
              </p>
              <p className="text-xs font-mono text-slate-600">
                Ref: {invoice.paymentReference}
              </p>
              {invoice.paidAt && (
                <p className="text-xs text-emerald-700 font-medium">
                  Verified:{" "}
                  {new Date(invoice.paidAt).toLocaleDateString("en-TZ", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              <p className="text-[11px] text-slate-500">
                Type: {invoice.type.toUpperCase()} Settlement
              </p>
            </div>
          </div>

          {/* Invoice Items Table (Header: Navy #173488, Rows: Blush zebra) */}
          <div className="rounded-2xl border border-[#FCEAF2] bg-white overflow-hidden shadow-xs">
            <div className="bg-[#173488] text-white px-4 py-2.5 grid grid-cols-12 text-xs font-bold">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6 sm:col-span-7">Item Description</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-2 text-right">Unit (TZS)</div>
              <div className="col-span-2 text-right">Total (TZS)</div>
            </div>

            <div className="divide-y divide-[#FCEAF2] text-xs">
              {invoice.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`px-4 py-3 grid grid-cols-12 items-center transition-colors ${
                    idx % 2 === 1 ? "bg-[#FFF5F8]" : "bg-white"
                  }`}
                >
                  <div className="col-span-1 text-center text-slate-400 font-medium">
                    {idx + 1}
                  </div>
                  <div className="col-span-6 sm:col-span-7">
                    <p className="font-semibold text-slate-900">{item.description}</p>
                    {item.stylist && (
                      <p className="text-[11px] text-[#E6007A] font-medium">
                        Senior Stylist: {item.stylist}
                      </p>
                    )}
                    {item.sku && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        SKU: {item.sku}
                      </p>
                    )}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-slate-700">
                    {item.qty}
                  </div>
                  <div className="col-span-2 text-right font-mono text-slate-600">
                    {item.unitPrice.toLocaleString()}
                  </div>
                  <div className="col-span-2 text-right font-mono font-bold text-slate-900">
                    {item.total.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Totals & Policies */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-2">
            {/* Notes & Terms (Left) */}
            <div className="sm:col-span-6 rounded-2xl bg-[#FFF5F8] p-4 text-xs space-y-2 border border-[#FCEAF2]">
              <div className="flex items-center gap-1.5 text-[#173488] font-bold">
                <ShieldCheck className="size-4 text-[#E6007A]" />
                <span>Certified Guarantee & Terms</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {invoice.notes || "Official verified electronic invoice."}
              </p>
              <p className="text-slate-500 leading-relaxed text-[10px] pt-1 border-t border-[#FCEAF2]">
                {invoice.businessDetails.returnPolicy}
              </p>
              <p className="text-[10px] text-emerald-800 font-semibold">
                Tax: 18% VAT included in gross item total.
              </p>
            </div>

            {/* Calculations Breakdown (Right) */}
            <div className="sm:col-span-6 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 py-0.5">
                <span>Subtotal</span>
                <span className="font-mono">TZS {invoice.subtotal.toLocaleString()}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700 py-0.5 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">-TZS {invoice.discount.toLocaleString()}</span>
                </div>
              )}
              {invoice.deliveryFee > 0 && (
                <div className="flex justify-between text-slate-600 py-0.5">
                  <span>Delivery / Shipping</span>
                  <span className="font-mono">TZS {invoice.deliveryFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 py-0.5">
                <span>VAT (18% inclusive)</span>
                <span className="font-mono">TZS {invoice.taxAmount.toLocaleString()}</span>
              </div>

              {/* "TOTAL PAYABLE" Block: Deep Navy container with white text and thin Magenta rule */}
              <div className="relative rounded-xl bg-[#0B1A42] text-white p-3.5 flex items-center justify-between shadow-sm mt-2 border-t-2 border-[#E6007A]">
                <span className="font-serif text-sm tracking-wide">TOTAL PAYABLE</span>
                <span className="font-mono text-base font-bold">
                  TZS {invoice.total.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-xs pt-1.5 px-1 font-semibold">
                <span className="text-slate-700">Amount Paid</span>
                <span className="font-mono text-emerald-700">
                  TZS {invoice.amountPaid.toLocaleString()}
                </span>
              </div>
              {invoice.balanceDue > 0 ? (
                <div className="flex justify-between text-xs px-1 font-bold text-rose-600">
                  <span>Balance Due</span>
                  <span className="font-mono">TZS {invoice.balanceDue.toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex justify-between text-xs px-1 text-slate-400 font-medium">
                  <span>Balance Due</span>
                  <span className="font-mono text-emerald-700">TZS 0 (Settled)</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-[#FCEAF2] text-xs text-slate-500 italic">
            "{invoice.businessDetails.footerNote}"
          </div>
        </div>
      </div>
    </div>
  );
}
