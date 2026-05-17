import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search  = searchParams.get("search") ?? "";
  const filter  = searchParams.get("filter") ?? "all";
  const page    = parseInt(searchParams.get("page") ?? "1");
  const limit   = 25;
  const offset  = (page - 1) * limit;

  let query = supabase
    .from("users")
    .select("id, name, email, created_at, is_banned, banned_at, email_verified, business_members(count)", { count: "exact" });

  if (filter === "banned") query = query.eq("is_banned", true);
  if (filter === "unverified") query = query.eq("email_verified", false);
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [], total: count ?? 0, page, limit });
}
