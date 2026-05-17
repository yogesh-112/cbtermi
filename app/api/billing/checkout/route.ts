import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { getStripe, priceIdForPlan } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { planId } = await request.json();
  const priceId = priceIdForPlan(planId);
  if (!priceId) return NextResponse.json({ message: "Invalid plan" }, { status: 400 });

  const { data: biz } = await supabase.from("businesses").select("name, email, stripe_customer_id").eq("id", session.businessId).single();
  const { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("business_id", session.businessId).single();

  const customerId = biz?.stripe_customer_id || sub?.stripe_customer_id || undefined;

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(customerId ? { customer: customerId } : { customer_email: biz?.email ?? session.email }),
    metadata: { businessId: session.businessId },
    subscription_data: { metadata: { businessId: session.businessId } },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
