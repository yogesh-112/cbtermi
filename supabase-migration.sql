-- ============================================================
-- Clear Build USA — Full Supabase Migration
-- Run this in the Supabase SQL Editor (safe to re-run: uses
-- IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout)
-- ============================================================

-- ─────────────────────────────────────────
-- 1. Alter existing tables (add missing columns)
-- ─────────────────────────────────────────

-- contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_type TEXT DEFAULT 'lead';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'New Lead';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS about TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS quote_prefix TEXT DEFAULT 'Q-';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV-';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS project_prefix TEXT DEFAULT 'PRJ-';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_reversed BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'payment';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reversal_of_payment_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id);

-- communication_logs
ALTER TABLE communication_logs ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
ALTER TABLE communication_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE communication_logs ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'outbound';
ALTER TABLE communication_logs ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES users(id);
ALTER TABLE communication_logs ADD COLUMN IF NOT EXISTS subject TEXT;

-- projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_manager TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC(12,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deposit_pct NUMERIC(5,2) DEFAULT 30;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS milestones TEXT DEFAULT 'None';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS share_with_customer BOOLEAN DEFAULT TRUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─────────────────────────────────────────
-- 2. New tables
-- ─────────────────────────────────────────

-- audit_events
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- scheduling_slots
CREATE TABLE IF NOT EXISTS scheduling_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  slot_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  purpose TEXT,
  meeting_type TEXT DEFAULT 'Consultation',
  location TEXT,
  notes TEXT,
  time_zone TEXT DEFAULT 'America/New_York',
  repeat_option TEXT DEFAULT 'none',
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- booking_links
CREATE TABLE IF NOT EXISTS booking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  purpose TEXT,
  contact_id UUID REFERENCES contacts(id),
  expiry_date DATE,
  internal_notes TEXT,
  message_to_recipient TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- booking_link_slots
CREATE TABLE IF NOT EXISTS booking_link_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_link_id UUID NOT NULL REFERENCES booking_links(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES scheduling_slots(id) ON DELETE CASCADE,
  UNIQUE(booking_link_id, slot_id)
);

-- scheduled_meetings
CREATE TABLE IF NOT EXISTS scheduled_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  booking_link_id UUID REFERENCES booking_links(id),
  slot_id UUID REFERENCES scheduling_slots(id),
  contact_id UUID REFERENCES contacts(id),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- templates (reusable content templates)
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- notification_templates (email/sms templates stored in settings)
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  name TEXT,
  type TEXT,
  channel TEXT DEFAULT 'email',
  subject TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  priority TEXT DEFAULT 'medium',
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- support_ticket_messages
CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- change_orders
CREATE TABLE IF NOT EXISTS change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  project_id UUID REFERENCES projects(id),
  co_number TEXT,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft',
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- change_order_items
CREATE TABLE IF NOT EXISTS change_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
  category TEXT,
  item_name TEXT,
  description TEXT,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit TEXT,
  unit_price NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  discount NUMERIC(5,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_tour_status
CREATE TABLE IF NOT EXISTS user_tour_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started',
  completed_steps INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

-- help_faqs
CREATE TABLE IF NOT EXISTS help_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- help_common_issues
CREATE TABLE IF NOT EXISTS help_common_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  solution TEXT,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- item_requirement_lists
CREATE TABLE IF NOT EXISTS item_requirement_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  contact_id UUID REFERENCES contacts(id),
  name TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- item_requirements
CREATE TABLE IF NOT EXISTS item_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES item_requirement_lists(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit TEXT,
  unit_cost NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'needed',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- project_updates
CREATE TABLE IF NOT EXISTS project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  contact_id UUID REFERENCES contacts(id),
  title TEXT,
  message TEXT,
  type TEXT DEFAULT 'update',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 3. Seed system FAQs (optional — delete if you have your own)
-- ─────────────────────────────────────────
INSERT INTO help_faqs (category, question, answer, sort_order) VALUES
  ('Getting Started', 'How do I add a contact?', 'Go to Contacts → click "Add Contact". Fill in the name, email, and phone. The contact will be added as a Lead by default.', 1),
  ('Getting Started', 'How do I create a quote?', 'Go to Quotes → click "New Quote". Select a customer, add line items, and click "Save & Send" to email the quote to your customer.', 2),
  ('Getting Started', 'How do I create an invoice?', 'Go to Invoices → click "New Invoice". Select a customer, add line items, and click "Review & Send".', 3),
  ('Payments', 'How do I record a payment?', 'Go to Payments → click "Record Payment". Select the invoice, enter the amount and payment method, then save.', 4),
  ('Payments', 'How do I reverse a payment?', 'Go to Payments, find the payment, and click the reverse icon. Only owners and admins can reverse payments.', 5),
  ('Team', 'How do I invite a team member?', 'Go to Team → click "Invite Member". Enter their email and select a role. They will receive an email invite.', 6),
  ('Settings', 'How do I change my business logo?', 'Go to Settings → Business Profile → click the logo area to upload a new image.', 7),
  ('Settings', 'How do I set my tax rate?', 'Go to Settings → Tax & Numbering. Set your default tax rate and it will be applied to new quotes and invoices.', 8)
ON CONFLICT DO NOTHING;
