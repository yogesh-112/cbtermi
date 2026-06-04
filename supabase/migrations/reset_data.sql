-- ============================================================
-- Clear Build USA — Database Reset (v4)
-- ============================================================

-- Step 1: Save what we want to keep
CREATE TEMP TABLE _keep_templates              AS SELECT * FROM templates;
CREATE TEMP TABLE _keep_notification_templates AS SELECT * FROM notification_templates;
CREATE TEMP TABLE _keep_help_faqs             AS SELECT * FROM help_faqs;
CREATE TEMP TABLE _keep_super_admins          AS SELECT * FROM super_admins;
CREATE TEMP TABLE _keep_plans                 AS SELECT * FROM plans;
CREATE TEMP TABLE _keep_admin_settings        AS SELECT * FROM admin_settings;

-- Step 2: Truncate everything in one statement
TRUNCATE TABLE
  payments,
  invoice_items,
  invoices,
  quote_items,
  quote_versions,
  approvals,
  change_order_items,
  change_orders,
  quotes,
  expenses,
  opportunities,
  project_tasks,
  project_members,
  project_updates,
  projects,
  item_requirements,
  item_requirement_lists,
  contacts,
  feedback,
  team_invitations,
  communication_logs,
  notification_rules,
  notification_rule_logs,
  scheduled_meetings,
  booking_link_slots,
  booking_links,
  scheduling_slots,
  support_ticket_messages,
  support_tickets,
  tutorial_videos,
  coupon_codes,
  audit_events,
  user_tour_status,
  webhook_configs,
  business_members,
  subscriptions,
  templates,
  notification_templates,
  help_faqs,
  admin_sessions,
  super_admins,
  plans,
  admin_settings,
  users,
  businesses
RESTART IDENTITY;

-- Step 3: Restore
INSERT INTO help_faqs      SELECT * FROM _keep_help_faqs;
INSERT INTO super_admins   SELECT * FROM _keep_super_admins;
INSERT INTO plans          SELECT * FROM _keep_plans;
INSERT INTO admin_settings SELECT * FROM _keep_admin_settings;

INSERT INTO templates (id, business_id, type, name, subject, body, variables, is_system, is_active, created_by, created_at, updated_at)
  SELECT id, NULL, type, name, subject, body, variables, is_system, is_active, NULL, created_at, updated_at
  FROM _keep_templates;

INSERT INTO notification_templates (id, business_id, name, channel, subject, message, created_by, created_at, updated_at, language)
  SELECT id, NULL, name, channel, subject, message, NULL, created_at, updated_at, language
  FROM _keep_notification_templates;

-- Step 4: Verify
SELECT 'templates'             AS table_name, COUNT(*) AS rows FROM templates
UNION ALL SELECT 'notification_templates',   COUNT(*) FROM notification_templates
UNION ALL SELECT 'help_faqs',               COUNT(*) FROM help_faqs
UNION ALL SELECT 'super_admins',            COUNT(*) FROM super_admins
UNION ALL SELECT 'users',                   COUNT(*) FROM users
UNION ALL SELECT 'businesses',              COUNT(*) FROM businesses
UNION ALL SELECT 'contacts',               COUNT(*) FROM contacts;
