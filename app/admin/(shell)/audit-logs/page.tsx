"use client";
import { useEffect, useState, useCallback } from "react";
import {
  AdminTable, AdminTr, AdminTd, MonoId, StatusPill,
  Pagination, AdminEmpty,
} from "@/components/admin/ui";
import { RefreshCw } from "lucide-react";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/audit-logs?page=${page}`)
      .then(r => r.json())
      .then(d => { setLogs(d.logs ?? []); setTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const actionColor = (action: string) => {
    if (action.includes("suspend") || action.includes("ban"))   return "text-red-400";
    if (action.includes("reactivate") || action.includes("unban")) return "text-emerald-400";
    if (action.includes("login"))    return "text-blue-400";
    if (action.includes("create"))   return "text-emerald-400";
    if (action.includes("delete"))   return "text-red-400";
    return "text-white/60";
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0d1117]">Audit Logs</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">All admin actions — {total} entries</p>
        </div>
        <button onClick={load} className="p-2 rounded-[8px] text-[#6b7280] hover:bg-white hover:text-[#0d1117] transition-colors border border-[#e5e7eb]">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <AdminTable headers={["When", "Admin", "Action", "Entity", "Payload", "IP"]}>
        {loading && <tr><td colSpan={6} className="py-10 text-center text-white/30 text-[13px]">Loading…</td></tr>}
        {!loading && logs.length === 0 && <AdminEmpty message="No audit logs yet" />}
        {logs.map((log: any) => (
          <AdminTr key={log.id}>
            <AdminTd className="text-[11px] text-white/40 whitespace-nowrap">
              {new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </AdminTd>
            <AdminTd>
              <div>
                <p className="text-white text-[12px] font-medium">{log.super_admins?.name ?? "—"}</p>
                <p className="text-[10px] text-white/25">{log.super_admins?.role?.replace(/_/g, " ")}</p>
              </div>
            </AdminTd>
            <AdminTd>
              <span className={`text-[12px] font-mono font-medium ${actionColor(log.action)}`}>{log.action}</span>
            </AdminTd>
            <AdminTd className="text-[12px]">
              {log.entity_type ? (
                <div>
                  <span className="text-white/50">{log.entity_type}</span>
                  {log.entity_id && <><br/><MonoId id={log.entity_id} /></>}
                </div>
              ) : "—"}
            </AdminTd>
            <AdminTd className="max-w-[160px]">
              {log.payload ? (
                <span className="text-[11px] text-white/30 font-mono line-clamp-2">
                  {JSON.stringify(log.payload)}
                </span>
              ) : "—"}
            </AdminTd>
            <AdminTd className="text-[11px] text-white/30 font-mono">{log.ip_address ?? "—"}</AdminTd>
          </AdminTr>
        ))}
      </AdminTable>

      <Pagination page={page} total={total} limit={50} onChange={setPage} />
    </div>
  );
}
