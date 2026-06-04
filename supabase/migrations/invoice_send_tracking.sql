-- Invoice send tracking columns
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS email_opened_at timestamptz;
