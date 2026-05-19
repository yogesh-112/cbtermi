"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Receipt, Search, SlidersHorizontal, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const AVATAR_COLORS = [
  "bg-[#2453E4]","bg-brand-green","bg-brand-navy","bg-[#7C3AED]",
  "bg-[#D97706]","bg-[#DC2626]","bg-[#0D9488]","bg-[#DB2777]",
];

function InvStatusBadge({ inv }: { inv: any }) {
  const t = useT();
  const now = new Date();
  const due = inv.due_date ? new Date(inv.due_date) : null;
  const daysOverdue = due && due < now ? Math.ceil((now.getTime() - due.getTime()) / 86400000) : 0;
  const daysTilDue  = due && due >= now ? Math.ceil((due.getTime() - now.getTime()) / 86400000) : 0;

  if (inv.status === "paid") return <span className="badge bg-brand-green/10 text-brand-green">● {t.invoices.paid}</span>;
  if (daysOverdue > 0) return <span className="badge bg-red-50 text-red-600">● {t.invoices.overdueLabel} {daysOverdue}d</span>;
  if (daysTilDue <= 7 && daysTilDue > 0) return <span className="badge bg-amber-50 text-amber-700">● {t.invoices.dueSoon}</span>;
  if (inv.status === "draft") return <span className="badge bg-[#f0efea] text-[#8a8fa3]">{t.common.draft}</span>;
  return <span className="badge bg-orange-50 text-orange-700">● {t.invoices.awaiting}</span>;
}

