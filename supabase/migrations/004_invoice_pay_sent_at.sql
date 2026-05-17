-- Migration 004: Invoice pay + quote sent_at tracking
-- Run in Supabase SQL editor

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pay_url           TEXT;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
