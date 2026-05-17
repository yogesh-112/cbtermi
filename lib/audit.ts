import { supabase } from "./supabase";

export async function logAudit(opts: {
  businessId: string;
  userId?: string;
  entityType: string;
  entityId?: string;
  action: string;
  payload?: Record<string, unknown>;
}) {
  await supabase.from("audit_events").insert({
    business_id: opts.businessId,
    user_id: opts.userId,
    entity_type: opts.entityType,
    entity_id: opts.entityId,
    action: opts.action,
    payload: opts.payload ?? null,
  });
}
