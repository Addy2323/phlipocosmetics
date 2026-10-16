-- Philipo Cosmetics — Business Partner & Reseller System Migration
-- Migration 0001: Add Reseller Application, Document Vault, Audit Logs, and User Reseller Fields

-- 1. Extend public.profiles with reseller role/partner status fields
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS account_purpose TEXT NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS partner_status TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS partner_code TEXT,
  ADD COLUMN IF NOT EXISTS reseller_discount_rate INTEGER DEFAULT 0;

-- 2. Reseller Applications Table
CREATE TABLE IF NOT EXISTS public.reseller_applications (
  id VARCHAR(36) PRIMARY KEY, -- e.g. "PC-PARTNER-109482"
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_type VARCHAR(50) NOT NULL, -- 'individual' | 'registered_business'
  
  -- Personal & Contact Information
  full_name VARCHAR(255) NOT NULL,
  dob VARCHAR(50),
  phone VARCHAR(50) NOT NULL,
  alt_phone VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  ward VARCHAR(100),
  street TEXT,
  preferred_contact VARCHAR(50) NOT NULL DEFAULT 'phone',

  -- Business & Sales Operations
  shop_name VARCHAR(255) NOT NULL,
  business_reg_number VARCHAR(100), -- BRELA
  tin VARCHAR(50), -- TRA TIN
  business_license VARCHAR(100),
  authorized_rep_position VARCHAR(100),
  sales_channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_monthly_sales VARCHAR(100),
  experience_years VARCHAR(50),
  product_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  territories JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivery_preference TEXT,

  -- NIDA & Identity
  nida_number VARCHAR(50) NOT NULL,
  nida_normalized VARCHAR(20) NOT NULL, -- Exactly 20 numeric digits
  nida_name VARCHAR(255) NOT NULL,

  -- Selfie & PDPA 2022 Biometrics
  selfie_url TEXT,
  biometric_consent BOOLEAN NOT NULL DEFAULT false,
  biometric_consent_timestamp TIMESTAMPTZ,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED', -- NOT_STARTED, PENDING, IN_PROGRESS, VERIFIED, FAILED, MANUAL_REVIEW_REQUIRED
  verification_method VARCHAR(50) NOT NULL DEFAULT 'manual_review',
  verification_notes TEXT,

  -- Terms & Agreement
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_version VARCHAR(50) NOT NULL DEFAULT '2026.1-TZ',
  terms_accepted_at TIMESTAMPTZ,

  -- Lifecycle & Administration
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, IN_PROGRESS, SUBMITTED, UNDER_REVIEW, MORE_INFORMATION_REQUIRED, RESUBMITTED, APPROVED, REJECTED, SUSPENDED
  step INTEGER NOT NULL DEFAULT 1,
  assigned_reviewer VARCHAR(255),
  admin_notes TEXT,
  more_info_reason TEXT,
  rejection_reason TEXT,
  suspension_reason TEXT,
  partner_code VARCHAR(50),
  reseller_discount_rate INTEGER DEFAULT 25,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reseller_applications_user ON public.reseller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_reseller_applications_status ON public.reseller_applications(status);
CREATE INDEX IF NOT EXISTS idx_reseller_applications_region ON public.reseller_applications(region);
CREATE INDEX IF NOT EXISTS idx_reseller_applications_nida ON public.reseller_applications(nida_normalized);

-- Enable RLS
ALTER TABLE public.reseller_applications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.reseller_applications TO authenticated;
GRANT ALL ON public.reseller_applications TO service_role;

-- Policies: Applicants can read & update their own applications
DROP POLICY IF EXISTS "Users read own application" ON public.reseller_applications;
CREATE POLICY "Users read own application" ON public.reseller_applications 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own application" ON public.reseller_applications;
CREATE POLICY "Users insert own application" ON public.reseller_applications 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own draft application" ON public.reseller_applications;
CREATE POLICY "Users update own draft application" ON public.reseller_applications 
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Reseller Supporting Documents Table
CREATE TABLE IF NOT EXISTS public.reseller_documents (
  id VARCHAR(36) PRIMARY KEY,
  application_id VARCHAR(36) NOT NULL REFERENCES public.reseller_applications(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- national_id_front, national_id_back, business_cert, business_license, tin_cert, premises_photo
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'uploaded', -- uploaded, verified, action_required, rejected
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  verified_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_reseller_documents_app ON public.reseller_documents(application_id);

ALTER TABLE public.reseller_documents ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reseller_documents TO authenticated;
GRANT ALL ON public.reseller_documents TO service_role;

DROP POLICY IF EXISTS "Users manage documents of own application" ON public.reseller_documents;
CREATE POLICY "Users manage documents of own application" ON public.reseller_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reseller_applications app 
      WHERE app.id = reseller_documents.application_id AND app.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reseller_applications app 
      WHERE app.id = reseller_documents.application_id AND app.user_id = auth.uid()
    )
  );

-- 4. Reseller Audit Logs Table
CREATE TABLE IF NOT EXISTS public.reseller_audit_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  application_id VARCHAR(36) NOT NULL REFERENCES public.reseller_applications(id) ON DELETE CASCADE,
  actor_id VARCHAR(36) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL, -- STATUS_CHANGE, DOCUMENT_VERIFIED, INFO_REQUESTED, PARTNER_APPROVED, PARTNER_SUSPENDED
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reseller_audit_logs_app ON public.reseller_audit_logs(application_id);

ALTER TABLE public.reseller_audit_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.reseller_audit_logs TO authenticated;
GRANT ALL ON public.reseller_audit_logs TO service_role;

DROP POLICY IF EXISTS "Users read audit logs of own application" ON public.reseller_audit_logs;
CREATE POLICY "Users read audit logs of own application" ON public.reseller_audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reseller_applications app 
      WHERE app.id = reseller_audit_logs.application_id AND app.user_id = auth.uid()
    )
  );
