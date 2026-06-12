/**
 * Manual-tester-style E2E pass over the whole application.
 * Desktop (1366×800) + Mobile (390×844). Creates clearly-labelled test
 * records ("MT-TEST …") and deletes them afterwards.
 *
 * Usage: node scripts/manual-test.mjs
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const SHOTS = "scripts/manual-test-shots";
mkdirSync(SHOTS, { recursive: true });

const envText = readFileSync(".env.test", "utf8");
const env = Object.fromEntries(
  envText.split("\n").filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
  })
);

const STAMP = Date.now().toString().slice(-6);
const TEST = `MT-TEST-${STAMP}`;

const results = [];
let pass = 0, fail = 0, warn = 0;
function ok(label, detail = "") { pass++; results.push(`✅ ${label}${detail ? " — " + detail : ""}`); console.log(results.at(-1)); }
function bad(label, detail = "") { fail++; results.push(`❌ ${label}${detail ? " — " + detail : ""}`); console.log(results.at(-1)); }
function note(label, detail = "") { warn++; results.push(`⚠️ ${label}${detail ? " — " + detail : ""}`); console.log(results.at(-1)); }

const cleanupIds = []; // { url } DELETE endpoints to call at the end

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', env.TEST_EMAIL);
  await page.fill('input[type="password"]', env.TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 20000 });
}

async function toastText(page) {
  const t = await page.locator('[class*="toast"], [role="status"]').last().textContent({ timeout: 4000 }).catch(() => null);
  return t;
}

const browser = await chromium.launch({ headless: true });

/* ════════════════ DESKTOP PASS ════════════════ */
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", e => pageErrors.push(e.message.slice(0, 140)));

  console.log("\n========== DESKTOP PASS ==========\n");

  // 1. Invalid login
  try {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', env.TEST_EMAIL);
    await page.fill('input[type="password"]', "definitely-wrong-password");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2500);
    const body = await page.textContent("body");
    if (page.url().includes("/login") && /invalid|incorrect|wrong/i.test(body)) ok("Invalid login rejected with error message");
    else if (page.url().includes("/login")) note("Invalid login stays on page but no visible error message");
    else bad("Invalid login was accepted!");
  } catch (e) { bad("Invalid login test", e.message.slice(0, 100)); }

  // 2. Valid login
  try {
    await login(page);
    ok("Valid login → dashboard");
  } catch (e) { bad("Valid login", e.message.slice(0, 100)); await browser.close(); process.exit(1); }

  // 3. Dashboard content
  try {
    const body = await page.textContent("body");
    if (/revenue|invoice|project|lead/i.test(body)) ok("Dashboard renders stats and content");
    else note("Dashboard rendered but expected stats text not found");
    await page.screenshot({ path: `${SHOTS}/d-dashboard.png` });
  } catch (e) { bad("Dashboard", e.message.slice(0, 100)); }

  // 4. New Contact via topbar CTA (the ?new=1 flow)
  try {
    await page.goto(`${BASE}/contacts/new`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const modalVisible = await page.locator("text=Full Name").first().isVisible().catch(() => false);
    if (modalVisible) ok("'New Contact' CTA opens create form (redirect + modal)");
    else bad("'New Contact' CTA does not open the create form");
    // fill and save
    const nameInput = page.locator('input').filter({ has: page.locator(':scope') }).first();
    await page.fill('div[class*="modal"] input >> nth=0', `${TEST} Lead`).catch(async () => {
      // fallback: first text input inside the dialog area
      await page.locator('input[placeholder*="name" i], input').nth(0).fill(`${TEST} Lead`);
    });
    // find email + phone fields by placeholder if present
    const emailField = page.locator('input[type="email"]').first();
    if (await emailField.isVisible().catch(() => false)) await emailField.fill(`mt${STAMP}@example.com`);
    await page.locator('button:has-text("Save"), button:has-text("Add")').last().click();
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    if (body.includes(`${TEST} Lead`)) ok("Contact created and visible in list");
    else note("Contact save clicked but new contact not visible in list yet");
  } catch (e) { bad("Create contact via UI", e.message.slice(0, 120)); }

  // capture created contact id for cleanup + later flows
  let contactId = null;
  try {
    const d = await page.evaluate(async () => (await fetch("/api/contacts?limit=5")).json());
    const c = (d.contacts ?? []).find(x => x.full_name?.includes("MT-TEST"));
    if (c) { contactId = c.id; cleanupIds.push({ url: `/api/contacts/${c.id}` }); }
  } catch {}

  // 5. Leads page shows the new lead; convert to customer
  try {
    await page.goto(`${BASE}/leads`, { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    if (body.includes(`${TEST} Lead`)) {
      ok("Leads page lists the new lead");
      const row = page.locator(`tr:has-text("${TEST} Lead")`);
      await row.locator('button:has-text("Convert")').click();
      await page.waitForTimeout(1800);
      await page.goto(`${BASE}/customers`, { waitUntil: "networkidle" });
      const cbody = await page.textContent("body");
      if (cbody.includes(`${TEST} Lead`)) ok("Convert to customer works — appears on Customers page");
      else note("Converted but not visible on Customers page");
    } else note("New lead not on Leads page (may be >50 records or created as different type)");
  } catch (e) { bad("Lead convert flow", e.message.slice(0, 120)); }

  // 6. Quote: create draft via UI
  try {
    await page.goto(`${BASE}/quotes/new`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    if (contactId) await page.selectOption("select", { value: contactId }).catch(() => {});
    // line item: first row inputs — item name, qty, rate
    const itemInput = page.locator('table input').first();
    await itemInput.fill(`${TEST} item`);
    const numericInputs = page.locator('table input[type="number"]');
    const n = await numericInputs.count();
    if (n >= 2) {
      await numericInputs.nth(0).fill("2");   // qty
      await numericInputs.nth(1).fill("100"); // rate
    }
    await page.waitForTimeout(400);
    const totals = await page.textContent("body");
    if (totals.includes("200")) ok("Quote line item math computes (2 × $100 = $200)");
    else note("Quote totals did not show expected 200");
    await page.locator('button:has-text("Draft"), button:has-text("draft")').first().click();
    await page.waitForTimeout(2500);
    if (/\/quotes\/[a-f0-9-]{8}/.test(page.url())) {
      ok("Quote draft saved → redirected to quote detail");
      const qid = page.url().match(/quotes\/([a-f0-9-]+)/)?.[1];
      if (qid) cleanupIds.push({ url: `/api/quotes/${qid}` });
    } else {
      const t = await toastText(page);
      bad("Quote draft save failed", t ?? "no redirect");
    }
  } catch (e) { bad("Quote create flow", e.message.slice(0, 120)); }

  // 7. Invoice: create draft via UI
  try {
    await page.goto(`${BASE}/invoices/new`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    if (contactId) await page.selectOption("select", { value: contactId }).catch(() => {});
    const itemInput = page.locator('table input').first();
    await itemInput.fill(`${TEST} inv item`);
    const numericInputs = page.locator('table input[type="number"]');
    if (await numericInputs.count() >= 2) {
      await numericInputs.nth(0).fill("1");
      await numericInputs.nth(1).fill("150");
    }
    await page.locator('button:has-text("Draft"), button:has-text("draft")').first().click();
    await page.waitForTimeout(2500);
    if (/\/invoices\/[a-f0-9-]{8}/.test(page.url())) {
      ok("Invoice draft saved → invoice detail");
      const iid = page.url().match(/invoices\/([a-f0-9-]+)/)?.[1];
      if (iid) cleanupIds.push({ url: `/api/invoices/${iid}` });
    } else {
      const t = await toastText(page);
      bad("Invoice draft save failed", t ?? "no redirect");
    }
  } catch (e) { bad("Invoice create flow", e.message.slice(0, 120)); }

  // 8. Project create
  try {
    await page.goto(`${BASE}/projects/new`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.locator('input').first().fill(`${TEST} Project`);
    await page.locator('button:has-text("Create"), button:has-text("Save")').first().click();
    await page.waitForTimeout(2500);
    if (/\/projects\/[a-f0-9-]{8}/.test(page.url()) || page.url().endsWith("/projects")) {
      ok("Project created");
      const d = await page.evaluate(async () => (await fetch("/api/projects?limit=5")).json());
      const p = (d.projects ?? []).find(x => x.name?.includes("MT-TEST"));
      if (p) cleanupIds.push({ url: `/api/projects/${p.id}` });
    } else {
      const t = await toastText(page);
      bad("Project create failed", t ?? page.url());
    }
  } catch (e) { bad("Project create flow", e.message.slice(0, 120)); }

  // 9. Opportunity via modal
  try {
    await page.goto(`${BASE}/opportunities`, { waitUntil: "networkidle" });
    await page.locator('button:has-text("New"), button:has-text("Opportunity")').first().click();
    await page.waitForTimeout(600);
    await page.locator('div:has(> div h2:has-text("Opportunity")) input, input').first().fill(`${TEST} Opp`);
    // first text input in modal
    const modalInputs = page.locator('input');
    // assume first input is name (autoFocus)
    await page.keyboard.press("Tab");
    await page.locator('button:has-text("Save"), button:has-text("Create")').last().click();
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    if (body.includes(`${TEST} Opp`)) {
      ok("Opportunity created via modal");
      const d = await page.evaluate(async () => (await fetch("/api/opportunities?limit=5")).json());
      const o = (d.opportunities ?? []).find(x => x.name?.includes("MT-TEST"));
      if (o) cleanupIds.push({ url: `/api/opportunities/${o.id}` });
    } else {
      const t = await toastText(page);
      bad("Opportunity create failed", t ?? "not in list");
    }
  } catch (e) { bad("Opportunity flow", e.message.slice(0, 120)); }

  // 10. Expense via modal
  try {
    await page.goto(`${BASE}/expenses`, { waitUntil: "networkidle" });
    await page.locator('button:has-text("Add"), button:has-text("Expense")').first().click();
    await page.waitForTimeout(600);
    await page.locator('input').first().fill(`${TEST} Expense`);
    const amount = page.locator('input[type="number"]').first();
    await amount.fill("42.50");
    await page.locator('button:has-text("Save")').last().click();
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    if (body.includes(`${TEST} Expense`)) {
      ok("Expense created via modal");
      const d = await page.evaluate(async () => (await fetch("/api/expenses?limit=5")).json());
      const x = (d.expenses ?? []).find(e2 => e2.title?.includes("MT-TEST"));
      if (x) cleanupIds.push({ url: `/api/expenses/${x.id}` });
    } else {
      const t = await toastText(page);
      bad("Expense create failed", t ?? "not in list");
    }
  } catch (e) { bad("Expense flow", e.message.slice(0, 120)); }

  // 11. Change order draft
  try {
    await page.goto(`${BASE}/change-orders/new`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.locator('input').first().fill(`${TEST} CO`);
    await page.locator('button:has-text("Save"), button:has-text("Create")').first().click();
    await page.waitForTimeout(2500);
    const body = await page.textContent("body");
    if (/\/change-orders\/[a-f0-9-]{8}/.test(page.url()) || body.includes(`${TEST} CO`)) {
      ok("Change order draft created");
      const d = await page.evaluate(async () => (await fetch("/api/change-orders?limit=5")).json());
      const co = (d.changeOrders ?? []).find(x => x.title?.includes("MT-TEST"));
      if (co) cleanupIds.push({ url: `/api/change-orders/${co.id}` });
    } else {
      const t = await toastText(page);
      bad("Change order create failed", t ?? page.url());
    }
  } catch (e) { bad("Change order flow", e.message.slice(0, 120)); }

  // 12. Payments page: validation guard (no contact selected)
  try {
    await page.goto(`${BASE}/payments`, { waitUntil: "networkidle" });
    await page.locator('button:has-text("Record")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Record"), button:has-text("Save")').last().click();
    await page.waitForTimeout(1200);
    const body = await page.textContent("body");
    if (/select a contact|required|must be/i.test(body)) ok("Payment modal validates required fields");
    else note("Payment modal validation message not detected");
    await page.keyboard.press("Escape");
  } catch (e) { note("Payment validation test", e.message.slice(0, 100)); }

  // 13. Global search finds test contact
  try {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await page.fill('input[placeholder*="Search" i]', "MT-TEST");
    await page.waitForTimeout(1500);
    const body = await page.textContent("body");
    if (body.includes("MT-TEST")) ok("Global search returns test records");
    else note("Global search returned nothing for MT-TEST");
  } catch (e) { note("Global search", e.message.slice(0, 100)); }

  // 14. Settings save round-trip
  try {
    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const saveBtn = page.locator('button:has-text("Save")').first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(1500);
      const t = await toastText(page);
      if (t && /saved|updated/i.test(t)) ok("Settings save works", t.slice(0, 40));
      else note("Settings save clicked — no confirmation toast detected");
    } else note("Settings save button not found on first tab");
  } catch (e) { bad("Settings", e.message.slice(0, 100)); }

  // 15. Static render checks for remaining pages
  for (const [path, expect] of [
    ["/scheduling", /slot|meeting|booking/i],
    ["/templates", /template/i],
    ["/notifications", /notification|template/i],
    ["/communications", /communication|message/i],
    ["/item-requirements", /requirement|list/i],
    ["/project-updates", /update/i],
    ["/feedback", /feedback/i],
    ["/team", /team|member|invite/i],
    ["/audit-log", /audit/i],
    ["/subscription", /trial|plan|subscription/i],
    ["/help", /faq|help|support/i],
    ["/profile", /profile|account/i],
  ]) {
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 20000 });
      const body = await page.textContent("body");
      if (body.includes("Application error")) bad(`${path} crashes`);
      else if (expect.test(body)) ok(`${path} renders`);
      else note(`${path} renders but expected content not matched`);
    } catch (e) { bad(`${path}`, e.message.slice(0, 80)); }
  }

  // 16. Chatbot round-trip
  try {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    const reply = await page.evaluate(async () => {
      const r = await fetch("/api/chatbot", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "How do I create an invoice?" }], currentPage: "/dashboard" }),
      });
      return { status: r.status, data: await r.json() };
    });
    if (reply.status === 200 && reply.data.message && !/ran into an issue/i.test(reply.data.message)) {
      ok("Chatbot replies correctly", reply.data.message.slice(0, 60) + "…");
    } else bad("Chatbot error", JSON.stringify(reply).slice(0, 120));
  } catch (e) { bad("Chatbot", e.message.slice(0, 100)); }

  // 17. Logout
  try {
    await page.evaluate(async () => { await fetch("/api/auth/logout", { method: "POST" }); });
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    if (page.url().includes("/login")) ok("Logout → protected pages redirect to login");
    else bad("After logout, dashboard still accessible", page.url());
  } catch (e) { bad("Logout", e.message.slice(0, 100)); }

  if (pageErrors.length) bad("Desktop pass JS exceptions", [...new Set(pageErrors)].join(" | ").slice(0, 200));
  else ok("No client-side JS exceptions during entire desktop pass");

  await ctx.close();
}

