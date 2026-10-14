import { db, schema } from "./db";
import { eq, desc, sql, gte, and, inArray } from "drizzle-orm";
import crypto from "crypto";

export interface DashboardStats {
  totalRevenue: number;
  totalOrdersCount: number;
  todayOrdersCount: number;
  activeAppointmentsCount: number;
  lowStockCount: number;
  grossProfit: number;
  totalCOGS: number;
  recentOrders: Array<typeof schema.orders.$inferSelect>;
  recentAppointments: Array<typeof schema.salonAppointments.$inferSelect>;
  lowStockProducts: Array<typeof schema.products.$inferSelect>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // 1. Fetch Orders
  const allOrders = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
  const paidOrders = allOrders.filter((o) => o.paymentStatus === "Paid");

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = allOrders.length;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayOrdersCount = allOrders.filter((o) => {
    const createdDate = new Date(o.createdAt).toISOString().split("T")[0];
    return createdDate === todayStr;
  }).length;

  // 2. Fetch Active Appointments
  const appointments = await db
    .select()
    .from(schema.salonAppointments)
    .orderBy(desc(schema.salonAppointments.createdAt));

  const activeAppointmentsCount = appointments.filter(
    (a) => a.status === "Confirmed" || a.status === "Waiting" || a.status === "In chair"
  ).length;

  // 3. Low Stock Alert Products (stock <= 10)
  const allProducts = await db.select().from(schema.products);
  const lowStockProducts = allProducts.filter((p) => p.stock <= 10 && p.isActive);
  const lowStockCount = lowStockProducts.length;

  // 4. Calculate COGS & Profit
  const allOrderItems = await db.select().from(schema.orderItems);
  const totalCOGS = allOrderItems.reduce((sum, item) => sum + item.unitCost * item.qty, 0);
  const grossProfit = totalRevenue > 0 ? totalRevenue - totalCOGS : 0;

  return {
    totalRevenue,
    totalOrdersCount,
    todayOrdersCount,
    activeAppointmentsCount,
    lowStockCount,
    grossProfit,
    totalCOGS,
    recentOrders: allOrders.slice(0, 5),
    recentAppointments: appointments.slice(0, 5),
    lowStockProducts,
  };
}

export async function getSalesAnalytics() {
  const allOrders = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
  const paidOrders = allOrders.filter((o) => o.paymentStatus === "Paid");

  const channelBreakdown = {
    Online: paidOrders.filter((o) => o.channel === "Online").reduce((s, o) => s + o.total, 0),
    POS: paidOrders.filter((o) => o.channel === "POS").reduce((s, o) => s + o.total, 0),
    WhatsApp: paidOrders.filter((o) => o.channel === "WhatsApp").reduce((s, o) => s + o.total, 0),
  };

  const paymentMethodBreakdown = {
    MobileMoney: paidOrders.filter((o) => o.paymentMethod === "momo").reduce((s, o) => s + o.total, 0),
    Card: paidOrders.filter((o) => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0),
    COD: paidOrders.filter((o) => o.paymentMethod === "cod").reduce((s, o) => s + o.total, 0),
  };

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const allOrderItems = await db.select().from(schema.orderItems);
  const totalCOGS = allOrderItems.reduce((sum, item) => sum + item.unitCost * item.qty, 0);
  const netProfit = totalRevenue - totalCOGS;
  const marginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  return {
    totalRevenue,
    totalCOGS,
    netProfit,
    marginPercent,
    channelBreakdown,
    paymentMethodBreakdown,
    paidOrdersCount: paidOrders.length,
  };
}

export async function getOrdersList() {
  return await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
}

export async function updateOrderStatus(orderId: string, status: { fulfillmentStatus?: string; paymentStatus?: string }) {
  const updateData: Partial<typeof schema.orders.$inferInsert> = { updatedAt: new Date() };
  if (status.fulfillmentStatus) updateData.fulfillmentStatus = status.fulfillmentStatus;
  if (status.paymentStatus) updateData.paymentStatus = status.paymentStatus;

  const [updated] = await db
    .update(schema.orders)
    .set(updateData)
    .where(eq(schema.orders.id, orderId))
    .returning();

  await db.insert(schema.auditLogs).values({
    id: `log-${crypto.randomUUID()}`,
    actor: "system_staff",
    action: "order.status_update",
    entity: "orders",
    detail: `Updated order ${orderId} fulfillment: ${status.fulfillmentStatus || 'unchanged'}, payment: ${status.paymentStatus || 'unchanged'}`,
  });

  return updated;
}

export async function getProductsList() {
  return await db.select().from(schema.products).orderBy(schema.products.name);
}

export async function createProduct(prod: Omit<typeof schema.products.$inferInsert, "id" | "createdAt">) {
  const id = `P-${Math.floor(1000 + Math.random() * 9000)}`;
  const [created] = await db
    .insert(schema.products)
    .values({ ...prod, id, createdAt: new Date() })
    .returning();

  // Initial stock movement
  await db.insert(schema.stockMovements).values({
    id: `sm-${crypto.randomUUID()}`,
    productId: id,
    qty: prod.stock ?? 0,
    balanceAfter: prod.stock ?? 0,
    type: "Goods receipt",
    referenceId: "Initial stock load",
  });

  return created;
}

