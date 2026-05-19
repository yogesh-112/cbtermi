import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error("Set TEST_EMAIL and TEST_PASSWORD in .env.test before running tests.");
  }

  // Call the login API directly from the page context so Set-Cookie is applied
  // to the browser's cookie jar — avoids any UI form submission quirks.
  const res = await page.request.post("/api/auth/login", {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok()) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as Record<string, string>).message ?? "unknown error";
    throw new Error(
      `Login API returned ${res.status()}: "${msg}"\n` +
      `→ Check TEST_EMAIL and TEST_PASSWORD in .env.test are correct and the account's email is verified.`
    );
  }

  // Navigate to dashboard — middleware will pass if the session cookie was set
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await page.context().storageState({ path: authFile });
});
