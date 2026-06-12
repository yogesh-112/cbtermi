import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Verify the quote belongs to this business
  const { data: quote } = await supabase
    .from("quotes")
    .select("id")
    .eq("id", id)
    .eq("business_id", session.businessId)
    .single();
  if (!quote) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const { data: versions, error } = await supabase
    .from("quote_versions")
    .select("id, version_number, status, subtotal, tax_amount, total, note, created_at, created_by")
    .eq("quote_id", id)
    .eq("business_id", session.businessId)
    .order("version_number", { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ versions: versions ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;
  const { id } = await params;

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, business_id, status, subtotal, tax_amount, total")
    .eq("id", id)
    .eq("business_id", session.businessId)
    .single();
  if (!quote) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const { data: items } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", id)
    .order("sort_order");

  // Determine next version number
  const { data: latest } = await supabase
    .from("quote_versions")
    .select("version_number")
    .eq("quote_id", id)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();
  const nextVersion = (latest?.version_number ?? 0) + 1;

  const body = await request.json().catch(() => ({}));

  const { data: version, error } = await supabase
    .from("quote_versions")
    .insert({
      quote_id:       id,
      business_id:    session.businessId,
      version_number: nextVersion,
      status:         quote.status,
      subtotal:       quote.subtotal,
      tax_amount:     quote.tax_amount,
      total:          quote.total,
      items_snapshot: items ?? [],
      note:           body.note ?? null,
      created_by:     session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ version }, { status: 201 });
}
