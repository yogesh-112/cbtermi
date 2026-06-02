import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";
import { logAudit } from "@/lib/audit";

async function getExpense(id: string, businessId: string) {
  const { data } = await supabase
    .from("expenses")
    .select("*, projects(id, name)")
    .eq("id", id)
    .eq("business_id", businessId)
    .single();
  return data;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const expense = await getExpense(id, session.businessId);
  if (!expense) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ expense });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;

  const { id } = await params;
  const existing = await getExpense(id, session.businessId);
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title       !== undefined) updates.title        = body.title?.trim();
  if (body.category    !== undefined) updates.category     = body.category;
  if (body.amount      !== undefined) updates.amount       = parseFloat(body.amount);
  if (body.expense_date !== undefined) updates.expense_date = body.expense_date;
  if (body.description !== undefined) updates.description  = body.description?.trim() || null;
  if (body.receipt_url !== undefined) updates.receipt_url  = body.receipt_url?.trim() || null;
  if (body.project_id  !== undefined) updates.project_id   = body.project_id || null;
  if (body.status      !== undefined) updates.status       = body.status;

  const { data: expense, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", id)
    .eq("business_id", session.businessId)
    .select("*, projects(id, name)")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "expense",
    entityId: id,
    action: "updated",
    payload: updates,
  });

  return NextResponse.json({ expense });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getExpense(id, session.businessId);
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("business_id", session.businessId);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await logAudit({
    businessId: session.businessId,
    userId: session.id,
    entityType: "expense",
    entityId: id,
    action: "deleted",
    payload: { title: existing.title, amount: existing.amount },
  });

  return NextResponse.json({ ok: true });
}
