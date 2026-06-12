-- Persist the quote form's "Project type" and "Project address" inputs.
-- Applied to production 2026-06-12 (was silently discarded before).
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS project_type    TEXT,
  ADD COLUMN IF NOT EXISTS project_address TEXT;
