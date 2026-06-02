-- Quote versions table — stores snapshots of quotes each time items are changed
create table if not exists quote_versions (
  id              uuid primary key default gen_random_uuid(),
  quote_id        uuid not null references quotes(id) on delete cascade,
  business_id     uuid not null references businesses(id) on delete cascade,
  version_number  int not null,
  status          text,
  subtotal        numeric(10,2),
  tax_amount      numeric(10,2),
  total           numeric(10,2),
  items_snapshot  jsonb,
  note            text,
  created_by      uuid references users(id),
  created_at      timestamptz not null default now()
);

create index if not exists quote_versions_quote_id_idx on quote_versions(quote_id);
create index if not exists quote_versions_business_id_idx on quote_versions(business_id);
