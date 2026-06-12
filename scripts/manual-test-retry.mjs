/**
 * Focused retry of the five flows that failed in manual-test.mjs due to
 * selector mismatches. Uses exact placeholders/labels from the source.
 */
import { chromium } from "playwright";
import { readFileSync } from "fs";

const BASE = "http://localhost:3000";
const envText = readFileSync(".env.test", "utf8");
const env = Object.fromEntries(
  envText.split("\n").filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
  })
);

const STAMP = Date.now().toString().slice(-6);
const TEST = `MT-TEST-${STAMP}`;
let pass = 0, fail = 0;
const ok = (l, d = "") => { pass++; console.log(`✅ ${l}${d ? " — " + d : ""}`); };
const bad = (l, d = "") => { fail++; console.log(`❌ ${l}${d ? " — " + d : ""}`); };
const cleanup = [];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
const page = await ctx.newPage();
page.on("pageerror", e => console.log("PAGEERROR:", e.message.slice(0, 120)));

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', env.TEST_EMAIL);
await page.fill('input[type="password"]', env.TEST_PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL(/dashboard/, { timeout: 20000 });

let contactId = null;

// 1. Contact via create modal (exact placeholders)
try {
  await page.goto(`${BASE}/contacts?new=1`, { waitUntil: "networkidle" });
  await page.waitForSelector('input[placeholder="John Doe"]', { timeout: 8000 });
  await page.fill('input[placeholder="John Doe"]', `${TEST} Lead`);
  await page.fill('input[placeholder="john@example.com"]', `mt${STAMP}@example.com`);
  await page.fill('input[placeholder="+1 (555) 000-0000"]', "+1 555 000 1234");
  // submit = last primary button in the modal footer
  await page.locator('.btn.btn-primary').last().click();
  await page.waitForTimeout(2500);
  const body = await page.textContent("body");
  if (body.includes(`${TEST} Lead`)) ok("Contact created via modal and listed");
  else bad("Contact created but not visible in list");
  const d = await page.evaluate(async () => (await fetch("/api/contacts?limit=5")).json());
  const c = (d.contacts ?? []).find(x => x.full_name?.startsWith(TEST));
  if (c) { contactId = c.id; cleanup.push(`/api/contacts/${c.id}`); }
} catch (e) { bad("Contact create", e.message.slice(0, 120)); }

// 2. Lead → customer conversion
try {
  await page.goto(`${BASE}/leads`, { waitUntil: "networkidle" });
  const row = page.locator(`tr:has-text("${TEST} Lead")`);
  if (await row.count()) {
    await row.locator('button:has-text("Convert")').click();
    await page.waitForTimeout(2000);
    await page.goto(`${BASE}/customers`, { waitUntil: "networkidle" });
    const cbody = await page.textContent("body");
    if (cbody.includes(`${TEST} Lead`)) ok("Lead converted → shows on Customers page");
    else bad("Convert clicked but contact not on Customers page");
  } else bad("New lead not visible on Leads page");
} catch (e) { bad("Lead conversion", e.message.slice(0, 120)); }

// 3. Quote draft (select contact, one line item, Save draft)
try {
  await page.goto(`${BASE}/quotes/new`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  if (contactId) await page.selectOption("select >> nth=0", contactId).catch(() => {});
  await page.locator("table input").first().fill(`${TEST} quote item`);
  const nums = page.locator('table input[type="number"]');
  await nums.nth(0).fill("2");
  await nums.nth(1).fill("100");
  await page.locator('button:has-text("Save draft")').first().click();
  await page.waitForTimeout(3000);
  if (/\/quotes\/[a-f0-9-]{8}/.test(page.url())) {
    ok("Quote draft saved → detail page", page.url().split("/").pop().slice(0, 8));
    cleanup.push(`/api/quotes/${page.url().match(/quotes\/([a-f0-9-]+)/)[1]}`);
  } else bad("Quote draft did not save", page.url());
} catch (e) { bad("Quote draft", e.message.slice(0, 120)); }

// 4. Invoice draft (grid layout, "Save as Draft")
try {
  await page.goto(`${BASE}/invoices/new`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  if (contactId) await page.selectOption("select >> nth=0", contactId).catch(() => {});
  // first line-item text input below the items header
  const ti = page.locator('input[placeholder*="Item" i], input[placeholder*="Description" i]').first();
  if (await ti.isVisible().catch(() => false)) await ti.fill(`${TEST} inv item`);
  else await page.locator('.card input:not([type="date"]):not([type="number"]):not([type="checkbox"])').nth(0).fill(`${TEST} inv item`);
  const nums = page.locator('input[type="number"]');
  await nums.nth(0).fill("1");
  await nums.nth(1).fill("150");
  await page.locator('button:has-text("Save as Draft")').click();
  await page.waitForTimeout(3000);
  if (/\/invoices\/[a-f0-9-]{8}/.test(page.url())) {
    ok("Invoice draft saved → detail page");
    cleanup.push(`/api/invoices/${page.url().match(/invoices\/([a-f0-9-]+)/)[1]}`);
  } else {
    const t = await page.locator('[class*="toast"]').last().textContent().catch(() => null);
    bad("Invoice draft did not save", t ?? page.url());
  }
} catch (e) { bad("Invoice draft", e.message.slice(0, 120)); }

// 5. Project ("Create project")
try {
  await page.goto(`${BASE}/projects/new`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.locator("input").first().fill(`${TEST} Project`);
  await page.locator('button:has-text("Create project")').click();
  await page.waitForTimeout(3000);
  const d = await page.evaluate(async () => (await fetch("/api/projects?limit=5")).json());
  const p = (d.projects ?? []).find(x => x.name?.startsWith(TEST));
  if (p) { ok("Project created", p.project_number ?? p.id.slice(0, 8)); cleanup.push(`/api/projects/${p.id}`); }
  else {
    const t = await page.locator('[class*="toast"]').last().textContent().catch(() => null);
    bad("Project not created", t ?? page.url());
  }
} catch (e) { bad("Project create", e.message.slice(0, 120)); }

// 6. Opportunity (modal; save button label = "New Opportunity")
try {
  await page.goto(`${BASE}/opportunities`, { waitUntil: "networkidle" });
  await page.locator('.btn.btn-primary').first().click(); // header "New Opportunity"
  await page.waitForTimeout(700);
  // name field is first input inside the modal
  const modal = page.locator('[class*="modal"], [role="dialog"]').last();
  const nameInput = (await modal.locator("input").count())
    ? modal.locator("input").first()
    : page.locator("input").first();
  await nameInput.fill(`${TEST} Opp`);
  // save = primary button inside modal footer
  const saveBtn = (await modal.locator(".btn.btn-primary").count())
    ? modal.locator(".btn.btn-primary").last()
    : page.locator(".btn.btn-primary").last();
  await saveBtn.click();
  await page.waitForTimeout(2500);
  const d = await page.evaluate(async () => (await fetch("/api/opportunities?limit=5")).json());
  const o = (d.opportunities ?? []).find(x => x.name?.startsWith(TEST));
  if (o) { ok("Opportunity created via modal"); cleanup.push(`/api/opportunities/${o.id}`); }
  else bad("Opportunity not created");
} catch (e) { bad("Opportunity", e.message.slice(0, 120)); }

// 7. Expense (modal; save button label = "Add Expense")
try {
  await page.goto(`${BASE}/expenses`, { waitUntil: "networkidle" });
  await page.locator('.btn.btn-primary').first().click();
  await page.waitForTimeout(700);
  const modal = page.locator('[class*="modal"], [role="dialog"]').last();
  await modal.locator("input").first().fill(`${TEST} Expense`);
  await modal.locator('input[type="number"]').first().fill("42.50");
  await modal.locator(".btn.btn-primary").last().click();
  await page.waitForTimeout(2500);
  const d = await page.evaluate(async () => (await fetch("/api/expenses?limit=5")).json());
  const x = (d.expenses ?? []).find(e2 => e2.title?.startsWith(TEST));
  if (x) { ok("Expense created via modal"); cleanup.push(`/api/expenses/${x.id}`); }
  else bad("Expense not created");
} catch (e) { bad("Expense", e.message.slice(0, 120)); }

// 8. Settings save (look for toast with exact mechanism)
try {
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const save = page.locator('button:has-text("Save")').first();
  await save.click();
  const toast = await page.waitForSelector("text=/saved|updated/i", { timeout: 5000 }).catch(() => null);
  if (toast) ok("Settings save confirms with toast");
  else bad("Settings save → no confirmation feedback");
} catch (e) { bad("Settings save", e.message.slice(0, 120)); }

// cleanup
console.log("\n── cleanup ──");
for (const url of cleanup) {
  const s = await page.evaluate(async (u) => (await fetch(u, { method: "DELETE" })).status, url).catch(() => "ERR");
  console.log(`DELETE ${url} → ${s}`);
}
// verify cleanup of contact
const left = await page.evaluate(async () => {
  const d = await (await fetch("/api/contacts?limit=10")).json();
  return (d.contacts ?? []).filter(c => c.full_name?.includes("MT-TEST")).length;
});
console.log("MT-TEST contacts remaining:", left);

await browser.close();
console.log(`\nRETRY SUMMARY: ${pass} passed · ${fail} failed`);
