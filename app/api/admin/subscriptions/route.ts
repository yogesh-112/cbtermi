import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "all";
  const search = searchParams.get("search") ?? "";
  const page   = parseInt(searchParams.get("page") ?? "1");
  const limit  = 25;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("subscriptions")
    .select(`
      id, status, created_at, trial_ends_at, trial_extended_at, trial_extended_days,
      stripe_subscription_id, stripe_customer_id,
      businesses(id, name, email),
      plans(id, name, price_monthly)
    `, { count: "exact" });

  if (status !== "all") query = query.eq("status", status);
  if (search) {
    query = query.ilike("businesses.name", `%${search}%`);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ subscriptions: data ?? [], total: count ?? 0, page, limit });
}
