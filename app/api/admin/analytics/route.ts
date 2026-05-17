import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const days30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const days90 = new Date(Date.now() - 90 * 86400000).toISOString();

  const [bizData, payData, planDist, statusDist] = await Promise.all([
    supabase.from("businesses").select("created_at").gte("created_at", days30),
    supabase.from("payments").select("amount, created_at").gte("created_at", days30).eq("is_reversed", false),
    supabase.from("subscriptions").select("plans(name), status"),
    supabase.from("subscriptions").select("status"),
  ]);

  // Build 30-day daily chart
  const chart: { date: string; signups: number; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    chart.push({ date: d.toISOString().slice(0, 10), signups: 0, revenue: 0 });
  }
  for (const b of bizData.data ?? []) {
    const row = chart.find(r => r.date === b.created_at.slice(0, 10));
    if (row) row.signups++;
  }
  for (const p of payData.data ?? []) {
    const row = chart.find(r => r.date === p.created_at.slice(0, 10));
    if (row) row.revenue += p.amount ?? 0;
  }

  // Plan distribution
  const planCounts: Record<string, number> = {};
  for (const s of planDist.data ?? []) {
    const name = (s.plans as any)?.name ?? "Unknown";
    planCounts[name] = (planCounts[name] ?? 0) + 1;
  }

  // Subscription status distribution
  const statusCounts: Record<string, number> = {};
  for (const s of statusDist.data ?? []) {
    statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
  }

  // 90-day revenue total
  const { data: rev90 } = await supabase
    .from("payments").select("amount").gte("created_at", days90).eq("is_reversed", false);
  const revenue90d = (rev90 ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);

  // Total businesses last 30 vs 60
  const days60 = new Date(Date.now() - 60 * 86400000).toISOString();
  const [biz30, biz60] = await Promise.all([
    supabase.from("businesses").select("*", { count: "exact", head: true }).gte("created_at", days30),
    supabase.from("businesses").select("*", { count: "exact", head: true }).gte("created_at", days60).lt("created_at", days30),
  ]);

  return NextResponse.json({
    chart,
    planDistribution: Object.entries(planCounts).map(([name, count]) => ({ name, count })),
    statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    revenue90d,
    signups30d: biz30.count ?? 0,
    signups30dPrev: biz60.count ?? 0,
  });
}
