-- Migration: Backend gap fixes (Priority 2)
-- Run this in the Supabase SQL editor

-- ─── payments: reversal support ─────────────────────────────────────────────
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_type varchar(20) NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS reversal_of_payment_id uuid REFERENCES payments(id);

-- Back-fill existing rows
UPDATE payments SET payment_type = 'reversal' WHERE is_reversed = false AND amount < 0;

-- ─── businesses: trial + restricted mode ────────────────────────────────────
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS restricted_mode boolean NOT NULL DEFAULT false;

-- Set trial window for existing businesses that don't have one yet
UPDATE businesses
  SET trial_started_at = created_at,
      trial_ends_at    = created_at + INTERVAL '14 days'
  WHERE trial_started_at IS NULL;

-- ─── users: last used business + active flag ─────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_used_business_id uuid REFERENCES businesses(id),
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- ─── business_members: role code + status ────────────────────────────────────
-- NOTE: existing `role` column is kept for compatibility.
-- Add status tracking columns.
ALTER TABLE business_members
  ADD COLUMN IF NOT EXISTS status_code varchar(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

-- ─── invoices: soft-delete support ──────────────────────────────────────────
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS replaced_by_invoice_id uuid REFERENCES invoices(id);

-- ─── change orders ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  project_id        uuid REFERENCES projects(id),
  contact_id        uuid REFERENCES contacts(id),
  co_number         varchar(50) NOT NULL,
  title             varchar(255),
  status            varchar(20) NOT NULL DEFAULT 'draft',
  subtotal          numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount        numeric(12,2) NOT NULL DEFAULT 0,
  total             numeric(12,2) NOT NULL DEFAULT 0,
  notes             text,
  terms             text,
  sent_at           timestamptz,
  approved_at       timestamptz,
  approved_by_name  varchar(255),
  created_by        uuid REFERENCES users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS change_order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id  uuid NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
  description      text,
  qty              numeric(10,3) NOT NULL DEFAULT 1,
  unit             varchar(50),
  rate             numeric(12,2) NOT NULL DEFAULT 0,
  total            numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate         numeric(5,2) NOT NULL DEFAULT 0,
  sort_order       int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_change_orders_business ON change_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_project  ON change_orders(project_id);

-- ─── audit events ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id          uuid REFERENCES users(id),
  entity_type      varchar(50) NOT NULL,
  entity_id        uuid,
  action           varchar(50) NOT NULL,
  payload          jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_business ON audit_events(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity   ON audit_events(entity_type, entity_id);
