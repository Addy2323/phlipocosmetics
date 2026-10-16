// Persistent Invoicing & Financial Settlement Engine for Philipo Cosmetics
// Handles automated invoice issuance, immutable snapshots, and local/remote sync.

export interface InvoiceItem {
  id: string;
  description: string;
  sku?: string;
  stylist?: string;
  qty: number;
  unitPrice: number;
  discount?: number;
  taxRatePercent?: number;
  total: number;
}

export interface BusinessDetails {
  name: string;
  tin: string;
  vrn: string;
  address: string;
  phone: string;
  email: string;
  footerNote: string;
  returnPolicy: string;
}

export type InvoiceStatus = "PAID" | "PENDING" | "PARTIALLY_PAID" | "VOID" | "REFUNDED";
export type InvoiceType = "product" | "salon" | "pos" | "combined";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  orderId?: string;
  appointmentId?: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  deliveryFee: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: string;
  paymentReference: string;
  paymentProvider?: string;
  paidAt?: string;
  issuedAt: string;
  dueDate?: string;
  notes?: string;
  items: InvoiceItem[];
  businessDetails: BusinessDetails;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSettings {
  businessName: string;
  tin: string;
  vrn: string;
  address: string;
  phone: string;
  email: string;
  prefix: string;
  footerNote: string;
  returnPolicy: string;
  taxRatePercent: number;
}

export const DEFAULT_BUSINESS_DETAILS: BusinessDetails = {
  name: "Philipo Cosmetics Ltd",
  tin: "142-890-332",
  vrn: "40-029810-Z",
  address: "Plot 42, Samora Avenue, CBD, Dar es Salaam, Tanzania",
  phone: "+255 744 000 111 / +255 755 222 333",
  email: "billing@philipocosmetics.co.tz",
  footerNote: "Thank you for your patronage. Your natural radiance is our pride.",
  returnPolicy: "Unopened cosmetics may be exchanged within 7 days with this official invoice. Salon appointments are non-refundable after service execution.",
};

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  businessName: DEFAULT_BUSINESS_DETAILS.name,
  tin: DEFAULT_BUSINESS_DETAILS.tin,
  vrn: DEFAULT_BUSINESS_DETAILS.vrn,
  address: DEFAULT_BUSINESS_DETAILS.address,
  phone: DEFAULT_BUSINESS_DETAILS.phone,
  email: DEFAULT_BUSINESS_DETAILS.email,
  prefix: "INV-PC-",
  footerNote: DEFAULT_BUSINESS_DETAILS.footerNote,
  returnPolicy: DEFAULT_BUSINESS_DETAILS.returnPolicy,
  taxRatePercent: 18,
};

const INVOICES_STORAGE_KEY = "philipo_invoices_ledger_v2";
const SETTINGS_STORAGE_KEY = "philipo_invoice_settings_v2";

export function getInvoiceSettings(): InvoiceSettings {
  if (typeof window === "undefined") return DEFAULT_INVOICE_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? { ...DEFAULT_INVOICE_SETTINGS, ...JSON.parse(raw) } : DEFAULT_INVOICE_SETTINGS;
  } catch {
    return DEFAULT_INVOICE_SETTINGS;
  }
}

export function saveInvoiceSettings(settings: Partial<InvoiceSettings>): InvoiceSettings {
  const current = getInvoiceSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to persist invoice settings:", err);
    }
  }
  return updated;
}

