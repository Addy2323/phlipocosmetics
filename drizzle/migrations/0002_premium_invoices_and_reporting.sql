-- Migration: 0002_premium_invoices_and_reporting.sql
-- Description: Adds invoices and invoice_settings tables for Philipo Cosmetics premium reporting and automated billing

CREATE TABLE IF NOT EXISTS "invoices" (
  "id" varchar(36) PRIMARY KEY,
  "invoice_number" varchar(100) NOT NULL UNIQUE,
  "type" varchar(50) NOT NULL DEFAULT 'product',
  "order_id" varchar(100),
  "appointment_id" varchar(100),
  "user_id" varchar(36),
  "customer_name" varchar(255) NOT NULL,
  "customer_phone" varchar(50) NOT NULL,
  "customer_email" varchar(255),
  "delivery_address" text,
  "status" varchar(50) NOT NULL DEFAULT 'PAID',
  "currency" varchar(10) NOT NULL DEFAULT 'TZS',
  "subtotal" integer NOT NULL,
  "discount" integer NOT NULL DEFAULT 0,
  "tax_amount" integer NOT NULL DEFAULT 0,
  "delivery_fee" integer NOT NULL DEFAULT 0,
  "total" integer NOT NULL,
  "amount_paid" integer NOT NULL DEFAULT 0,
  "balance_due" integer NOT NULL DEFAULT 0,
  "payment_method" varchar(50) NOT NULL,
  "payment_reference" varchar(255),
  "payment_provider" varchar(50),
  "paid_at" timestamp,
  "issued_at" timestamp NOT NULL DEFAULT now(),
  "due_date" timestamp,
  "notes" text,
  "items" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "business_details" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "pdf_url" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "invoice_settings" (
  "id" varchar(36) PRIMARY KEY,
  "business_name" varchar(255) NOT NULL DEFAULT 'Philipo Cosmetics Ltd',
  "tin" varchar(50) NOT NULL DEFAULT '142-890-332',
  "vrn" varchar(50) NOT NULL DEFAULT '40-029810-Z',
  "address" text NOT NULL DEFAULT 'Plot 42, Samora Avenue, CBD, Dar es Salaam, Tanzania',
  "phone" varchar(100) NOT NULL DEFAULT '+255 744 000 111 / +255 755 222 333',
  "email" varchar(255) NOT NULL DEFAULT 'billing@philipocosmetics.co.tz',
  "prefix" varchar(20) NOT NULL DEFAULT 'INV-PC-',
  "footer_note" text NOT NULL DEFAULT 'Thank you for your patronage. Your natural radiance is our pride.',
  "return_policy" text NOT NULL DEFAULT 'Unopened beauty products may be exchanged within 7 days with valid invoice.',
  "tax_rate_percent" integer NOT NULL DEFAULT 18,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_invoices_customer_phone" ON "invoices" ("customer_phone");
CREATE INDEX IF NOT EXISTS "idx_invoices_order_id" ON "invoices" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_appointment_id" ON "invoices" ("appointment_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_user_id" ON "invoices" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices" ("status");
CREATE INDEX IF NOT EXISTS "idx_invoices_issued_at" ON "invoices" ("issued_at");
