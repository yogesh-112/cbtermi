import { test, expect } from "@playwright/test";

test.describe("Payments", () => {
  test("list page loads with 4 stat cards and chart", async ({ page }) => {
    await page.goto("/payments");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".mini-stat")).toHaveCount(4);
    // Mini bar chart section
    await expect(page.locator("text=Payment History").or(page.locator("text=payment history"))).toBeVisible();
  });

  test("Record Payment modal opens with all fields", async ({ page }) => {
    await page.goto("/payments");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });

    // The button may be in the header or empty state
    const btn = page.getByRole("button", { name: /record payment/i }).first();
    await expect(btn).toBeVisible();
    await btn.click();

    await expect(page.getByLabel(/contact/i)).toBeVisible();
    await expect(page.getByLabel(/amount/i)).toBeVisible();
    await expect(page.getByLabel(/payment date/i)).toBeVisible();
    await expect(page.getByLabel(/method/i)).toBeVisible();
  });

  test("cannot record payment without amount", async ({ page }) => {
    await page.goto("/payments");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /record payment/i }).first().click();

    // Submit without filling amount
    await page.getByRole("button", { name: /record payment/i }).last().click();
    await expect(
      page.locator("[role='alert']").or(page.locator("text=required")).or(page.locator("text=Required"))
    ).toBeVisible({ timeout: 5_000 });
  });

  test("payment row shows method and amount", async ({ page }) => {
    await page.goto("/payments");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });

    const rows = page.locator("tbody tr").filter({ hasNot: page.locator("td[colspan]") });
    const count = await rows.count();
    if (count === 0) return; // no payments yet

    // Each row should have an amount and a method
    await expect(rows.first().locator("td").nth(3)).toBeVisible();
  });
});
