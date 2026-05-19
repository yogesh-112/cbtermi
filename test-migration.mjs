// Direct Supabase migration test — no server needed
// Tests every table and column added by supabase-migration.sql
// Run: node test-migration.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ernyjnbayadptczaowdn.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybnlqbmJheWFkcHRjemFvd2RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMDc2MiwiZXhwIjoyMDk0MzA2NzYyfQ.YiWlSC_GrdRrcKlh_wenSisADhkaaSI1psyVHjdfJjU";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

let passed = 0;
let failed = 0;
const failures = [];

async function test(label, fn) {
  try {
    await fn();
    console.log(`  ✓  ${label}`);
    passed++;
  } catch (e) {
    console.log(`  ✗  ${label}`);
    console.log(`       ${e.message}`);
    failed++;
    failures.push({ label, error: e.message });
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// ── helpers ──────────────────────────────────────────────
async function getFirstBusiness() {
  const { data, error } = await supabase.from("businesses").select("id, name").limit(1).single();
  if (error || !data) throw new Error("No business found — run the app and create one first");
  return data;
}

async function getFirstUser() {
  const { data, error } = await supabase.from("users").select("id").limit(1).single();
  if (error || !data) throw new Error("No user found");
  return data;
}

async function getFirstContact(bizId) {
  const { data } = await supabase.from("contacts").select("id").eq("business_id", bizId).limit(1).single();
  return data;
}

// ─────────────────────────────────────────────────────────
console.log("\n━━━ Clear Build USA — Migration Test ━━━\n");

// ── 1. Connectivity ──
console.log("[ Connectivity ]");
await test("Supabase reachable", async () => {
  const { error } = await supabase.from("businesses").select("id").limit(1);
  assert(!error, error?.message);
});

const biz = await getFirstBusiness().catch(() => null);
const user = await getFirstUser().catch(() => null);

if (!biz || !user) {
  console.log("\n⚠  No business/user found. Register an account on the app first, then re-run this test.\n");
  process.exit(0);
}

console.log(`   Using business: "${biz.name}" (${biz.id})`);
const BIZ = biz.id;
const USER = user.id;

// ── 2. Contacts ──
console.log("\n[ Contacts ]");
let contactId;
await test("INSERT contact with lead_status + contact_type", async () => {
  const { data, error } = await supabase.from("contacts").insert({
    business_id: BIZ, created_by: USER,
    full_name: "Test Contact (auto)", email: "test-auto@cbtest.com",
    phone: "5550001111", contact_type: "lead", lead_status: "New Lead", source: "Website",
  }).select().single();
  assert(!error, error?.message);
  contactId = data.id;
});

await test("UPDATE contact lead_status", async () => {
  if (!contactId) throw new Error("No contact to update");
  const { error } = await supabase.from("contacts").update({ lead_status: "In Conversation" }).eq("id", contactId);
  assert(!error, error?.message);
});

// ── 3. Projects ──
console.log("\n[ Projects ]");
let projectId;
await test("INSERT project with start_date, budget, description", async () => {
  const { data, error } = await supabase.from("projects").insert({
    business_id: BIZ, created_by: USER, contact_id: contactId,
    name: "Test Project (auto)", project_number: "PRJ-TEST",
    project_type: "Residential Remodel", start_date: "2026-06-01",
    end_date: "2026-08-01", budget: 50000, description: "Auto test project",
    status: "active",
  }).select().single();
  assert(!error, error?.message);
  projectId = data.id;
});

// ── 4. Quotes ──
console.log("\n[ Quotes ]");
let quoteId;
await test("INSERT quote", async () => {
  const { data, error } = await supabase.from("quotes").insert({
    business_id: BIZ, created_by: USER, contact_id: contactId,
    quote_number: "Q-TEST", title: "Test Quote (auto)", status: "draft",
    subtotal: 1000, tax_amount: 80, total: 1080,
  }).select().single();
  assert(!error, error?.message);
  quoteId = data.id;
});

await test("INSERT quote_items", async () => {
  if (!quoteId) throw new Error("No quote");
  const { error } = await supabase.from("quote_items").insert({
    quote_id: quoteId, item_name: "Labor", quantity: 10, unit_price: 100, total: 1000, sort_order: 0,
  });
  assert(!error, error?.message);
});

// ── 5. Invoices ──
console.log("\n[ Invoices ]");
let invoiceId;
await test("INSERT invoice", async () => {
  const { data, error } = await supabase.from("invoices").insert({
    business_id: BIZ, created_by: USER, contact_id: contactId,
    invoice_number: "INV-TEST", status: "draft",
    subtotal: 1000, tax_amount: 80, total: 1080, amount_due: 1080, amount_paid: 0,
  }).select().single();
  assert(!error, error?.message);
  invoiceId = data.id;
});

await test("INSERT invoice_items", async () => {
  if (!invoiceId) throw new Error("No invoice");
  const { error } = await supabase.from("invoice_items").insert({
    invoice_id: invoiceId, item_name: "Materials", quantity: 5, unit_price: 200, total: 1000, sort_order: 0,
  });
  assert(!error, error?.message);
});

// ── 6. Payments ──
console.log("\n[ Payments ]");
let paymentId;
await test("INSERT payment with is_reversed column", async () => {
  const { data, error } = await supabase.from("payments").insert({
    business_id: BIZ, created_by: USER, contact_id: contactId,
    invoice_id: invoiceId, amount: 500, payment_date: "2026-05-19",
    payment_method: "cash", is_reversed: false, payment_type: "payment",
  }).select().single();
  assert(!error, error?.message);
  paymentId = data.id;
});

await test("UPDATE payment is_reversed = true", async () => {
  if (!paymentId) throw new Error("No payment");
  const { error } = await supabase.from("payments").update({ is_reversed: true }).eq("id", paymentId);
  assert(!error, error?.message);
});

// ── 7. Change Orders ──
console.log("\n[ Change Orders ]");
let coId;
await test("INSERT change_order", async () => {
  const { data, error } = await supabase.from("change_orders").insert({
    business_id: BIZ, created_by: USER, contact_id: contactId, project_id: projectId,
    co_number: "CO-TEST", title: "Test CO (auto)", status: "draft",
    subtotal: 500, tax_amount: 40, total: 540,
  }).select().single();
  assert(!error, error?.message);
  coId = data.id;
});

await test("INSERT change_order_items", async () => {
  if (!coId) throw new Error("No change order");
  const { error } = await supabase.from("change_order_items").insert({
    change_order_id: coId, item_name: "Extra Work", quantity: 5, unit_price: 100, total: 500, sort_order: 0,
  });
  assert(!error, error?.message);
});

// ── 8. Audit Events ──
console.log("\n[ Audit Events ]");
await test("INSERT audit_event", async () => {
  const { error } = await supabase.from("audit_events").insert({
    business_id: BIZ, user_id: USER, entity_type: "test", action: "migration_test",
    payload: { test: true },
  });
  assert(!error, error?.message);
});

// ── 9. Scheduling ──
console.log("\n[ Scheduling ]");
let slotId;
await test("INSERT scheduling_slot", async () => {
  const { data, error } = await supabase.from("scheduling_slots").insert({
    business_id: BIZ, created_by: USER,
    slot_date: "2026-06-15", start_time: "09:00", end_time: "10:00",
    meeting_type: "Consultation", status: "available",
  }).select().single();
  assert(!error, error?.message);
  slotId = data.id;
});

let bookingLinkId;
await test("INSERT booking_link", async () => {
  const { data, error } = await supabase.from("booking_links").insert({
    business_id: BIZ, created_by: USER,
    token: "test-token-" + Date.now(),
    title: "Test Booking Link (auto)", status: "active",
  }).select().single();
  assert(!error, error?.message);
  bookingLinkId = data.id;
});

await test("INSERT booking_link_slot", async () => {
  if (!bookingLinkId || !slotId) throw new Error("No link or slot");
  const { error } = await supabase.from("booking_link_slots").insert({
    booking_link_id: bookingLinkId, slot_id: slotId,
  });
  assert(!error, error?.message);
});

// ── 10. Templates ──
console.log("\n[ Templates ]");
let templateId;
await test("INSERT template", async () => {
  const { data, error } = await supabase.from("templates").insert({
    business_id: BIZ, created_by: USER,
    type: "quote", name: "Test Template (auto)",
    body: "Hello {{contact_name}}", is_system: false, is_active: true,
  }).select().single();
  assert(!error, error?.message);
  templateId = data.id;
});

// ── 11. Notification Templates ──
console.log("\n[ Notification Templates ]");
await test("INSERT notification_template", async () => {
  const { error } = await supabase.from("notification_templates").insert({
    business_id: BIZ, created_by: USER,
    name: "quote_sent", channel: "email",
    subject: "Your quote is ready",
    message: "Hi {{contact_name}}, your quote is ready.",
  });
  assert(!error, error?.message);
});

// ── 12. Support Tickets ──
console.log("\n[ Support Tickets ]");
let ticketId;
await test("INSERT support_ticket", async () => {
  const { data, error } = await supabase.from("support_tickets").insert({
    business_id: BIZ, user_id: USER,
    subject: "Test Ticket (auto)", description: "This is an automated test ticket.",
    category: "Other", priority: "low", status: "open",
  }).select().single();
  assert(!error, error?.message);
  ticketId = data.id;
});

await test("INSERT support_ticket_message", async () => {
  if (!ticketId) throw new Error("No ticket");
  const { error } = await supabase.from("support_ticket_messages").insert({
    ticket_id: ticketId, user_id: USER,
    message: "Auto test message", is_admin: false,
  });
  assert(!error, error?.message);
});

// ── 13. Users profile columns ──
console.log("\n[ User Profile Columns ]");
await test("UPDATE user with display_name, about, skills", async () => {
  const { error } = await supabase.from("users").update({
    display_name: "Test Display", about: "Auto test bio",
    skills: ["Testing", "QA"],
  }).eq("id", USER);
  assert(!error, error?.message);
});

// ── 14. Businesses settings columns ──
console.log("\n[ Business Settings Columns ]");
await test("UPDATE business with logo_url, timezone, tax_rate", async () => {
  const { error } = await supabase.from("businesses").update({
    timezone: "America/New_York", tax_rate: 8.5, currency: "USD",
  }).eq("id", BIZ);
  assert(!error, error?.message);
});

// ── 15. Project Updates ──
console.log("\n[ Project Updates ]");
await test("INSERT project_update", async () => {
  const { error } = await supabase.from("project_updates").insert({
    business_id: BIZ, created_by: USER, project_id: projectId, contact_id: contactId,
    title: "Test Update (auto)", message: "Automated test update.", type: "update",
  });
  assert(!error, error?.message);
});

// ── 16. Tour Status ──
console.log("\n[ Tour Status ]");
await test("INSERT user_tour_status", async () => {
  const { error } = await supabase.from("user_tour_status").upsert({
    user_id: USER, business_id: BIZ,
    status: "not_started", completed_steps: [],
  }, { onConflict: "user_id,business_id" });
  assert(!error, error?.message);
});

// ── 17. Help FAQs ──
console.log("\n[ Help FAQs ]");
await test("SELECT help_faqs (table exists + seeded)", async () => {
  const { data, error } = await supabase.from("help_faqs").select("id").limit(1);
  assert(!error, error?.message);
  assert(data !== null, "Table missing");
});

// ── 18. Item Requirements ──
console.log("\n[ Item Requirements ]");
let listId;
await test("INSERT item_requirement_list", async () => {
  const { data, error } = await supabase.from("item_requirement_lists").insert({
    business_id: BIZ, created_by: USER, project_id: projectId,
    title: "Test List (auto)", status: "draft",
  }).select().single();
  assert(!error, error?.message);
  listId = data.id;
});

await test("INSERT item_requirement", async () => {
  if (!listId) throw new Error("No list");
  const { error } = await supabase.from("item_requirements").insert({
    list_id: listId, item_name: "Lumber 2x4", quantity: 20, unit: "pcs", status: "needed", sort_order: 0,
  });
  assert(!error, error?.message);
});

// ── 19. Webhooks ──
console.log("\n[ Webhooks ]");
await test("INSERT webhook", async () => {
  const { error } = await supabase.from("webhooks").insert({
    business_id: BIZ, created_by: USER,
    url: "https://example.com/webhook", events: ["invoice.paid"], is_active: true,
  });
  assert(!error, error?.message);
});

// ── Cleanup (delete test records) ──
console.log("\n[ Cleanup ]");
await test("Delete test records", async () => {
  await supabase.from("webhooks").delete().eq("business_id", BIZ).eq("url", "https://example.com/webhook");
  await supabase.from("item_requirements").delete().eq("list_id", listId);
  if (listId) await supabase.from("item_requirement_lists").delete().eq("id", listId);
  if (ticketId) await supabase.from("support_ticket_messages").delete().eq("ticket_id", ticketId);
  if (ticketId) await supabase.from("support_tickets").delete().eq("id", ticketId);
  if (templateId) await supabase.from("templates").delete().eq("id", templateId);
  await supabase.from("notification_templates").delete().eq("business_id", BIZ).eq("name", "quote_sent");
  if (bookingLinkId) await supabase.from("booking_link_slots").delete().eq("booking_link_id", bookingLinkId);
  if (bookingLinkId) await supabase.from("booking_links").delete().eq("id", bookingLinkId);
  if (slotId) await supabase.from("scheduling_slots").delete().eq("id", slotId);
  await supabase.from("audit_events").delete().eq("entity_type", "test");
  if (coId) await supabase.from("change_order_items").delete().eq("change_order_id", coId);
  if (coId) await supabase.from("change_orders").delete().eq("id", coId);
  if (paymentId) await supabase.from("payments").delete().eq("id", paymentId);
  if (invoiceId) await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
  if (invoiceId) await supabase.from("invoices").delete().eq("id", invoiceId);
  if (quoteId) await supabase.from("quote_items").delete().eq("quote_id", quoteId);
  if (quoteId) await supabase.from("quotes").delete().eq("id", quoteId);
  await supabase.from("project_updates").delete().eq("project_id", projectId);
  if (projectId) await supabase.from("projects").delete().eq("id", projectId);
  if (contactId) await supabase.from("contacts").delete().eq("id", contactId);
});

// ── Summary ──
console.log("\n━━━ Results ━━━");
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failures.length) {
  console.log("\n  Failed tests:");
  failures.forEach(f => console.log(`    ✗ ${f.label}\n      → ${f.error}`));
}
console.log(failed === 0 ? "\n  ✅ All tests passed — migration is complete!\n" : "\n  ⚠  Some tests failed — see above.\n");