/* ════════════════ MOBILE PASS ════════════════ */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", e => pageErrors.push(e.message.slice(0, 140)));

  console.log("\n========== MOBILE PASS ==========\n");

  try {
    await login(page);
    ok("Mobile login → dashboard");
  } catch (e) { bad("Mobile login", e.message.slice(0, 100)); }

  // Bottom nav present with 5 tabs
  try {
    const navLinks = await page.locator('nav.lg\\:hidden a, nav[class*="lg:hidden"] a').count();
    if (navLinks >= 5) ok(`Bottom nav present (${navLinks} tabs)`);
    else note(`Bottom nav has only ${navLinks} tabs`);
    await page.screenshot({ path: `${SHOTS}/m-dashboard.png` });
  } catch (e) { bad("Bottom nav", e.message.slice(0, 100)); }

  // More page parity: every desktop nav destination reachable
  try {
    await page.goto(`${BASE}/more`, { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    const required = ["Leads", "Customers", "Opportunit", "Project", "Payment", "Scheduling",
      "Expense", "Template", "Change Order", "Item Requirement", "Communication",
      "Feedback", "Notification", "Help", "Team", "Subscription", "Audit"];
    const missing = required.filter(r => !new RegExp(r, "i").test(body));
    if (!missing.length) ok("More page: full parity with desktop sidebar (incl. role-gated Audit Log)");
    else bad("More page missing items", missing.join(", "));
    await page.screenshot({ path: `${SHOTS}/m-more.png`, fullPage: true });
  } catch (e) { bad("More page parity", e.message.slice(0, 100)); }

  // Each page renders meaningful content on mobile (not desktop-only blank)
  for (const path of ["/contacts", "/leads", "/customers", "/opportunities", "/projects",
    "/quotes", "/invoices", "/payments", "/expenses", "/change-orders", "/scheduling",
    "/templates", "/notifications", "/communications", "/item-requirements",
    "/project-updates", "/feedback", "/team", "/settings", "/subscription", "/help", "/audit-log"]) {
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 20000 });
      const crashed = (await page.textContent("body")).includes("Application error");
      // measure visible text in main content area
      const textLen = await page.evaluate(() => {
        const main = document.querySelector("main");
        if (!main) return 0;
        // visible text only
        const walk = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
        let txt = "";
        while (walk.nextNode()) {
          const el = walk.currentNode.parentElement;
          if (el && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden") txt += walk.currentNode.textContent;
        }
        return txt.trim().length;
      });
      if (crashed) bad(`mobile ${path} crashes`);
      else if (textLen > 60) ok(`mobile ${path} renders content (${textLen} chars visible)`);
      else note(`mobile ${path} looks EMPTY (${textLen} chars visible) — possible desktop-only layout`);
    } catch (e) { bad(`mobile ${path}`, e.message.slice(0, 80)); }
  }

  if (pageErrors.length) bad("Mobile pass JS exceptions", [...new Set(pageErrors)].join(" | ").slice(0, 200));
  else ok("No client-side JS exceptions during entire mobile pass");

  /* ── cleanup test records ── */
  console.log("\n── cleanup ──");
  await login(page).catch(() => {});
  for (const c of cleanupIds) {
    const status = await page.evaluate(async (url) => (await fetch(url, { method: "DELETE" })).status, c.url).catch(() => "ERR");
    console.log(`DELETE ${c.url} → ${status}`);
  }

  await ctx.close();
}

await browser.close();

console.log(`\n========== SUMMARY: ${pass} passed · ${warn} warnings · ${fail} failed ==========`);
