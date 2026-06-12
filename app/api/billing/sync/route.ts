import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getStripe, planForPriceId } from "@/lib/stripe";

/**
 * Fallback sync: pull subscription state from Stripe directly.
 * Called client-side after a successful checkout redirect so the DB
 * is updated even if the webhook hasn't fired (or isn't configured).
 *
 * Accepts an optional checkout `session_id` so the very first subscribe
 * works without depending on the webhook to store the subscription id.
 */
export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { session_id } = await request.json().catch(() => ({} as { session_id?: string }));

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("business_id", session.businessId)
    .single();

  try {
    const stripe = getStripe();
    let stripeSubId = sub?.stripe_subscription_id as string | null;
    let stripeCustomerId = sub?.stripe_customer_id as string | null;

    // First subscribe: webhook may not have stored the subscription id yet —
    // resolve it from the checkout session instead.
    if (session_id) {
      const cs = await stripe.checkout.sessions.retrieve(session_id);
      // Never trust a session that belongs to another business
      if (cs.metadata?.businessId === session.businessId && cs.subscription) {
        stripeSubId = typeof cs.subscription === "string" ? cs.subscription : cs.subscription.id;
        stripeCustomerId = (typeof cs.customer === "string" ? cs.customer : cs.customer?.id) ?? stripeCustomerId;
      }
    }

    if (!stripeSubId) {
      return NextResponse.json({ message: "No Stripe subscription found" }, { status: 404 });
    }

    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId) as any;

    const priceId = stripeSub.items?.data[0]?.price?.id;
    const plan = planForPriceId(priceId ?? "");
    const [planName, cycle] = plan.split("_");
    const rawPeriodEnd = stripeSub.current_period_end ?? stripeSub.items?.data[0]?.current_period_end;
    const periodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : null;

    await supabase.from("subscriptions").upsert({
      business_id: session.businessId,
      plan: planName || "pro",
      billing_cycle: cycle === "yearly" ? "yearly" : "monthly",
      stripe_price_id: priceId ?? null,
      stripe_subscription_id: stripeSubId,
      stripe_customer_id: stripeCustomerId,
      status: stripeSub.status,
      current_period_end: periodEnd,
      renews_at: periodEnd,
      cancel_at_period_end: stripeSub.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "business_id" });

    if (stripeCustomerId) {
      await supabase.from("businesses").update({ stripe_customer_id: stripeCustomerId }).eq("id", session.businessId);
    }

    return NextResponse.json({ message: "Synced" });
  } catch (err) {
    console.error("[billing/sync] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ message: "Sync failed" }, { status: 500 });
  }
}
