import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, canAdminDo } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/admin-audit";
import { supabase } from "@/lib/supabase";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const [{ data: biz }, { data: members }, { data: sub }, { data: invoices }, { data: payments }] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", id).single(),
    supabase.from("business_members").select("*, users(id, name, email, created_at, is_banned)").eq("business_id", id),
    supabase.from("subscriptions").select("*, plans(*)").eq("business_id", id).order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("invoices").select("id, invoice_number, total, status, created_at").eq("business_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("payments").select("id, amount, payment_method, created_at").eq("business_id", id).order("created_at", { ascending: false }).limit(10),
  ]);

  if (!biz) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ business: biz, members: members ?? [], subscription: sub, invoices: invoices ?? [], payments: payments ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canAdminDo(session.role, "support")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { action, reason, notes } = body;

  let update: Record<string, unknown> = {};

  if (action === "suspend") {
    if (!canAdminDo(session.role, "support")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    update = { admin_status: "suspended", suspended_at: new Date().toISOString(), suspended_reason: reason ?? null, suspended_by: session.id };
  } else if (action === "reactivate") {
    update = { admin_status: "active", reactivated_at: new Date().toISOString(), suspended_reason: null };
  } else if (action === "notes") {
    update = { notes };
  } else {
    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  }

  const { data, error } = await supabase.from("businesses").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await logAdminAudit({
    adminId: session.id,
    action: `business_${action}`,
    entityType: "business",
    entityId: id,
    payload: { reason },
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ business: data });
}
