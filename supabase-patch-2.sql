-- ============================================================
-- Clear Build USA — Patch 2: Fix pre-existing tables missing columns
-- Run in Supabase SQL Editor after supabase-migration.sql
-- ============================================================

-- change_order_items (table existed but lacked these columns)
ALTER TABLE change_order_items ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE change_order_items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE change_order_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE change_order_items ADD COLUMN IF NOT EXISTS quantity NUMERIC(10,2) DEFAULT 1;
ALTER TABLE change_order_items ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE change_order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE change_order_items ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE change_order_items ADD COLUMN IF NOT EXISTS discount NUMERIC(5,2) DEFAULT 0;
ALTER TABLE change_order_items ADD COLUMN IF NOT EXISTS total NUMERIC(12,2) DEFAULT 0;
ALTER TABLE change_order_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- project_updates (table existed but lacked these columns)
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'update';
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id);
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- item_requirement_lists (table existed but lacked these columns)
ALTER TABLE item_requirement_lists ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE item_requirement_lists ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE item_requirement_lists ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE item_requirement_lists ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
ALTER TABLE item_requirement_lists ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id);
ALTER TABLE item_requirement_lists ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- item_requirements (table existed but lacked these columns)
ALTER TABLE item_requirements ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE item_requirements ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE item_requirements ADD COLUMN IF NOT EXISTS quantity NUMERIC(10,2) DEFAULT 1;
ALTER TABLE item_requirements ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE item_requirements ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12,2) DEFAULT 0;
ALTER TABLE item_requirements ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'needed';
ALTER TABLE item_requirements ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
