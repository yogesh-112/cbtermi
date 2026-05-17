import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const bid = session.businessId;

  // Build 14-day window
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 13);
  start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString();

  const [
    { count: activeProjects },
    { count: pendingQuotes },
    { data: invoices },
    { data: recentActivity },
    { count: pendingFeedback },
    { data: recentInvoices },
    { data: recentPayments },
  ] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("business_id", bid).eq("status", "active"),
    supabase.from("quotes").select("*", { count: "exact", head: true }).eq("business_id", bid).in("status", ["draft", "sent"]),
    supabase.from("invoices").select("total, amount_paid, amount_due, status").eq("business_id", bid).not("status", "eq", "voided"),
    supabase.from("communication_logs").select("*, contacts(full_name)").eq("business_id", bid).order("created_at", { ascending: false }).limit(10),
    supabase.from("feedback").select("*", { count: "exact", head: true }).eq("business_id", bid),
    supabase.from("invoices").select("created_at, total").eq("business_id", bid).gte("created_at", startIso).not("status", "eq", "voided"),
    supabase.from("payments").select("created_at, amount").eq("business_id", bid).gte("created_at", startIso),
  ]);

  const pendingInvoices   = (invoices ?? []).filter((i) => ["sent","viewed","partially_paid","overdue"].includes(i.status)).length;
  const outstandingAmount = (invoices ?? []).reduce((s, i) => s + (i.amount_due ?? 0), 0);
  const receivedAmount    = (invoices ?? []).reduce((s, i) => s + (i.amount_paid ?? 0), 0);

  // Build daily chart data for the last 14 days
  const dayMap: Record<string, { invoiced: number; paid: number }> = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dayMap[d.toISOString().split("T")[0]] = { invoiced: 0, paid: 0 };
  }
  (recentInvoices ?? []).forEach((inv: any) => {
    const day = inv.created_at?.split("T")[0];
    if (day && dayMap[day]) dayMap[day].invoiced += inv.total ?? 0;
  });
  (recentPayments ?? []).forEach((p: any) => {
    const day = p.created_at?.split("T")[0];
    if (day && dayMap[day]) dayMap[day].paid += p.amount ?? 0;
  });
  const chartData = Object.entries(dayMap).map(([date, vals]) => ({ date, ...vals }));

  return NextResponse.json({
    stats: { activeProjects: activeProjects ?? 0, pendingQuotes: pendingQuotes ?? 0, pendingInvoices, outstandingAmount, receivedAmount, pendingFeedback: pendingFeedback ?? 0 },
    recentActivity: recentActivity ?? [],
    chartData,
  });
}
