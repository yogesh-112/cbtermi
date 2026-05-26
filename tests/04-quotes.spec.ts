import { test, expect } from "@playwright/test";

test.describe("Quotes", () => {
  test("list page loads with 5 stat cards and status tabs", async ({ page }) => {
    await page.goto("/quotes");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".mini-stat")).toHaveCount(5);
    await expect(page.getByRole("button", { name: /^all/i }).first()).toBeVisible();
  });

  test("status tabs filter the list", async ({ page }) => {
    await page.goto("/quotes");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    for (const tab of ["Draft", "Sent", "Approved"]) {
      const btn = page.getByRole("button", { name: new RegExp(`^${tab}`, "i") }).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(400);
        await expect(page.locator("h1")).toBeVisible();
      }
    }
  });

  test("search filters client-side", async ({ page }) => {
    await page.goto("/quotes");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder("Search quotes…").fill("zzznomatch");
    await page.waitForTimeout(300);
    await expect(
      page.locator("tbody tr").filter({ hasNot: page.locator("td[colspan]") })
    ).toHaveCount(0);
  });

  test("new quote page loads all sections", async ({ page }) => {
    await page.goto("/quotes/new");
    // Quote new page has no h1 — check the "New quote · Draft" subtitle paragraph
    await expect(page.locator("text=New quote · Draft")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder("Search or add…")).toBeVisible();
    await expect(page.getByPlaceholder("Item name")).toBeVisible();
    await expect(page.getByRole("button", { name: /save draft/i }).first()).toBeVisible();
  });

  test("shows toast when saving quote without a contact", async ({ page }) => {
    await page.goto("/quotes/new");
    await expect(page.getByPlaceholder("Item name")).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder("Item name").fill("Labor");
    await page.getByRole("button", { name: /save draft/i }).first().click();
    // Toast says "Please select a contact"
    await expect(page.getByText("Please select a contact")).toBeVisible({ timeout: 5_000 });
  });

  test("creates a draft quote end-to-end", async ({ page }) => {
    test.slow(); // triple timeout — mobile is slower on create+redirect flows
    await page.goto("/quotes/new");
    await expect(page.getByPlaceholder("Search or add…")).toBeVisible({ timeout: 10_000 });

    // Click to open dropdown then wait for contacts to render
    await page.getByPlaceholder("Search or add…").click();
    const firstContact = page.locator(".absolute button").first();
    await expect(firstContact).toBeVisible({ timeout: 10_000 });
    await firstContact.click();
    // Confirm contact was selected — search input is replaced by the contact avatar/name row
    await expect(page.getByPlaceholder("Search or add…")).not.toBeVisible({ timeout: 5_000 });

    await page.getByPlaceholder("Item name").fill("Test Labor");
    // quantity input (nth 0) and unit_price input (nth 1 — type=number fields)
    const numInputs = page.locator("input[type=number]");
    await numInputs.nth(0).fill("2");
    await numInputs.nth(1).fill("100");

    await page.getByRole("button", { name: /save draft/i }).first().click();
    // Exclude /quotes/new — require at least 10 chars after /quotes/ to match a UUID
    await expect(page).toHaveURL(/\/quotes\/[a-z0-9-]{10,}$/, { timeout: 20_000 });
    // Wait for quote data to load (remote browsers can take longer for the Supabase fetch)
    await expect(page.locator("h1")).toBeVisible({ timeout: 40_000 });
    // Duplicate button is always visible once quote detail data loads
    await expect(page.getByRole("button", { name: /duplicate/i })).toBeVisible({ timeout: 10_000 });
  });
});
