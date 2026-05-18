import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const { data: existing } = await supabase
    .from("templates")
    .select("id, is_system, business_id")
    .eq("id", id)
    .single();

  if (!existing) return NextResponse.json({ message: "Template not found" }, { status: 404 });
  if (existing.is_system) return NextResponse.json({ message: "System templates cannot be edited" }, { status: 403 });
  if (existing.business_id !== session.businessId) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.subject !== undefined) updates.subject = body.subject;
  if (body.body !== undefined) updates.body = body.body;
  if (body.variables !== undefined) updates.variables = body.variables;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  const { data, error } = await supabase.from("templates").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ message: "Update failed" }, { status: 500 });

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "template",
    entityId: id,
    action: "template_edited",
  });

  return NextResponse.json({ template: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data: existing } = await supabase
    .from("templates")
    .select("id, is_system, business_id")
    .eq("id", id)
    .single();

  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (existing.is_system) return NextResponse.json({ message: "System templates cannot be deleted" }, { status: 403 });
  if (existing.business_id !== session.businessId) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  await supabase.from("templates").delete().eq("id", id);

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "template",
    entityId: id,
    action: "template_deleted",
  });

  return NextResponse.json({ ok: true });
}
