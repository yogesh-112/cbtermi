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

  // Extend the trial so create-flow tests are not blocked by checkTrialAccess
  const testSecret = process.env.PLAYWRIGHT_TEST_SECRET;
  if (testSecret) {
    const extendRes = await page.request.post("/api/test/setup", {
      headers: { "Content-Type": "application/json", "x-test-secret": testSecret },
    });
    if (!extendRes.ok()) {
      const body = await extendRes.json().catch(() => ({}));
      throw new Error(`Trial extension failed (${extendRes.status()}): ${JSON.stringify(body)}\n→ Ensure PLAYWRIGHT_TEST_SECRET matches on the server.`);
    }
  }

  // Seed a contact so quote/invoice/project create tests always have one to select
  const existing = await page.request.get("/api/contacts?limit=1");
  const existingData = await existing.json().catch(() => ({ contacts: [] }));
  const hasContacts = Array.isArray(existingData?.contacts)
    ? existingData.contacts.length > 0
    : Array.isArray(existingData) && existingData.length > 0;

  if (!hasContacts) {
    const seeded = await page.request.post("/api/contacts", {
      data: {
        full_name: "Playwright Seed Contact",
        email: "playwright.seed@example.com",
        phone: "+15550009999",
        contact_type: "lead",
        lead_status: "New Lead",
      },
      headers: { "Content-Type": "application/json" },
    });
    if (!seeded.ok()) {
      const err = await seeded.json().catch(() => ({}));
      throw new Error(`Failed to seed contact: ${JSON.stringify(err)}`);
    }
  }

  await page.context().storageState({ path: authFile });
});
