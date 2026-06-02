-- Opportunities table
create table if not exists opportunities (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references businesses(id) on delete cascade,
  contact_id          uuid references contacts(id) on delete set null,
  name                text not null,
  project_type        text,
  property_address    text,
  estimated_value     numeric(10,2),
  expected_start_date date,
  status              text not null default 'open'
                        check (status in ('open','qualified','quoted','won','lost')),
  priority            text not null default 'medium'
                        check (priority in ('low','medium','high')),
  notes               text,
  owner_user_id       uuid references users(id),
  created_by          uuid references users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists opportunities_business_id_idx on opportunities(business_id);
create index if not exists opportunities_contact_id_idx  on opportunities(contact_id);
create index if not exists opportunities_status_idx      on opportunities(status);

-- Add opportunity_id to quotes so quotes can be linked to an opportunity
alter table quotes
  add column if not exists opportunity_id uuid references opportunities(id) on delete set null;

create index if not exists quotes_opportunity_id_idx on quotes(opportunity_id);
