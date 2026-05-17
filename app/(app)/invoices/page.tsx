"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Receipt, Eye, Search } from "lucide-react";
import { StatusBadge, EmptyState, ActionMenu } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const STATUS_TABS = [
    { value: "", label: "All" },
    { value: "sent", label: "Sent" },
    { value: "paid", label: "Paid" },
    { value: "overdue", label: "Overdue" },
  ];

  const load = () => {
    setLoading(true);
    fetch("/api/invoices").then(r => r.json()).then(d => setInvoices(d.invoices ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = invoices.filter(inv => {
    if (statusFilter && inv.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return inv.invoice_number?.toLowerCase().includes(q) ||
      inv.contacts?.full_name?.toLowerCase().includes(q);
  });

  const outstanding = invoices.reduce((s, inv) => s + (inv.amount_due ?? 0), 0);
  const paid = invoices.filter(inv => inv.status === "paid").length;
  const totalValue = invoices.reduce((s, inv) => s + (inv.total ?? 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-desc">{invoices.length} invoices</p>
        </div>
        <Link href="/invoices/new" className="btn btn-green"><Plus size={15} /> Create Invoice</Link>
      </div>

      {/* Mini stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="mini-stat mini-stat-navy">
          <span className="mini-stat-label">Total Invoices</span>
          <span className="mini-stat-value">{invoices.length}</span>
          <span className="mini-stat-sub">{fmt(totalValue)} total</span>
        </div>
        <div className="mini-stat mini-stat-amber">
          <span className="mini-stat-label">Outstanding</span>
          <span className="mini-stat-value">{fmt(outstanding)}</span>
        </div>
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">Paid</span>
          <span className="mini-stat-value">{paid}</span>
          <span className="mini-stat-sub">invoices</span>
        </div>
      </div>

      {/* Filter tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="tabs-bar mb-0 flex-1">
          {STATUS_TABS.map(t => (
            <button key={t.value} onClick={() => setStatusFilter(t.value)}
              className={`tab-btn ${statusFilter === t.value ? "active" : ""}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="input-group w-full sm:w-64 flex-shrink-0">
          <Search size={14} className="input-icon" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices…" className="field" />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="mobile-card animate-pulse h-28 skeleton" />)
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Receipt size={36} />} title="No invoices yet" description="Create your first invoice."
            action={<Link href="/invoices/new" className="btn btn-green btn-sm"><Plus size={14} /> Create Invoice</Link>} />
        ) : filtered.map(inv => (
          <Link key={inv.id} href={`/invoices/${inv.id}`} className="mobile-card block hover:shadow-card-md transition-shadow">
            <div className="mobile-card-row">
              <div>
                <p className="font-semibold text-[#0c1226]">{inv.invoice_number}</p>
                <p className="text-xs text-[#8a8fa3] mt-0.5">{inv.contacts?.full_name || "—"}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-navy">{fmt(inv.total)}</p>
                <StatusBadge status={inv.status} />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f0efea]">
              <span className="text-xs text-[#8a8fa3]">{fmtDate(inv.created_at)}</span>
              <span className={`text-xs font-semibold ${inv.amount_due > 0 ? "text-red-600" : "text-brand-green"}`}>
                {inv.amount_due > 0 ? `${fmt(inv.amount_due)} due` : "Paid"}
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
              <th>Number</th>
              <th>Contact</th>
              <th>Total</th>
              <th>Amount Due</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-[#8a8fa3]">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState icon={<Receipt size={40} />} title="No invoices yet" description="Create your first invoice."
                  action={<Link href="/invoices/new" className="btn btn-green btn-sm"><Plus size={14} /> Create Invoice</Link>} />
              </td></tr>
            ) : filtered.map(inv => (
              <tr key={inv.id}>
                <td>
                  <Link href={`/invoices/${inv.id}`} className="font-medium text-brand-navy hover:underline">
                    {inv.invoice_number}
                  </Link>
                </td>
                <td className="text-[#4a5168]">{inv.contacts?.full_name || "—"}</td>
                <td className="font-semibold">{fmt(inv.total)}</td>
                <td className={inv.amount_due > 0 ? "text-red-600 font-semibold" : "text-brand-green font-semibold"}>
                  {fmt(inv.amount_due)}
                </td>
                <td><StatusBadge status={inv.status} /></td>
                <td className="text-[#8a8fa3] text-xs">{fmtDate(inv.created_at)}</td>
                <td>
                  <ActionMenu items={[
                    { label: "View / Edit", icon: <Eye size={14} />, onClick: () => window.location.href = `/invoices/${inv.id}` },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
