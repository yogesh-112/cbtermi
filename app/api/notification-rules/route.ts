import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { ensureDefaultRules } from "@/lib/notification-rules";

const RULE_META: Record<string, { label: string; description: string; category: string; timeBased: boolean }> = {
  quote_sent:           { label: "Quote sent",             description: "Notify customer when a quote is sent to them.",                category: "Quotes",   timeBased: false },
  quote_approved:       { label: "Quote approved",         description: "Confirm with customer after they approve a quote.",             category: "Quotes",   timeBased: false },
  quote_rejected:       { label: "Quote change request",   description: "Acknowledge when a customer requests changes on a quote.",      category: "Quotes",   timeBased: false },
  change_order_approved:{ label: "Change order approved",  description: "Confirm with customer after a change order is approved.",       category: "Quotes",   timeBased: false },
  invoice_created:      { label: "Invoice sent",           description: "Notify customer when a new invoice is created.",               category: "Billing",  timeBased: false },
  invoice_overdue:      { label: "Invoice overdue",        description: "Remind customer when an invoice is past its due date.",         category: "Billing",  timeBased: true  },
  invoice_due_soon:     { label: "Invoice due soon",       description: "Remind customer that an invoice is due in a few days.",         category: "Billing",  timeBased: true  },
  payment_received:     { label: "Payment received",       description: "Thank customer when a payment is recorded.",                   category: "Billing",  timeBased: false },
  new_lead:             { label: "New lead acknowledgment","description": "Auto-reply to new leads confirming you received their inquiry.", category: "Leads", timeBased: false },
};

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await ensureDefaultRules(session.businessId);

  const { data: rules } = await supabase
    .from("notification_rules")
    .select("*")
    .eq("business_id", session.businessId)
    .order("rule_type");

  const enriched = (rules ?? []).map(r => ({
    ...r,
    ...RULE_META[r.rule_type],
  }));

  return NextResponse.json({ rules: enriched });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { rule_type, is_enabled, channel, delay_days, custom_subject, custom_message } = body;

  if (!rule_type || !RULE_META[rule_type]) {
    return NextResponse.json({ message: "Invalid rule_type" }, { status: 400 });
  }

  const { data: rule, error } = await supabase
    .from("notification_rules")
    .upsert({
      business_id:    session.businessId,
      rule_type,
      is_enabled:     is_enabled ?? false,
      channel:        channel ?? "email",
      delay_days:     delay_days ?? 0,
      custom_subject: custom_subject ?? null,
      custom_message: custom_message ?? null,
      updated_at:     new Date().toISOString(),
    }, { onConflict: "business_id,rule_type" })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ rule });
}
