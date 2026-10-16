import { pgTable, varchar, text, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("customer"), // admin, sales_staff, customer_service, stylist, customer
  accountPurpose: varchar("account_purpose", { length: 50 }).default("customer").notNull(), // customer, partner
  partnerStatus: varchar("partner_status", { length: 50 }).default("NONE").notNull(), // NONE, PENDING, APPROVED, REJECTED, SUSPENDED
  partnerCode: varchar("partner_code", { length: 50 }),
  resellerDiscountRate: integer("reseller_discount_rate").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
});

export const brands = pgTable("brands", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

export const products = pgTable("products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  tagline: text("tagline"),
  categoryName: varchar("category_name", { length: 100 }).notNull(),
  price: integer("price").notNull(),
  compareAt: integer("compare_at"),
  costPrice: integer("cost_price").default(0).notNull(),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("5.00"),
  reviews: integer("reviews").default(0).notNull(),
  stock: integer("stock").default(0).notNull(),
  reserved: integer("reserved").default(0).notNull(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  image: text("image").notNull(),
  badge: varchar("badge", { length: 100 }),
  description: text("description").notNull(),
  details: jsonb("details").$type<string[]>().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockMovements = pgTable("stock_movements", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id),
  qty: integer("qty").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  referenceId: varchar("reference_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id, { onDelete: "cascade" }),
  qty: integer("qty").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
  userId: varchar("user_id", { length: 36 }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }),
  deliveryCity: varchar("delivery_city", { length: 100 }).notNull(),
  deliveryArea: text("delivery_area").notNull(),
  deliveryNotes: text("delivery_notes"),
  channel: varchar("channel", { length: 50 }).default("Online").notNull(),
  subtotal: integer("subtotal").notNull(),
  deliveryFee: integer("delivery_fee").default(0).notNull(),
  total: integer("total").notNull(),
  paymentStatus: varchar("payment_status", { length: 50 }).default("Pending").notNull(), // Pending, Paid, Failed, Refunded
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // momo, card, cod
  fulfillmentStatus: varchar("fulfillment_status", { length: 50 }).default("Processing").notNull(), // Processing, Preparing, Out for Delivery, Delivered, Cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("order_id", { length: 36 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 36 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  qty: integer("qty").notNull(),
  unitPrice: integer("unit_price").notNull(),
  unitCost: integer("unit_cost").default(0).notNull(),
  totalPrice: integer("total_price").notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("order_id", { length: 36 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  reference: varchar("reference", { length: 255 }),
  rawResponse: jsonb("raw_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const salonCategories = pgTable("salon_categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  startingPrice: integer("starting_price").notNull().default(0),
  image: text("image"),
  order: integer("order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const salonServices = pgTable("salon_services", {
  id: varchar("id", { length: 36 }).primaryKey(),
  categoryId: varchar("category_id", { length: 36 }),
  name: varchar("name", { length: 255 }).notNull(),
  duration: varchar("duration", { length: 50 }).notNull(),
  durationMinutes: integer("duration_minutes").default(60).notNull(),
  price: integer("price").notNull(),
  description: text("description"),
  image: text("image"),
  requirements: text("requirements"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const salonStylists = pgTable("salon_stylists", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  skills: text("skills"),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("4.90"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const salonAppointments = pgTable("salon_appointments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }),
  categoryId: varchar("category_id", { length: 36 }),
  categoryName: varchar("category_name", { length: 255 }),
  serviceId: varchar("service_id", { length: 36 }).notNull().references(() => salonServices.id),
  serviceName: varchar("service_name", { length: 255 }).notNull(),
  stylistId: varchar("stylist_id", { length: 36 }).notNull().references(() => salonStylists.id),
  stylistName: varchar("stylist_name", { length: 255 }).notNull(),
  appointmentDate: varchar("appointment_date", { length: 50 }).notNull(), // YYYY-MM-DD
  timeSlot: varchar("time_slot", { length: 20 }).notNull(), // 14:00
  endTime: varchar("end_time", { length: 20 }), // 16:00
  duration: varchar("duration", { length: 50 }), // 2 hours
  status: varchar("status", { length: 50 }).default("CONFIRMED").notNull(), // PENDING_PAYMENT, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
  paymentStatus: varchar("payment_status", { length: 50 }).default("SUCCESSFUL").notNull(), // PENDING, PROCESSING, SUCCESSFUL, FAILED, REFUNDED
  paymentMethod: varchar("payment_method", { length: 50 }).default("momo"), // momo, bank
  paymentReference: varchar("payment_reference", { length: 255 }),
  amountPaid: integer("amount_paid").default(0),
  notes: text("notes"),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const smsLogs = pgTable("sms_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  recipient: varchar("recipient", { length: 50 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  providerResponse: text("provider_response"),
  referenceType: varchar("reference_type", { length: 50 }),
  referenceId: varchar("reference_id", { length: 100 }),
  retries: integer("retries").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  actor: varchar("actor", { length: 255 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  detail: text("detail").notNull(),
  at: timestamp("at").defaultNow().notNull(),
});

export const businessSettings = pgTable("business_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resellerApplications = pgTable("reseller_applications", {
  id: varchar("id", { length: 36 }).primaryKey(), // e.g. "PC-PARTNER-109482"
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  applicantType: varchar("applicant_type", { length: 50 }).notNull(), // individual, registered_business
  fullName: varchar("full_name", { length: 255 }).notNull(),
  dob: varchar("dob", { length: 50 }),
  phone: varchar("phone", { length: 50 }).notNull(),
  altPhone: varchar("alt_phone", { length: 50 }),
  email: varchar("email", { length: 255 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  ward: varchar("ward", { length: 100 }),
  street: text("street"),
  preferredContact: varchar("preferred_contact", { length: 50 }).default("phone").notNull(),
  shopName: varchar("shop_name", { length: 255 }).notNull(),
  businessRegNumber: varchar("business_reg_number", { length: 100 }),
  tin: varchar("tin", { length: 50 }),
  businessLicense: varchar("business_license", { length: 100 }),
  authorizedRepPosition: varchar("authorized_rep_position", { length: 100 }),
  salesChannels: jsonb("sales_channels").$type<string[]>().default([]).notNull(),
  estimatedMonthlySales: varchar("estimated_monthly_sales", { length: 100 }),
  experienceYears: varchar("experience_years", { length: 50 }),
  productCategories: jsonb("product_categories").$type<string[]>().default([]).notNull(),
  territories: jsonb("territories").$type<string[]>().default([]).notNull(),
  deliveryPreference: text("delivery_preference"),
  nidaNumber: varchar("nida_number", { length: 50 }).notNull(),
  nidaNormalized: varchar("nida_normalized", { length: 20 }).notNull(), // Exactly 20 numeric digits
  nidaName: varchar("nida_name", { length: 255 }).notNull(),
  selfieUrl: text("selfie_url"),
  biometricConsent: boolean("biometric_consent").default(false).notNull(),
  biometricConsentTimestamp: timestamp("biometric_consent_timestamp"),
  verificationStatus: varchar("verification_status", { length: 50 }).default("NOT_STARTED").notNull(), // NOT_STARTED, PENDING, IN_PROGRESS, VERIFIED, FAILED, MANUAL_REVIEW_REQUIRED
  verificationMethod: varchar("verification_method", { length: 50 }).default("manual_review").notNull(),
  verificationNotes: text("verification_notes"),
  termsAccepted: boolean("terms_accepted").default(false).notNull(),
  termsVersion: varchar("terms_version", { length: 50 }).default("2026.1-TZ").notNull(),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  status: varchar("status", { length: 50 }).default("DRAFT").notNull(), // DRAFT, IN_PROGRESS, SUBMITTED, UNDER_REVIEW, MORE_INFORMATION_REQUIRED, RESUBMITTED, APPROVED, REJECTED, SUSPENDED
  step: integer("step").default(1).notNull(),
  assignedReviewer: varchar("assigned_reviewer", { length: 255 }),
  adminNotes: text("admin_notes"),
  moreInfoReason: text("more_info_reason"),
  rejectionReason: text("rejection_reason"),
  suspensionReason: text("suspension_reason"),
  partnerCode: varchar("partner_code", { length: 50 }),
  resellerDiscountRate: integer("reseller_discount_rate").default(25),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resellerDocuments = pgTable("reseller_documents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  applicationId: varchar("application_id", { length: 36 }).notNull().references(() => resellerApplications.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // national_id_front, national_id_back, business_cert, business_license, tin_cert, premises_photo
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  status: varchar("status", { length: 50 }).default("uploaded").notNull(), // uploaded, verified, action_required, rejected
  notes: text("notes"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by", { length: 255 }),
});

export const resellerAuditLogs = pgTable("reseller_audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  applicationId: varchar("application_id", { length: 36 }).notNull().references(() => resellerApplications.id, { onDelete: "cascade" }),
  actorId: varchar("actor_id", { length: 36 }).notNull(),
  actorName: varchar("actor_name", { length: 255 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // STATUS_CHANGE, DOCUMENT_VERIFIED, INFO_REQUESTED, PARTNER_APPROVED, PARTNER_SUSPENDED
  previousStatus: varchar("previous_status", { length: 50 }),
  newStatus: varchar("new_status", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id", { length: 36 }).primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 50 }).default("product").notNull(), // product, salon, pos, combined
  orderId: varchar("order_id", { length: 100 }),
  appointmentId: varchar("appointment_id", { length: 100 }),
  userId: varchar("user_id", { length: 36 }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }),
  deliveryAddress: text("delivery_address"),
  status: varchar("status", { length: 50 }).default("PAID").notNull(), // PENDING, PAID, PARTIALLY_PAID, VOID, REFUNDED
  currency: varchar("currency", { length: 10 }).default("TZS").notNull(),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").default(0).notNull(),
  taxAmount: integer("tax_amount").default(0).notNull(),
  deliveryFee: integer("delivery_fee").default(0).notNull(),
  total: integer("total").notNull(),
  amountPaid: integer("amount_paid").default(0).notNull(),
  balanceDue: integer("balance_due").default(0).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  paymentReference: varchar("payment_reference", { length: 255 }),
  paymentProvider: varchar("payment_provider", { length: 50 }),
  paidAt: timestamp("paid_at"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  items: jsonb("items").$type<any[]>().default([]).notNull(),
  businessDetails: jsonb("business_details").$type<Record<string, any>>().default({}).notNull(),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceSettings = pgTable("invoice_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  businessName: varchar("business_name", { length: 255 }).default("Philipo Cosmetics Ltd").notNull(),
  tin: varchar("tin", { length: 50 }).default("142-890-332").notNull(),
  vrn: varchar("vrn", { length: 50 }).default("40-029810-Z").notNull(),
  address: text("address").default("Plot 42, Samora Avenue, CBD, Dar es Salaam, Tanzania").notNull(),
  phone: varchar("phone", { length: 100 }).default("+255 744 000 111 / +255 755 222 333").notNull(),
  email: varchar("email", { length: 255 }).default("billing@philipocosmetics.co.tz").notNull(),
  prefix: varchar("prefix", { length: 20 }).default("INV-PC-").notNull(),
  footerNote: text("footer_note").default("Thank you for your patronage. Your natural radiance is our pride.").notNull(),
  returnPolicy: text("return_policy").default("Unopened beauty products may be exchanged within 7 days with valid invoice.").notNull(),
  taxRatePercent: integer("tax_rate_percent").default(18).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

