"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminTable, AdminTr, AdminTd, MonoId, StatusPill,
  SearchBar, FilterTabs, Pagination, AdminEmpty,
  AdminModal, AdminLabel, AdminInput, AdminBtn,
} from "@/components/admin/ui";
import { RefreshCw, RefreshCcw, Clock } from "lucide-react";

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
  const [syncing, setSyncing] = useState(false);
  const [extendModal, setExtendModal] = useState<{ id: string; bizName: string } | null>(null);
  const [extendDays, setExtendDays] = useState("7");
  const [extending, setExtending] = useState(false);

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

  async function handleStripeSync() {
    if (!confirm("Sync all subscriptions with Stripe? This will update statuses in your database.")) return;
    setSyncing(true);
    const res = await fetch("/api/admin/stripe/sync", { method: "POST" });
    const d = await res.json();
    if (res.ok) {
      alert(`Synced ${d.synced} subscriptions${d.failed ? `, ${d.failed} failed` : ""}.`);
      load();
    } else {
      alert(d.message ?? "Sync failed");
    }
    setSyncing(false);
  }

  async function handleExtendTrial() {
    if (!extendModal) return;
    setExtending(true);
    const res = await fetch(`/api/admin/subscriptions/${extendModal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "extend_trial", days: extendDays }),
    });
    const d = await res.json();
    if (res.ok) {
      setExtendModal(null);
      load();
    } else {
      alert(d.message ?? "Failed to extend trial");
    }
    setExtending(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#0d1117]">Subscriptions</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">{total} total subscriptions</p>
        </div>
        <div className="flex items-center gap-2">
          <AdminBtn onClick={handleStripeSync} disabled={syncing} variant="purple">
            <RefreshCcw size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing…" : "Sync Stripe"}
          </AdminBtn>
          <button onClick={load} className="p-2 rounded-[8px] text-[#6b7280] hover:text-[#0d1117] hover:bg-white border border-[#e8e9ed] transition-colors shadow-sm">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e8e9ed] rounded-[12px] px-4 py-3 flex items-center gap-4 flex-wrap shadow-sm">
        <FilterTabs options={STATUS_OPTS} value={status} onChange={setStatus} />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder="Search businesses…" />
      </div>

      <AdminTable headers={["Subscription", "Business", "Plan", "Status", "Trial Ends", "Created", ""]}>
        {loading && <tr><td colSpan={7} className="py-10 text-center text-[#9399a8] text-[13px]">Loading…</td></tr>}
        {!loading && subs.length === 0 && <AdminEmpty message="No subscriptions found" />}
        {subs.map((s: any) => (
          <AdminTr key={s.id} onClick={() => router.push(`/admin/businesses/${s.businesses?.id}`)}>
            <AdminTd><MonoId id={s.id} prefix="sub" /></AdminTd>
            <AdminTd>
              <div>
                <p className="text-[#0d1117] font-medium text-[13px]">{s.businesses?.name ?? "—"}</p>
                <p className="text-[11px] text-[#9399a8]">{s.businesses?.email ?? ""}</p>
              </div>
            </AdminTd>
            <AdminTd>
              <span className="text-[11px] font-semibold text-[#374151] bg-[#f0f1f5] px-2 py-0.5 rounded-full">
                {s.plans?.name ?? "—"}
              </span>
            </AdminTd>
            <AdminTd><StatusPill status={s.status} /></AdminTd>
            <AdminTd className="text-[12px] text-[#9399a8]">
              {s.trial_ends_at ? new Date(s.trial_ends_at).toLocaleDateString() : "—"}
            </AdminTd>
            <AdminTd className="text-[12px] text-[#9399a8]">
              {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </AdminTd>
            <AdminTd>
              <button
                onClick={e => { e.stopPropagation(); setExtendDays("7"); setExtendModal({ id: s.id, bizName: s.businesses?.name ?? s.id }); }}
                className="flex items-center gap-1 text-[11px] font-medium text-[#6b7280] hover:text-[#b33a4b] bg-[#f8f9fb] hover:bg-[#fdf2f3] border border-[#e8e9ed] px-2 py-1 rounded-[6px] transition-colors whitespace-nowrap"
              >
                <Clock size={11} /> Extend Trial
              </button>
            </AdminTd>
          </AdminTr>
        ))}
      </AdminTable>

      <Pagination page={page} total={total} limit={25} onChange={setPage} />

      {/* Extend Trial Modal */}
      <AdminModal open={!!extendModal} onClose={() => setExtendModal(null)} title="Extend Trial">
        <p className="text-[13px] text-[#6b7280] mb-4">
          Extend trial for <strong className="text-[#0d1117]">{extendModal?.bizName}</strong>.
          Days are added on top of the current trial end date.
        </p>
        <AdminLabel>Days to extend</AdminLabel>
        <AdminInput
          type="number"
          min="1"
          max="90"
          value={extendDays}
          onChange={e => setExtendDays(e.target.value)}
          placeholder="7"
          className="mb-4"
        />
        <p className="text-[11px] text-[#9399a8] mb-4">Maximum 90 days per extension.</p>
        <div className="flex gap-2 justify-end">
          <AdminBtn onClick={() => setExtendModal(null)} variant="ghost">Cancel</AdminBtn>
          <AdminBtn onClick={handleExtendTrial} disabled={extending}>
            {extending ? "Extending…" : `Extend ${extendDays} Day${extendDays === "1" ? "" : "s"}`}
          </AdminBtn>
        </div>
      </AdminModal>
    </div>
  );
}
