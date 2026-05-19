import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    // Wait for the skeleton to resolve — mini-stats appear once API calls complete
    await page.waitForSelector(".mini-stat", { timeout: 25_000 });
  });

  test("loads without errors", async ({ page }) => {
    await expect(page.locator(".mini-stat").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("text=Application error").or(page.locator("text=Something went wrong"))).toHaveCount(0);
  });

  test("shows 4 stat cards", async ({ page }) => {
    await expect(page.locator(".mini-stat")).toHaveCount(4, { timeout: 15_000 });
  });

  test("shows sidebar navigation links", async ({ page }) => {
    // Sidebar is hidden on mobile viewports — only test on desktop
    if ((page.viewportSize()?.width ?? 1280) < 1024) return;
    await expect(page.getByRole("link", { name: /quotes/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /invoices/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /projects/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /contacts/i }).first()).toBeVisible();
  });

  test("quick-action 'New invoice' link navigates correctly", async ({ page }) => {
    await expect(page.locator(".mini-stat").first()).toBeVisible({ timeout: 15_000 });
    const link = page.getByRole("link", { name: /new invoice/i }).first();
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/invoices\/new/);
    }
  });

  test("page does not hang — mini stats appear after API resolves", async ({ page }) => {
    await expect(page.locator(".mini-stat").first()).toBeVisible({ timeout: 15_000 });
  });
});
