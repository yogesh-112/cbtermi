/**
 * Clear Build USA — Full Database Backup
 * Usage: node scripts/backup-db.mjs
 *
 * Reads every table via the service role key (bypasses RLS),
 * handles pagination, and writes a timestamped JSON file to backups/.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

/* ── Load .env manually (no dotenv dependency needed) ─────────────── */
const envPath = resolve(root, ".env");
const env = {};
try {
  readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const m = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*"?(.+?)"?\s*$/);
      if (m) env[m[1]] = m[2];
    });
} catch {
  console.error("Could not read .env — make sure it exists at project root.");
  process.exit(1);
}

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* ── All tables to back up ─────────────────────────────────────────── */
const TABLES = [
  // core
  "businesses",
  "users",
  "business_members",
  "subscriptions",
  "plans",
  "super_admins",
  "admin_settings",
  // crm
  "contacts",
  "opportunities",
  "team_invitations",
  "feedback",
  // quotes / invoices / payments
  "quotes",
  "quote_items",
  "quote_versions",
  "invoices",
  "invoice_items",
  "payments",
  "approvals",
  // change orders
  "change_orders",
  "change_order_items",
  // projects
  "projects",
  "project_tasks",
  "project_members",
  "project_updates",
  "item_requirement_lists",
  "item_requirements",
  "expenses",
  // communications & notifications
  "templates",
  "notification_templates",
  "communication_logs",
  "notification_rules",
  "notification_rule_logs",
  // scheduling
  "scheduling_slots",
  "booking_links",
  "booking_link_slots",
  "scheduled_meetings",
  // support / help
  "help_faqs",
  "support_tickets",
  "support_ticket_messages",
  "tutorial_videos",
  // system
  "coupon_codes",
  "audit_events",
  "user_tour_status",
  "webhook_configs",
];

/* ── Paginated fetch — reads ALL rows regardless of table size ─────── */
async function fetchAll(table) {
  const PAGE = 1000;
  let rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE - 1);
    if (error) {
      console.warn(`  ⚠  ${table}: ${error.message}`);
      return { rows: [], skipped: true };
    }
    if (!data || data.length === 0) break;
    rows = rows.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return { rows, skipped: false };
}

/* ── Main ──────────────────────────────────────────────────────────── */
async function main() {
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);

  const backupDir = resolve(root, "backups");
  mkdirSync(backupDir, { recursive: true });
  const outFile = resolve(backupDir, `backup-${stamp}.json`);

  console.log(`\nClear Build USA — Database Backup`);
  console.log(`Target: ${SUPABASE_URL}`);
  console.log(`Output: backups/backup-${stamp}.json\n`);

  const backup = {
    created_at: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    tables: {},
    summary: {},
  };

  let totalRows = 0;
  let skippedTables = [];

  for (const table of TABLES) {
    process.stdout.write(`  Backing up ${table.padEnd(30)}`);
    const { rows, skipped } = await fetchAll(table);
    if (skipped) {
      skippedTables.push(table);
      console.log(`SKIPPED (table may not exist)`);
    } else {
      backup.tables[table] = rows;
      backup.summary[table] = rows.length;
      totalRows += rows.length;
      console.log(`${rows.length} rows`);
    }
  }

  writeFileSync(outFile, JSON.stringify(backup, null, 2), "utf8");

  console.log(`\n✓  Backup complete`);
  console.log(`   Total rows : ${totalRows}`);
  console.log(`   File size  : ${(readFileSync(outFile).length / 1024).toFixed(1)} KB`);
  console.log(`   Saved to   : backups/backup-${stamp}.json`);
  if (skippedTables.length) {
    console.log(`\n   Skipped tables (don't exist yet): ${skippedTables.join(", ")}`);
  }
  console.log();
}

main().catch((e) => {
  console.error("Backup failed:", e.message);
  process.exit(1);
});
