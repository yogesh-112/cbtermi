import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data } = await supabase.from("project_updates").select("*, projects(name), contacts(full_name)").eq("business_id", session.businessId).order("created_at", { ascending: false });
  return NextResponse.json({ updates: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { data, error } = await supabase.from("project_updates").insert({ ...body, business_id: session.businessId, created_by: session.id }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await supabase.from("communication_logs").insert({ business_id: session.businessId, contact_id: body.contact_id, project_id: body.project_id, type: "project_update", channel: "email", subject: body.title, message: body.message, sent_by: session.id });
  return NextResponse.json({ update: data }, { status: 201 });
}
