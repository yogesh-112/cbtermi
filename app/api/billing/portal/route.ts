import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data: biz } = await supabase.from("businesses").select("stripe_customer_id").eq("id", session.businessId).single();
  const { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("business_id", session.businessId).single();

  const customerId = biz?.stripe_customer_id || sub?.stripe_customer_id;
  if (!customerId) return NextResponse.json({ message: "No billing account found. Please subscribe first." }, { status: 404 });

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
  });

  return NextResponse.json({ url: portalSession.url });
}
