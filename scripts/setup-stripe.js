#!/usr/bin/env node
/**
 * Run once to create Stripe products + prices for all 6 plans.
 * Usage: node scripts/setup-stripe.js
 */

const path = require("path");
const fs   = require("fs");

// Load .env from project root (works whether you run from project root or scripts/)
const envPath = path.resolve(__dirname, "../.env");
if (!fs.existsSync(envPath)) {
  console.log("ERROR: .env file not found at", envPath);
  process.exit(1);
}
require("dotenv").config({ path: envPath });

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.log("ERROR: STRIPE_SECRET_KEY is not set in .env");
  process.exit(1);
}

const Stripe = require("stripe");
const stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });

const PLANS = [
  {
    name: "Solo",
    description: "For one-person shops getting started.",
    monthly: { amount: 1900,   envKey: "STRIPE_PRICE_SOLO_MONTHLY" },
    yearly:  { amount: 15000,  envKey: "STRIPE_PRICE_SOLO_YEARLY" },
    metadata: { plan: "solo" },
  },
  {
    name: "Pro",
    description: "Most popular for small crews.",
    monthly: { amount: 4900,   envKey: "STRIPE_PRICE_PRO_MONTHLY" },
    yearly:  { amount: 39000,  envKey: "STRIPE_PRICE_PRO_YEARLY" },
    metadata: { plan: "pro" },
  },
  {
    name: "Business",
    description: "For multi-crew companies.",
    monthly: { amount: 12900,  envKey: "STRIPE_PRICE_BUSINESS_MONTHLY" },
    yearly:  { amount: 99000,  envKey: "STRIPE_PRICE_BUSINESS_YEARLY" },
    metadata: { plan: "business" },
  },
];

async function main() {
  const isTest = key.startsWith("sk_test_");
  console.log("Connected to Stripe (" + (isTest ? "TEST" : "LIVE") + " mode)");
  console.log("Using key: " + key.slice(0, 12) + "...");
  console.log("");

  const results = {};

  for (const plan of PLANS) {
    console.log("Creating product: " + plan.name + "...");
    let product;
    try {
      product = await stripe.products.create({
        name: "Clear Build — " + plan.name,
        description: plan.description,
        metadata: plan.metadata,
      });
      console.log("  Product created: " + product.id);
    } catch (err) {
      console.log("  ERROR creating product: " + err.message);
      continue;
    }

    try {
      const monthly = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthly.amount,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { plan: plan.metadata.plan, cycle: "monthly" },
      });
      console.log("  Monthly price: " + monthly.id);
      results[plan.monthly.envKey] = monthly.id;
    } catch (err) {
      console.log("  ERROR creating monthly price: " + err.message);
    }

    try {
      const yearly = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearly.amount,
        currency: "usd",
        recurring: { interval: "year" },
        metadata: { plan: plan.metadata.plan, cycle: "yearly" },
      });
      console.log("  Yearly price:   " + yearly.id);
      results[plan.yearly.envKey] = yearly.id;
    } catch (err) {
      console.log("  ERROR creating yearly price: " + err.message);
    }

    console.log("");
  }

  if (Object.keys(results).length === 0) {
    console.log("No prices were created. Check the errors above.");
    process.exit(1);
  }

  console.log("------------------------------------------------------------");
  console.log("Add these to your .env file:");
  console.log("");
  for (const [k, v] of Object.entries(results)) {
    console.log(k + '="' + v + '"');
  }
  console.log("");
  console.log("Done!");
}

main().catch(function(err) {
  console.log("UNEXPECTED ERROR: " + err.message);
  console.log(err.stack);
  process.exit(1);
});
