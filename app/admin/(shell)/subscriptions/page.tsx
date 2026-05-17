"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminTable, AdminTr, AdminTd, MonoId, StatusPill,
  SearchBar, FilterTabs, Pagination, AdminEmpty,
} from "@/components/admin/ui";
import { RefreshCw } from "lucide-react";

const STATUS_OPTS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Trial", value: "trialing" },
  { label: "Past Due", value: "past_due" },
  { label: "Canceled", value: "canceled" },
];

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [subs, setSubs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), status });
    if (search) params.set("search", search);
    fetch(`/api/admin/subscriptions?${params}`)
      .then(r => r.json())
      .then(d => { setSubs(d.subscriptions ?? []); setTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status, search]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0d1117]">Subscriptions</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">{total} total subscriptions</p>
        </div>
        <button onClick={load} className="p-2 rounded-[8px] text-[#6b7280] hover:bg-white hover:text-[#0d1117] transition-colors border border-[#e5e7eb]">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-[12px] px-4 py-3 flex items-center gap-4 flex-wrap">
        <FilterTabs options={STATUS_OPTS} value={status} onChange={setStatus} />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder="Search businesses…" />
      </div>

      <AdminTable headers={["Business", "Plan", "Status", "Trial Ends", "Created"]}>
        {loading && <tr><td colSpan={5} className="py-10 text-center text-white/30 text-[13px]">Loading…</td></tr>}
        {!loading && subs.length === 0 && <AdminEmpty message="No subscriptions found" />}
        {subs.map((s: any) => (
          <AdminTr key={s.id} onClick={() => router.push(`/admin/businesses/${s.businesses?.id}`)}>
            <AdminTd>
              <div>
                <p className="text-white font-medium text-[13px]">{s.businesses?.name ?? "—"}</p>
                <p className="text-[11px] text-white/30">{s.businesses?.email ?? ""}</p>
              </div>
            </AdminTd>
            <AdminTd>
              <span className="text-[12px] text-white/60 bg-white/[0.06] px-2 py-0.5 rounded-full">
                {s.plans?.name ?? "—"}
              </span>
            </AdminTd>
            <AdminTd><StatusPill status={s.status} /></AdminTd>
            <AdminTd className="text-[12px] text-white/40">
              {s.trial_ends_at ? new Date(s.trial_ends_at).toLocaleDateString() : "—"}
            </AdminTd>
            <AdminTd className="text-[12px] text-white/40">
              {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </AdminTd>
          </AdminTr>
        ))}
      </AdminTable>

      <Pagination page={page} total={total} limit={25} onChange={setPage} />
    </div>
  );
}
