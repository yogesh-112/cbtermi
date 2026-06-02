import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";
import { logAudit } from "@/lib/audit";

async function getOpp(id: string, businessId: string) {
  const { data } = await supabase
    .from("opportunities")
    .select("*, contacts(id, full_name, email, phone)")
    .eq("id", id)
    .eq("business_id", businessId)
    .single();
  return data;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const opp = await getOpp(id, session.businessId);
  if (!opp) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Fetch linked quotes
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, status, created_at")
    .eq("business_id", session.businessId)
    .eq("opportunity_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ opportunity: opp, quotes: quotes ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;

  const { id } = await params;
  const existing = await getOpp(id, session.businessId);
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.name               !== undefined) updates.name               = body.name?.trim();
  if (body.contact_id         !== undefined) updates.contact_id         = body.contact_id || null;
  if (body.project_type       !== undefined) updates.project_type       = body.project_type || null;
  if (body.property_address   !== undefined) updates.property_address   = body.property_address?.trim() || null;
  if (body.estimated_value    !== undefined) updates.estimated_value    = body.estimated_value ? parseFloat(body.estimated_value) : null;
  if (body.expected_start_date !== undefined) updates.expected_start_date = body.expected_start_date || null;
  if (body.status             !== undefined) updates.status             = body.status;
  if (body.priority           !== undefined) updates.priority           = body.priority;
  if (body.notes              !== undefined) updates.notes              = body.notes?.trim() || null;

  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .update(updates)
    .eq("id", id)
    .eq("business_id", session.businessId)
    .select("*, contacts(id, full_name, email)")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "opportunity",
    entityId: id,
    action: "updated",
    payload: { changed: Object.keys(updates) },
  });

  return NextResponse.json({ opportunity });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOpp(id, session.businessId);
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const { error } = await supabase
    .from("opportunities")
    .delete()
    .eq("id", id)
    .eq("business_id", session.businessId);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "opportunity",
    entityId: id,
    action: "deleted",
    payload: { name: existing.name },
  });

  return NextResponse.json({ ok: true });
}
