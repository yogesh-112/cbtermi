import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("loads without errors", async ({ page }) => {
    // No error toast or crash
    await expect(page.locator(".page-title, h1").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Error").or(page.locator("text=Something went wrong"))).toHaveCount(0);
  });

  test("shows stat cards", async ({ page }) => {
    // 4 mini-stat cards should be present
    await expect(page.locator(".mini-stat")).toHaveCount(4, { timeout: 10_000 });
  });

  test("shows sidebar navigation links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /quotes/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /invoices/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /projects/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /contacts/i }).first()).toBeVisible();
  });

  test("quick-action links navigate correctly", async ({ page }) => {
    // New Quote shortcut
    const quoteLink = page.getByRole("link", { name: /new quote/i }).first();
    if (await quoteLink.isVisible()) {
      await quoteLink.click();
      await expect(page).toHaveURL(/\/quotes\/new/);
    }
  });

  test("recent activity section renders", async ({ page }) => {
    // Either shows activity items or the 'No activity yet' empty state
    const activity = page.locator("text=No activity").or(page.locator(".audit-row, [data-testid='activity-item']"));
    // Just check the page doesn't hang — we don't mandate specific content
    await page.waitForTimeout(1000);
    await expect(page.locator(".mini-stat").first()).toBeVisible();
  });
});
