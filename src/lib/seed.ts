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
  await queryClient.unsafe(`
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

    CREATE TABLE IF NOT EXISTS salon_categories (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      starting_price INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS salon_services (
      id VARCHAR(36) PRIMARY KEY,
      category_id VARCHAR(36) REFERENCES salon_categories(id),
      name VARCHAR(255) NOT NULL,
      duration VARCHAR(50) NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      price INTEGER NOT NULL,
      description TEXT,
      image TEXT,
      requirements TEXT,
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
      customer_email VARCHAR(255),
      category_id VARCHAR(36),
      category_name VARCHAR(255),
      service_id VARCHAR(36) NOT NULL REFERENCES salon_services(id),
      service_name VARCHAR(255) NOT NULL,
      stylist_id VARCHAR(36) NOT NULL REFERENCES salon_stylists(id),
      stylist_name VARCHAR(255) NOT NULL,
      appointment_date VARCHAR(50) NOT NULL,
      time_slot VARCHAR(20) NOT NULL,
      end_time VARCHAR(20),
      duration VARCHAR(50),
      status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
      payment_status VARCHAR(50) NOT NULL DEFAULT 'SUCCESSFUL',
      payment_method VARCHAR(50) NOT NULL DEFAULT 'momo',
      payment_reference VARCHAR(255),
      amount_paid INTEGER DEFAULT 0,
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
  `);

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

  // Seed salon categories
  const defaultCategories = [
    { id: "CAT-1", name: "Hair Styling", slug: "hair-styling", description: "Braids, cornrows, wigs, and modern styles.", startingPrice: 30000, order: 1, image: "/assets/salon/category-hair-styling.jpg" },
    { id: "CAT-2", name: "Hair Straightening", slug: "hair-straightening", description: "Smooth and sleek hair solutions.", startingPrice: 50000, order: 2, image: "/assets/salon/category-hair-straightening.jpg" },
    { id: "CAT-3", name: "Hair Braiding", slug: "hair-braiding", description: "Traditional and modern braids.", startingPrice: 25000, order: 3, image: "/assets/salon/category-hair-braiding.jpg" },
    { id: "CAT-4", name: "Hair Design", slug: "hair-design", description: "Custom styles for every occasion.", startingPrice: 40000, order: 4, image: "/assets/salon/category-hair-design.jpg" },
    { id: "CAT-5", name: "Hair Treatment", slug: "hair-treatment", description: "Nourish, repair and restore.", startingPrice: 35000, order: 5, image: "/assets/salon/category-hair-treatment.jpg" },
    { id: "CAT-6", name: "Washing & Blow-Dry", slug: "washing-blow-dry", description: "Clean, fresh and styled.", startingPrice: 20000, order: 6, image: "/assets/salon/category-washing-blowdry.jpg" },
    { id: "CAT-7", name: "Makeup", slug: "makeup", description: "Look your best for any event.", startingPrice: 30000, order: 7, image: "/assets/salon/category-makeup.jpg" },
  ];

  for (const cat of defaultCategories) {
    const existing = await db.select().from(schema.salonCategories).where(eq(schema.salonCategories.id, cat.id));
    if (existing.length === 0) {
      await db.insert(schema.salonCategories).values(cat);
    }
  }

  // Seed salon services matching reference screenshots
  const defaultServices = [
    // Hair Styling (CAT-1)
    { id: "S-KNOTLESS", categoryId: "CAT-1", name: "Knotless Braids", duration: "2 hours", durationMinutes: 120, price: 35000, description: "Lightweight, natural look.", image: "/assets/salon/service-knotless-braids.jpg", requirements: "Hair must be washed or book wash service." },
    { id: "S-CORNROWS", categoryId: "CAT-1", name: "Cornrows", duration: "1 hour", durationMinutes: 60, price: 25000, description: "Classic and stylish.", image: "/assets/salon/service-cornrows.jpg", requirements: "Clean scalp recommended." },
    { id: "S-WIGINSTALL", categoryId: "CAT-1", name: "Wig Installation", duration: "2 hours", durationMinutes: 120, price: 50000, description: "Professional and secure.", image: "/assets/salon/service-wig-install.jpg", requirements: "Bring your lace wig 24h prior for customization." },
    
    // Hair Straightening (CAT-2)
    { id: "S-SILKPRESS", categoryId: "CAT-2", name: "Silk Press & Flat Iron", duration: "1 h 30 min", durationMinutes: 90, price: 50000, description: "Thermal straightening with moisture shield.", image: "/assets/salon/category-hair-straightening.jpg" },
    { id: "S-KERATIN", categoryId: "CAT-2", name: "Keratin Gloss Treatment", duration: "2 h 30 min", durationMinutes: 150, price: 120000, description: "Frizz elimination and diamond shine.", image: "/assets/salon/category-hair-straightening.jpg" },

    // Hair Braiding (CAT-3)
    { id: "S-BOXBRAIDS", categoryId: "CAT-3", name: "Classic Box Braids", duration: "2 h 30 min", durationMinutes: 150, price: 35000, description: "Precision parted traditional box braids.", image: "/assets/salon/category-hair-braiding.jpg" },
    { id: "S-TRIBALBRAIDS", categoryId: "CAT-3", name: "Tribal Fulani Braids", duration: "3 hours", durationMinutes: 180, price: 45000, description: "Artistic center-part braids with bead accents.", image: "/assets/salon/category-hair-braiding.jpg" },

    // Hair Design (CAT-4)
    { id: "S-SCULPTEDUPDO", categoryId: "CAT-4", name: "Sculpted Updo", duration: "1 h 30 min", durationMinutes: 90, price: 40000, description: "Elegantly pinned gala or event architectural style.", image: "/assets/salon/category-hair-design.jpg" },
    { id: "S-BRIDALHAIR", categoryId: "CAT-4", name: "Bridal Hair Architecture", duration: "3 hours", durationMinutes: 180, price: 150000, description: "Exclusive wedding styling and veil placement.", image: "/assets/salon/category-hair-design.jpg" },

    // Hair Treatment (CAT-5)
    { id: "S-DEEPSTEAM", categoryId: "CAT-5", name: "Deep Conditioning & Steam", duration: "50 min", durationMinutes: 50, price: 35000, description: "Nourish, repair and restore moisture balance.", image: "/assets/salon/category-hair-treatment.jpg" },
    { id: "S-PROTEINTHERAPY", categoryId: "CAT-5", name: "Protein Barrier Therapy", duration: "1 h 15 min", durationMinutes: 75, price: 45000, description: "Strengthening treatment for damaged strands.", image: "/assets/salon/category-hair-treatment.jpg" },

    // Washing & Blow-Dry (CAT-6)
    { id: "S-WASHBLOW", categoryId: "CAT-6", name: "Hydrating Wash & Blow-Dry", duration: "45 min", durationMinutes: 45, price: 20000, description: "Clean, fresh and styled blow-out.", image: "/assets/salon/category-washing-blowdry.jpg" },
    { id: "S-WASHTRIM", categoryId: "CAT-6", name: "Wash, Trim & Deluxe Blowout", duration: "1 hour", durationMinutes: 60, price: 30000, description: "Purifying wash, precision dusting, and soft bounce.", image: "/assets/salon/category-washing-blowdry.jpg" },

    // Makeup (CAT-7)
    { id: "S-SOFTGLAM", categoryId: "CAT-7", name: "Full Soft Glam Makeup", duration: "1 h 15 min", durationMinutes: 75, price: 30000, description: "Look your best for any event with velvety skin finish.", image: "/assets/salon/category-makeup.jpg" },
    { id: "S-BRIDALGLAM", categoryId: "CAT-7", name: "Luxury Bridal Glam", duration: "2 hours", durationMinutes: 120, price: 95000, description: "High-definition longwear bridal makeup with lashes.", image: "/assets/salon/category-makeup.jpg" },
  ];

  for (const s of defaultServices) {
    const existing = await db.select().from(schema.salonServices).where(eq(schema.salonServices.id, s.id));
    if (existing.length === 0) {
      await db.insert(schema.salonServices).values(s);
    }
  }

  // Seed salon stylists (featuring Jane M. from Screenshot 4)
  const defaultStylists = [
    { id: "ST-1", name: "Jane M.", phone: "+255 712 345 678", skills: "Braiding · Wigs · Modern Styles", rating: "4.95" },
    { id: "ST-2", name: "Amina Mushi", phone: "+255 744 281 673", skills: "Braiding · Colour", rating: "4.90" },
    { id: "ST-3", name: "Grace Kilonzo", phone: "+255 744 281 676", skills: "Silk press · Bridal", rating: "4.85" },
    { id: "ST-4", name: "Neema Joseph", phone: "+255 744 281 677", skills: "Natural hair · Treatments", rating: "4.90" },
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

