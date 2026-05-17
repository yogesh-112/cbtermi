import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
  }
  return _stripe;
}

const PRICE_MAP: Record<string, string | undefined> = {
  solo_monthly:     process.env.STRIPE_PRICE_SOLO_MONTHLY,
  solo_yearly:      process.env.STRIPE_PRICE_SOLO_YEARLY,
  pro_monthly:      process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly:       process.env.STRIPE_PRICE_PRO_YEARLY,
  business_monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
  business_yearly:  process.env.STRIPE_PRICE_BUSINESS_YEARLY,
};

const REVERSE_MAP: Record<string, string> = {};
for (const [plan, price] of Object.entries(PRICE_MAP)) {
  if (price) REVERSE_MAP[price] = plan;
}

export function priceIdForPlan(planId: string): string | undefined {
  return PRICE_MAP[planId];
}

export function planForPriceId(priceId: string): string {
  return REVERSE_MAP[priceId] ?? "pro_monthly";
}
