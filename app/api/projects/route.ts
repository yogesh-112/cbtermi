import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  const limit = Math.min(parseInt(sp.get("limit") ?? "50"), 100);
  const offset = parseInt(sp.get("offset") ?? "0");
  let q = supabase.from("projects").select("*, contacts(full_name, email, phone)", { count: "exact" }).eq("business_id", session.businessId);
  if (status) q = q.eq("status", status);
  const { data, count, error } = await q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  // Fetch status counts for accurate filter badges
  const { data: allStatuses } = await supabase.from("projects").select("status").eq("business_id", session.businessId);
  const counts = {
    active:    allStatuses?.filter(p => p.status === "active").length ?? 0,
    scheduled: allStatuses?.filter(p => p.status === "scheduled").length ?? 0,
    on_hold:   allStatuses?.filter(p => p.status === "on_hold").length ?? 0,
    completed: allStatuses?.filter(p => p.status === "completed").length ?? 0,
  };
  return NextResponse.json({ projects: data ?? [], total: count ?? 0, counts });
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
