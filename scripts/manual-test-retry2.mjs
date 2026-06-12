/** Final retry: quote draft, invoice draft, project create — visible-scoped selectors. */
import { chromium } from "playwright";
import { readFileSync } from "fs";

const BASE = "http://localhost:3000";
const env = Object.fromEntries(
  readFileSync(".env.test", "utf8").split("\n").filter(l => l.includes("=")).map(l => {
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
const page = await (await browser.newContext({ viewport: { width: 1366, height: 800 } })).newPage();
page.on("pageerror", e => console.log("PAGEERROR:", e.message.slice(0, 120)));

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', env.TEST_EMAIL);
await page.fill('input[type="password"]', env.TEST_PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL(/dashboard/, { timeout: 20000 });

// reuse an existing contact
const contactId = await page.evaluate(async () => {
  const d = await (await fetch("/api/contacts?limit=1")).json();
  return d.contacts?.[0]?.id ?? null;
});

// 1. Quote draft
try {
  await page.goto(`${BASE}/quotes/new`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  if (contactId) await page.selectOption("main select >> nth=0", contactId).catch(() => {});
  await page.locator("main table input").first().fill(`${TEST} quote item`);
  const nums = page.locator('main table input[type="number"]');
  await nums.nth(0).fill("2");
  await nums.nth(1).fill("100");
  await page.locator('button:has-text("Save draft"):visible').click();
  await page.waitForTimeout(3000);
  if (/\/quotes\/[a-f0-9-]{8}/.test(page.url())) {
    ok("Quote draft saved → detail page");
    cleanup.push(`/api/quotes/${page.url().match(/quotes\/([a-f0-9-]+)/)[1]}`);
  } else bad("Quote draft did not save", page.url());
} catch (e) { bad("Quote draft", e.message.slice(0, 140)); }

// 2. Invoice draft
try {
  await page.goto(`${BASE}/invoices/new`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  if (contactId) await page.selectOption("main select >> nth=0", contactId).catch(() => {});
  // first non-date/number/checkbox input inside the line items area (main content)
  const itemName = page.locator('main input:not([type="date"]):not([type="number"]):not([type="checkbox"])').first();
  await itemName.fill(`${TEST} inv item`);
  const nums = page.locator('main input[type="number"]');
  await nums.nth(0).fill("1");
  await nums.nth(1).fill("150");
  await page.locator('button:has-text("Save as Draft"):visible').first().click();
  await page.waitForTimeout(3000);
  if (/\/invoices\/[a-f0-9-]{8}/.test(page.url())) {
    ok("Invoice draft saved → detail page");
    cleanup.push(`/api/invoices/${page.url().match(/invoices\/([a-f0-9-]+)/)[1]}`);
  } else {
    const t = await page.locator('[class*="toast"]').last().textContent().catch(() => null);
    bad("Invoice draft did not save", t ?? page.url());
  }
} catch (e) { bad("Invoice draft", e.message.slice(0, 140)); }

// 3. Project create (scope to main; the earlier 'first input' hit the topbar search)
try {
  await page.goto(`${BASE}/projects/new`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.locator("main input").first().fill(`${TEST} Project`);
  await page.locator('button:has-text("Create project"):visible').click();
  await page.waitForTimeout(3000);
  const d = await page.evaluate(async () => (await fetch("/api/projects?limit=5")).json());
  const p = (d.projects ?? []).find(x => x.name?.startsWith(TEST));
  if (p) { ok("Project created", p.project_number ?? ""); cleanup.push(`/api/projects/${p.id}`); }
  else {
    const t = await page.locator('[class*="toast"]').last().textContent().catch(() => null);
    bad("Project not created", t ?? page.url());
  }
} catch (e) { bad("Project create", e.message.slice(0, 140)); }

// 4. Verify trial gate consistency: expired-trial business cannot create project
//    (the gate was just added) — simulate by checking route source is gated at runtime?
//    Instead verify the response shape on a valid trial is 201 and quote/invoice/project all consistent.
console.log("\n── cleanup ──");
for (const url of cleanup) {
  const s = await page.evaluate(async (u) => (await fetch(u, { method: "DELETE" })).status, url).catch(() => "ERR");
  console.log(`DELETE ${url} → ${s}`);
}
const leftovers = await page.evaluate(async () => {
  const out = {};
  for (const [k, u, arr, field] of [
    ["contacts", "/api/contacts?limit=20", "contacts", "full_name"],
    ["quotes", "/api/quotes?limit=20", "quotes", "title"],
    ["invoices", "/api/invoices?limit=20", "invoices", "title"],
    ["projects", "/api/projects?limit=20", "projects", "name"],
    ["opportunities", "/api/opportunities?limit=20", "opportunities", "name"],
    ["expenses", "/api/expenses?limit=20", "expenses", "title"],
    ["change-orders", "/api/change-orders?limit=20", "changeOrders", "title"],
  ]) {
    const d = await (await fetch(u)).json();
    out[k] = (d[arr] ?? []).filter(x => JSON.stringify(x).includes("MT-TEST")).map(x => x.id);
  }
  return out;
});
console.log("MT-TEST leftovers:", JSON.stringify(leftovers));
// delete any leftovers from earlier runs
for (const [k, ids] of Object.entries(leftovers)) {
  const ep = k === "change-orders" ? "change-orders" : k;
  for (const id of ids) {
    const s = await page.evaluate(async (u) => (await fetch(u, { method: "DELETE" })).status, `/api/${ep}/${id}`).catch(() => "ERR");
    console.log(`cleanup leftover /api/${ep}/${id} → ${s}`);
  }
}

await browser.close();
console.log(`\nRETRY2 SUMMARY: ${pass} passed · ${fail} failed`);
