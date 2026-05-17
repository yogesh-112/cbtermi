import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "all";
  const page   = parseInt(searchParams.get("page") ?? "1");
  const limit  = 25;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("businesses")
    .select(`
      id, name, email, phone, created_at, admin_status, suspended_at, suspended_reason,
      business_members(count),
      subscriptions(status, plan_id, plans(name))
    `, { count: "exact" });

  if (status !== "all") query = query.eq("admin_status", status);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ businesses: data ?? [], total: count ?? 0, page, limit });
}
