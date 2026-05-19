import { test, expect } from "@playwright/test";

// These tests run without the saved auth session
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentication", () => {
  test("redirects unauthenticated user to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows error for wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("wrong@example.com");
    await page.getByPlaceholder("••••••••").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Error message appears in the form
    await expect(page.locator(".text-brand-rose, [class*='text-red']").first()).toBeVisible({ timeout: 8_000 });
  });

  test("logs in successfully and lands on dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(process.env.TEST_EMAIL!);
    await page.getByPlaceholder("••••••••").fill(process.env.TEST_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    // Check page content loaded (h1 greeting is always visible on all viewports)
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    // Logout button is in the topbar which is hidden on mobile
    if ((page.viewportSize()?.width ?? 1280) < 1024) return;
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(process.env.TEST_EMAIL!);
    await page.getByPlaceholder("••••••••").fill(process.env.TEST_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Open user menu (has aria-label="Open user menu")
    await page.getByRole("button", { name: /open user menu/i }).click();
    // Wait for dropdown to appear then click logout
    await page.getByRole("button", { name: /sign out/i }).waitFor({ state: "visible" });
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL(/\/login/, { timeout: 15_000 });

    // Confirm session is cleared
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
