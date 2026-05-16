-- Clear Build USA — Full Schema
-- Run this in the Supabase SQL Editor.
-- If you already have a "User" table from earlier setup, drop it first:
-- DROP TABLE IF EXISTS "User" CASCADE;

-- ─── USERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name                     TEXT NOT NULL,
  email                         TEXT UNIQUE NOT NULL,
  password                      TEXT NOT NULL,
  email_verified                BOOLEAN DEFAULT FALSE,
  email_verification_token      TEXT,
  email_verification_expires_at TIMESTAMPTZ,
  password_reset_token          TEXT,
  password_reset_expires_at     TIMESTAMPTZ,
  preferred_language            TEXT DEFAULT 'en',
  last_business_id              UUID,
  created_at                    TIMESTAMPTZ DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BUSINESSES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  legal_name       TEXT,
  email            TEXT,
  phone            TEXT,
  logo_url         TEXT,
  business_type    TEXT,
  service_area     TEXT,
  address          TEXT,
  city             TEXT,
  state            TEXT,
  zip              TEXT,
  country          TEXT DEFAULT 'US',
  default_tax_rate DECIMAL(5,2) DEFAULT 0,
  payment_terms    TEXT DEFAULT 'Net 30',
  quote_prefix     TEXT DEFAULT 'Q-',
  invoice_prefix   TEXT DEFAULT 'INV-',
  project_prefix   TEXT DEFAULT 'PRJ-',
  currency         TEXT DEFAULT 'USD',
  timezone         TEXT DEFAULT 'America/New_York',
  date_format      TEXT DEFAULT 'MM/DD/YYYY',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BUSINESS MEMBERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'staff',
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- ─── TEAM INVITATIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT DEFAULT 'staff',
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by  UUID REFERENCES users(id),
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CONTACTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID REFERENCES businesses(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  business_name  TEXT,
  email          TEXT,
  phone          TEXT,
  whatsapp       TEXT,
  address        TEXT,
  city           TEXT,
  state          TEXT,
  zip            TEXT,
  contact_type   TEXT DEFAULT 'lead',
  lead_status    TEXT DEFAULT 'New Lead',
  source         TEXT,
  notes          TEXT,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROJECTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id     UUID REFERENCES contacts(id),
  name           TEXT NOT NULL,
  project_number TEXT,
  project_type   TEXT,
  address        TEXT,
  start_date     DATE,
  end_date       DATE,
  status         TEXT DEFAULT 'active',
  description    TEXT,
  budget         DECIMAL(12,2),
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── QUOTES ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id),
  project_id      UUID REFERENCES projects(id),
  quote_number    TEXT NOT NULL,
  title           TEXT,
  issue_date      DATE DEFAULT CURRENT_DATE,
  valid_until     DATE,
  status          TEXT DEFAULT 'draft',
  subtotal        DECIMAL(12,2) DEFAULT 0,
  tax_amount      DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total           DECIMAL(12,2) DEFAULT 0,
  notes           TEXT,
  terms           TEXT,
  approved_by     TEXT,
  approved_at     TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    UUID REFERENCES quotes(id) ON DELETE CASCADE,
  item_name   TEXT NOT NULL,
  description TEXT,
  quantity    DECIMAL(10,2) DEFAULT 1,
  unit        TEXT,
  unit_price  DECIMAL(12,2) DEFAULT 0,
  tax_rate    DECIMAL(5,2) DEFAULT 0,
  discount    DECIMAL(5,2) DEFAULT 0,
  total       DECIMAL(12,2) DEFAULT 0,
  sort_order  INTEGER DEFAULT 0
);

-- ─── INVOICES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id),
  project_id      UUID REFERENCES projects(id),
  invoice_number  TEXT NOT NULL,
  issue_date      DATE DEFAULT CURRENT_DATE,
  due_date        DATE,
  payment_terms   TEXT,
  status          TEXT DEFAULT 'draft',
  subtotal        DECIMAL(12,2) DEFAULT 0,
  tax_amount      DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total           DECIMAL(12,2) DEFAULT 0,
  amount_paid     DECIMAL(12,2) DEFAULT 0,
  amount_due      DECIMAL(12,2) DEFAULT 0,
  notes           TEXT,
  terms           TEXT,
  is_sent         BOOLEAN DEFAULT FALSE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID REFERENCES invoices(id) ON DELETE CASCADE,
  item_name   TEXT NOT NULL,
  description TEXT,
  quantity    DECIMAL(10,2) DEFAULT 1,
  unit        TEXT,
  unit_price  DECIMAL(12,2) DEFAULT 0,
  tax_rate    DECIMAL(5,2) DEFAULT 0,
  discount    DECIMAL(5,2) DEFAULT 0,
  total       DECIMAL(12,2) DEFAULT 0,
  sort_order  INTEGER DEFAULT 0
);

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id       UUID REFERENCES contacts(id),
  invoice_id       UUID REFERENCES invoices(id),
  project_id       UUID REFERENCES projects(id),
  amount           DECIMAL(12,2) NOT NULL,
  payment_date     DATE DEFAULT CURRENT_DATE,
  payment_method   TEXT DEFAULT 'cash',
  reference_number TEXT,
  notes            TEXT,
  is_reversed      BOOLEAN DEFAULT FALSE,
  reversed_at      TIMESTAMPTZ,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ITEM REQUIREMENT LISTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS item_requirement_lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id),
  contact_id  UUID REFERENCES contacts(id),
  title       TEXT NOT NULL,
  notes       TEXT,
  status      TEXT DEFAULT 'draft',
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_requirements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     UUID REFERENCES item_requirement_lists(id) ON DELETE CASCADE,
  item_name   TEXT NOT NULL,
  description TEXT,
  quantity    DECIMAL(10,2) DEFAULT 1,
  required_by DATE,
  notes       TEXT,
  sort_order  INTEGER DEFAULT 0
);

-- ─── PROJECT UPDATES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_updates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID REFERENCES businesses(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id),
  contact_id       UUID REFERENCES contacts(id),
  update_type      TEXT DEFAULT 'progress',
  message          TEXT NOT NULL,
  is_client_visible BOOLEAN DEFAULT TRUE,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FEEDBACK ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id),
  contact_id  UUID REFERENCES contacts(id),
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  category    TEXT DEFAULT 'general',
  message     TEXT,
  is_public   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTIFICATION TEMPLATES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  channel     TEXT DEFAULT 'email',
  subject     TEXT,
  message     TEXT NOT NULL,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COMMUNICATION LOGS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS communication_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id  UUID REFERENCES contacts(id),
  project_id  UUID REFERENCES projects(id),
  type        TEXT,
  channel     TEXT,
  subject     TEXT,
  message     TEXT,
  sent_by     UUID REFERENCES users(id),
  status      TEXT DEFAULT 'sent',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id            UUID REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
  plan                   TEXT DEFAULT 'trial',
  status                 TEXT DEFAULT 'trial',
  trial_ends_at          TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  renews_at              TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_customer_id     TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TEAM INVITATIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT DEFAULT 'staff',
  token       TEXT UNIQUE NOT NULL,
  invited_by  UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ACTIVITY LOG ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),
  entity_type TEXT,
  entity_id   UUID,
  action      TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
