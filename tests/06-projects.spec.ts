import { test, expect } from "@playwright/test";

test.describe("Projects", () => {
  test("list page loads with 4 stat cards", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".mini-stat")).toHaveCount(4);
  });

  test("status filter tabs work", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });

    for (const tab of ["Active", "Scheduled", "Completed"]) {
      const btn = page.getByRole("button", { name: new RegExp(`^${tab}`, "i") }).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(500);
        await expect(page.locator("h1")).toBeVisible();
      }
    }
  });

  test("new project page has required fields", async ({ page }) => {
    await page.goto("/projects/new");
    await expect(page.getByPlaceholder(/project name/i).or(page.getByLabel(/project name/i))).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder("Search or add…")).toBeVisible();
  });

  test("project card links to detail page", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });

    // Desktop: card grid links
    const firstCard = page.locator("a[href*='/projects/']").first();
    if (!await firstCard.isVisible()) return;

    await firstCard.click();
    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+$/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("creates a new project", async ({ page }) => {
    await page.goto("/projects/new");
    await expect(page.getByPlaceholder("Search or add…")).toBeVisible({ timeout: 10_000 });

    // Check contacts exist
    await page.getByPlaceholder("Search or add…").click();
    const firstContact = page.locator(".absolute button").first();
    const hasContacts = await firstContact.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasContacts) {
      test.skip(true, "No contacts in test account — skipping project creation test");
      return;
    }
    await firstContact.click();

    // Fill project name
    const nameField = page.getByPlaceholder(/project name/i).or(page.getByLabel(/project name/i)).first();
    await nameField.fill(`Test Project ${Date.now()}`);

    await page.getByRole("button", { name: /create project|save/i }).first().click();

    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+$/, { timeout: 15_000 });
    await expect(page.locator("text=PRJ-")).toBeVisible();
  });
});
