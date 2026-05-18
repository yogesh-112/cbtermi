import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const allowed = ["slot_date","start_time","end_time","purpose","meeting_type","location","notes","time_zone","status"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];

  const { data, error } = await supabase
    .from("scheduling_slots")
    .update(updates)
    .eq("id", id)
    .eq("business_id", session.businessId)
    .select()
    .single();

  if (error) return NextResponse.json({ message: "Update failed" }, { status: 500 });

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "scheduling_slot",
    entityId: id,
    action: "slot_edited",
  });

  return NextResponse.json({ slot: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data: slot } = await supabase
    .from("scheduling_slots")
    .select("status")
    .eq("id", id)
    .eq("business_id", session.businessId)
    .single();

  if (!slot) return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (slot.status === "booked") return NextResponse.json({ message: "Cannot delete a booked slot" }, { status: 400 });

  await supabase.from("scheduling_slots").delete().eq("id", id);

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "scheduling_slot",
    entityId: id,
    action: "slot_canceled",
  });

  return NextResponse.json({ ok: true });
}
