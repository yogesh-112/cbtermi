import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, canAdminDo } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/admin-audit";
import { supabase } from "@/lib/supabase";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const [{ data: user }, { data: memberships }, { data: auditEvents }] = await Promise.all([
    supabase.from("users").select("*").eq("id", id).single(),
    supabase.from("business_members").select("*, businesses(id, name, admin_status)").eq("user_id", id),
    supabase.from("audit_events").select("action, entity_type, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  if (!user) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ user, memberships: memberships ?? [], auditEvents: auditEvents ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canAdminDo(session.role, "support")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { action, reason, notes } = await request.json();
  let update: Record<string, unknown> = {};

  if (action === "ban") {
    update = { is_banned: true, banned_at: new Date().toISOString(), banned_reason: reason ?? null, banned_by: session.id };
  } else if (action === "unban") {
    update = { is_banned: false, banned_at: null, banned_reason: null };
  } else if (action === "verify_email") {
    update = { email_verified: true };
  } else if (action === "notes") {
    update = { admin_notes: notes };
  } else if (action === "force_logout") {
    update = { force_logout_at: new Date().toISOString() };
  } else {
    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  }

  const { data, error } = await supabase.from("users").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await logAdminAudit({
    adminId: session.id,
    action: `user_${action}`,
    entityType: "user",
    entityId: id,
    payload: { reason },
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ user: data });
}
