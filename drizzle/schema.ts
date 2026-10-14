import { pgTable, varchar, text, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("customer"), // admin, sales_staff, customer_service, stylist, customer
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

export const salonServices = pgTable("salon_services", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  duration: varchar("duration", { length: 50 }).notNull(),
  durationMinutes: integer("duration_minutes").default(60).notNull(),
  price: integer("price").notNull(),
  description: text("description"),
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
  serviceId: varchar("service_id", { length: 36 }).notNull().references(() => salonServices.id),
  serviceName: varchar("service_name", { length: 255 }).notNull(),
  stylistId: varchar("stylist_id", { length: 36 }).notNull().references(() => salonStylists.id),
  stylistName: varchar("stylist_name", { length: 255 }).notNull(),
  appointmentDate: varchar("appointment_date", { length: 50 }).notNull(), // YYYY-MM-DD
  timeSlot: varchar("time_slot", { length: 20 }).notNull(), // 09:00
  status: varchar("status", { length: 50 }).default("Confirmed").notNull(), // Pending, Confirmed, Waiting, In chair, Completed, Cancelled, No-show
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
