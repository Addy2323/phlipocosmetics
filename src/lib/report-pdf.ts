import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PHILIPO_PALETTE } from "./brand-theme";

export interface ReportExportData {
  title: string;
  category: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  currency: string;
  generatedAt: string;
  generatedBy: string;
  kpis: Array<{ label: string; value: string; hint?: string }>;
  headers: string[];
  rows: (string | number)[][];
}

export function generateReportPDFDocument(data: ReportExportData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Decorative Header Bars (Navy + Philipo Magenta)
  doc.setFillColor(...PHILIPO_PALETTE.navyRgb);
  doc.rect(0, 0, pageWidth, 7, "F");

  doc.setFillColor(...PHILIPO_PALETTE.magentaRgb);
  doc.rect(0, 7, pageWidth, 1.5, "F");

  let y = 18;

  // 2. Company Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...PHILIPO_PALETTE.navyRgb);
  doc.text("PHILIPO COSMETICS", margin, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PHILIPO_PALETTE.magentaRgb);
  doc.text("BUSINESS INTELLIGENCE & FINANCIAL PERFORMANCE AUDIT", margin, y + 4.5);

  // Right Header
  const rightX = pageWidth - margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...PHILIPO_PALETTE.navyRgb);
  doc.text(data.title.toUpperCase(), rightX, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PHILIPO_PALETTE.mutedSlateRgb);
  doc.text(`Period: ${data.periodLabel} (${data.startDate} to ${data.endDate})`, rightX, y + 4.5, { align: "right" });
  doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString("en-TZ")} | User: ${data.generatedBy}`, rightX, y + 8.5, { align: "right" });

  y += 14;

  // Divider
  doc.setDrawColor(...PHILIPO_PALETTE.borderLightRgb);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // 3. KPI Cards Grid (Blush / cream-pink surfaces)
  const availableKpis = data.kpis.slice(0, 4);
  if (availableKpis.length > 0) {
    const cardGap = 3;
    const cardWidth = (pageWidth - margin * 2 - cardGap * (availableKpis.length - 1)) / availableKpis.length;
    const cardHeight = 18;

    availableKpis.forEach((kpi, idx) => {
      const cx = margin + idx * (cardWidth + cardGap);
      doc.setFillColor(...PHILIPO_PALETTE.blushRgb);
      doc.roundedRect(cx, y, cardWidth, cardHeight, 1.5, 1.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...PHILIPO_PALETTE.magentaRgb);
      doc.text(kpi.label.toUpperCase(), cx + 3, y + 4.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...PHILIPO_PALETTE.navyRgb);
      doc.text(kpi.value, cx + 3, y + 10.5);

      if (kpi.hint) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(...PHILIPO_PALETTE.mutedSlateRgb);
        doc.text(kpi.hint, cx + 3, y + 15);
      }
    });

    y += cardHeight + 6;
  }

  // 4. Report Data Table (Table headers: navy with white text, alternating rows: blush)
  const formattedRows = data.rows.map((row) =>
    row.map((val) => (typeof val === "number" ? val.toLocaleString() : val.toString()))
  );

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [data.headers],
    body: formattedRows,
    theme: "striped",
    headStyles: {
      fillColor: PHILIPO_PALETTE.navyRgb,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: PHILIPO_PALETTE.blushRgb,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: PHILIPO_PALETTE.slateTextRgb,
      cellPadding: 2.8,
    },
  });

  // 5. Footer
  const footerY = pageHeight - 10;
  doc.setDrawColor(...PHILIPO_PALETTE.champagneGoldRgb);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...PHILIPO_PALETTE.mutedSlateRgb);
  doc.text(
    `Philipo Cosmetics · Confidential Management Report · Currency: ${data.currency} · Page 1 of 1`,
    pageWidth / 2,
    footerY + 1,
    { align: "center" }
  );

  return doc;
}

export function downloadReportPDF(data: ReportExportData): void {
  const doc = generateReportPDFDocument(data);
  const cleanTitle = data.title.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Philipo_${cleanTitle}_Report_${data.startDate}_to_${data.endDate}.pdf`);
}
