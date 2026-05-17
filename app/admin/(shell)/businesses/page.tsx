"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminTable, AdminTr, AdminTd, MonoId, StatusPill,
  SearchBar, FilterTabs, Pagination, AdminEmpty,
} from "@/components/admin/ui";
import { ChevronRight, RefreshCw } from "lucide-react";

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
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0d1117]">Businesses</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">{total} total businesses</p>
        </div>
        <button onClick={load} className="p-2 rounded-[8px] text-[#6b7280] hover:bg-white hover:text-[#0d1117] transition-colors border border-[#e5e7eb]">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e5e7eb] rounded-[12px] px-4 py-3 flex items-center gap-4 flex-wrap">
        <FilterTabs options={STATUS_OPTS} value={status} onChange={setStatus} />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder="Search businesses…" />
      </div>

      {/* Table */}
      <AdminTable headers={["Business", "Owner Email", "Plan", "Status", "Created", ""]}>
        {loading && <tr><td colSpan={6} className="py-10 text-center text-white/30 text-[13px]">Loading…</td></tr>}
        {!loading && businesses.length === 0 && <AdminEmpty message="No businesses found" />}
        {businesses.map((b: any) => {
          const sub = Array.isArray(b.subscriptions) ? b.subscriptions[0] : b.subscriptions;
          const plan = sub?.plans?.name ?? "—";
          const subStatus = sub?.status ?? b.admin_status ?? "active";
          return (
            <AdminTr key={b.id} onClick={() => router.push(`/admin/businesses/${b.id}`)}>
              <AdminTd>
                <div>
                  <p className="text-white font-medium text-[13px]">{b.name}</p>
                  <MonoId id={b.id} prefix="biz" />
                </div>
              </AdminTd>
              <AdminTd className="text-[12px]">{b.email ?? "—"}</AdminTd>
              <AdminTd>
                <span className="text-[12px] text-white/60 bg-white/[0.06] px-2 py-0.5 rounded-full">{plan}</span>
              </AdminTd>
              <AdminTd><StatusPill status={b.admin_status === "suspended" ? "suspended" : subStatus} /></AdminTd>
              <AdminTd className="text-[12px] text-white/40">
                {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </AdminTd>
              <AdminTd><ChevronRight size={14} className="text-white/20" /></AdminTd>
            </AdminTr>
          );
        })}
      </AdminTable>

      <Pagination page={page} total={total} limit={25} onChange={setPage} />
    </div>
  );
}
