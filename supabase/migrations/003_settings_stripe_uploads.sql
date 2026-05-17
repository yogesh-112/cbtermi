-- Migration 003: Add missing columns for settings, Stripe, uploads, webhooks, notification prefs
-- Run in Supabase SQL editor

-- ─── businesses: missing settings columns ────────────────────────────────────
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS website          TEXT,
  ADD COLUMN IF NOT EXISTS trade_license    TEXT,
  ADD COLUMN IF NOT EXISTS tax_label        TEXT DEFAULT 'Sales tax',
  ADD COLUMN IF NOT EXISTS quote_next_number  INT  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS invoice_next_number INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS language         TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  -- notification prefs (notifications section)
  ADD COLUMN IF NOT EXISTS n_payment        BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS n_quote          BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS n_invoice        BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS n_message        BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS n_review         BOOLEAN DEFAULT true,
  -- notification defaults (numbering section)
  ADD COLUMN IF NOT EXISTS notify_new_quote    BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_invoice_due  BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_payment      BOOLEAN DEFAULT true;

-- ─── subscriptions: Stripe subscription detail ───────────────────────────────
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle         TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS stripe_price_id       TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end  BOOLEAN DEFAULT false;

-- ─── webhook_configs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  secret      TEXT NOT NULL,
  events      TEXT[] DEFAULT '{}',
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_business ON webhook_configs(business_id);

-- ─── users: avatar support ───────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