export default function InvoicesPage() {
  const t = useT();
  const PAGE_SIZE = 50;
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    outstandingAmt: 0, paidAmt: 0,
    dueThisWeekAmt: 0, dueThisWeekCount: 0,
    overdueAmt: 0, overdueCount: 0, outstandingCount: 0,
    counts: { all: 0, draft: 0, sent: 0, overdue: 0, paid: 0 },
  });

  const load = (p: number, sf: string) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(p * PAGE_SIZE) });
    if (sf !== "all") params.set("status", sf);
    fetch(`/api/invoices?${params}`).then(r => r.json()).then(d => {
      setInvoices(d.invoices ?? []);
      setTotal(d.total ?? 0);
      if (d.summary) setSummary(d.summary);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(0, "all"); }, []);

  const handleFilter = (sf: string) => { setStatusFilter(sf); setPage(0); load(0, sf); };

  const STATUS_TABS = [
    { key: "all",     label: t.invoices.tabAll,     count: summary.counts.all },
    { key: "draft",   label: t.invoices.tabDrafts,  count: summary.counts.draft },
    { key: "sent",    label: t.invoices.tabSent,    count: summary.counts.sent },
    { key: "overdue", label: t.invoices.tabOverdue, count: summary.counts.overdue },
    { key: "paid",    label: t.invoices.tabPaid,    count: summary.counts.paid },
  ];

  const now = new Date();

  const filtered = invoices.filter(i => {
    if (!search) return true;
    const s = search.toLowerCase();
    return i.invoice_number?.toLowerCase().includes(s) ||
      i.contacts?.full_name?.toLowerCase().includes(s) ||
      i.projects?.name?.toLowerCase().includes(s);
  });

  const getInitials = (name: string) =>
    name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div>
      <div className="mb-1">
        <h1 className="page-title">{t.invoices.title}</h1>
        <p className="page-desc">{fmt(summary.outstandingAmt)} {t.invoices.outstanding.toLowerCase()} · {fmt(summary.paidAmt)} {t.invoices.paidThisMonth.toLowerCase()}</p>
      </div>

      {/* 4 large stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="mini-stat mini-stat-rose">
          <span className="mini-stat-label">{t.invoices.outstanding}</span>
          <span className="mini-stat-value text-[20px]">{fmt(summary.outstandingAmt)}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">{summary.outstandingCount} invoice{summary.outstandingCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="mini-stat mini-stat-blue">
          <span className="mini-stat-label">{t.invoices.dueThisWeek}</span>
          <span className="mini-stat-value text-[20px]">{fmt(summary.dueThisWeekAmt)}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">{summary.dueThisWeekCount} invoice{summary.dueThisWeekCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="mini-stat mini-stat-amber">
          <span className="mini-stat-label">{t.invoices.overdue}</span>
          <span className="mini-stat-value text-[20px]">{fmt(summary.overdueAmt)}</span>
          <span className="text-[11px] text-red-500 mt-0.5">{summary.overdueCount} invoice{summary.overdueCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">{t.invoices.paidThisMonth}</span>
          <span className="mini-stat-value text-[20px]">{fmt(summary.paidAmt)}</span>
          <span className="text-[11px] text-brand-green flex items-center gap-1 mt-0.5">
            <TrendingUp size={10} /> {t.invoices.totalReceived}
          </span>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="tabs-bar mb-0 flex-1">
          {STATUS_TABS.map(st => (
            <button key={st.key} onClick={() => handleFilter(st.key)}
              className={`tab-btn ${statusFilter === st.key ? "active" : ""} flex items-center gap-1.5`}>
              {st.label}
              {st.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0efea] text-[#8a8fa3]">{st.count}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="input-group w-52">
            <Search size={13} className="input-icon" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.invoices.searchPlaceholder} className="field" />
          </div>
          <button className="btn btn-outline btn-sm gap-1.5"><SlidersHorizontal size={13} /> Filters</button>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="mobile-card animate-pulse h-28 skeleton" />)
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Receipt size={36} />} title={t.invoices.noInvoices} description={t.invoices.noInvoicesFilter}
            action={<Link href="/invoices/new" className="btn btn-primary btn-sm"><Plus size={14} /> {t.invoices.newInvoice}</Link>} />
        ) : filtered.map(inv => (
          <Link key={inv.id} href={`/invoices/${inv.id}`} className="mobile-card block hover:shadow-card-md transition-shadow">
            <div className="mobile-card-row">
              <div>
                <p className="font-semibold text-[#0c1226]">{inv.invoice_number}</p>
                <p className="text-xs text-[#4a5168] mt-0.5">{inv.contacts?.full_name || "—"}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#0c1226]">{fmt(inv.total)}</p>
                <InvStatusBadge inv={inv} />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f0efea]">
              <span className="text-xs text-[#8a8fa3]">{fmtDate(inv.created_at)}</span>
              <span className={`text-xs font-semibold ${(inv.amount_due ?? 0) > 0 ? "text-red-600" : "text-brand-green"}`}>
                {(inv.amount_due ?? 0) > 0 ? `${fmt(inv.amount_due)} ${t.invoices.dueLabel}` : t.invoices.paid}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t.invoices.invoiceCol}</th>
              <th>{t.invoices.projectCol}</th>
              <th>{t.invoices.customerCol}</th>
              <th>{t.invoices.amountCol}</th>
              <th>{t.invoices.issuedCol}</th>
              <th>{t.invoices.dueCol}</th>
              <th>{t.invoices.statusCol}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-[#8a8fa3]">{t.invoices.loading}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}>
                <EmptyState icon={<Receipt size={40} />} title={t.invoices.noInvoicesYet} description={t.invoices.noInvoicesDesc}
                  action={<Link href="/invoices/new" className="btn btn-primary btn-sm"><Plus size={14} /> {t.invoices.newInvoice}</Link>} />
              </td></tr>
            ) : filtered.map((inv, idx) => {
              const name = inv.contacts?.full_name;
              const initials = getInitials(name || "?");
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <tr key={inv.id}>
                  <td>
                    <Link href={`/invoices/${inv.id}`} className="font-semibold text-brand-navy hover:underline text-[13px]">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="text-[#4a5168] text-[13px]">{inv.projects?.name || "—"}</td>
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
                  <td className="font-semibold text-[13px]">{fmt(inv.total)}</td>
                  <td className="text-[#8a8fa3] text-[12px]">{fmtDate(inv.created_at)}</td>
                  <td className="text-[12px]">
                    {inv.due_date ? (
                      <span className={new Date(inv.due_date) < now && inv.status !== "paid" ? "text-red-500 font-medium" : "text-[#8a8fa3]"}>
                        {fmtDate(inv.due_date)}
                      </span>
                    ) : "—"}
                  </td>
                  <td><InvStatusBadge inv={inv} /></td>
                  <td>
                    <span className="text-[#d8d6cf] cursor-pointer hover:text-[#8a8fa3]">···</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f0efea]">
          <span className="text-[13px] text-[#8a8fa3]">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button onClick={() => { const p = page - 1; setPage(p); load(p, statusFilter); }} disabled={page === 0}
              className="btn btn-outline btn-sm disabled:opacity-40">Previous</button>
            <button onClick={() => { const p = page + 1; setPage(p); load(p, statusFilter); }} disabled={(page + 1) * PAGE_SIZE >= total}
              className="btn btn-outline btn-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
