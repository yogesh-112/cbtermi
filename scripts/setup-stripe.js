#!/usr/bin/env node
/**
 * Run once to create Stripe products + prices for all 6 plans.
 * Usage: node scripts/setup-stripe.js
 *
 * Requires STRIPE_SECRET_KEY in your .env (test or live).
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-04-22.dahlia",
});

const PLANS = [
  {
    name: "Solo",
    description: "For one-person shops getting started.",
    monthly: { amount: 1900, envKey: "STRIPE_PRICE_SOLO_MONTHLY" },
    yearly:  { amount: 15000, envKey: "STRIPE_PRICE_SOLO_YEARLY" },  // $15 × 12 billed upfront
    metadata: { plan: "solo" },
  },
  {
    name: "Pro",
    description: "Most popular for small crews.",
    monthly: { amount: 4900, envKey: "STRIPE_PRICE_PRO_MONTHLY" },
    yearly:  { amount: 39000, envKey: "STRIPE_PRICE_PRO_YEARLY" },   // $39 × 12
    metadata: { plan: "pro" },
  },
  {
    name: "Business",
    description: "For multi-crew companies.",
    monthly: { amount: 12900, envKey: "STRIPE_PRICE_BUSINESS_MONTHLY" },
    yearly:  { amount: 99000, envKey: "STRIPE_PRICE_BUSINESS_YEARLY" }, // $99 × 12
    metadata: { plan: "business" },
  },
];

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Error: STRIPE_SECRET_KEY is not set in .env");
    process.exit(1);
  }

  const isTest = process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");
  console.log(`\nConnected to Stripe (${isTest ? "TEST" : "LIVE"} mode)\n`);

  const results = {};

  for (const plan of PLANS) {
    process.stdout.write(`Creating product: ${plan.name}… `);
    const product = await stripe.products.create({
      name: `Clear Build — ${plan.name}`,
      description: plan.description,
      metadata: plan.metadata,
    });
    console.log(`✓ ${product.id}`);

    process.stdout.write(`  Monthly price ($${plan.monthly.amount / 100}/mo)… `);
    const monthly = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthly.amount,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { plan: plan.metadata.plan, cycle: "monthly" },
    });
    console.log(`✓ ${monthly.id}`);
    results[plan.monthly.envKey] = monthly.id;

    process.stdout.write(`  Yearly price ($${plan.yearly.amount / 100}/yr billed annually)… `);
    const yearly = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.yearly.amount,
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { plan: plan.metadata.plan, cycle: "yearly" },
    });
    console.log(`✓ ${yearly.id}`);
    results[plan.yearly.envKey] = yearly.id;

    console.log();
  }

  console.log("─".repeat(60));
  console.log("Add these to your .env file:\n");
  for (const [key, value] of Object.entries(results)) {
    console.log(`${key}="${value}"`);
  }
  console.log("\nDone.");
}

main().catch(err => {
  console.error("\nFailed:", err.message);
  process.exit(1);
});
