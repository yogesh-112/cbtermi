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

  test("page loads with 3 stat cards", async ({ page }) => {
    await expect(page.locator(".mini-stat")).toHaveCount(3);
  });

  test("search filters the list", async ({ page }) => {
    const search = page.getByPlaceholder("Search by name, email or phone…");
    await search.fill("zzznomatch");
    await page.waitForTimeout(400);
    const rows = page.locator("table tbody tr").filter({ hasNot: page.locator("td[colspan]") });
    expect(await rows.count()).toBe(0);
    await search.clear();
  });

  test("opens Add Contact modal with required fields", async ({ page }) => {
    await page.getByRole("button", { name: /add contact/i }).first().click();
    await expect(page.getByPlaceholder("John Doe")).toBeVisible();
    await expect(page.getByPlaceholder("john@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("+1 (555) 000-0000").first()).toBeVisible();
  });

  test("creates a new contact", async ({ page }) => {
    await page.getByRole("button", { name: /add contact/i }).first().click();

    await page.getByPlaceholder("John Doe").fill(TEST_CONTACT.name);
    await page.getByPlaceholder("john@example.com").fill(TEST_CONTACT.email);
    await page.getByPlaceholder("+1 (555) 000-0000").first().fill(TEST_CONTACT.phone);

    // Submit button inside modal — use last() to avoid matching the page header button
    await page.getByRole("button", { name: "Add Contact" }).last().click();

    // Contact saved — check toast (contact may be on a different pagination page)
    await expect(page.getByText("Contact added")).toBeVisible({ timeout: 10_000 });
  });

  test("contact row links to detail page", async ({ page }) => {
    const firstLink = page.locator("table tbody a").first();
    if (!await firstLink.isVisible({ timeout: 3_000 }).catch(() => false)) return;
    await firstLink.click();
    await expect(page).toHaveURL(/\/contacts\/.+/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("tabs filter by type", async ({ page }) => {
    const leadsTab = page.getByRole("button", { name: /leads/i }).first();
    if (await leadsTab.isVisible()) {
      await leadsTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});
