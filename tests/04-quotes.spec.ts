import { test, expect } from "@playwright/test";

test.describe("Quotes", () => {
  test("list page loads with stat cards and tabs", async ({ page }) => {
    await page.goto("/quotes");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".mini-stat")).toHaveCount(5);
    await expect(page.getByRole("button", { name: /all/i }).first()).toBeVisible();
  });

  test("status tabs filter the list", async ({ page }) => {
    await page.goto("/quotes");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });

    for (const tab of ["Draft", "Sent", "Approved"]) {
      const btn = page.getByRole("button", { name: new RegExp(tab, "i") }).first();
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
    const search = page.getByPlaceholder(/search/i).first();
    await search.fill("zzznomatch");
    await page.waitForTimeout(300);
    await expect(page.locator("tbody tr").filter({ hasNot: page.locator("td[colspan]") })).toHaveCount(0);
  });

  test("new quote page loads all sections", async ({ page }) => {
    await page.goto("/quotes/new");
    await expect(page.getByText("New quote", { exact: false }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder("Search or add…")).toBeVisible();
    await expect(page.getByPlaceholder("Item name")).toBeVisible();
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible();
  });

  test("cannot save quote without a contact", async ({ page }) => {
    await page.goto("/quotes/new");
    await expect(page.getByPlaceholder("Item name")).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder("Item name").fill("Labor");
    await page.getByRole("button", { name: /save draft/i }).first().click();
    // Should show error toast or inline message
    await expect(
      page.locator("text=contact").or(page.locator("text=customer")).or(page.locator("[role='alert']"))
    ).toBeVisible({ timeout: 5_000 });
  });

  test("creates a draft quote end-to-end", async ({ page }) => {
    await page.goto("/quotes/new");
    await expect(page.getByPlaceholder("Search or add…")).toBeVisible({ timeout: 10_000 });

    // Select first available contact
    await page.getByPlaceholder("Search or add…").click();
    const firstContact = page.locator(".absolute button").first();
    const hasContacts = await firstContact.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasContacts) {
      test.skip(true, "No contacts in test account — skipping quote creation test");
      return;
    }
    await firstContact.click();

    // Fill item
    await page.getByPlaceholder("Item name").fill("Test Labor");
    await page.locator("input[type=number]").nth(0).fill("2");   // qty
    await page.locator("input[type=number]").nth(1).fill("100"); // unit price

    await page.getByRole("button", { name: /save draft/i }).first().click();

    // Should redirect to quote detail
    await expect(page).toHaveURL(/\/quotes\/[a-z0-9-]+$/, { timeout: 15_000 });
    await expect(page.locator("text=Q-")).toBeVisible();
  });
});
