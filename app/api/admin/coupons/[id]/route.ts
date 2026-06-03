import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { logAdminAudit } from "@/lib/admin-audit";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const { data: coupon, error } = await supabase
    .from("coupon_codes")
    .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ coupon });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: existing } = await supabase.from("coupon_codes").select("code").eq("id", id).single();
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await supabase.from("coupon_codes").delete().eq("id", id);

  await logAdminAudit({
    adminId: session.id,
    action: "coupon_deleted",
    entityType: "coupon",
    entityId: id,
    payload: { code: existing.code },
  });

  return NextResponse.json({ ok: true });
}
