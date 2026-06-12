import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data: co } = await supabase
    .from("change_orders")
    .select("*, contacts(*), projects(name)")
    .eq("id", id).eq("business_id", session.businessId).single();
  if (!co) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const { data: items } = await supabase.from("change_order_items").select("*").eq("change_order_id", id).order("sort_order");
  return NextResponse.json({ changeOrder: co, items: items ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { items, ...body } = await request.json();

  const { data: existing } = await supabase.from("change_orders").select("status").eq("id", id).eq("business_id", session.businessId).single();
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  if (["approved", "converted"].includes(existing.status) && body.status !== "voided") {
    return NextResponse.json({ message: `Cannot edit an ${existing.status} change order.` }, { status: 400 });
  }
  if (["approved", "voided"].includes(body.status) && !["owner", "admin"].includes(session.role ?? "")) {
    return NextResponse.json({ message: "Only owners and admins can approve or void change orders." }, { status: 403 });
  }

  if (items) {
    await supabase.from("change_order_items").delete().eq("change_order_id", id);
    const subtotal = items.reduce((s: number, i: any) => {
      const base = (i.quantity ?? 0) * (i.unit_price ?? 0);
      return s + base * (1 - (i.discount ?? 0) / 100);
    }, 0);
    const tax_amount = items.reduce((s: number, i: any) => {
      const base = (i.quantity ?? 0) * (i.unit_price ?? 0);
      return s + base * (1 - (i.discount ?? 0) / 100) * ((i.tax_rate ?? 0) / 100);
    }, 0);
    body.subtotal = subtotal; body.tax_amount = tax_amount; body.total = subtotal + tax_amount;
    const { error: insertErr } = await supabase.from("change_order_items").insert(items.map((item: any, i: number) => ({ ...item, change_order_id: id, sort_order: i })));
    if (insertErr) return NextResponse.json({ message: insertErr.message }, { status: 500 });
  }

  const { data, error } = await supabase.from("change_orders").update({ ...body, updated_at: new Date().toISOString() }).eq("id", id).eq("business_id", session.businessId).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ changeOrder: data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(session.role ?? "")) {
    return NextResponse.json({ message: "Only owners and admins can delete change orders." }, { status: 403 });
  }
  const { id } = await params;
  const { data: existing } = await supabase.from("change_orders").select("status").eq("id", id).eq("business_id", session.businessId).single();
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (["approved", "converted"].includes(existing.status)) {
    return NextResponse.json({ message: `Cannot delete an ${existing.status} change order.` }, { status: 400 });
  }
  await supabase.from("change_order_items").delete().eq("change_order_id", id);
  await supabase.from("change_orders").delete().eq("id", id).eq("business_id", session.businessId);
  return NextResponse.json({ message: "Deleted" });
}
