-- Expenses table
create table if not exists expenses (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  category     text not null,
  title        text not null,
  description  text,
  amount       numeric(10,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  receipt_url  text,
  status       text not null default 'recorded'
                 check (status in ('recorded', 'approved', 'voided')),
  created_by   uuid references users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists expenses_business_id_idx on expenses(business_id);
create index if not exists expenses_project_id_idx  on expenses(project_id);
