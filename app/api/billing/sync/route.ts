import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getStripe, planForPriceId } from "@/lib/stripe";

/**
 * Fallback sync: pull subscription state from Stripe directly.
 * Called client-side after a successful checkout redirect so the DB
 * is updated even if the webhook hasn't fired yet.
 */
export async function POST() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("business_id", session.businessId)
    .single();

  if (!sub?.stripe_subscription_id) {
    return NextResponse.json({ message: "No Stripe subscription found" }, { status: 404 });
  }

  try {
    const stripe = getStripe();
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id) as any;

    const priceId = stripeSub.items?.data[0]?.price?.id;
    const plan = planForPriceId(priceId ?? "");
    const [planName, cycle] = plan.split("_");
    const periodEnd = stripeSub.current_period_end
      ? new Date(stripeSub.current_period_end * 1000).toISOString()
      : null;

    await supabase.from("subscriptions").update({
      plan: planName || "pro",
      billing_cycle: cycle === "yearly" ? "yearly" : "monthly",
      stripe_price_id: priceId ?? null,
      status: stripeSub.status,
      current_period_end: periodEnd,
      renews_at: periodEnd,
      cancel_at_period_end: stripeSub.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    }).eq("business_id", session.businessId);

    return NextResponse.json({ message: "Synced" });
  } catch (err) {
    return NextResponse.json({ message: "Sync failed" }, { status: 500 });
  }
}
