// Run: node scripts/test-email.mjs
// Tests Resend directly using the same env vars as the production app
import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually
const envPath = resolve(process.cwd(), ".env");
const env = {};
try {
  readFileSync(envPath, "utf8").split("\n").forEach(line => {
    const [k, ...v] = line.split("=");
    if (k && !k.startsWith("#")) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
  });
  Object.assign(process.env, env);
} catch {}

const RESEND_API_KEY      = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL   = process.env.RESEND_FROM_EMAIL || "Clear Build USA <onboarding@resend.dev>";
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

console.log("\n── Email Config ──────────────────────────────");
console.log("RESEND_API_KEY:     ", RESEND_API_KEY ? `${RESEND_API_KEY.slice(0,10)}... ✓` : "MISSING ❌");
console.log("RESEND_FROM_EMAIL:  ", RESEND_FROM_EMAIL);
console.log("NEXT_PUBLIC_APP_URL:", NEXT_PUBLIC_APP_URL || "MISSING ❌ (links go to localhost)");
console.log("─────────────────────────────────────────────\n");

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY is not set in .env — emails are mocked and never sent.");
  process.exit(1);
}

// Dynamic import of resend
const { Resend } = await import("resend");
const resend = new Resend(RESEND_API_KEY);

// Send to your own email to test
const TEST_TO = process.argv[2];
if (!TEST_TO) {
  console.error("Usage: node scripts/test-email.mjs your@email.com");
  process.exit(1);
}

console.log(`Sending test email to: ${TEST_TO}`);
console.log(`FROM: ${RESEND_FROM_EMAIL}\n`);

const { data, error } = await resend.emails.send({
  from: RESEND_FROM_EMAIL,
  to: TEST_TO,
  subject: "Clear Build USA — Email Test",
  html: "<p>✅ Email is working! Sent at: " + new Date().toISOString() + "</p>",
});

if (data) {
  console.log("✅ SUCCESS — Email sent!");
  console.log("   Resend Email ID:", data.id);
  console.log("   Check your inbox (and spam folder).");
} else {
  console.error("❌ FAILED — Resend error:");
  console.error("   Status:", error?.statusCode);
  console.error("   Name:  ", error?.name);
  console.error("   Message:", JSON.stringify(error));
  console.log("\nCommon fixes:");
  if (error?.name === "invalid_from_address") {
    console.log("  → Your FROM domain is not verified in Resend.");
    console.log("  → Go to resend.com → Domains → Add clearbuildusa.com");
    console.log("  → Add the DNS records Resend gives you in Hostinger DNS panel.");
  }
  if (error?.name === "invalid_api_key" || error?.name === "missing_api_key") {
    console.log("  → Your RESEND_API_KEY is wrong or expired.");
    console.log("  → Go to resend.com → API Keys and create a new one.");
  }
  if (error?.name === "daily_quota_exceeded" || error?.name === "monthly_quota_exceeded") {
    console.log("  → You've hit Resend's sending limit for your plan.");
    console.log("  → Upgrade your Resend plan or wait until the quota resets.");
  }
}
