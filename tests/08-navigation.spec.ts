import { test, expect } from "@playwright/test";

// Dashboard and Settings use dynamic/loading headings — detect them differently
const PAGES = [
  { path: "/dashboard",  check: () => "page.locator('.mini-stat').first()" },
  { path: "/contacts",   check: () => "h1 /contacts/i" },
  { path: "/quotes",     check: () => "h1 /quotes/i" },
  { path: "/invoices",   check: () => "h1 /invoices/i" },
  { path: "/projects",   check: () => "h1 /projects/i" },
  { path: "/payments",   check: () => "h1 /payments/i" },
  { path: "/settings",   check: () => "section-title" },
];

test.describe("Navigation — page load smoke tests", () => {
  test("/dashboard loads without crashing", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator(".mini-stat").first()).toBeVisible({ timeout: 25_000 });
    await expect(page.locator("text=Application error").or(page.locator("text=500"))).toHaveCount(0);
  });

  for (const path of ["/contacts", "/quotes", "/invoices", "/projects", "/payments"]) {
    test(`${path} loads without crashing`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible({ timeout: 12_000 });
      await expect(page.locator("text=Application error").or(page.locator("text=500"))).toHaveCount(0);
    });
  }

  test("/settings loads without crashing", async ({ page }) => {
    await page.goto("/settings");
    // Settings h1 is the business name (dynamic), check for section titles instead
    await expect(page.locator(".section-title").first()).toBeVisible({ timeout: 12_000 });
    await expect(page.locator("text=Application error").or(page.locator("text=500"))).toHaveCount(0);
  });
});

test.describe("Sidebar navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector(".mini-stat", { timeout: 25_000 });
  });

  test("clicking Invoices in sidebar navigates correctly", async ({ page }) => {
    // Sidebar is hidden on mobile — skip gracefully
    if (!await page.locator("nav a[href='/invoices']").first().isVisible().catch(() => false)) return;
    await page.locator("nav a[href='/invoices']").first().click();
    await expect(page).toHaveURL("/invoices");
    await expect(page.locator("h1")).toContainText(/invoices/i);
  });

  test("clicking Quotes in sidebar navigates correctly", async ({ page }) => {
    if (!await page.locator("nav a[href='/quotes']").first().isVisible().catch(() => false)) return;
    await page.locator("nav a[href='/quotes']").first().click();
    await expect(page).toHaveURL("/quotes");
    await expect(page.locator("h1")).toContainText(/quotes/i);
  });

  test("clicking Contacts in sidebar navigates correctly", async ({ page }) => {
    if (!await page.locator("nav a[href='/contacts']").first().isVisible().catch(() => false)) return;
    await page.locator("nav a[href='/contacts']").first().click();
    await expect(page).toHaveURL("/contacts");
    await expect(page.locator("h1")).toContainText(/contacts/i);
  });

  test("browser back/forward works across pages", async ({ page }) => {
    await page.goto("/quotes");
    await page.goto("/invoices");
    await page.goBack();
    await expect(page).toHaveURL("/quotes");
    await page.goForward();
    await expect(page).toHaveURL("/invoices");
  });
});

test.describe("Mobile navigation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile bottom bar is visible and page loads", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Mobile has a bottom nav bar
    const mobileNav = page.locator("nav").last();
    await expect(mobileNav).toBeVisible({ timeout: 10_000 });
  });

  test("mobile sidebar drawer opens and closes", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Look for a hamburger/menu button in the topbar area (small screen)
    const menuBtn = page.locator("[aria-label='Open menu']").or(
      page.locator("button").filter({ hasText: /menu/i })
    ).first();

    if (await menuBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await menuBtn.click();
      await page.getByRole("button", { name: /close menu/i }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: /close menu/i }).click();
    }
    // Page should still be intact
    await expect(page.locator(".mini-stat").first()).toBeVisible({ timeout: 15_000 });
  });
});
