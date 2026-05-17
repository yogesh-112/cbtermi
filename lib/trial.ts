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

  if (biz.trial_ends_at && new Date(biz.trial_ends_at) < new Date()) {
    return NextResponse.json(
      { message: "Your free trial has ended. Please upgrade your subscription to continue creating or editing records." },
      { status: 403 }
    );
  }

  return null;
}
