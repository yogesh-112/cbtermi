import { supabase } from "./supabase";

export async function logAdminAudit(opts: {
  adminId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await supabase.from("admin_audit_logs").insert({
    admin_id:    opts.adminId,
    action:      opts.action,
    entity_type: opts.entityType ?? null,
    entity_id:   opts.entityId ?? null,
    payload:     opts.payload ?? null,
    ip_address:  opts.ipAddress ?? null,
  });
}