export async function adjustProductStock(productId: string, adjustmentQty: number, type: string, referenceId?: string) {
  const [product] = await db.select().from(schema.products).where(eq(schema.products.id, productId));
  if (!product) throw new Error("Product not found");

  const newStock = Math.max(0, product.stock + adjustmentQty);

  const [updated] = await db
    .update(schema.products)
    .set({ stock: newStock })
    .where(eq(schema.products.id, productId))
    .returning();

  await db.insert(schema.stockMovements).values({
    id: `sm-${crypto.randomUUID()}`,
    productId,
    qty: adjustmentQty,
    balanceAfter: newStock,
    type,
    referenceId: referenceId ?? "Manual inventory adjustment",
  });

  return updated;
}

export async function getSalonAppointments() {
  return await db.select().from(schema.salonAppointments).orderBy(desc(schema.salonAppointments.createdAt));
}

export async function createSalonAppointment(data: Omit<typeof schema.salonAppointments.$inferInsert, "id" | "createdAt">) {
  const id = `B-${Math.floor(1000 + Math.random() * 9000)}`;
  const [created] = await db
    .insert(schema.salonAppointments)
    .values({ ...data, id, createdAt: new Date() })
    .returning();

  // Send SMS confirmation log
  const smsBody = `Habari ${data.customerName}, kiti chako cha ${data.serviceName} na ${data.stylistName} tarehe ${data.appointmentDate} saa ${data.timeSlot} kimethibitishwa! Ref: #${id}. Philipo Cosmetics.`;
  await db.insert(schema.smsLogs).values({
    id: `sms-${crypto.randomUUID()}`,
    recipient: data.customerPhone,
    message: smsBody,
    referenceType: "Salon Appointment",
    referenceId: id,
    createdAt: new Date(),
  });

  await db.insert(schema.auditLogs).values({
    id: `log-${crypto.randomUUID()}`,
    actor: data.customerPhone,
    action: "salon.appointment_created",
    entity: "salon_appointments",
    detail: `Booked ${data.serviceName} with ${data.stylistName} for ${data.appointmentDate} @ ${data.timeSlot}`,
  });

  return created;
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const [updated] = await db
    .update(schema.salonAppointments)
    .set({ status })
    .where(eq(schema.salonAppointments.id, appointmentId))
    .returning();

  return updated;
}

export async function getAuditLogs() {
  return await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.at)).limit(100);
}

export async function getSMSLogs() {
  return await db.select().from(schema.smsLogs).orderBy(desc(schema.smsLogs.createdAt)).limit(100);
}

export async function getSalonServicesList() {
  const services = await db.select().from(schema.salonServices).where(eq(schema.salonServices.isActive, true));
  if (services.length > 0) return services;

  // Fallback / initial database seed if table is empty
  const defaultServices = [
    { id: "S-1", name: "Signature Braiding", duration: "3 h 30 min", price: 85000, description: "Knotless, fulani, or box braids with premium hair extension." },
    { id: "S-2", name: "Silk Press & Style", duration: "1 h 30 min", price: 45000, description: "Clarifying wash, deep hydration steam, and silk press." },
    { id: "S-3", name: "Deep Conditioning Ritual", duration: "50 min", price: 30000, description: "Scalp treatment and restorative protein mask." },
    { id: "S-4", name: "Bridal Hair & Makeup", duration: "4 h", price: 250000, description: "Full glam makeup, trial session, and hair styling." },
    { id: "S-5", name: "Colour & Gloss", duration: "2 h", price: 120000, description: "Custom shade coloring, toner, and shine treatment." },
  ];

  for (const s of defaultServices) {
    await db.insert(schema.salonServices).values({ ...s, durationMinutes: 60, isActive: true }).onConflictDoNothing();
  }

  return await db.select().from(schema.salonServices).where(eq(schema.salonServices.isActive, true));
}

export async function getSalonStylistsList() {
  const stylistsList = await db.select().from(schema.salonStylists).where(eq(schema.salonStylists.isActive, true));
  if (stylistsList.length > 0) return stylistsList;

  // Fallback / initial database seed if table is empty
  const defaultStylists = [
    { id: "ST-1", name: "Amina Mushi", skills: "Braiding · Colour", rating: "4.90" },
    { id: "ST-2", name: "Grace Kilonzo", skills: "Silk press · Bridal", rating: "4.80" },
    { id: "ST-3", name: "Neema Joseph", skills: "Natural hair · Treatments", rating: "4.90" },
  ];

  for (const st of defaultStylists) {
    await db.insert(schema.salonStylists).values({ ...st, isActive: true }).onConflictDoNothing();
  }

  return await db.select().from(schema.salonStylists).where(eq(schema.salonStylists.isActive, true));
}

export async function getBookedSlotsForDateAndStylist(appointmentDate: string, stylistId: string): Promise<string[]> {
  const existing = await db
    .select()
    .from(schema.salonAppointments)
    .where(
      and(
        eq(schema.salonAppointments.appointmentDate, appointmentDate),
        eq(schema.salonAppointments.stylistId, stylistId)
      )
    );

  return existing
    .filter((a) => a.status !== "Cancelled")
    .map((a) => a.timeSlot);
}
