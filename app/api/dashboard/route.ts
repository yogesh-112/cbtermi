import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const bid = session.businessId;

  const today = new Date().toISOString().split("T")[0];

  // Build 14-day window for chart
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
    { data: recentInvoices },
    { data: recentPayments },
    // Pending actions data
    { data: sentQuotes },
    { data: overdueInvoices },
    { data: newLeads },
    { data: openOpportunities },
    { data: upcomingSchedule },
  ] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("business_id", bid).eq("status", "active"),
    supabase.from("quotes").select("*", { count: "exact", head: true }).eq("business_id", bid).in("status", ["sent", "viewed"]),
    supabase.from("invoices").select("total, amount_paid, amount_due, status").eq("business_id", bid).not("status", "eq", "voided"),
    supabase.from("communication_logs").select("*, contacts(full_name)").eq("business_id", bid).order("created_at", { ascending: false }).limit(6),
    supabase.from("invoices").select("created_at, total").eq("business_id", bid).gte("created_at", startIso).not("status", "eq", "voided"),
    supabase.from("payments").select("created_at, amount").eq("business_id", bid).gte("created_at", startIso),
    // Quotes awaiting approval
    supabase.from("quotes").select("id, quote_number, contacts(full_name)").eq("business_id", bid).in("status", ["sent", "viewed"]).order("created_at", { ascending: false }).limit(5),
    // Overdue invoices
    supabase.from("invoices").select("id, invoice_number, amount_due, due_date, contacts(full_name)").eq("business_id", bid).lt("due_date", today).not("status", "in", '("paid","voided")').gt("amount_due", 0).order("due_date", { ascending: true }).limit(5),
    // New leads (last 7 days)
    supabase.from("contacts").select("id, full_name, created_at").eq("business_id", bid).eq("contact_type", "lead").gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()).order("created_at", { ascending: false }).limit(3),
    // Open opportunities
    supabase.from("opportunities").select("id, name, estimated_value, status, priority").eq("business_id", bid).in("status", ["open", "qualified"]).order("priority", { ascending: false }).limit(4),
    // Upcoming schedule (next 7 days)
    supabase.from("schedules").select("id, title, scheduled_start").eq("business_id", bid).gte("scheduled_start", new Date().toISOString()).lte("scheduled_start", new Date(Date.now() + 7 * 86400000).toISOString()).order("scheduled_start", { ascending: true }).limit(3),
  ]);

  const pendingInvoices   = (invoices ?? []).filter(i => ["sent","viewed","partially_paid","overdue"].includes(i.status)).length;
  const outstandingAmount = (invoices ?? []).reduce((s, i) => s + (i.amount_due ?? 0), 0);
  const receivedAmount    = (invoices ?? []).reduce((s, i) => s + (i.amount_paid ?? 0), 0);

  // Pipeline value from open opportunities
  const pipelineValue = (openOpportunities ?? []).reduce((s, o) => s + (o.estimated_value ?? 0), 0);

  // Build pending actions list
  const pendingActions: Array<{ type: string; label: string; sub: string; href: string; urgency: "high" | "medium" | "low" }> = [];

  (overdueInvoices ?? []).forEach(inv => {
    const contact = Array.isArray(inv.contacts) ? inv.contacts[0] : inv.contacts as any;
    pendingActions.push({
      type: "invoice",
      label: `${inv.invoice_number} overdue`,
      sub: contact?.full_name ?? "—",
      href: `/invoices/${inv.id}`,
      urgency: "high",
    });
  });

  (sentQuotes ?? []).forEach(q => {
    const contact = Array.isArray(q.contacts) ? q.contacts[0] : q.contacts as any;
    pendingActions.push({
      type: "quote",
      label: `${q.quote_number} awaiting approval`,
      sub: contact?.full_name ?? "—",
      href: `/quotes/${q.id}`,
      urgency: "medium",
    });
  });

  (openOpportunities ?? []).filter(o => o.priority === "high").forEach(o => {
    pendingActions.push({
      type: "opportunity",
      label: o.name,
      sub: `High priority · ${o.status}`,
      href: `/opportunities/${o.id}`,
      urgency: "medium",
    });
  });

  (newLeads ?? []).forEach(l => {
    pendingActions.push({
      type: "lead",
      label: `New lead: ${l.full_name}`,
      sub: "Follow up needed",
      href: `/contacts/${l.id}`,
      urgency: "low",
    });
  });

  (upcomingSchedule ?? []).forEach(s => {
    pendingActions.push({
      type: "schedule",
      label: s.title,
      sub: new Date(s.scheduled_start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      href: `/scheduling`,
      urgency: "low",
    });
  });

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
    stats: {
      activeProjects: activeProjects ?? 0,
      pendingQuotes: pendingQuotes ?? 0,
      pendingInvoices,
      outstandingAmount,
      receivedAmount,
      openOpportunities: (openOpportunities ?? []).length,
      pipelineValue,
    },
    recentActivity: recentActivity ?? [],
    pendingActions: pendingActions.slice(0, 8),
    chartData,
  });
}
