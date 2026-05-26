import { test, expect } from "@playwright/test";

test.describe("Invoices", () => {
  test("list page loads with 4 stat cards", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".mini-stat")).toHaveCount(4);
  });

  test("status tabs work", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    for (const tab of ["Draft", "Sent", "Paid"]) {
      const btn = page.getByRole("button", { name: new RegExp(`^${tab}`, "i") }).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(400);
        await expect(page.locator("h1")).toBeVisible();
      }
    }
  });

  test("search filters by invoice number or contact", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder("Search invoices…").fill("zzznomatch");
    await page.waitForTimeout(300);
    await expect(
      page.locator("tbody tr").filter({ hasNot: page.locator("td[colspan]") })
    ).toHaveCount(0);
  });

  test("new invoice page has required fields", async ({ page }) => {
    await page.goto("/invoices/new");
    // Use heading role to avoid matching the "New invoice" topbar link
    await expect(page.getByRole("heading", { name: "New invoice" })).toBeVisible({ timeout: 10_000 });
    // Customer label wraps a select — find the select by its label text
    await expect(page.locator("select").first()).toBeVisible();
    await expect(page.getByPlaceholder("Item name")).toBeVisible();
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /review & send/i }).first()).toBeVisible();
  });

  test("shows toast when saving invoice without a contact", async ({ page }) => {
    await page.goto("/invoices/new");
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /save draft/i }).click();
    // Toast message is "Please select a contact"
    await expect(page.getByText("Please select a contact")).toBeVisible({ timeout: 5_000 });
  });

  test("creates a draft invoice end-to-end", async ({ page }) => {
    test.slow(); // triple timeout — mobile is slower on create+redirect flows
    await page.goto("/invoices/new");
    // First select is the Customer select
    const customerSelect = page.locator("select").first();
    await expect(customerSelect).toBeVisible({ timeout: 10_000 });
    // Wait for contacts to populate — retry until a real contact option appears beyond placeholder
    await expect(customerSelect.locator("option[value]:not([value=''])")).not.toHaveCount(0, { timeout: 10_000 });
    await customerSelect.selectOption({ index: 1 });

    await page.getByPlaceholder("Item name").fill("Test Service");
    // unit_price: first input[step='0.01'] on the page
    await page.locator("input[step='0.01']").first().fill("500");

    await page.getByRole("button", { name: /save draft/i }).click();
    await expect(page).toHaveURL(/\/invoices\/[a-z0-9-]{10,}$/, { timeout: 20_000 });
    // Wait for invoice data to load (remote browsers can take longer for the Supabase fetch)
    await expect(page.locator("h1")).toBeVisible({ timeout: 40_000 });
    // "Duplicate invoice" aria-label button renders once data is loaded
    await expect(page.getByRole("button", { name: /duplicate invoice/i })).toBeVisible({ timeout: 10_000 });
  });

  test("invoice detail page shows status badge and actions", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    const firstLink = page.locator("tbody a[href*='/invoices/']").first();
    if (!await firstLink.isVisible({ timeout: 3_000 }).catch(() => false)) return;
    await firstLink.click();
    await expect(page).toHaveURL(/\/invoices\/[a-z0-9-]+$/);
    await expect(page.locator(".badge")).toBeVisible();
  });
});
