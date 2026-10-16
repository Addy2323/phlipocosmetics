# MASTER IMPLEMENTATION PROMPT
# PHILIPO COSMETICS — PREMIUM REPORTS, ANALYTICS & AUTOMATIC INVOICE GENERATION

## 1. PROJECT OBJECTIVE

Upgrade the existing Philipo Cosmetics platform by implementing a premium, visually impressive reporting and invoice management system.

The system must include:

1. A beautiful Business Reports Dashboard.
2. Advanced report generation with filters and analytics.
3. Automatic invoice generation after verified successful payments.
4. Professionally designed, full-color downloadable PDF invoices.
5. PDF, Excel, and CSV report exports with matching brand styling.
6. Customer invoice history and download functionality ("My Invoices").
7. Admin invoice management and financial oversight.
8. Sales performance analytics integrated into the existing Sales Dashboard.
9. Salon appointment revenue and cosmetics product sales reporting.
10. Consistent, premium design across the website, reports, charts, invoices, and exported documents.

**CRITICAL DESIGN REQUIREMENT:** The result must look premium, modern, colorful, elegant, and professionally designed. Do not produce a plain, generic admin panel with boring white cards, default charts, unstyled tables, or basic black-and-white invoices.

The visual quality must reflect the luxury identity of Philipo Cosmetics — a premier Tanzanian beauty, cosmetics, and salon atelier.

---

## 2. PRESERVE THE EXISTING APPLICATION

Before making changes:

- Inspect the existing repository and understand its architecture.
- Identify the current frontend framework (Vite + React + TanStack Router), backend/database (Drizzle ORM, Supabase/PostgreSQL, local stores), authentication, payment integrations, PDF libraries, and notification services.
- Review the existing Admin, Customer, and Sales dashboards.
- Reuse existing components, business logic, design tokens, and database models where appropriate.
- Do not rebuild the application from scratch.
- Do not introduce a fourth dashboard or unnecessary user roles.
- Do not break existing product shopping, checkout, salon booking, payments, inventory, or authentication.
- Do not replace working integrations with simulated implementations.
- Do not use hardcoded statistics, fake transactions, or fabricated payment references in production.

Prepare a short implementation plan and identify the files that need modification before proceeding.

---

## 3. PREMIUM VISUAL DESIGN SYSTEM (PHILIPO BRAND IDENTITY)

Establish a consistent design language across all dashboard screens, report pages, invoices, and exported files.

### A. Brand Colors Come First

Before hardcoding values, check the repository's existing CSS (`src/index.css`, Tailwind tokens, or root theme variables). If established brand tokens differ slightly from the sampled values below, prioritize and unify around the repository's existing official definitions:

- **Philipo Magenta**: `#E6007A` (or existing brand magenta `#EC008C`) — primary brand accents, prominent action buttons, active navigation indicators, and signature beauty highlights.
- **Deep Philipo Navy**: `#173488` (and midnight navy `#0B1A42` / deep `#0F172A`) — primary headings, table headers, document headers, "Total Payable" blocks, and executive financial metrics.
- **Blush & Cream-Pink**: `#FFF5F8` to `#FDF7F9` (with soft borders `#FCEAF2`) — page backgrounds, delicate document surfaces, and alternating table-row zebra tints.
- **Champagne Gold**: `#C9A45C` — used **only as a sparing, premium accent**: thin dividing rules, luxury badge accents, VIP tags, and delicate hairline separators. Never overwhelm the screen with gold.
- **Pure White**: `#FFFFFF` — cards, modals, table surfaces, and invoice content areas.
- **Muted Slate**: `#64748B` to `#475569` — secondary text, captions, and supporting metadata.

### B. Status Colors Stay Strictly Separate from the Brand

Magenta is the beauty brand identity, **never** an error or status indicator. System statuses must preserve standard, intuitive semantic clarity:

- **PAID / Success**: Emerald Green (`#10B981` / background `#E4EEE6`) — verified payments, completed salon appointments, and positive profit trends.
- **PENDING / Attention**: Warm Amber (`#F59E0B` / background `#FFF1D6`) — awaiting payment confirmation, partial settlements, and low stock warnings.
- **FAILED / Void / Error**: Crimson Red (`#EF4444` / background `#FCE8E6`) — payment failures, cancelled bookings, voided invoices, and validation errors.

