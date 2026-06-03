-- Formal approval records (G3)
create table if not exists approvals (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  object_type       text not null check (object_type in ('quote','change_order')),
  object_id         uuid not null,
  approver_name     text,
  approver_email    text,
  total_at_approval numeric(10,2),
  approved_at       timestamptz not null default now(),
  ip_address        text
);
create index if not exists approvals_object_id_idx    on approvals(object_id);
create index if not exists approvals_business_id_idx  on approvals(business_id);

-- Coupon codes (G8)
create table if not exists coupon_codes (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  description      text,
  discount_percent int check (discount_percent between 1 and 100),
  max_uses         int,
  uses_count       int not null default 0,
  expires_at       timestamptz,
  is_active        boolean not null default true,
  stripe_coupon_id text,
  created_by       uuid,
  created_at       timestamptz not null default now()
);

-- Calendly URL on businesses (G12)
alter table businesses add column if not exists calendly_url text;
