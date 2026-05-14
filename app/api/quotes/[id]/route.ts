import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data: quote } = await supabase.from("quotes").select("*, contacts(*), projects(name)").eq("id", id).eq("business_id", session.businessId).single();
  if (!quote) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const { data: items } = await supabase.from("quote_items").select("*").eq("quote_id", id).order("sort_order");
  return NextResponse.json({ quote, items: items ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { items, ...body } = await request.json();

  if (items) {
    await supabase.from("quote_items").delete().eq("quote_id", id);
    const subtotal = items.reduce((s: number, i: any) => s + (i.total ?? 0), 0);
    const tax_amount = items.reduce((s: number, i: any) => s + ((i.total ?? 0) * (i.tax_rate ?? 0) / 100), 0);
    body.subtotal = subtotal; body.tax_amount = tax_amount; body.total = subtotal + tax_amount;
    await supabase.from("quote_items").insert(items.map((item: any, i: number) => ({ ...item, quote_id: id, sort_order: i })));
  }

  const { data, error } = await supabase.from("quotes").update({ ...body, updated_at: new Date().toISOString() }).eq("id", id).eq("business_id", session.businessId).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ quote: data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await supabase.from("quotes").delete().eq("id", id).eq("business_id", session.businessId);
  return NextResponse.json({ message: "Deleted" });
}
