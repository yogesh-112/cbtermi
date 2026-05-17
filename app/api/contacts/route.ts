import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { checkTrialAccess } from "@/lib/trial";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const type = request.nextUrl.searchParams.get("type");
  let q = supabase.from("contacts").select("*").eq("business_id", session.businessId).order("created_at", { ascending: false });
  if (type) q = q.eq("contact_type", type);
  const { data, error } = await q;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const trialErr = await checkTrialAccess(session.businessId);
  if (trialErr) return trialErr;
  const body = await request.json();
  if (!body.full_name) return NextResponse.json({ message: "Full name required" }, { status: 400 });
  const { data, error } = await supabase.from("contacts").insert({ ...body, business_id: session.businessId, created_by: session.id }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ contact: data }, { status: 201 });
}
