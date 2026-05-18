import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("user_tour_status")
    .select("*")
    .eq("user_id", session.id)
    .eq("business_id", session.businessId)
    .single();

  return NextResponse.json({ tour: data ?? { status: "not_started", completed_steps: [] } });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const status = body.status as string;
  const completedSteps: number[] = body.completed_steps ?? [];

  const { data: existing } = await supabase
    .from("user_tour_status")
    .select("id")
    .eq("user_id", session.id)
    .eq("business_id", session.businessId)
    .single();

  if (existing) {
    await supabase
      .from("user_tour_status")
      .update({ status, completed_steps: completedSteps, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("user_tour_status").insert({
      user_id: session.id,
      business_id: session.businessId,
      status,
      completed_steps: completedSteps,
    });
  }

  if (status === "skipped" || status === "completed") {
    await logAudit({
      businessId: session.businessId,
      userId: session.id,
      entityType: "tour",
      action: status === "skipped" ? "tour_skipped" : "tour_completed",
    });
  }

  return NextResponse.json({ ok: true });
}