### C. Browser Autofill Override

Eliminate browser default yellow or light-blue autofill backgrounds (`:-webkit-autofill`) across all inputs, including customer sign-in/registration forms and report date/filter dropdowns. Apply clean CSS box-shadow overrides:

```css
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
select:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 1000px #FFFFFF inset !important;
  -webkit-text-fill-color: inherit !important;
  transition: background-color 5000s ease-in-out 0s;
}
.dark input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 1000px #0F172A inset !important;
  -webkit-text-fill-color: #FFFFFF !important;
}
```

### D. Single Token Definition Shared Across Outputs

Define the palette once in a shared design token structure (e.g. `src/lib/brand-theme.ts`), and reuse the exact same RGB and hex constants across:

1. **Web Dashboard & UI Components** (Tailwind / CSS tokens).
2. **Vector PDF Generation** (`jspdf` / `jspdf-autotable`).
3. **Excel Spreadsheet Styling** (header fills, font colors, zebra stripes).

---

## 4. REPORTS DASHBOARD

Create a dedicated Reports section within the existing Admin Dashboard (`/admin/reports`) and an appropriate Sales Reports section within the existing Sales Dashboard. Do not create a separate dashboard role.

### A. Reports Landing Page

Design an attractive page titled:

**"Business Intelligence & Reports"**

Subtitle: *"Analyze business performance, salon & cosmetics revenues, P&L, and generate professional reports."*

At the top, display:

- Reporting period selector (`Daily`, `Weekly`, `Monthly`, `Quarterly`, `Annual / YTD`, `Custom Range`).
- Custom date-range picker in Tanzania time (`Africa/Dar_es_Salaam`).
- Report category selector (Sales, Products, Salon, Payments, Inventory, P&L).
- Secondary filters: Payment status filter (`Paid`, `Pending`, `All`), Product category filter, Salon service filter.
- Primary actions: **"Generate Report"**, **"Export Branded PDF"**, and **"Export Excel (XLSX/CSV)"**.

### B. KPI Cards

Display appropriate metrics according to the selected report and user permissions:

- Gross Sales (Cosmetics + Salon).
- Net Sales.
- Wholesale Cost of Goods Sold (COGS).
- Payments Collected.
- Outstanding Balances.
- Total Completed Orders.
- Completed Salon Appointments.
- Recorded Operating Expenses (OpEx).
- Gross Profit.
- Net Operating Profit & Net Margin Percentage.

Each card must include a clear label, formatted TZS currency value, relevant icon, and contextual comparison without fabricated percentages.

### C. Interactive Charts

Implement polished, responsive Recharts:

1. **Revenue & Profit over Time**: Spline/Area chart with Deep Navy `#173488` for revenue and Philipo Magenta `#E6007A` or Champagne Gold for net profit.
2. **Sales by Product Category & Bestsellers**: Bar chart with brand color grading.
3. **Salon Services Revenue Breakdown**: Horizontal bar chart comparing braiding, wig installs, treatments, and makeup.
4. **Payment Channel Mix**: Donut chart showing M-Pesa, Tigo Pesa, Airtel, Card, and Cash shares.

### D. 6 Report Categories

1. **Sales Report**: Gross sales, discounts, net sales, orders count, and sales trends.
2. **Product Performance Report**: Product name, SKU, units sold, gross sales, wholesale COGS, gross profit, and margin.
3. **Salon Performance Report**: Appointments booked, completed services, stylist allocation, gross revenue by service, and average ticket.
4. **Payment Reconciliation Report**: Successful, pending, failed transactions, provider references, and collection breakdown.
5. **Inventory Valuation Report**: Current stock, low-stock alerts, unit valuations, total stock asset valuation, and reorder notices.
6. **Profit and Loss (P&L) Report**: Net sales, COGS wholesale, operating expenses (lease, utilities, packaging), gross profit, and net profit with margin ratio.

---

## 5. PROFESSIONAL COLORED PDF & SPREADSHEET EXPORTS

Report exports must look like executive business documents, not raw data dumps.

