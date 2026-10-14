import { db, schema } from "./db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { formatTanzanianPhone } from "./auth-server";

export interface CartItemInput {
  productId: string;
  qty: number;
}

export interface CheckoutInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryCity: string;
  deliveryArea: string;
  deliveryNotes?: string;
  paymentMethod: "momo" | "card" | "cod";
  items: CartItemInput[];
  userId?: string | undefined;
}

export async function createOrderFromCart(input: CheckoutInput) {
  if (!input.items || input.items.length === 0) {
    throw new Error("Cannot checkout with an empty cart.");
  }
  if (!input.customerName || !input.customerPhone) {
    throw new Error("Customer name and valid phone number are required for delivery.");
  }

  const formattedPhone = formatTanzanianPhone(input.customerPhone);
  const orderId = `ord-${crypto.randomUUID()}`;
  const orderNumber = `PC-${Math.floor(100000 + Math.random() * 900000)}`;

  // 1. Calculate Delivery Fee based on Region
  const cityLower = input.deliveryCity.toLowerCase();
  let deliveryFee = 7000;
  if (cityLower.includes("dar")) {
    deliveryFee = 5000; // Local Dar es Salaam delivery rate
  } else if (cityLower.includes("arusha") || cityLower.includes("mwanza") || cityLower.includes("dodoma")) {
    deliveryFee = 10000;
  } else if (cityLower.includes("zanzibar")) {
    deliveryFee = 15000;
  }

  // 2. Fetch and Validate Product Stocks
  let itemsSubtotal = 0;
  const itemsToInsert = [];

  for (const item of input.items) {
    const [product] = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, item.productId));

    if (!product) {
      throw new Error(`Product ID '${item.productId}' was not found in catalog.`);
    }
    if (product.stock < item.qty) {
      throw new Error(
        `Insufficient stock for '${product.name}'. Only ${product.stock} unit(s) available.`
      );
    }

    const itemTotal = product.price * item.qty;
    itemsSubtotal += itemTotal;

    itemsToInsert.push({
      id: `oi-${crypto.randomUUID()}`,
      orderId,
      productId: product.id,
      productName: product.name,
      qty: item.qty,
      unitPrice: product.price,
      unitCost: product.costPrice,
      totalPrice: itemTotal,
    });
  }

  const grandTotal = itemsSubtotal + deliveryFee;

  // 3. Create Order Record
  const [createdOrder] = await db
    .insert(schema.orders)
    .values({
      id: orderId,
      orderNumber,
      userId: input.userId ?? null,
      customerName: input.customerName.trim(),
      customerPhone: formattedPhone,
      deliveryCity: input.deliveryCity.trim(),
      deliveryArea: input.deliveryArea.trim(),
      channel: "Online",
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "cod" ? "Pending COD" : "Paid",
      fulfillmentStatus: "Processing",
      subtotal: itemsSubtotal,
      deliveryFee: deliveryFee,
      total: grandTotal,
      notes: input.deliveryNotes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // 4. Insert Order Items & Reserve/Deduct Stock
  for (const item of itemsToInsert) {
    await db.insert(schema.orderItems).values(item);

    // Update product stock in DB
    const [prod] = await db.select().from(schema.products).where(eq(schema.products.id, item.productId));
    if (prod) {
      const newStock = Math.max(0, prod.stock - item.qty);
      await db
        .update(schema.products)
        .set({ stock: newStock })
        .where(eq(schema.products.id, item.productId));

      // Add inventory ledger record
      await db.insert(schema.stockMovements).values({
        id: `sm-${crypto.randomUUID()}`,
        productId: item.productId,
        qty: -item.qty,
        balanceAfter: newStock,
        type: "Online customer order sale",
        referenceId: orderNumber,
      });
    }
  }

  // 5. Dispatch Baraka SMS Notification
  const smsBody = `Habari ${input.customerName}, oda yako #${orderNumber} ya TSh ${grandTotal.toLocaleString()} imepokelewa Philipo Cosmetics! Tutakupigia kuituma. Asante!`;
  await db.insert(schema.smsLogs).values({
    id: `sms-${crypto.randomUUID()}`,
    recipient: formattedPhone,
    message: smsBody,
    referenceType: "Order Confirmation",
    referenceId: orderNumber,
    createdAt: new Date(),
  });

  // 6. Record Audit Trail
  await db.insert(schema.auditLogs).values({
    id: `log-${crypto.randomUUID()}`,
    actor: formattedPhone,
    action: "checkout.order_placed",
    entity: "orders",
    detail: `Placed order ${orderNumber} for TSh ${grandTotal.toLocaleString()} with ${input.paymentMethod}`,
  });

  return {
    success: true,
    order: createdOrder,
    orderNumber,
    total: grandTotal,
    smsMessage: smsBody,
  };
}
