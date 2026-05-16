import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const bid = session.businessId;

  const [
    { count: activeProjects },
    { count: pendingQuotes },
    { data: invoices },
    { data: recentActivity },
    { count: pendingFeedback },
  ] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("business_id", bid).eq("status", "active"),
    supabase.from("quotes").select("*", { count: "exact", head: true }).eq("business_id", bid).in("status", ["draft", "sent"]),
    supabase.from("invoices").select("total, amount_paid, amount_due, status").eq("business_id", bid).not("status", "eq", "voided"),
    supabase.from("communication_logs").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(10),
    supabase.from("feedback").select("*", { count: "exact", head: true }).eq("business_id", bid),
  ]);

  const pendingInvoices  = (invoices ?? []).filter((i) => ["sent","viewed","partially_paid","overdue"].includes(i.status)).length;
  const outstandingAmount = (invoices ?? []).reduce((s, i) => s + (i.amount_due ?? 0), 0);
  const receivedAmount    = (invoices ?? []).reduce((s, i) => s + (i.amount_paid ?? 0), 0);

  return NextResponse.json({
    stats: { activeProjects: activeProjects ?? 0, pendingQuotes: pendingQuotes ?? 0, pendingInvoices, outstandingAmount, receivedAmount, pendingFeedback: pendingFeedback ?? 0 },
    recentActivity: recentActivity ?? [],
  });
}
