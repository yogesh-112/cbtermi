ALTER TABLE feedback ADD COLUMN IF NOT EXISTS token varchar(64);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'received';
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS responded_at timestamptz;
