import { db, schema, queryClient } from "./db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Hash password with PBKDF2 (native node crypto)
export function hashPassword(password: string): string {
  const salt = "philipo_cosmetics_salt_2026";
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function seedDatabase() {
  console.log("Seeding Philipo Cosmetics database tables...");

  // 1. Create tables if not existing via raw Drizzle DDL
  await queryClient`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'customer',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS brands (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      tagline TEXT,
      category_name VARCHAR(100) NOT NULL,
      price INTEGER NOT NULL,
      compare_at INTEGER,
      cost_price INTEGER NOT NULL DEFAULT 0,
      rating NUMERIC(3, 2) DEFAULT '5.00',
      reviews INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      reserved INTEGER NOT NULL DEFAULT 0,
      sku VARCHAR(100) NOT NULL UNIQUE,
      image TEXT NOT NULL,
      badge VARCHAR(100),
      description TEXT NOT NULL,
      details JSONB NOT NULL DEFAULT '[]'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id VARCHAR(36) PRIMARY KEY,
      product_id VARCHAR(36) NOT NULL REFERENCES products(id),
      qty INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      type VARCHAR(100) NOT NULL,
      reference_id VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      qty INTEGER NOT NULL DEFAULT 1,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY,
      order_number VARCHAR(100) NOT NULL UNIQUE,
      user_id VARCHAR(36),
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      customer_email VARCHAR(255),
      delivery_city VARCHAR(100) NOT NULL,
      delivery_area TEXT NOT NULL,
      delivery_notes TEXT,
      channel VARCHAR(50) NOT NULL DEFAULT 'Online',
      subtotal INTEGER NOT NULL,
      delivery_fee INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL,
      payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      payment_method VARCHAR(50) NOT NULL,
      fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'Processing',
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id VARCHAR(36) PRIMARY KEY,
      order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id VARCHAR(36) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      qty INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      unit_cost INTEGER NOT NULL DEFAULT 0,
      total_price INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(36) PRIMARY KEY,
      order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      provider VARCHAR(50) NOT NULL,
      phone VARCHAR(50),
      amount INTEGER NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      reference VARCHAR(255),
      raw_response JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS salon_services (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      duration VARCHAR(50) NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      price INTEGER NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS salon_stylists (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      skills TEXT,
      rating NUMERIC(3, 2) DEFAULT '4.90',
      is_active BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS salon_appointments (
      id VARCHAR(36) PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      service_id VARCHAR(36) NOT NULL REFERENCES salon_services(id),
      service_name VARCHAR(255) NOT NULL,
      stylist_id VARCHAR(36) NOT NULL REFERENCES salon_stylists(id),
      stylist_name VARCHAR(255) NOT NULL,
      appointment_date VARCHAR(50) NOT NULL,
      time_slot VARCHAR(20) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Confirmed',
      notes TEXT,
      price INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sms_logs (
      id VARCHAR(36) PRIMARY KEY,
      recipient VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      provider_response TEXT,
      reference_type VARCHAR(50),
      reference_id VARCHAR(100),
      retries INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(36) PRIMARY KEY,
      actor VARCHAR(255) NOT NULL,
      action VARCHAR(100) NOT NULL,
      entity VARCHAR(100) NOT NULL,
      detail TEXT NOT NULL,
      at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS business_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  // Seed default staff accounts if missing
  const defaultAccounts = [
    {
      id: "u-admin-1",
      email: "admin@philipo.co.tz",
      passwordHash: hashPassword("Admin123!"),
      fullName: "Amina Mushi (Admin)",
      phone: "+255 744 281 673",
      role: "admin",
    },
    {
      id: "u-sales-1",
      email: "sales@philipo.co.tz",
      passwordHash: hashPassword("Sales123!"),
      fullName: "Zawadi Mremi (Sales)",
      phone: "+255 744 281 674",
      role: "sales_staff",
    },
    {
      id: "u-support-1",
      email: "support@philipo.co.tz",
      passwordHash: hashPassword("Support123!"),
      fullName: "Fatma Suleiman (Customer Support)",
      phone: "+255 744 281 675",
      role: "customer_service",
    },
    {
      id: "u-stylist-1",
      email: "stylist@philipo.co.tz",
      passwordHash: hashPassword("Stylist123!"),
      fullName: "Grace Kilonzo (Stylist)",
      phone: "+255 744 281 676",
      role: "stylist",
    },
    {
      id: "u-customer-1",
      email: "customer@philipo.co.tz",
      passwordHash: hashPassword("Customer123!"),
      fullName: "Hellen Nyerere",
      phone: "+255 744 000 111",
      role: "customer",
    },
  ];

  for (const acc of defaultAccounts) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, acc.email));
    if (existing.length === 0) {
      await db.insert(schema.users).values(acc);
      console.log(`Created user account: ${acc.email} (${acc.role})`);
    }
  }

  // Seed products
  const defaultProducts = [
    {
      id: "P-1001",
      slug: "radiant-renewal-serum",
      name: "Radiant Renewal Serum",
      tagline: "Brighten · Firm · Replenish",
      categoryName: "Skincare",
      price: 68000,
      compareAt: 82000,
      costPrice: 38000,
      rating: "4.80",
      reviews: 126,
      stock: 42,
      reserved: 6,
      sku: "PC-SKN-0031",
      image: "/assets/p-serum.jpg",
      badge: "Best seller",
      description: "A featherlight vitamin-rich serum that lifts dullness and evens tone, formulated for humid coastal climates.",
      details: ["30 ml glass bottle", "Vitamin C + niacinamide", "Fragrance free", "Dermatologist tested"],
    },
    {
      id: "P-1002",
      slug: "matte-liquid-lipstick-berry",
      name: "Matte Liquid Lipstick — Berry",
      tagline: "Long wear velvet finish",
      categoryName: "Makeup",
      price: 24500,
      compareAt: 30000,
      costPrice: 12000,
      rating: "4.60",
      reviews: 318,
      stock: 120,
      reserved: 14,
      sku: "PC-MKP-0112",
      image: "/assets/p-lipstick.jpg",
      badge: "Trending",
      description: "Eight-hour velvet colour that never cakes. A deep berry that flatters every skin tone in our shade studies.",
      details: ["7 ml", "Transfer resistant", "Shea butter base", "Cruelty free"],
    },
    {
      id: "P-1003",
      slug: "luxe-hair-oil",
      name: "Luxe Hair Oil",
      tagline: "Nourish · Strengthen · Shine",
      categoryName: "Hair",
      price: 39000,
      compareAt: 45000,
      costPrice: 20000,
      rating: "4.90",
      reviews: 204,
      stock: 8,
      reserved: 3,
      sku: "PC-HAR-0007",
      image: "/assets/p-hairoil.jpg",
      badge: "Low stock",
      description: "Argan, jojoba and vitamin E blend used in our salon finishing ritual. Weightless on braids and natural coils.",
      details: ["59 ml dropper", "Argan + jojoba", "Heat protective", "Salon favourite"],
    },
    {
      id: "P-1004",
      slug: "radiant-skin-cream",
      name: "Radiant Skin Cream",
      tagline: "Hydrate · Replenish · Glow",
      categoryName: "Skincare",
      price: 52000,
      compareAt: 60000,
      costPrice: 28000,
      rating: "4.70",
      reviews: 89,
      stock: 64,
      reserved: 2,
      sku: "PC-SKN-0058",
      image: "/assets/p-cream.jpg",
      badge: undefined,
      description: "A rich but breathable day cream with a soft-focus finish, layered beautifully under makeup.",
      details: ["50 ml jar", "Hyaluronic acid", "SPF free — layer with sunscreen", "Refillable"],
    },
  ];

  for (const prod of defaultProducts) {
    const existing = await db.select().from(schema.products).where(eq(schema.products.id, prod.id));
    if (existing.length === 0) {
      await db.insert(schema.products).values(prod);
      console.log(`Seeded product: ${prod.name}`);
    }
  }

  // Seed salon services
  const defaultServices = [
    { id: "S-1", name: "Signature Braiding", duration: "3 h 30 min", durationMinutes: 210, price: 85000, description: "Knotless, box, or tribal braids with premium scalp therapy." },
    { id: "S-2", name: "Silk Press & Style", duration: "1 h 30 min", durationMinutes: 90, price: 45000, description: "Hydrating wash, blow out, thermal press, and split end trim." },
    { id: "S-3", name: "Deep Conditioning Ritual", duration: "50 min", durationMinutes: 50, price: 30000, description: "Steam treatment with argan oil mask for soft strength." },
    { id: "S-4", name: "Bridal Hair & Makeup", duration: "4 h", durationMinutes: 240, price: 250000, description: "Full bridal makeover with trial and premium eyelash installation." },
    { id: "S-5", name: "Colour & Gloss", duration: "2 h", durationMinutes: 120, price: 120000, description: "Custom tinting and high-shine gloss formula." },
  ];

  for (const s of defaultServices) {
    const existing = await db.select().from(schema.salonServices).where(eq(schema.salonServices.id, s.id));
    if (existing.length === 0) {
      await db.insert(schema.salonServices).values(s);
    }
  }

  // Seed salon stylists
  const defaultStylists = [
    { id: "ST-1", name: "Amina Mushi", phone: "+255 744 281 673", skills: "Braiding · Colour", rating: "4.90" },
    { id: "ST-2", name: "Grace Kilonzo", phone: "+255 744 281 676", skills: "Silk press · Bridal", rating: "4.80" },
    { id: "ST-3", name: "Neema Joseph", phone: "+255 744 281 677", skills: "Natural hair · Treatments", rating: "4.90" },
  ];

  for (const st of defaultStylists) {
    const existing = await db.select().from(schema.salonStylists).where(eq(schema.salonStylists.id, st.id));
    if (existing.length === 0) {
      await db.insert(schema.salonStylists).values(st);
    }
  }

  // Seed initial sample orders for testing KPIs & reports if order table empty
  const existingOrdersCount = await db.select().from(schema.orders);
  if (existingOrdersCount.length === 0) {
    const seedOrders = [
      {
        id: "PC-24871",
        orderNumber: "PC-24871",
        userId: "u-customer-1",
        customerName: "Zawadi Mremi",
        customerPhone: "+255 744 000 222",
        customerEmail: "zawadi@gmail.com",
        deliveryCity: "Dar es Salaam",
        deliveryArea: "Masaki, Chole Road",
        channel: "Online",
        subtotal: 137500,
        deliveryFee: 5000,
        total: 142500,
        paymentStatus: "Paid",
        paymentMethod: "momo",
        fulfillmentStatus: "Preparing",
        createdAt: new Date(),
      },
      {
        id: "PC-24870",
        orderNumber: "PC-24870",
        userId: null,
        customerName: "Walk-in customer",
        customerPhone: "+255 700 000 000",
        deliveryCity: "Dar es Salaam",
        deliveryArea: "Store POS Counter",
        channel: "POS",
        subtotal: 24500,
        deliveryFee: 0,
        total: 24500,
        paymentStatus: "Paid",
        paymentMethod: "momo",
        fulfillmentStatus: "Delivered",
        createdAt: new Date(),
      },
      {
        id: "PC-24869",
        orderNumber: "PC-24869",
        userId: null,
        customerName: "Fatma Suleiman",
        customerPhone: "+255 744 111 333",
        deliveryCity: "Dar es Salaam",
        deliveryArea: "Mikocheni B, Rose Garden",
        channel: "Online",
        subtotal: 318000,
        deliveryFee: 0,
        total: 318000,
        paymentStatus: "Paid",
        paymentMethod: "momo",
        fulfillmentStatus: "Out for Delivery",
        createdAt: new Date(),
      },
    ];

    for (const ord of seedOrders) {
      await db.insert(schema.orders).values(ord);
    }
  }

  console.log("Database tables and seed data created successfully!");
  await queryClient.end();
}

