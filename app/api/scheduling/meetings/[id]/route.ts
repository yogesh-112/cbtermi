import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const allowed = ["status","notes","purpose"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];

  const { data, error } = await supabase
    .from("scheduled_meetings")
    .update(updates)
    .eq("id", id)
    .eq("business_id", session.businessId)
    .select("*, scheduling_slots(*), contacts(full_name)")
    .single();

  if (error) return NextResponse.json({ message: "Update failed" }, { status: 500 });

  const newStatus = body.status as string;
  if (newStatus === "canceled" || newStatus === "completed") {
    await logAudit({
      businessId: session.businessId,
      userId: session.id,
      entityType: "scheduled_meeting",
      entityId: id,
      action: newStatus === "canceled" ? "meeting_canceled" : "meeting_completed",
    });

    if (newStatus === "canceled" && data.slot_id) {
      await supabase
        .from("scheduling_slots")
        .update({ status: "available", updated_at: new Date().toISOString() })
        .eq("id", data.slot_id);
    }
  }

  return NextResponse.json({ meeting: data });
}