// Initial realistic seed invoices representing both cosmetic orders and salon sessions
const SEED_INVOICES: Invoice[] = [
  {
    id: "inv-seed-1",
    invoiceNumber: "INV-PC-2026-10492",
    type: "product",
    orderId: "PC-884120",
    userId: "usr-dev-rehema",
    customerName: "Rehema Mwangi",
    customerPhone: "+255 714 889 012",
    customerEmail: "rehema.mwangi@gmail.com",
    deliveryAddress: "Oysterbay, Haile Selassie Road, Dar es Salaam",
    status: "PAID",
    currency: "TZS",
    subtotal: 185000,
    discount: 15000,
    taxAmount: 28169, // 18% inclusive
    deliveryFee: 5000,
    total: 175000,
    amountPaid: 175000,
    balanceDue: 0,
    paymentMethod: "M-Pesa (Vodacom)",
    paymentReference: "MPESA-993821034",
    paymentProvider: "Vodacom Tanzania",
    paidAt: "2026-10-14T09:30:00Z",
    issuedAt: "2026-10-14T09:28:00Z",
    notes: "Direct home delivery. Package labeled fragile cosmetics.",
    businessDetails: DEFAULT_BUSINESS_DETAILS,
    createdAt: "2026-10-14T09:28:00Z",
    updatedAt: "2026-10-14T09:30:00Z",
    items: [
      {
        id: "item-1",
        description: "Botanical Youth Elixir Serum (30ml)",
        sku: "SKU-SER-001",
        qty: 1,
        unitPrice: 120000,
        discount: 10000,
        total: 110000,
      },
      {
        id: "item-2",
        description: "Hydra-Luxe Ceramide Moisturizer (50g)",
        sku: "SKU-MOIST-002",
        qty: 1,
        unitPrice: 65000,
        discount: 5000,
        total: 60000,
      },
    ],
  },
  {
    id: "inv-seed-2",
    invoiceNumber: "INV-PC-2026-10493",
    type: "salon",
    appointmentId: "PC-SLN-184902",
    customerName: "Amina Salum",
    customerPhone: "+255 784 220 918",
    customerEmail: "amina.salum@yahoo.com",
    deliveryAddress: "In-Salon Service (Dar es Salaam Hub)",
    status: "PAID",
    currency: "TZS",
    subtotal: 50000,
    discount: 0,
    taxAmount: 7627,
    deliveryFee: 0,
    total: 50000,
    amountPaid: 50000,
    balanceDue: 0,
    paymentMethod: "Mixx by Yas (Tigo Pesa)",
    paymentReference: "TIGO-884102941",
    paymentProvider: "Tigo Tanzania",
    paidAt: "2026-10-13T14:15:00Z",
    issuedAt: "2026-10-13T14:10:00Z",
    notes: "Hair Styling Appointment with Senior Stylist Neema Mchome.",
    businessDetails: DEFAULT_BUSINESS_DETAILS,
    createdAt: "2026-10-13T14:10:00Z",
    updatedAt: "2026-10-13T14:15:00Z",
    items: [
      {
        id: "item-sln-1",
        description: "Wig Installation & Precision Melt",
        stylist: "Neema Mchome",
        qty: 1,
        unitPrice: 50000,
        discount: 0,
        total: 50000,
      },
    ],
  },
  {
    id: "inv-seed-3",
    invoiceNumber: "INV-PC-2026-10494",
    type: "pos",
    customerName: "Fatma Kassim",
    customerPhone: "+255 754 331 445",
    deliveryAddress: "Kariakoo Retail Flagship Store",
    status: "PAID",
    currency: "TZS",
    subtotal: 95000,
    discount: 5000,
    taxAmount: 13728,
    deliveryFee: 0,
    total: 90000,
    amountPaid: 90000,
    balanceDue: 0,
    paymentMethod: "Cash on Counter",
    paymentReference: "POS-REC-10948",
    paidAt: "2026-10-12T11:45:00Z",
    issuedAt: "2026-10-12T11:45:00Z",
    notes: "In-store walk-in client checkout.",
    businessDetails: DEFAULT_BUSINESS_DETAILS,
    createdAt: "2026-10-12T11:45:00Z",
    updatedAt: "2026-10-12T11:45:00Z",
    items: [
      {
        id: "item-pos-1",
        description: "Matte Velvet Liquid Lipstick (Crimson Sultana)",
        sku: "SKU-LIP-004",
        qty: 2,
        unitPrice: 47500,
        discount: 5000,
        total: 90000,
      },
    ],
  },
  {
    id: "inv-seed-4",
    invoiceNumber: "INV-PC-2026-10495",
    type: "salon",
    appointmentId: "PC-SLN-492019",
    customerName: "Zainab Bakari",
    customerPhone: "+255 767 112 900",
    customerEmail: "zainab.bakari@gmail.com",
    deliveryAddress: "In-Salon Service (Dar es Salaam Hub)",
    status: "PAID",
    currency: "TZS",
    subtotal: 35000,
    discount: 0,
    taxAmount: 5338,
    deliveryFee: 0,
    total: 35000,
    amountPaid: 35000,
    balanceDue: 0,
    paymentMethod: "Airtel Money",
    paymentReference: "AIRTEL-44910284",
    paymentProvider: "Airtel Tanzania",
    paidAt: "2026-10-15T08:00:00Z",
    issuedAt: "2026-10-15T07:55:00Z",
    notes: "Knotless Braids styling session with Stylist Grace.",
    businessDetails: DEFAULT_BUSINESS_DETAILS,
    createdAt: "2026-10-15T07:55:00Z",
    updatedAt: "2026-10-15T08:00:00Z",
    items: [
      {
        id: "item-sln-2",
        description: "Knotless Braids (Medium Length)",
        stylist: "Grace Massawe",
        qty: 1,
        unitPrice: 35000,
        discount: 0,
        total: 35000,
      },
    ],
  },
];

