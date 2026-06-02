-- Notification automation rules
create table if not exists notification_rules (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  rule_type     text not null check (rule_type in (
    'quote_sent', 'quote_approved', 'quote_rejected',
    'change_order_approved',
    'invoice_created', 'invoice_overdue', 'invoice_due_soon',
    'payment_received',
    'new_lead'
  )),
  is_enabled    boolean not null default false,
  channel       text not null default 'email' check (channel in ('email','sms','whatsapp')),
  delay_days    int not null default 0,
  custom_subject text,
  custom_message text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(business_id, rule_type)
);

create index if not exists notification_rules_business_id_idx on notification_rules(business_id);

-- Logs every notification sent by the rule engine
create table if not exists notification_rule_logs (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  rule_type     text not null,
  contact_id    uuid references contacts(id) on delete set null,
  entity_type   text,
  entity_id     uuid,
  channel       text,
  status        text not null default 'sent' check (status in ('sent','failed','skipped')),
  error_message text,
  sent_at       timestamptz not null default now()
);

create index if not exists notification_rule_logs_business_id_idx on notification_rule_logs(business_id);
create index if not exists notification_rule_logs_sent_at_idx     on notification_rule_logs(sent_at);
