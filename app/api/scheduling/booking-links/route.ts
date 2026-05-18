import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { checkTrialAccess } from "@/lib/trial";
import { logAudit } from "@/lib/audit";
import crypto from "crypto";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("booking_links")
    .select("*, contacts(id, full_name, email, phone), booking_link_slots(slot_id, scheduling_slots(*))")
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ links: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;

  const body = await request.json();
  if (!body.title?.trim()) return NextResponse.json({ message: "Title is required" }, { status: 400 });
  if (!body.slot_ids?.length) return NextResponse.json({ message: "At least one slot is required" }, { status: 400 });

  const token = crypto.randomBytes(24).toString("hex");

  const { data: link, error } = await supabase
    .from("booking_links")
    .insert({
      business_id: session.businessId,
      created_by: session.id,
      token,
      title: body.title.trim(),
      purpose: body.purpose ?? null,
      contact_id: body.contact_id ?? null,
      expiry_date: body.expiry_date ?? null,
      internal_notes: body.internal_notes ?? null,
      message_to_recipient: body.message_to_recipient ?? null,
      status: "active",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: "Failed to create link" }, { status: 500 });

  const slotJoins = (body.slot_ids as string[]).map((sid: string) => ({
    booking_link_id: link.id,
    slot_id: sid,
  }));
  await supabase.from("booking_link_slots").insert(slotJoins);

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "booking_link",
    entityId: link.id,
    action: "booking_link_created",
    payload: { title: link.title, token },
  });

  return NextResponse.json({ link: { ...link, booking_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${token}` } }, { status: 201 });
}
