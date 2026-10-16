import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice } from "./invoices-store";
import { PHILIPO_PALETTE } from "./brand-theme";

function formatTZS(amount: number): string {
  return `TZS ${Math.round(amount).toLocaleString()}`;
}

export function generateInvoicePDFDocument(invoice: Invoice): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Top Decorative Brand Bar (Navy with Philipo Magenta Accent)
  doc.setFillColor(...PHILIPO_PALETTE.navyRgb);
  doc.rect(0, 0, pageWidth, 7, "F");

  doc.setFillColor(...PHILIPO_PALETTE.magentaRgb);
  doc.rect(0, 7, pageWidth, 1.5, "F");

  // 2. Company Brand & Header
  let y = 18;

  // Left side: Brand Name & Slogan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...PHILIPO_PALETTE.navyRgb);
  doc.text("PHILIPO COSMETICS", margin, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PHILIPO_PALETTE.magentaRgb);
  doc.text("LUXURY BEAUTY & SALON ATELIER · TANZANIA", margin, y + 5);

  // Business Address & Contact Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PHILIPO_PALETTE.mutedSlateRgb);
  doc.text(invoice.businessDetails.address, margin, y + 10);
  doc.text(`Phone: ${invoice.businessDetails.phone} | Email: ${invoice.businessDetails.email}`, margin, y + 14);
  doc.text(`TIN: ${invoice.businessDetails.tin} | VRN: ${invoice.businessDetails.vrn}`, margin, y + 18);

  // Right side: TAX INVOICE Title & Details
  const rightX = pageWidth - margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...PHILIPO_PALETTE.navyRgb);
  doc.text("TAX INVOICE", rightX, y, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PHILIPO_PALETTE.slateTextRgb);
  doc.text(invoice.invoiceNumber, rightX, y + 6, { align: "right" });

  // Status Badge (Strictly separate from brand magenta: green for paid, amber for pending)
  const isPaid = invoice.status === "PAID";
  const badgeWidth = 28;
  const badgeHeight = 7;
  const badgeX = rightX - badgeWidth;
  const badgeY = y + 10;

  if (isPaid) {
    doc.setFillColor(...PHILIPO_PALETTE.status.paidRgb);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("PAID IN FULL", badgeX + badgeWidth / 2, badgeY + 4.8, { align: "center" });
  } else {
    doc.setFillColor(...PHILIPO_PALETTE.status.pendingRgb);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(invoice.status, badgeX + badgeWidth / 2, badgeY + 4.8, { align: "center" });
  }

  // Issue & Reference metadata
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PHILIPO_PALETTE.mutedSlateRgb);
  const issuedDateFormatted = new Date(invoice.issuedAt).toLocaleDateString("en-TZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Issued: ${issuedDateFormatted}`, rightX, y + 22, { align: "right" });
  if (invoice.orderId) {
    doc.text(`Order Ref: #${invoice.orderId}`, rightX, y + 26, { align: "right" });
  } else if (invoice.appointmentId) {
    doc.text(`Appointment Ref: #${invoice.appointmentId}`, rightX, y + 26, { align: "right" });
  }

  // Divider Line
  y = 48;
  doc.setDrawColor(...PHILIPO_PALETTE.borderLightRgb);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  // 3. Customer & Billing Destination Box (Cream-pink / blush surface)
  y += 6;
  doc.setFillColor(...PHILIPO_PALETTE.blushRgb);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PHILIPO_PALETTE.magentaRgb);
  doc.text("BILLED TO / CLIENT DETAILS", margin + 5, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...PHILIPO_PALETTE.navyRgb);
  doc.text(invoice.customerName, margin + 5, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PHILIPO_PALETTE.mutedSlateRgb);
  doc.text(`Mobile: ${invoice.customerPhone}${invoice.customerEmail ? " | Email: " + invoice.customerEmail : ""}`, margin + 5, y + 14);
  doc.text(`Service / Delivery: ${invoice.deliveryAddress || "Dar es Salaam, Tanzania"}`, margin + 5, y + 18);

  // Right info in billing box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PHILIPO_PALETTE.navyRgb);
  doc.text("PAYMENT METHOD", rightX - 5, y + 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...PHILIPO_PALETTE.slateTextRgb);
  doc.text(invoice.paymentMethod, rightX - 5, y + 10, { align: "right" });

  doc.setFontSize(7.5);
  doc.setTextColor(...PHILIPO_PALETTE.mutedSlateRgb);
  doc.text(`Trans Ref: ${invoice.paymentReference}`, rightX - 5, y + 14, { align: "right" });
  if (invoice.paidAt) {
    const paidDate = new Date(invoice.paidAt).toLocaleDateString("en-TZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    doc.text(`Payment Verified: ${paidDate}`, rightX - 5, y + 18, { align: "right" });
  }

  // 4. Items Table (Headers: Navy with white text; Alternating rows: Blush)
  y += 27;

  const tableRows = invoice.items.map((item, idx) => {
    const desc = item.stylist
      ? `${item.description}\nStylist: ${item.stylist}`
      : item.sku
        ? `${item.description}\nSKU: ${item.sku}`
        : item.description;

    return [
      (idx + 1).toString(),
      desc,
      item.qty.toString(),
      formatTZS(item.unitPrice),
      item.discount ? `-${formatTZS(item.discount)}` : "-",
      formatTZS(item.total),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["#", "Item Description & Specification", "Qty", "Unit Price", "Discount", "Amount (TZS)"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: PHILIPO_PALETTE.navyRgb,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: PHILIPO_PALETTE.blushRgb, // Alternating Blush
    },
    bodyStyles: {
      fontSize: 8,
      textColor: PHILIPO_PALETTE.slateTextRgb,
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 24, halign: "right" },
      5: { cellWidth: 32, halign: "right", fontStyle: "bold" },
    },
  });

  // 5. Financial Summary & Totals
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 5 : y + 50;

  // Bottom Left: Payment Notes & Return Policy
  const notesWidth = 95;
  doc.setFillColor(...PHILIPO_PALETTE.blushRgb);
  doc.roundedRect(margin, finalY, notesWidth, 34, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...PHILIPO_PALETTE.magentaRgb);
  doc.text("IMPORTANT POLICY & NOTES", margin + 4, finalY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...PHILIPO_PALETTE.slateTextRgb);
  const splitNotes = doc.splitTextToSize(invoice.notes || "Official verified electronic invoice.", notesWidth - 8);
  doc.text(splitNotes, margin + 4, finalY + 9);

  doc.setFontSize(6.5);
  doc.setTextColor(...PHILIPO_PALETTE.mutedSlateRgb);
  const splitPolicy = doc.splitTextToSize(invoice.businessDetails.returnPolicy, notesWidth - 8);
  doc.text(splitPolicy, margin + 4, finalY + 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...PHILIPO_PALETTE.navyRgb);
  doc.text("Tax Status: 18% VAT included in gross item pricing.", margin + 4, finalY + 30);

  // Bottom Right: Financial Calculations
  const sumX = pageWidth - margin - 85;
  const valX = pageWidth - margin;
  let curY = finalY + 4;

  const printLine = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(8);
    doc.setTextColor(...(bold ? PHILIPO_PALETTE.slateTextRgb : PHILIPO_PALETTE.mutedSlateRgb));
    doc.text(label, sumX, curY);
    doc.text(value, valX, curY, { align: "right" });
    curY += 5;
  };

  printLine("Subtotal", formatTZS(invoice.subtotal));
  if (invoice.discount > 0) {
    printLine("Promotional Discount", `-${formatTZS(invoice.discount)}`);
  }
  if (invoice.deliveryFee > 0) {
    printLine("Courier Delivery Fee", formatTZS(invoice.deliveryFee));
  }
  printLine("VAT (18% inclusive)", formatTZS(invoice.taxAmount));

  // "TOTAL PAYABLE" Block: Deep Navy with white text and thin Magenta rule
  curY += 1;
  doc.setFillColor(...PHILIPO_PALETTE.deepNavyRgb);
  doc.roundedRect(sumX - 2, curY - 3.5, 87, 9, 1.5, 1.5, "F");

  // Thin Magenta Rule accent on the top edge
  doc.setFillColor(...PHILIPO_PALETTE.magentaRgb);
  doc.rect(sumX - 2, curY - 3.5, 87, 0.8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL PAYABLE", sumX + 3, curY + 2.5);
  doc.text(formatTZS(invoice.total), valX - 3, curY + 2.5, { align: "right" });

  curY += 11;
  printLine("Amount Paid", formatTZS(invoice.amountPaid), true);
  if (invoice.balanceDue > 0) {
    doc.setTextColor(...PHILIPO_PALETTE.status.failedRgb);
    printLine("Balance Due", formatTZS(invoice.balanceDue), true);
  } else {
    doc.setTextColor(...PHILIPO_PALETTE.status.paidRgb);
    printLine("Balance Outstanding", "TZS 0 (Settled)", true);
  }

  // 6. Page Footer
  const footerY = pageHeight - 12;
  doc.setDrawColor(...PHILIPO_PALETTE.champagneGoldRgb);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...PHILIPO_PALETTE.navyRgb);
  doc.text(invoice.businessDetails.footerNote, pageWidth / 2, footerY, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...PHILIPO_PALETTE.mutedSlateRgb);
  doc.text(
    `Philipo Cosmetics Ltd · Verified Tax Invoice · Generated: ${new Date().toISOString()} · Page 1 of 1`,
    pageWidth / 2,
    footerY + 4,
    { align: "center" }
  );

  return doc;
}

export function downloadInvoicePDF(invoice: Invoice): void {
  const doc = generateInvoicePDFDocument(invoice);
  doc.save(`Philipo_Invoice_${invoice.invoiceNumber}.pdf`);
}

export function printInvoicePDF(invoice: Invoice): void {
  const doc = generateInvoicePDFDocument(invoice);
  doc.autoPrint();
  const blobUrl = doc.output("bloburl");
  const win = window.open(blobUrl, "_blank");
  if (win) {
    win.focus();
  }
}
