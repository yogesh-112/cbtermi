import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { getStripe, priceIdForPlan } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { planId, couponCode } = await request.json();
  const priceId = priceIdForPlan(planId);
  if (!priceId) return NextResponse.json({ message: "Invalid plan" }, { status: 400 });

  const { data: biz } = await supabase.from("businesses").select("name, email, stripe_customer_id").eq("id", session.businessId).single();
  const { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("business_id", session.businessId).single();

  const customerId = biz?.stripe_customer_id || sub?.stripe_customer_id || undefined;

  // Look up Stripe promotion code ID from our coupon_codes table
  let stripePromoCodeId: string | null = null;
  if (couponCode) {
    const { data: coupon } = await supabase
      .from("coupon_codes")
      .select("stripe_coupon_id, uses_count, max_uses, expires_at, is_active")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (coupon?.stripe_coupon_id) {
      const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
      const exhausted = coupon.max_uses && coupon.uses_count >= coupon.max_uses;
      if (!expired && !exhausted) {
        stripePromoCodeId = coupon.stripe_coupon_id;
        // Increment uses_count
        await supabase.from("coupon_codes")
          .update({ uses_count: (coupon.uses_count ?? 0) + 1 })
          .eq("code", couponCode.toUpperCase());
      }
    }
  }

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(customerId ? { customer: customerId } : { customer_email: biz?.email ?? session.email }),
    metadata: { businessId: session.businessId },
    subscription_data: { metadata: { businessId: session.businessId } },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
    // Use promo code if available, otherwise allow manual entry at checkout
    ...(stripePromoCodeId
      ? { discounts: [{ promotion_code: stripePromoCodeId }] }
      : { allow_promotion_codes: true }),
  });

  return NextResponse.json({ url: checkoutSession.url });
}
