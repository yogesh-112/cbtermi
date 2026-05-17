import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = 50;
  const from = (page - 1) * pageSize;

  const entityType = request.nextUrl.searchParams.get("entity_type");
  const entityId   = request.nextUrl.searchParams.get("entity_id");

  let q = supabase
    .from("audit_events")
    .select("*, users(full_name, email)", { count: "exact" })
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (entityType) q = q.eq("entity_type", entityType);
  if (entityId)   q = q.eq("entity_id", entityId);

  const { data, count } = await q;
  return NextResponse.json({ events: data ?? [], total: count ?? 0, page, pageSize });
}