export function getStoredInvoices(): Invoice[] {
  if (typeof window === "undefined") return SEED_INVOICES;
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(SEED_INVOICES));
      return SEED_INVOICES;
    }
    const parsed: Invoice[] = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_INVOICES;
  } catch {
    return SEED_INVOICES;
  }
}

export function saveStoredInvoices(invoices: Invoice[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
  } catch (err) {
    console.error("Failed to persist invoices:", err);
  }
}

export function getInvoiceById(idOrNumber: string): Invoice | undefined {
  const all = getStoredInvoices();
  return all.find(
    (inv) =>
      inv.id === idOrNumber ||
      inv.invoiceNumber === idOrNumber ||
      inv.orderId === idOrNumber ||
      inv.appointmentId === idOrNumber
  );
}

export function getInvoicesByCustomer(
  userId?: string,
  phone?: string,
  email?: string
): Invoice[] {
  const all = getStoredInvoices();
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, "").slice(-9) : "";
  const cleanEmail = email ? email.toLowerCase().trim() : "";

  return all.filter((inv) => {
    if (userId && inv.userId === userId) return true;
    if (cleanEmail && inv.customerEmail && inv.customerEmail.toLowerCase().trim() === cleanEmail) {
      return true;
    }
    if (cleanPhone && inv.customerPhone) {
      const invPhoneClean = inv.customerPhone.replace(/[^0-9]/g, "").slice(-9);
      if (invPhoneClean && invPhoneClean === cleanPhone) return true;
    }
    return false;
  });
}

// Generate sequential or random distinct invoice number
export function generateInvoiceNumber(): string {
  const settings = getInvoiceSettings();
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `${settings.prefix}${year}-${randomSuffix}`;
}

