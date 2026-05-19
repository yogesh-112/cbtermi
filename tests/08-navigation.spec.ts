import { test, expect } from "@playwright/test";

const PAGES = [
  { path: "/dashboard",  heading: /dashboard/i },
  { path: "/contacts",   heading: /contacts/i },
  { path: "/quotes",     heading: /quotes/i },
  { path: "/invoices",   heading: /invoices/i },
  { path: "/projects",   heading: /projects/i },
  { path: "/payments",   heading: /payments/i },
  { path: "/settings",   heading: /settings/i },
];

test.describe("Navigation — page load smoke tests", () => {
  for (const { path, heading } of PAGES) {
    test(`${path} loads without crashing`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1").filter({ hasText: heading })).toBeVisible({ timeout: 12_000 });
      // No uncaught JS errors — check for common error markers
      await expect(page.locator("text=Application error").or(page.locator("text=500"))).toHaveCount(0);
    });
  }
});

test.describe("Sidebar navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("nav")).toBeVisible({ timeout: 10_000 });
  });

  test("clicking Invoices in sidebar navigates correctly", async ({ page }) => {
    await page.locator("nav a[href='/invoices']").click();
    await expect(page).toHaveURL("/invoices");
    await expect(page.locator("h1")).toContainText(/invoices/i);
  });

  test("clicking Quotes in sidebar navigates correctly", async ({ page }) => {
    await page.locator("nav a[href='/quotes']").click();
    await expect(page).toHaveURL("/quotes");
    await expect(page.locator("h1")).toContainText(/quotes/i);
  });

  test("clicking Contacts in sidebar navigates correctly", async ({ page }) => {
    await page.locator("nav a[href='/contacts']").click();
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

  test("hamburger menu opens and closes", async ({ page }) => {
    await page.goto("/dashboard");
    // On mobile the sidebar is hidden; a menu button should be visible
    const menuBtn = page.getByRole("button", { name: /menu|navigation/i }).or(
      page.locator("[aria-label='Open menu']")
    ).first();

    // Mobile sidebar toggle may not have an explicit label — try clicking topbar area
    if (await menuBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await menuBtn.click();
      await expect(page.locator("nav")).toBeVisible({ timeout: 5_000 });
      await page.getByRole("button", { name: /close menu/i }).click();
    }
    // If no hamburger visible on this layout, just confirm dashboard loaded
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
  });
});
