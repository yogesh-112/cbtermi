/**
 * Crawl every app page and report client-side exceptions (pageerror),
 * console errors, and failed network requests.
 * Usage: node scripts/crawl-errors.mjs
 */
import { chromium } from "playwright";
import { readFileSync } from "fs";

const BASE = "http://localhost:3000";

// load TEST_EMAIL / TEST_PASSWORD from .env.test
const envText = readFileSync(".env.test", "utf8");
const env = Object.fromEntries(
  envText.split("\n").filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
  })
);

const PAGES = [
  "/", "/login",
  "/dashboard", "/contacts", "/leads", "/customers", "/opportunities",
  "/projects", "/projects/new", "/quotes", "/quotes/new", "/change-orders",
  "/change-orders/new", "/scheduling", "/expenses", "/invoices", "/invoices/new",
  "/payments", "/templates", "/notifications", "/communications",
  "/item-requirements", "/project-updates", "/feedback", "/team",
  "/audit-log", "/settings", "/subscription", "/help", "/more", "/profile",
];

const browser = await chromium.launch({ headless: true });
const findings = {};

async function crawl(viewport, label) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();

  const errsFor = {};
  let current = "";
  page.on("pageerror", err => {
    (errsFor[current] ??= []).push(`PAGEERROR: ${err.message}`);
  });
  page.on("console", msg => {
    if (msg.type() === "error") {
      const t = msg.text();
      if (t.includes("favicon") || t.includes("404 (Not Found)") && t.includes("_next/image")) return;
      (errsFor[current] ??= []).push(`CONSOLE: ${t.slice(0, 300)}`);
    }
  });
  page.on("requestfailed", req => {
    if (req.url().includes("favicon")) return;
    (errsFor[current] ??= []).push(`REQFAIL: ${req.url().slice(0, 120)} — ${req.failure()?.errorText}`);
  });

  // login
  current = "(login flow)";
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', env.TEST_EMAIL);
  await page.fill('input[type="password"]', env.TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|business-setup/, { timeout: 20000 }).catch(() => {});
  console.log(`[${label}] logged in → ${page.url()}`);

  for (const p of PAGES) {
    current = p;
    try {
      const res = await page.goto(`${BASE}${p}`, { waitUntil: "networkidle", timeout: 25000 });
      const status = res?.status();
      // detect Next.js error overlay / error boundary text
      const body = (await page.textContent("body").catch(() => "")) || "";
      if (body.includes("Application error: a client-side exception")) {
        (errsFor[p] ??= []).push("CRASH: Application error boundary shown");
      }
      if (status && status >= 500) (errsFor[p] ??= []).push(`HTTP ${status}`);
    } catch (e) {
      (errsFor[p] ??= []).push(`NAV FAIL: ${e.message.slice(0, 150)}`);
    }
  }

  findings[label] = errsFor;
  await ctx.close();
}

await crawl({ width: 1366, height: 800 }, "desktop");
await crawl({ width: 390, height: 844 }, "mobile");

await browser.close();

for (const [label, errsFor] of Object.entries(findings)) {
  console.log(`\n===== ${label.toUpperCase()} =====`);
  const pagesWithErrors = Object.entries(errsFor).filter(([, v]) => v.length);
  if (!pagesWithErrors.length) { console.log("No errors found 🎉"); continue; }
  for (const [p, errs] of pagesWithErrors) {
    console.log(`\n--- ${p}`);
    for (const e of [...new Set(errs)]) console.log("   " + e);
  }
}
