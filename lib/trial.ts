import { supabase } from "./supabase";
import { NextResponse } from "next/server";

/** Returns a 403 response if the business is in restricted mode or trial has expired, otherwise null. */
export async function checkTrialAccess(businessId: string): Promise<NextResponse | null> {
  const { data: biz } = await supabase
    .from("businesses")
    .select("restricted_mode, trial_ends_at")
    .eq("id", businessId)
    .single();

  if (!biz) return null; // can't determine — let through

  if (biz.restricted_mode) {
    return NextResponse.json(
      { message: "Your account is in restricted mode. Please upgrade your subscription to continue." },
      { status: 403 }
    );
  }

  // An active paid subscription always grants access, regardless of the
  // original trial window.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, trial_ends_at")
    .eq("business_id", businessId)
    .single();

  if (sub && sub.plan !== "trial" && ["active", "trialing", "past_due"].includes(sub.status)) {
    return null;
  }

  // Trial window: prefer the subscription row's trial_ends_at, fall back to the business column
  const trialEndsAt = sub?.trial_ends_at ?? biz.trial_ends_at;
  if (trialEndsAt && new Date(trialEndsAt) < new Date()) {
    return NextResponse.json(
      { message: "Your free trial has ended. Please upgrade your subscription to continue creating or editing records." },
      { status: 403 }
    );
  }

  return null;
}
