import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { triggerNotificationRule } from "@/lib/notification-rules";

// Called daily by Vercel cron (configured in vercel.json)
// Handles time-based notification rules: invoice_overdue, invoice_due_soon
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Due-soon: invoices due in 3 days (not yet notified)
  const dueSoonDate = new Date(today);
  dueSoonDate.setDate(dueSoonDate.getDate() + 3);
  const dueSoonStr = dueSoonDate.toISOString().split("T")[0];

  let sent = 0;
  let failed = 0;

  // 1. Invoice overdue — due_date < today, not paid
  const { data: overdueInvoices } = await supabase
    .from("invoices")
    .select("id, business_id, contact_id, invoice_number, amount_due, due_date")
    .lt("due_date", todayStr)
    .not("status", "in", '("paid","voided","draft")')
    .gt("amount_due", 0)
    .limit(100);

  for (const inv of overdueInvoices ?? []) {
    // Check we haven't already sent this rule for this invoice today
    const { count } = await supabase
      .from("notification_rule_logs")
      .select("*", { count: "exact", head: true })
      .eq("business_id", inv.business_id)
      .eq("rule_type", "invoice_overdue")
      .eq("entity_id", inv.id)
      .gte("sent_at", `${todayStr}T00:00:00Z`);

    if ((count ?? 0) > 0) continue; // already sent today

    try {
      await triggerNotificationRule({
        businessId: inv.business_id,
        ruleType: "invoice_overdue",
        contactId: inv.contact_id,
        entityType: "invoice",
        entityId: inv.id,
        extraVars: { invoice_number: inv.invoice_number ?? "" },
      });
      sent++;
    } catch { failed++; }
  }

  // 2. Invoice due soon — due_date = today+3, not paid
  const { data: dueSoonInvoices } = await supabase
    .from("invoices")
    .select("id, business_id, contact_id, invoice_number, amount_due, due_date")
    .eq("due_date", dueSoonStr)
    .not("status", "in", '("paid","voided","draft")')
    .gt("amount_due", 0)
    .limit(100);

  for (const inv of dueSoonInvoices ?? []) {
    const { count } = await supabase
      .from("notification_rule_logs")
      .select("*", { count: "exact", head: true })
      .eq("business_id", inv.business_id)
      .eq("rule_type", "invoice_due_soon")
      .eq("entity_id", inv.id)
      .gte("sent_at", `${todayStr}T00:00:00Z`);

    if ((count ?? 0) > 0) continue;

    try {
      await triggerNotificationRule({
        businessId: inv.business_id,
        ruleType: "invoice_due_soon",
        contactId: inv.contact_id,
        entityType: "invoice",
        entityId: inv.id,
        extraVars: { invoice_number: inv.invoice_number ?? "" },
      });
      sent++;
    } catch { failed++; }
  }

  return NextResponse.json({ ok: true, sent, failed, date: todayStr });
}
