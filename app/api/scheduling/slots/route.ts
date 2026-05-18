import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { checkTrialAccess } from "@/lib/trial";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");
  let q = supabase
    .from("scheduling_slots")
    .select("*")
    .eq("business_id", session.businessId)
    .order("slot_date")
    .order("start_time");

  if (status) q = q.eq("status", status);

  const { data } = await q;
  return NextResponse.json({ slots: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;

  const body = await request.json();
  if (!body.slot_date) return NextResponse.json({ message: "Date is required" }, { status: 400 });

  const slots: Record<string, unknown>[] = [];
  const baseSlot = {
    business_id: session.businessId,
    created_by: session.id,
    slot_date: body.slot_date,
    start_time: body.start_time ?? null,
    end_time: body.end_time ?? null,
    purpose: body.purpose ?? null,
    meeting_type: body.meeting_type ?? "Consultation",
    location: body.location ?? null,
    notes: body.notes ?? null,
    time_zone: body.time_zone ?? "America/New_York",
    repeat_option: body.repeat_option ?? "none",
    status: "available",
  };

  const repeat = body.repeat_option ?? "none";
  const repeatCount = Math.min(parseInt(body.repeat_count ?? "1", 10), 52);

  if (repeat === "none") {
    slots.push(baseSlot);
  } else {
    for (let i = 0; i < repeatCount; i++) {
      const d = new Date(body.slot_date);
      if (repeat === "daily") d.setDate(d.getDate() + i);
      else if (repeat === "weekly") d.setDate(d.getDate() + i * 7);
      else if (repeat === "monthly") d.setMonth(d.getMonth() + i);
      else d.setDate(d.getDate() + i);
      slots.push({ ...baseSlot, slot_date: d.toISOString().split("T")[0] });
    }
  }

  const { data, error } = await supabase.from("scheduling_slots").insert(slots).select();
  if (error) return NextResponse.json({ message: "Failed to create slot(s)" }, { status: 500 });

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "scheduling_slot",
    action: "slot_created",
    payload: { count: slots.length, date: body.slot_date },
  });

  return NextResponse.json({ slots: data }, { status: 201 });
}
