"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Trash2, Search, SlidersHorizontal } from "lucide-react";
import { StatusBadge, EmptyState, toast, ConfirmDialog } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-brand-navy","bg-[#2453E4]","bg-brand-green","bg-[#7C3AED]",
  "bg-[#D97706]","bg-[#DC2626]","bg-[#0D9488]","bg-[#DB2777]",
];

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => {
    setLoading(true);
    fetch("/api/quotes").then(r => r.json()).then(d => setQuotes(d.quotes ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const del = async () => {
    if (!deleteId) return;
    await fetch(`/api/quotes/${deleteId}`, { method: "DELETE" });
    toast("Quote deleted"); setDeleteId(null); load();
  };

  const draft    = quotes.filter(q => q.status === "draft").length;
  const sent     = quotes.filter(q => ["sent","viewed"].includes(q.status)).length;
  const approved = quotes.filter(q => q.status === "approved").length;
  const expired  = quotes.filter(q => q.status === "expired").length;
  const rejected = quotes.filter(q => q.status === "rejected").length;
  const totalValue = quotes.filter(q => q.status === "approved").reduce((s, q) => s + (q.total ?? 0), 0);
  const allValue   = quotes.reduce((s, q) => s + (q.total ?? 0), 0);

  const STATUS_TABS = [
    { key: "all",      label: "All",       count: quotes.length },
    { key: "draft",    label: "Draft",     count: draft },
    { key: "sent",     label: "Sent",      count: sent },
    { key: "approved", label: "Approved",  count: approved },
    { key: "rejected", label: "Rejected",  count: rejected },
  ];

  const filtered = quotes.filter(q => {
    if (statusFilter !== "all") {
      if (statusFilter === "sent" && !["sent","viewed"].includes(q.status)) return false;
      if (statusFilter !== "sent" && q.status !== statusFilter) return false;
    }
    if (!search) return true;
    const s = search.toLowerCase();
    return q.quote_number?.toLowerCase().includes(s) ||
      q.title?.toLowerCase().includes(s) ||
      q.contacts?.full_name?.toLowerCase().includes(s) ||
      q.projects?.name?.toLowerCase().includes(s);
  });

  const getInitials = (name: string) =>
    name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div>
      <div className="mb-1">
        <h1 className="page-title">Quotes</h1>
        <p className="page-desc">{fmt(allValue)} quoted · {approved} approved</p>
      </div>

      {/* 5 stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <div className="mini-stat mini-stat-navy">
          <span className="mini-stat-label">Draft</span>
          <span className="mini-stat-value">{draft}</span>
        </div>
        <div className="mini-stat mini-stat-blue">
          <span className="mini-stat-label">Sent / Viewed</span>
          <span className="mini-stat-value">{sent}</span>
        </div>
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">Approved</span>
          <span className="mini-stat-value">{approved}</span>
        </div>
        <div className="mini-stat mini-stat-amber">
          <span className="mini-stat-label">Expired</span>
          <span className="mini-stat-value">{expired}</span>
        </div>
        <div className="mini-stat mini-stat-rose lg:col-span-1 col-span-2 sm:col-span-1">
          <span className="mini-stat-label">Total value</span>
          <span className="mini-stat-value text-[18px]">{fmt(allValue)}</span>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="tabs-bar mb-0 flex-1">
          {STATUS_TABS.map(t => (
            <button key={t.key} onClick={() => setStatusFilter(t.key)}
              className={`tab-btn ${statusFilter === t.key ? "active" : ""} flex items-center gap-1.5`}>
              {t.label}
              {t.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0efea] text-[#8a8fa3]">{t.count}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="input-group w-52">
            <Search size={13} className="input-icon" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search quotes…" className="field" />
          </div>
          <button className="btn btn-outline btn-sm gap-1.5"><SlidersHorizontal size={13} /> Filters</button>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="mobile-card animate-pulse h-24 skeleton" />)
        ) : filtered.length === 0 ? (
          <EmptyState icon={<FileText size={36} />} title="No quotes" description="No quotes match your filters."
            action={<Link href="/quotes/new" className="btn btn-primary btn-sm"><Plus size={14} /> New Quote</Link>} />
        ) : filtered.map(q => (
          <Link key={q.id} href={`/quotes/${q.id}`} className="mobile-card block hover:shadow-card-md transition-shadow">
            <div className="mobile-card-row">
              <div>
                <p className="font-semibold text-[#0c1226]">{q.quote_number}</p>
                <p className="text-xs text-[#4a5168] mt-0.5">{q.projects?.name || q.title || "—"}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#0c1226]">{fmt(q.total)}</p>
                <StatusBadge status={q.status} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#8a8fa3]">
              {q.contacts?.full_name && <span>{q.contacts.full_name}</span>}
              <span>{fmtDate(q.created_at)}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>#</th>
              <th>Project</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Created</th>
              <th>Valid until</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-[#8a8fa3]">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}>
                <EmptyState icon={<FileText size={40} />} title="No quotes yet" description="Create your first quote."
                  action={<Link href="/quotes/new" className="btn btn-primary btn-sm"><Plus size={14} /> New Quote</Link>} />
              </td></tr>
            ) : filtered.map((q, idx) => {
              const name = q.contacts?.full_name;
              const initials = getInitials(name || "?");
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <tr key={q.id}>
                  <td>
                    <Link href={`/quotes/${q.id}`} className="font-semibold text-brand-navy hover:underline text-[13px]">
                      {q.quote_number}
                    </Link>
                  </td>
                  <td className="text-[#4a5168] text-[13px]">{q.projects?.name || q.title || "—"}</td>
                  <td>
                    {name ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 ${avatarColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-[9px] font-bold">{initials}</span>
                        </div>
                        <span className="text-[13px] text-[#0c1226]">{name}</span>
                      </div>
                    ) : <span className="text-[#8a8fa3]">—</span>}
                  </td>
                  <td className="font-semibold text-[13px]">{fmt(q.total)}</td>
                  <td className="text-[#8a8fa3] text-[12px]">{fmtDate(q.created_at)}</td>
                  <td className="text-[#8a8fa3] text-[12px]">{fmtDate(q.valid_until) || "—"}</td>
                  <td><StatusBadge status={q.status} /></td>
                  <td>
                    <button onClick={() => setDeleteId(q.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-[#d8d6cf] hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={del}
        title="Delete quote" message="Delete this quote? This cannot be undone." danger />
    </div>
  );
}
