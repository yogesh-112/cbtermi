"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminTable, AdminTr, AdminTd, MonoId, StatusPill,
  SearchBar, FilterTabs, Pagination, AdminEmpty,
} from "@/components/admin/ui";
import { ChevronRight, RefreshCw, Plus } from "lucide-react";

const STATUS_OPTS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
];

export default function AdminBusinessesPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), status });
    if (search) params.set("search", search);
    fetch(`/api/admin/businesses?${params}`)
      .then(r => r.json())
      .then(d => { setBusinesses(d.businesses ?? []); setTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#0d1117]">Businesses</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">{total} total businesses</p>
        </div>
        <button onClick={load} className="p-2 rounded-[8px] text-[#6b7280] hover:text-[#0d1117] hover:bg-white border border-[#e8e9ed] transition-colors shadow-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-[#e8e9ed] rounded-[12px] px-4 py-3 flex items-center gap-4 flex-wrap shadow-sm">
        <FilterTabs options={STATUS_OPTS} value={status} onChange={setStatus} />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder="Search businesses…" />
      </div>

      {/* Table */}
      <AdminTable headers={["Business", "Owner Email", "Plan", "Status", "Created", ""]}>
        {loading && (
          <tr><td colSpan={6} className="py-10 text-center text-[#9399a8] text-[13px]">Loading…</td></tr>
        )}
        {!loading && businesses.length === 0 && <AdminEmpty message="No businesses found" />}
        {businesses.map((b: any) => {
          const sub = Array.isArray(b.subscriptions) ? b.subscriptions[0] : b.subscriptions;
          const plan = sub?.plans?.name ?? "—";
          const subStatus = sub?.status ?? "—";
          const isSuspended = b.admin_status === "suspended";
          return (
            <AdminTr key={b.id} onClick={() => router.push(`/admin/businesses/${b.id}`)}>
              <AdminTd>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#f0f1f5] flex items-center justify-center text-[11px] font-bold text-[#6b7280] flex-shrink-0">
                    {b.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[#0d1117] font-medium text-[13px]">{b.name}</p>
                    <MonoId id={b.id} prefix="biz" />
                  </div>
                </div>
              </AdminTd>
              <AdminTd className="text-[12px] text-[#6b7280]">{b.email ?? "—"}</AdminTd>
              <AdminTd>
                {plan !== "—" ? (
                  <span className="text-[11px] font-semibold text-[#374151] bg-[#f0f1f5] px-2 py-0.5 rounded-full">{plan}</span>
                ) : <span className="text-[#c0c3cc] text-[12px]">—</span>}
              </AdminTd>
              <AdminTd>
                <StatusPill status={isSuspended ? "suspended" : subStatus !== "—" ? subStatus : "active"} />
              </AdminTd>
              <AdminTd className="text-[12px] text-[#9399a8]">
                {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </AdminTd>
              <AdminTd>
                <ChevronRight size={14} className="text-[#c0c3cc]" />
              </AdminTd>
            </AdminTr>
          );
        })}
      </AdminTable>

      <Pagination page={page} total={total} limit={25} onChange={setPage} />
    </div>
  );
}
