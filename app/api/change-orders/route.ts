import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data } = await supabase
    .from("change_orders")
    .select("*, contacts(full_name), projects(name)")
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: false });
  return NextResponse.json({ changeOrders: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;

  const { items, ...rawBody } = await request.json();
  // Sanitize UUID fields — empty string "" is not a valid UUID
  const body = {
    ...rawBody,
    contact_id: rawBody.contact_id || null,
    project_id: rawBody.project_id || null,
    quote_id:   rawBody.quote_id   || null,
  };

  // Auto-number
  const { count } = await supabase
    .from("change_orders")
    .select("*", { count: "exact", head: true })
    .eq("business_id", session.businessId);
  const co_number = body.co_number || `CO-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const subtotal = (items ?? []).reduce((s: number, i: any) => s + (i.total ?? 0), 0);
  const tax_amount = (items ?? []).reduce((s: number, i: any) => s + ((i.total ?? 0) * (i.tax_rate ?? 0) / 100), 0);
  const total = subtotal + tax_amount;

  const { data: co, error } = await supabase
    .from("change_orders")
    .insert({ ...body, co_number, business_id: session.businessId, subtotal, tax_amount, total, created_by: session.id })
    .select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  if (items?.length) {
    const { error: itemsErr } = await supabase.from("change_order_items").insert(
      items.map((item: any, i: number) => ({ ...item, change_order_id: co.id, sort_order: i }))
    );
    if (itemsErr) console.error("[change-orders] change_order_items insert failed:", itemsErr.message);
  }
  return NextResponse.json({ changeOrder: co }, { status: 201 });
}
