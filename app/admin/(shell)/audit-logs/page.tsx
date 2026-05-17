"use client";
import { useEffect, useState, useCallback } from "react";
import { AdminTable, AdminTr, AdminTd, MonoId, Pagination, AdminEmpty } from "@/components/admin/ui";
import { RefreshCw } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  suspend:    "bg-red-50 text-red-700",
  ban:        "bg-red-50 text-red-700",
  reactivate: "bg-emerald-50 text-emerald-700",
  unban:      "bg-emerald-50 text-emerald-700",
  login:      "bg-blue-50 text-blue-700",
  create:     "bg-emerald-50 text-emerald-700",
  delete:     "bg-red-50 text-red-700",
  update:     "bg-amber-50 text-amber-700",
};

function actionColor(action: string) {
  const key = Object.keys(ACTION_COLORS).find(k => action.includes(k));
  return key ? ACTION_COLORS[key] : "bg-gray-100 text-gray-600";
}

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#0d1117]">Audit Logs</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">All admin actions · {total} entries</p>
        </div>
        <button onClick={load} className="p-2 rounded-[8px] text-[#6b7280] hover:text-[#0d1117] hover:bg-white border border-[#e8e9ed] transition-colors shadow-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <AdminTable headers={["When", "Admin", "Action", "Entity", "IP"]}>
        {loading && <tr><td colSpan={5} className="py-10 text-center text-[#9399a8] text-[13px]">Loading…</td></tr>}
        {!loading && logs.length === 0 && <AdminEmpty message="No audit logs yet" />}
        {logs.map((log: any) => (
          <AdminTr key={log.id}>
            <AdminTd className="text-[11px] text-[#9399a8] whitespace-nowrap">
              {new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </AdminTd>
            <AdminTd>
              <div>
                <p className="text-[#0d1117] font-medium text-[13px]">{log.super_admins?.name ?? "System"}</p>
                <p className="text-[10px] text-[#9399a8]">{log.super_admins?.role?.replace(/_/g, " ")}</p>
              </div>
            </AdminTd>
            <AdminTd>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono ${actionColor(log.action)}`}>
                {log.action}
              </span>
            </AdminTd>
            <AdminTd>
              {log.entity_type ? (
                <div>
                  <span className="text-[12px] text-[#6b7280]">{log.entity_type}</span>
                  {log.entity_id && <><br /><MonoId id={log.entity_id} /></>}
                </div>
              ) : <span className="text-[#c0c3cc]">—</span>}
            </AdminTd>
            <AdminTd className="text-[11px] text-[#9399a8] font-mono">{log.ip_address ?? "—"}</AdminTd>
          </AdminTr>
        ))}
      </AdminTable>

      <Pagination page={page} total={total} limit={50} onChange={setPage} />
    </div>
  );
}