### Visual Presentation & Shared Identity

- **Document Header**: Bold "PHILIPO COSMETICS" brand header in Deep Navy `#173488` with a thin Philipo Magenta `#E6007A` or Gold accent stripe.
- **Table Headers**: Deep Navy (`#173488` / RGB: `23, 52, 136`) background with crisp Pure White bold text, in both PDF and Excel.
- **Alternating Table Rows**: Soft Blush (`#FFF5F8` / RGB: `255, 245, 248`) row striping for effortless readability.
- **KPI Summary Block**: Top executive KPI cards styled with cream-pink surfaces and navy headings.
- **Footer**: Formal confidentiality note, currency declaration (TZS), timestamp, and page numbers.

### Export Formats

- **PDF**: Full-color, printable vector document via `jspdf` and `jspdf-autotable`.
- **Excel (XLSX / CSV)**: Formatted headers with navy background fill, currency formatting, bold totals, and clean column widths.

---

## 6. AUTOMATIC INVOICE GENERATION AFTER PAYMENT

Whenever a customer pays for cosmetics products, salon services, or in-store purchases, the system must automatically generate the appropriate tax invoice after verified payment.

### Invoice Visual Structure

Follow the unified brand identity:

1. **Top Bar**: Deep Navy `#173488` band with a thin Philipo Magenta `#E6007A` accent stripe.
2. **Header**:
   - "PHILIPO COSMETICS" title in serif typography.
   - Slogan: *"Luxury Beauty & Salon Atelier · Tanzania"*.
   - Registered premise address, phone, email, TIN (`142-890-332`), and VRN (`40-029810-Z`).
   - Right side: Large "TAX INVOICE" header, sequential invoice number (e.g. `INV-PC-2026-10492`), issue date, and order/appointment reference.
3. **Payment Status Badge**:
   - Prominent, elegant green **PAID IN FULL** badge for verified payments.
   - Warm amber **PENDING** badge for unpaid/partial orders.
   - Never use magenta for status badges.
4. **Billed To / Client Box**:
   - Customer full name, phone number, email, and delivery destination or salon chair reservation.
   - Payment method, verified transaction reference (e.g. M-Pesa code), and settlement timestamp.
5. **Invoice Items Table**:
   - **Header**: Deep Navy `#173488` fill with Pure White text.
   - **Rows**: Alternating Blush (`#FFF5F8`) zebra striping.
   - **Columns**: `#`, `Item Description & Specification` (includes Stylist name for salon, SKU for cosmetics), `Qty`, `Unit Price (TZS)`, `Discount`, `Line Total (TZS)`.
6. **Financial Summary**:
   - Subtotal, promotional discounts, courier delivery fee, 18% VAT (inclusive).
   - **"TOTAL PAYABLE" Block**: Deep Navy `#173488` rectangular container with contrasting bold white text, underlined by a thin Magenta (`#E6007A`) or Gold rule.
   - Amount Paid and Balance Due (with settled indicator).
7. **Footer**:
   - Luxury gratitude note: *"Thank you for your patronage. Your natural radiance is our pride."*
   - Return and cancellation policy statement.
   - Computerized electronic document disclaimer.

---

## 7. AUTOMATIC INVOICE LIFECYCLE

Implement the following sequence:

1. Customer completes checkout (`checkout.tsx`), salon booking (`salon.tsx`), or POS sale (`sales.dashboard.tsx`).
2. Payment provider verifies the transaction (M-Pesa, Tigo Pesa, Airtel, Card, or Cash).
3. System confirms amount, currency (TZS), reference, and associated order/appointment.
4. Backend/Store issues an immutable invoice snapshot with unique numbering (`INV-PC-YYYY-NNNNN`).
5. Customer immediately sees the invoice on the confirmation screen with **"View Invoice"** and **"Download PDF"** buttons.
6. Invoice is automatically filed into the customer's **"My Invoices"** tab in their account.
7. Admin can locate, review, download, or void the invoice in `/admin/invoices`.
8. Ensure idempotency: replaying a webhook or refreshing the page must never generate duplicate invoices.

---

## 8. INVOICE STORAGE AND CUSTOMER ACCESS

