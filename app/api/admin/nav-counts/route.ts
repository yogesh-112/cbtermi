import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const [businesses, users, subs, payments] = await Promise.all([
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).in("status", ["active", "trialing"]),
    supabase.from("payments").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
  ]);

  return NextResponse.json({
    businesses: businesses.count ?? 0,
    users:      users.count ?? 0,
    activeSubs: subs.count ?? 0,
    payments30d: payments.count ?? 0,
  });
}
