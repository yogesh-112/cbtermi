import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data } = await supabase.from("contacts").select("*").eq("id", id).eq("business_id", session.businessId).single();
  if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const [{ data: quotes }, { data: invoices }, { data: projects }, { data: payments }, { data: logs }] = await Promise.all([
    supabase.from("quotes").select("id,quote_number,title,total,status,created_at").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase.from("invoices").select("id,invoice_number,total,amount_due,status,created_at").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase.from("projects").select("id,name,status,created_at").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase.from("payments").select("id,amount,payment_date,payment_method").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase.from("communication_logs").select("*").eq("contact_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  return NextResponse.json({ contact: data, quotes: quotes ?? [], invoices: invoices ?? [], projects: projects ?? [], payments: payments ?? [], communications: logs ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabase.from("contacts").update({ ...body, updated_at: new Date().toISOString() }).eq("id", id).eq("business_id", session.businessId).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ contact: data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await supabase.from("contacts").delete().eq("id", id).eq("business_id", session.businessId);
  return NextResponse.json({ message: "Deleted" });
}
