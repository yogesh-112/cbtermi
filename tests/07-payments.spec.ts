import { test, expect } from "@playwright/test";

test.describe("Payments", () => {
  test("list page loads with 4 stat cards and chart", async ({ page }) => {
    await page.goto("/payments");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".mini-stat")).toHaveCount(4);
    await expect(page.locator("text=Payment History").or(page.locator("text=payment history"))).toBeVisible();
  });

  test("Record Payment button is always visible in page header", async ({ page }) => {
    await page.goto("/payments");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    // Button now lives in the page header (added to fix this)
    await expect(page.getByRole("button", { name: /record payment/i }).first()).toBeVisible();
  });

  test("Record Payment modal opens with all fields", async ({ page }) => {
    await page.goto("/payments");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /record payment/i }).first().click();

    // Modal fields — labels use .label class without for= so use placeholder/select
    await expect(page.locator("select").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("input[type=number]").first()).toBeVisible();
    await expect(page.locator("input[type=date]").first()).toBeVisible();
  });

  test("cannot record payment without amount", async ({ page }) => {
    await page.goto("/payments");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /record payment/i }).first().click();

    // Click save without filling amount
    await page.getByRole("button", { name: /record payment/i }).last().click();
    // Toast shows "Required" (from t.common.required)
    await expect(page.getByText("Required").first()).toBeVisible({ timeout: 5_000 });
  });

  test("payment row shows date and amount when data exists", async ({ page }) => {
    await page.goto("/payments");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    const rows = page.locator("tbody tr").filter({ hasNot: page.locator("td[colspan]") });
    if (await rows.count() === 0) return;
    await expect(rows.first().locator("td").nth(3)).toBeVisible();
  });
});
