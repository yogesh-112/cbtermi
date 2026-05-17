import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getStripe, planForPriceId } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) return NextResponse.json({ message: "Missing signature" }, { status: 400 });

  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const cs = event.data.object;
      const businessId = cs.metadata?.businessId;
      const customerId = cs.customer as string;
      const subscriptionId = cs.subscription as string;
      if (!businessId) break;
      await supabase.from("businesses").update({ stripe_customer_id: customerId }).eq("id", businessId);
      await supabase.from("subscriptions").upsert(
        { business_id: businessId, stripe_customer_id: customerId, stripe_subscription_id: subscriptionId, status: "active", updated_at: new Date().toISOString() },
        { onConflict: "business_id" }
      );
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      const priceId = sub.items.data[0]?.price.id;
      const plan = planForPriceId(priceId ?? "");
      const [planName, cycle] = plan.split("_");
      await supabase.from("subscriptions").update({
        plan: planName,
        billing_cycle: cycle === "yearly" ? "yearly" : "monthly",
        stripe_price_id: priceId,
        status: sub.status,
        current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: (sub as any).cancel_at_period_end,
        renews_at: new Date((sub as any).current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("stripe_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await supabase.from("subscriptions").update({
        status: "cancelled",
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      }).eq("stripe_subscription_id", sub.id);
      break;
    }

    case "invoice.payment_failed": {
      const inv = event.data.object;
      const subscriptionId = (inv as any).subscription as string;
      if (subscriptionId) {
        await supabase.from("subscriptions").update({ status: "past_due", updated_at: new Date().toISOString() }).eq("stripe_subscription_id", subscriptionId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
