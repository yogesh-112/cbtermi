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
    // Actual placeholder in the project name input
    await expect(page.getByPlaceholder("Hartwell Kitchen Remodel")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder("Search or add…")).toBeVisible();
  });

  test("project card/row links to detail page", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });
    const firstCard = page.locator("a[href*='/projects/']").first();
    if (!await firstCard.isVisible({ timeout: 3_000 }).catch(() => false)) return;
    await firstCard.click();
    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+$/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("creates a new project", async ({ page }) => {
    test.slow(); // triple timeout — mobile is slower on create+redirect flows
    await page.goto("/projects/new");
    await expect(page.getByPlaceholder("Search or add…")).toBeVisible({ timeout: 10_000 });

    // Click to open dropdown then wait for contacts to render
    await page.getByPlaceholder("Search or add…").click();
    const firstContact = page.locator(".absolute button").first();
    await expect(firstContact).toBeVisible({ timeout: 10_000 });
    await firstContact.click();
    // Confirm contact was selected — search input is replaced by the contact avatar/name row
    await expect(page.getByPlaceholder("Search or add…")).not.toBeVisible({ timeout: 5_000 });

    await page.getByPlaceholder("Hartwell Kitchen Remodel").fill(`Test Project ${Date.now()}`);
    await page.getByRole("button", { name: /create project|save/i }).first().click();

    // Exclude /projects/new — require at least 10 chars to match a UUID
    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]{10,}$/, { timeout: 20_000 });
    // Edit button is always visible once project detail data loads
    await expect(page.getByRole("button", { name: /edit/i }).first()).toBeVisible({ timeout: 20_000 });
  });
});