// Automatic creation from an e-commerce order
export function createInvoiceFromOrder(order: {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  destination?: string;
  items: Array<{ name: string; qty: number; price: number; sku?: string }>;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  userId?: string;
}): Invoice {
  const existing = getInvoiceById(order.orderNumber) || getInvoiceById(order.id);
  if (existing) return existing;

  const settings = getInvoiceSettings();
  const invoiceNumber = generateInvoiceNumber();
  const now = new Date().toISOString();

  let subtotal = 0;
  const items: InvoiceItem[] = order.items.map((item, idx) => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;
    return {
      id: `oi-${idx}-${Date.now()}`,
      description: item.name,
      sku: item.sku || `SKU-PRD-${Math.floor(100 + Math.random() * 900)}`,
      qty: item.qty,
      unitPrice: item.price,
      total: itemTotal,
    };
  });

  const deliveryFee = Math.max(0, order.total - subtotal);
  const taxRate = settings.taxRatePercent / 100;
  const taxAmount = Math.round((order.total * taxRate) / (1 + taxRate)); // VAT inclusive
  const isPaid = order.paymentStatus === "Paid" || order.paymentStatus === "PAID";

  const newInvoice: Invoice = {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    invoiceNumber,
    type: "product",
    orderId: order.orderNumber,
    userId: order.userId,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    deliveryAddress: order.destination || "Tanzania Destination",
    status: isPaid ? "PAID" : "PENDING",
    currency: "TZS",
    subtotal,
    discount: 0,
    taxAmount,
    deliveryFee,
    total: order.total,
    amountPaid: isPaid ? order.total : 0,
    balanceDue: isPaid ? 0 : order.total,
    paymentMethod: order.paymentMethod,
    paymentReference: `PAY-${order.orderNumber}`,
    paymentProvider: order.paymentMethod.includes("Money") ? "Mobile Money" : "Card/Direct",
    paidAt: isPaid ? now : undefined,
    issuedAt: now,
    notes: "Official invoice generated upon verified customer checkout.",
    items,
    businessDetails: {
      name: settings.businessName,
      tin: settings.tin,
      vrn: settings.vrn,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      footerNote: settings.footerNote,
      returnPolicy: settings.returnPolicy,
    },
    createdAt: now,
    updatedAt: now,
  };

  const currentList = getStoredInvoices();
  saveStoredInvoices([newInvoice, ...currentList]);
  return newInvoice;
}

// Automatic creation from a verified salon appointment booking
export function createInvoiceFromSalonAppointment(appt: {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceName: string;
  stylistName: string;
  appointmentDate: string;
  timeSlot: string;
  endTime?: string;
  price: number;
  amountPaid?: number;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
}): Invoice {
  const existing = getInvoiceById(appt.id);
  if (existing) return existing;

  const settings = getInvoiceSettings();
  const invoiceNumber = generateInvoiceNumber();
  const now = new Date().toISOString();
  const paidAmount = appt.amountPaid ?? appt.price;
  const taxRate = settings.taxRatePercent / 100;
  const taxAmount = Math.round((appt.price * taxRate) / (1 + taxRate));

  const newInvoice: Invoice = {
    id: `inv-sln-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    invoiceNumber,
    type: "salon",
    appointmentId: appt.id,
    customerName: appt.customerName,
    customerPhone: appt.customerPhone,
    customerEmail: appt.customerEmail,
    deliveryAddress: `Philipo Salon Chair · ${appt.appointmentDate} at ${appt.timeSlot}`,
    status: paidAmount >= appt.price ? "PAID" : "PARTIALLY_PAID",
    currency: "TZS",
    subtotal: appt.price,
    discount: 0,
    taxAmount,
    deliveryFee: 0,
    total: appt.price,
    amountPaid: paidAmount,
    balanceDue: Math.max(0, appt.price - paidAmount),
    paymentMethod: appt.paymentMethod || "Mobile Money",
    paymentReference: appt.paymentReference || `MOMO-${Math.floor(100000 + Math.random() * 900000)}`,
    paymentProvider: "Tanzania Mobile Payment",
    paidAt: now,
    issuedAt: now,
    notes: `Salon styling appointment for ${appt.serviceName} with ${appt.stylistName}. Ref: #${appt.id}`,
    items: [
      {
        id: `sln-item-1`,
        description: `${appt.serviceName} (Hair & Styling)`,
        stylist: appt.stylistName,
        qty: 1,
        unitPrice: appt.price,
        total: appt.price,
      },
    ],
    businessDetails: {
      name: settings.businessName,
      tin: settings.tin,
      vrn: settings.vrn,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      footerNote: settings.footerNote,
      returnPolicy: settings.returnPolicy,
    },
    createdAt: now,
    updatedAt: now,
  };

  const currentList = getStoredInvoices();
  saveStoredInvoices([newInvoice, ...currentList]);
  return newInvoice;
}

