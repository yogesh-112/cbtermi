"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminTable, AdminTr, AdminTd, MonoId, StatusPill,
  SearchBar, FilterTabs, Pagination, AdminEmpty,
} from "@/components/admin/ui";
import { ChevronRight, RefreshCw } from "lucide-react";

const FILTER_OPTS = [
  { label: "All", value: "all" },
  { label: "Banned", value: "banned" },
  { label: "Unverified", value: "unverified" },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), filter });
    if (search) params.set("search", search);
    fetch(`/api/admin/users?${params}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  }, [page, search, filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, filter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#0d1117]">Users</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">{total} registered users</p>
        </div>
        <button onClick={load} className="p-2 rounded-[8px] text-[#6b7280] hover:text-[#0d1117] hover:bg-white border border-[#e8e9ed] transition-colors shadow-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="bg-white border border-[#e8e9ed] rounded-[12px] px-4 py-3 flex items-center gap-4 flex-wrap shadow-sm">
        <FilterTabs options={FILTER_OPTS} value={filter} onChange={setFilter} />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder="Search users…" />
      </div>

      <AdminTable headers={["User", "Email", "Businesses", "Status", "Joined", ""]}>
        {loading && <tr><td colSpan={6} className="py-10 text-center text-[#9399a8] text-[13px]">Loading…</td></tr>}
        {!loading && users.length === 0 && <AdminEmpty message="No users found" />}
        {users.map((u: any) => {
          const bizCount = Array.isArray(u.business_members)
            ? u.business_members.length
            : u.business_members?.count ?? 0;
          return (
            <AdminTr key={u.id} onClick={() => router.push(`/admin/users/${u.id}`)}>
              <AdminTd>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#f0f1f5] flex items-center justify-center text-[11px] font-bold text-[#6b7280] flex-shrink-0">
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[#0d1117] font-medium text-[13px]">{u.name}</p>
                    <MonoId id={u.id} prefix="usr" />
                  </div>
                </div>
              </AdminTd>
              <AdminTd className="text-[12px] text-[#6b7280]">{u.email}</AdminTd>
              <AdminTd className="text-[12px] text-[#6b7280]">{bizCount} biz</AdminTd>
              <AdminTd>
                {u.is_banned ? <StatusPill status="banned" />
                  : !u.email_verified ? <StatusPill status="inactive" />
                  : <StatusPill status="active" />}
              </AdminTd>
              <AdminTd className="text-[12px] text-[#9399a8]">
                {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </AdminTd>
              <AdminTd><ChevronRight size={14} className="text-[#c0c3cc]" /></AdminTd>
            </AdminTr>
          );
        })}
      </AdminTable>

      <Pagination page={page} total={total} limit={25} onChange={setPage} />
    </div>
  );
}
