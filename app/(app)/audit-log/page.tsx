"use client";
import { useEffect, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { fmtDate } from "@/lib/utils";

const ACTION_COLORS: Record<string, string> = {
  created:  "bg-blue-50 text-blue-700",
  updated:  "bg-amber-50 text-amber-700",
  deleted:  "bg-red-50 text-red-600",
  approved: "bg-green-50 text-green-700",
  sent:     "bg-violet-50 text-violet-700",
  paid:     "bg-emerald-50 text-emerald-700",
  voided:   "bg-[#f0efea] text-[#8a8fa3]",
};

const ENTITY_LABELS: Record<string, string> = {
  invoice:  "Invoice",
  quote:    "Quote",
  payment:  "Payment",
  project:  "Project",
  contact:  "Contact",
  settings: "Settings",
  team:     "Team",
  business: "Business",
};

const ENTITY_FILTERS = ["All", "invoice", "quote", "payment", "project", "contact"];

export default function AuditLogPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("All");

  useEffect(() => {
    fetch("/api/audit-log")
      .then(r => r.json())
      .then(d => setEvents(d.events ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => {
    const matchesEntity = entityFilter === "All" || e.entity_type === entityFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      e.action?.toLowerCase().includes(q) ||
      e.entity_type?.toLowerCase().includes(q) ||
      e.entity_id?.toLowerCase().includes(q) ||
      JSON.stringify(e.payload ?? {}).toLowerCase().includes(q) ||
      e.users?.name?.toLowerCase().includes(q);
    return matchesEntity && matchesSearch;
  });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="text-[13px] text-[#8a8fa3] mt-0.5">Track all changes and actions in your account</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8fa3] pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events…"
            className="field pl-8 w-full" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ENTITY_FILTERS.map(f => (
            <button key={f} onClick={() => setEntityFilter(f)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-lg capitalize transition-colors
                ${entityFilter === f ? "bg-brand-navy text-white" : "text-[#8a8fa3] border border-[#e7e6e1] hover:bg-[#f6f6f3]"}`}>
              {f === "All" ? "All" : ENTITY_LABELS[f] ?? f}
            </button>
          ))}
        </div>
      </div>

      {/* Events table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck size={32} className="mx-auto text-[#d8d6cf] mb-3" />
            <p className="text-[14px] font-medium text-[#4a5168]">No events found</p>
            <p className="text-[13px] text-[#8a8fa3] mt-1">Actions you and your team take will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e: any) => (
                  <tr key={e.id}>
                    <td className="text-[#8a8fa3] whitespace-nowrap">{fmtDate(e.created_at)}</td>
                    <td>
                      <span className="text-[13px] font-medium text-[#0c1226]">
                        {e.users?.name ?? "System"}
                      </span>
                    </td>
                    <td>
                      <span className="text-[12px] text-[#8a8fa3] capitalize">
                        {ENTITY_LABELS[e.entity_type] ?? e.entity_type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge capitalize ${ACTION_COLORS[e.action] ?? "bg-[#f0efea] text-[#4a5168]"}`}>
                        {e.action}
                      </span>
                    </td>
                    <td className="font-mono text-[11px] text-[#8a8fa3]">
                      {e.entity_id ? e.entity_id.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="max-w-[200px]">
                      {e.payload ? (
                        <span className="text-[11px] text-[#8a8fa3] truncate block">
                          {Object.entries(e.payload).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </span>
                      ) : <span className="text-[#d8d6cf]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