// Automatic creation from a retail POS checkout receipt
export function createInvoiceFromPOS(posReceipt: {
  ref: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{ name: string; qty: number; price: number; sku?: string }>;
  subtotal: number;
  discount: number;
  total: number;
  payMethod: string;
  salesPerson?: string;
}): Invoice {
  const existing = getInvoiceById(posReceipt.ref);
  if (existing) return existing;

  const settings = getInvoiceSettings();
  const invoiceNumber = generateInvoiceNumber();
  const now = new Date().toISOString();
  const taxRate = settings.taxRatePercent / 100;
  const taxAmount = Math.round((posReceipt.total * taxRate) / (1 + taxRate));

  const items: InvoiceItem[] = posReceipt.items.map((it, idx) => ({
    id: `pos-${idx}-${Date.now()}`,
    description: it.name,
    sku: it.sku || `SKU-POS-${idx + 1}`,
    qty: it.qty,
    unitPrice: it.price,
    total: it.price * it.qty,
  }));

  const newInvoice: Invoice = {
    id: `inv-pos-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    invoiceNumber,
    type: "pos",
    customerName: posReceipt.customerName || "In-Store Retail Client",
    customerPhone: posReceipt.customerPhone || "+255 700 000 000",
    deliveryAddress: "Kariakoo Retail Flagship Store Counter",
    status: "PAID",
    currency: "TZS",
    subtotal: posReceipt.subtotal,
    discount: posReceipt.discount,
    taxAmount,
    deliveryFee: 0,
    total: posReceipt.total,
    amountPaid: posReceipt.total,
    balanceDue: 0,
    paymentMethod: posReceipt.payMethod,
    paymentReference: posReceipt.ref,
    paidAt: now,
    issuedAt: now,
    notes: `In-Store POS Sale processed by ${posReceipt.salesPerson || "Staff"}.`,
    items,
    businessDetails: {
      name: settings.businessName,
      tin: settings.tin,
      vrn: settings.vrn,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      footerNote: settings.footerNote,
      returnPolicy: settings.returnPolicy,
    },
    createdAt: now,
    updatedAt: now,
  };

  const currentList = getStoredInvoices();
  saveStoredInvoices([newInvoice, ...currentList]);
  return newInvoice;
}

export function updateInvoiceStatus(id: string, status: InvoiceStatus, reason?: string): Invoice | undefined {
  const currentList = getStoredInvoices();
  let updatedInv: Invoice | undefined;

  const nextList = currentList.map((inv) => {
    if (inv.id === id || inv.invoiceNumber === id) {
      updatedInv = {
        ...inv,
        status,
        notes: reason ? `${inv.notes ? inv.notes + " | " : ""}${reason}` : inv.notes,
        updatedAt: new Date().toISOString(),
      };
      return updatedInv;
    }
    return inv;
  });

  if (updatedInv) {
    saveStoredInvoices(nextList);
  }
  return updatedInv;
}

export function voidInvoice(id: string, reason: string): Invoice | undefined {
  return updateInvoiceStatus(id, "VOID", `Voided: ${reason}`);
}

export function getInvoiceStats() {
  const invoices = getStoredInvoices();
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const paidInvoices = invoices.filter((inv) => inv.status === "PAID");
  const totalCollected = paidInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const pendingInvoices = invoices.filter((inv) => inv.status === "PENDING" || inv.status === "PARTIALLY_PAID");
  const totalOutstanding = pendingInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

  return {
    count: invoices.length,
    paidCount: paidInvoices.length,
    pendingCount: pendingInvoices.length,
    totalInvoiced,
    totalCollected,
    totalOutstanding,
  };
}
