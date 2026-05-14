import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const status = request.nextUrl.searchParams.get("status");
  let q = supabase.from("projects").select("*, contacts(full_name, email, phone)").eq("business_id", session.businessId).order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.name) return NextResponse.json({ message: "Project name required" }, { status: 400 });

  const { data: biz } = await supabase.from("businesses").select("project_prefix").eq("id", session.businessId).single();
  const { count } = await supabase.from("projects").select("*", { count: "exact", head: true }).eq("business_id", session.businessId);
  const project_number = `${biz?.project_prefix ?? "PRJ-"}${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data, error } = await supabase.from("projects").insert({ ...body, business_id: session.businessId, project_number, created_by: session.id }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ project: data }, { status: 201 });
}
