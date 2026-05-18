import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const allowed = ["title","purpose","expiry_date","internal_notes","message_to_recipient","status"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];

  const { data, error } = await supabase
    .from("booking_links")
    .update(updates)
    .eq("id", id)
    .eq("business_id", session.businessId)
    .select()
    .single();

  if (error) return NextResponse.json({ message: "Update failed" }, { status: 500 });

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "booking_link",
    entityId: id,
    action: "booking_link_canceled",
  });

  return NextResponse.json({ link: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await supabase.from("booking_links").delete().eq("id", id).eq("business_id", session.businessId);
  return NextResponse.json({ ok: true });
}
