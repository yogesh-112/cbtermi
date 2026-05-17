import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, canAdminDo } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/admin-audit";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canAdminDo(session.role, "support")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { action, days } = await request.json();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, trial_ends_at, business_id")
    .eq("id", id)
    .single();

  if (!sub) return NextResponse.json({ message: "Not found" }, { status: 404 });

  if (action === "extend_trial") {
    const extendDays = Math.min(Math.max(1, parseInt(days) || 7), 90);
    const base = sub.trial_ends_at ? new Date(sub.trial_ends_at) : new Date();
    const newTrialEnd = new Date(base.getTime() + extendDays * 86400000);

    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        trial_ends_at: newTrialEnd.toISOString(),
        status: "trialing",
        trial_extended_at: new Date().toISOString(),
        trial_extended_by: session.id,
        trial_extended_days: extendDays,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    await logAdminAudit({
      adminId: session.id,
      action: "trial_extended",
      entityType: "subscription",
      entityId: id,
      payload: { businessId: sub.business_id, days: extendDays, newTrialEnd: newTrialEnd.toISOString() },
    });

    return NextResponse.json({ subscription: data });
  }

  return NextResponse.json({ message: "Unknown action" }, { status: 400 });
}
