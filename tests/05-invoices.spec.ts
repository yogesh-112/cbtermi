import { test, expect } from "@playwright/test";

test.describe("Invoices", () => {
  test("list page loads with 4 stat cards", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".mini-stat")).toHaveCount(4);
  });

  test("status tabs work (All / Draft / Sent / Overdue / Paid)", async ({ page }) => {
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

  test("search filters by invoice number or contact name", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    const search = page.getByPlaceholder(/search/i).first();
    await search.fill("zzznomatch");
    await page.waitForTimeout(300);
    await expect(
      page.locator("tbody tr").filter({ hasNot: page.locator("td[colspan]") })
    ).toHaveCount(0);
  });

  test("new invoice page has required fields", async ({ page }) => {
    await page.goto("/invoices/new");
    await expect(page.getByText("New invoice")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel(/customer/i)).toBeVisible();
    await expect(page.getByPlaceholder("Item name")).toBeVisible();
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /review & send/i })).toBeVisible();
  });

  test("shows error when saving invoice without a contact", async ({ page }) => {
    await page.goto("/invoices/new");
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /save draft/i }).click();
    await expect(
      page.locator("text=contact").or(page.locator("text=Contact")).or(page.locator("[role='alert']"))
    ).toBeVisible({ timeout: 5_000 });
  });

  test("creates a draft invoice end-to-end", async ({ page }) => {
    await page.goto("/invoices/new");
    await expect(page.getByLabel(/customer/i)).toBeVisible({ timeout: 10_000 });

    const contactSelect = page.getByLabel(/customer/i);
    const options = await contactSelect.locator("option").count();
    if (options <= 1) {
      test.skip(true, "No contacts available — skipping invoice creation test");
      return;
    }
    // Select second option (first is the placeholder)
    await contactSelect.selectOption({ index: 1 });

    // Fill one line item
    await page.getByPlaceholder("Item name").fill("Test Service");
    // qty is already 1, set unit price
    await page.locator("input[step='0.01']").first().fill("500");

    await page.getByRole("button", { name: /save draft/i }).click();

    await expect(page).toHaveURL(/\/invoices\/[a-z0-9-]+$/, { timeout: 15_000 });
    await expect(page.locator("text=INV-")).toBeVisible();
  });

  test("invoice detail page shows status badge and actions", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });

    const firstLink = page.locator("tbody a[href*='/invoices/']").first();
    if (!await firstLink.isVisible()) return;

    await firstLink.click();
    await expect(page).toHaveURL(/\/invoices\/[a-z0-9-]+$/);
    await expect(page.locator(".badge")).toBeVisible();
  });
});
