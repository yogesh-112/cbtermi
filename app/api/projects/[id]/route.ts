import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data } = await supabase.from("projects").select("*, contacts(*)").eq("id", id).eq("business_id", session.businessId).single();
  if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const [{ data: quotes }, { data: invoices }, { data: payments }, { data: updates }, { data: feedback }, { data: lists }] = await Promise.all([
    supabase.from("quotes").select("id,quote_number,title,total,status,created_at").eq("project_id", id),
    supabase.from("invoices").select("id,invoice_number,total,amount_paid,amount_due,status,created_at").eq("project_id", id),
    supabase.from("payments").select("id,amount,payment_date,payment_method").eq("project_id", id),
    supabase.from("project_updates").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("feedback").select("*").eq("project_id", id),
    supabase.from("item_requirement_lists").select("*").eq("project_id", id),
  ]);

  const totalInvoiced = (invoices ?? []).reduce((s, i) => s + (i.total ?? 0), 0);
  const totalPaid     = (invoices ?? []).reduce((s, i) => s + (i.amount_paid ?? 0), 0);
  const totalQuoted   = (quotes ?? []).reduce((s, q) => s + (q.total ?? 0), 0);

  return NextResponse.json({ project: data, quotes: quotes ?? [], invoices: invoices ?? [], payments: payments ?? [], updates: updates ?? [], feedback: feedback ?? [], lists: lists ?? [], stats: { totalInvoiced, totalPaid, totalQuoted, totalDue: totalInvoiced - totalPaid } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabase.from("projects").update({ ...body, updated_at: new Date().toISOString() }).eq("id", id).eq("business_id", session.businessId).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ project: data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(session.role ?? "")) {
    return NextResponse.json({ message: "Only owners and admins can delete projects." }, { status: 403 });
  }
  const { id } = await params;
  await supabase.from("projects").delete().eq("id", id).eq("business_id", session.businessId);
  return NextResponse.json({ message: "Deleted" });
}
