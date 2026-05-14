import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data: invoice } = await supabase.from("invoices").select("*, contacts(*), projects(name)").eq("id", id).eq("business_id", session.businessId).single();
  if (!invoice) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const { data: items } = await supabase.from("invoice_items").select("*").eq("invoice_id", id).order("sort_order");
  const { data: payments } = await supabase.from("payments").select("*").eq("invoice_id", id).order("created_at", { ascending: false });
  return NextResponse.json({ invoice, items: items ?? [], payments: payments ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { items, ...body } = await request.json();

  const { data: existing } = await supabase.from("invoices").select("is_sent").eq("id", id).single();
  if (existing?.is_sent && items) return NextResponse.json({ message: "Cannot edit line items of a sent invoice. Duplicate it instead." }, { status: 400 });

  if (items) {
    await supabase.from("invoice_items").delete().eq("invoice_id", id);
    const subtotal = items.reduce((s: number, i: any) => s + (i.total ?? 0), 0);
    const tax_amount = items.reduce((s: number, i: any) => s + ((i.total ?? 0) * (i.tax_rate ?? 0) / 100), 0);
    body.subtotal = subtotal; body.tax_amount = tax_amount; body.total = subtotal + tax_amount;
    body.amount_due = body.total - (existing ? 0 : 0);
    await supabase.from("invoice_items").insert(items.map((item: any, i: number) => ({ ...item, invoice_id: id, sort_order: i })));
  }

  const { data, error } = await supabase.from("invoices").update({ ...body, updated_at: new Date().toISOString() }).eq("id", id).eq("business_id", session.businessId).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ invoice: data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await supabase.from("invoices").delete().eq("id", id).eq("business_id", session.businessId);
  return NextResponse.json({ message: "Deleted" });
}
