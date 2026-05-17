import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const sevenDaysAgo  = new Date(Date.now() - 7 * 86400000).toISOString();

  const [
    totalBiz, activeSubs, trialSubs, suspendedBiz,
    totalUsers, bannedUsers, newUsers7d,
    payments30d, recentBiz, recentUsers, recentPayments
  ] = await Promise.all([
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "trialing"),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("admin_status", "suspended"),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("is_banned", true),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("payments").select("amount").gte("created_at", thirtyDaysAgo).eq("is_reversed", false),
    supabase.from("businesses").select("id, name, created_at, admin_status").order("created_at", { ascending: false }).limit(8),
    supabase.from("users").select("id, name, email, created_at, is_banned").order("created_at", { ascending: false }).limit(8),
    supabase.from("payments").select("id, amount, created_at, contacts(full_name), invoices(invoice_number)").order("created_at", { ascending: false }).limit(8),
  ]);

  const mrr = (payments30d.data ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);

  // 14-day chart data
  const chartDays: { date: string; signups: number; revenue: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    chartDays.push({ date: d.toISOString().slice(0, 10), signups: 0, revenue: 0 });
  }
  const [bizChart, payChart] = await Promise.all([
    supabase.from("businesses").select("created_at").gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString()),
    supabase.from("payments").select("amount, created_at").gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString()).eq("is_reversed", false),
  ]);
  for (const b of bizChart.data ?? []) {
    const d = b.created_at.slice(0, 10);
    const row = chartDays.find(r => r.date === d);
    if (row) row.signups += 1;
  }
  for (const p of payChart.data ?? []) {
    const d = p.created_at.slice(0, 10);
    const row = chartDays.find(r => r.date === d);
    if (row) row.revenue += (p.amount ?? 0);
  }

  return NextResponse.json({
    stats: {
      totalBusinesses: totalBiz.count ?? 0,
      activeSubscriptions: activeSubs.count ?? 0,
      trialSubscriptions: trialSubs.count ?? 0,
      suspendedBusinesses: suspendedBiz.count ?? 0,
      totalUsers: totalUsers.count ?? 0,
      bannedUsers: bannedUsers.count ?? 0,
      newUsers7d: newUsers7d.count ?? 0,
      mrr,
    },
    chartData: chartDays,
    recentBusinesses: recentBiz.data ?? [],
    recentUsers: recentUsers.data ?? [],
    recentPayments: recentPayments.data ?? [],
  });
}
