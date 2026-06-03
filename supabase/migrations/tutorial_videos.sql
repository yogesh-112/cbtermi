-- Tutorial videos (admin-managed, replaces hardcoded array in Help page)
create table if not exists tutorial_videos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  topic       text not null,
  duration    text,
  youtube_id  text not null default '',
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Seed default tutorial stubs (youtube_id is empty — admin fills in real IDs)
insert into tutorial_videos (title, topic, duration, youtube_id, sort_order) values
  ('Getting Started with Clear Build',    'Onboarding', '3:45', '', 1),
  ('Creating and Sending Quotes',         'Quotes',     '5:20', '', 2),
  ('Managing Projects and Milestones',    'Projects',   '4:10', '', 3),
  ('Recording Payments and Invoices',     'Billing',    '3:55', '', 4),
  ('Using the Scheduling Module',         'Scheduling', '4:30', '', 5),
  ('Tracking Expenses on Projects',       'Expenses',   '2:50', '', 6)
on conflict do nothing;