Store invoice snapshots immutably so subsequent product price changes or stylist fee adjustments never modify issued historical invoices.

### Customer Dashboard ("My Invoices" at `/account`)

Add a dedicated **"My Invoices"** section containing:

- Invoice Number.
- Issue Date.
- Associated Order or Salon Booking Reference.
- Total Amount.
- Amount Paid.
- Balance Due.
- Payment Status badge.
- **"View"** action (opens interactive `InvoiceModal`).
- **"PDF"** action (triggers instant download of `Philipo_Invoice_INV-PC-....pdf`).

Customers must only access their own invoices.

---

## 9. ADMIN DASHBOARD INTEGRATION

Add or update navigation items in `AdminLayout`:

- **Reports & Analytics** (`/admin/reports`): 6-category BI report builder with Recharts and PDF/Excel export.
- **Invoice Management** (`/admin/invoices`): Central settlement table with search, filters, modal inspector, PDF export, voiding, and business tax settings.

### Invoice Settings Modal

Allow administrators to configure:

- Business legal name (`Philipo Cosmetics Ltd`).
- TIN and VRN.
- Registered premise address.
- Official phone and billing email.
- Invoice numbering prefix (`INV-PC-`).
- Return and cancellation policy text.
- VAT rate percentage (default `18%`).

---

## 10. SALES DASHBOARD INTEGRATION

Enhance `/sales/dashboard`:

- Retail POS counter sales automatically call `createInvoiceFromPOS(...)`.
- The completed receipt modal includes a dedicated **"Tax Invoice PDF"** download button.
- Sales staff receive sales and shift collection analytics without unauthorized access to global tax configuration.

---

## 11. DATABASE AND BACKEND DESIGN

1. Add `invoices` and `invoice_settings` tables to `drizzle/schema.ts`.
2. Generate safe, reversible SQL migration `drizzle/migrations/0002_premium_invoices_and_reporting.sql`.
3. Support statuses: `PENDING`, `PAID`, `PARTIALLY_PAID`, `VOID`, `REFUNDED`.
4. Store immutable items snapshot (`jsonb`) and business details snapshot (`jsonb`).

---

## 12. TECHNICAL IMPLEMENTATION & CODE STRUCTURE

- **Design Tokens**: `src/lib/brand-theme.ts` exporting Magenta (`#E6007A`), Navy (`#173488`), Blush (`#FFF5F8`), and Gold (`#C9A45C`).
- **Invoices Store**: `src/lib/invoices-store.ts`.
- **Vector PDF Generator**: `src/lib/invoice-pdf.ts` (`jspdf` + `jspdf-autotable`).
- **Report PDF Generator**: `src/lib/report-pdf.ts`.
- **Interactive Invoice Modal**: `src/components/admin/InvoiceModal.tsx`.
- **Admin Invoices Route**: `src/routes/admin.invoices.tsx`.
- **Admin Reports Route**: `src/routes/admin.reports.tsx`.
- **Customer Account**: `src/routes/account.tsx`.
- **Checkout & Salon Confirmation**: `src/routes/checkout.tsx` and `src/routes/salon.tsx`.

---

## 13. SECURITY AND PERMISSIONS

- Customers can only query their own invoices.
- Admin role gate enforces access to `/admin/invoices` and financial settings.
- Inputs and filters must be sanitized to prevent injection.

---

## 14. TESTING AND ACCEPTANCE CRITERIA

1. **Palette Check**: Confirm Magenta `#E6007A` and Navy `#173488` dominate the visual identity with blush backgrounds; confirm green, amber, and red are strictly reserved for payment/system statuses.
2. **Autofill Check**: Verify that browser autofill does not render blue/yellow backgrounds on inputs.
3. **Table & Export Consistency**: Confirm table headers are Navy with white text and alternating rows are Blush across web tables, PDF exports, and Excel spreadsheets.
4. **Invoice "Total Payable" Block**: Confirm deep navy container with white text and magenta/gold accent line.
5. **Checkout & Salon Booking**: Complete purchase and appointment booking to verify automatic invoice generation and immediate PDF download.
6. **Build Quality**: `npx tsc --noEmit` and `npm run build` must pass with 0 errors.
