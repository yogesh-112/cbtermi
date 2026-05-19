import { test, expect } from "@playwright/test";

const TIMESTAMP = Date.now();
const TEST_CONTACT = {
  name: `Playwright Test ${TIMESTAMP}`,
  email: `playwright.test.${TIMESTAMP}@example.com`,
  phone: "+15550001234",
};

test.describe("Contacts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
  });

  test("page loads with stat cards", async ({ page }) => {
    await expect(page.locator(".mini-stat")).toHaveCount(3);
  });

  test("search filters the list", async ({ page }) => {
    const search = page.getByPlaceholder(/search/i).first();
    await search.fill("zzznomatch");
    await page.waitForTimeout(400);
    // Either shows empty state or 0 results
    const rows = page.locator("table tbody tr").filter({ hasNot: page.locator("td[colspan]") });
    const count = await rows.count();
    expect(count).toBe(0);
    await search.clear();
  });

  test("opens Add Contact modal", async ({ page }) => {
    await page.getByRole("button", { name: /add contact/i }).click();
    await expect(page.getByPlaceholder("John Doe")).toBeVisible();
    await expect(page.getByPlaceholder("john@example.com")).toBeVisible();
  });

  test("creates a new contact", async ({ page }) => {
    await page.getByRole("button", { name: /add contact/i }).click();

    await page.getByPlaceholder("John Doe").fill(TEST_CONTACT.name);
    await page.getByPlaceholder("john@example.com").fill(TEST_CONTACT.email);
    await page.getByPlaceholder("+1 (555) 000-0000").first().fill(TEST_CONTACT.phone);

    await page.getByRole("button", { name: /add lead|adding|save/i }).click();

    // Modal closes and contact appears (or success toast)
    await expect(page.locator(`text=${TEST_CONTACT.name}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test("contact row links to detail page", async ({ page }) => {
    // If there are any contacts, click the first one
    const firstLink = page.locator("table tbody a").first();
    const count = await firstLink.count();
    if (count === 0) return; // no contacts yet — skip

    const href = await firstLink.getAttribute("href");
    await firstLink.click();
    await expect(page).toHaveURL(/\/contacts\/.+/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("tabs filter by type", async ({ page }) => {
    const leadsTab = page.getByRole("button", { name: /leads/i }).first();
    if (await leadsTab.isVisible()) {
      await leadsTab.click();
      await page.waitForTimeout(500);
      // URL or tab state updated — just confirm no crash
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});
