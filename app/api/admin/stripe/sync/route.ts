import { NextResponse } from "next/server";
import { requireAdminSession, canAdminDo } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/admin-audit";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

export async function POST() {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canAdminDo(session.role, "billing")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ message: "Stripe not configured" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Get all subscriptions from DB that have stripe IDs
  const { data: dbSubs } = await supabase
    .from("subscriptions")
    .select("id, stripe_subscription_id, stripe_customer_id, business_id")
    .not("stripe_subscription_id", "is", null);

  if (!dbSubs?.length) {
    return NextResponse.json({ synced: 0, message: "No Stripe subscriptions to sync" });
  }

  let synced = 0;
  let failed = 0;

  for (const dbSub of dbSubs) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(dbSub.stripe_subscription_id!);
      const statusMap: Record<string, string> = {
        active:             "active",
        trialing:           "trialing",
        past_due:           "past_due",
        canceled:           "canceled",
        incomplete:         "past_due",
        incomplete_expired: "canceled",
        unpaid:             "past_due",
        paused:             "canceled",
      };
      const update: Record<string, unknown> = {
        status: statusMap[stripeSub.status] ?? stripeSub.status,
      };
      if (stripeSub.trial_end) {
        update.trial_ends_at = new Date(stripeSub.trial_end * 1000).toISOString();
      }
      await supabase.from("subscriptions").update(update).eq("id", dbSub.id);
      synced++;
    } catch {
      failed++;
    }
  }

  await logAdminAudit({
    adminId: session.id,
    action: "stripe_sync",
    payload: { synced, failed, total: dbSubs.length },
  });

  return NextResponse.json({ synced, failed, total: dbSubs.length });
}
