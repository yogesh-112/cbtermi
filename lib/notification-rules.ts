import { supabase } from "./supabase";
import { sendEmail } from "./email";

export type RuleType =
  | "quote_sent" | "quote_approved" | "quote_rejected"
  | "change_order_approved"
  | "invoice_created" | "invoice_overdue" | "invoice_due_soon"
  | "payment_received"
  | "new_lead";

const RULE_DEFAULTS: Record<RuleType, { subject: string; message: string }> = {
  quote_sent: {
    subject: "Your quote from {{business_name}} is ready",
    message: "Hi {{contact_name}},\n\nYour quote is ready to review. Please click the link to view and approve it.\n\nThank you,\n{{business_name}}",
  },
  quote_approved: {
    subject: "Quote approved — {{business_name}}",
    message: "Hi {{contact_name}},\n\nThank you for approving the quote! We'll be in touch shortly to confirm next steps.\n\n{{business_name}}",
  },
  quote_rejected: {
    subject: "Quote update — {{business_name}}",
    message: "Hi {{contact_name}},\n\nWe received your request for changes on the quote. We'll review and be in touch shortly.\n\n{{business_name}}",
  },
  change_order_approved: {
    subject: "Change order approved — {{business_name}}",
    message: "Hi {{contact_name}},\n\nThank you for approving the change order. We'll proceed with the additional scope.\n\n{{business_name}}",
  },
  invoice_created: {
    subject: "New invoice from {{business_name}}",
    message: "Hi {{contact_name}},\n\nA new invoice has been created for your project. Please review and pay at your earliest convenience.\n\n{{business_name}}",
  },
  invoice_overdue: {
    subject: "Invoice overdue — {{business_name}}",
    message: "Hi {{contact_name}},\n\nThis is a reminder that an invoice is past due. Please make payment as soon as possible.\n\n{{business_name}}",
  },
  invoice_due_soon: {
    subject: "Invoice due soon — {{business_name}}",
    message: "Hi {{contact_name}},\n\nThis is a friendly reminder that your invoice will be due soon. Please make payment before the due date.\n\n{{business_name}}",
  },
  payment_received: {
    subject: "Payment received — {{business_name}}",
    message: "Hi {{contact_name}},\n\nThank you! We've received your payment. Your account is up to date.\n\n{{business_name}}",
  },
  new_lead: {
    subject: "Thanks for reaching out — {{business_name}}",
    message: "Hi {{contact_name}},\n\nThank you for contacting us! We'll be in touch shortly.\n\n{{business_name}}",
  },
};

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

export async function triggerNotificationRule(opts: {
  businessId: string;
  ruleType: RuleType;
  contactId?: string | null;
  entityType?: string;
  entityId?: string;
  extraVars?: Record<string, string>;
}) {
  const { businessId, ruleType, contactId, entityType, entityId, extraVars = {} } = opts;

  // Load the rule for this business
  const { data: rule } = await supabase
    .from("notification_rules")
    .select("*")
    .eq("business_id", businessId)
    .eq("rule_type", ruleType)
    .eq("is_enabled", true)
    .single();

  if (!rule) return; // Rule not enabled or doesn't exist

  // Load contact
  if (!contactId) return;
  const { data: contact } = await supabase
    .from("contacts")
    .select("full_name, email, phone, whatsapp_number")
    .eq("id", contactId)
    .single();
  if (!contact?.email) return;

  // Load business
  const { data: biz } = await supabase
    .from("businesses")
    .select("name, email, phone")
    .eq("id", businessId)
    .single();

  const defaults = RULE_DEFAULTS[ruleType];
  const vars: Record<string, string> = {
    business_name: biz?.name ?? "Your contractor",
    contact_name:  contact.full_name ?? "Customer",
    ...extraVars,
  };

  const subject = interpolate(rule.custom_subject ?? defaults.subject, vars);
  const body    = interpolate(rule.custom_message  ?? defaults.message,  vars);

  let status: "sent" | "failed" = "sent";
  let errorMessage: string | undefined;

  try {
    if (rule.channel === "email") {
      await sendEmail({
        to: contact.email,
        subject,
        html: `<div style="font-family:sans-serif;white-space:pre-wrap;color:#374151">${body}</div>`,
      });
    }
    // SMS/WhatsApp would be handled here when those integrations are live
  } catch (err: any) {
    status = "failed";
    errorMessage = err?.message;
  }

  // Log the send
  await supabase.from("notification_rule_logs").insert({
    business_id:   businessId,
    rule_type:     ruleType,
    contact_id:    contactId,
    entity_type:   entityType ?? null,
    entity_id:     entityId ?? null,
    channel:       rule.channel,
    status,
    error_message: errorMessage ?? null,
  });
}

export async function ensureDefaultRules(businessId: string) {
  const ruleTypes = Object.keys(RULE_DEFAULTS) as RuleType[];
  const rows = ruleTypes.map(rule_type => ({
    business_id: businessId,
    rule_type,
    is_enabled: false,
  }));
  // Insert only missing rows (ignore conflicts on unique key)
  await supabase.from("notification_rules").upsert(rows, { onConflict: "business_id,rule_type", ignoreDuplicates: true });
}
