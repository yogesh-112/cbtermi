import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data } = await supabase.from("quotes").select("*, contacts(full_name), projects(name)").eq("business_id", session.businessId).order("created_at", { ascending: false });
  return NextResponse.json({ quotes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;
  const { items, ...body } = await request.json();

  const { data: biz } = await supabase.from("businesses").select("quote_prefix").eq("id", session.businessId).single();
  const { count } = await supabase.from("quotes").select("*", { count: "exact", head: true }).eq("business_id", session.businessId);
  const quote_number = body.quote_number || `${biz?.quote_prefix ?? "Q-"}${String((count ?? 0) + 1).padStart(4, "0")}`;

  const subtotal = (items ?? []).reduce((s: number, i: any) => {
    const base = (i.quantity ?? 0) * (i.unit_price ?? 0);
    return s + base * (1 - (i.discount ?? 0) / 100);
  }, 0);
  const tax_amount = (items ?? []).reduce((s: number, i: any) => {
    const base = (i.quantity ?? 0) * (i.unit_price ?? 0);
    return s + base * (1 - (i.discount ?? 0) / 100) * ((i.tax_rate ?? 0) / 100);
  }, 0);
  const total = subtotal + tax_amount;

  const { data: quote, error } = await supabase.from("quotes").insert({ ...body, quote_number, business_id: session.businessId, subtotal, tax_amount, total, created_by: session.id }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  if (items?.length) {
    const { error: itemsErr } = await supabase.from("quote_items").insert(items.map((item: any, i: number) => ({ ...item, quote_id: quote.id, sort_order: i })));
    if (itemsErr) console.error("[quotes] quote_items insert failed:", itemsErr.message);
  }
  return NextResponse.json({ quote }, { status: 201 });
}
