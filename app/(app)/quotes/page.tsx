"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Eye, Trash2 } from "lucide-react";
import { StatusBadge, EmptyState, toast, ConfirmDialog, ActionMenu } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/quotes").then(r => r.json()).then(d => setQuotes(d.quotes ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const del = async () => {
    if (!deleteId) return;
    await fetch(`/api/quotes/${deleteId}`, { method: "DELETE" });
    toast("Quote deleted");
    setDeleteId(null);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotes</h1>
          <p className="page-desc">{quotes.length} quotes</p>
        </div>
        <Link href="/quotes/new" className="btn btn-green"><Plus size={15} /> Create Quote</Link>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="mobile-card animate-pulse h-24 skeleton" />)
        ) : quotes.length === 0 ? (
          <EmptyState icon={<FileText size={36} />} title="No quotes yet" description="Create your first quote."
            action={<Link href="/quotes/new" className="btn btn-green btn-sm"><Plus size={14} /> Create Quote</Link>} />
        ) : quotes.map(q => (
          <Link key={q.id} href={`/quotes/${q.id}`} className="mobile-card block hover:shadow-card-md transition-shadow">
            <div className="mobile-card-row">
              <div>
                <p className="font-semibold text-[#111827]">{q.quote_number}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{q.title || "—"}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-navy">{fmt(q.total)}</p>
                <StatusBadge status={q.status} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#9CA3AF]">
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
              <th>Number</th>
              <th>Title</th>
              <th>Contact</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-[#9CA3AF]">Loading…</td></tr>
            ) : quotes.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState icon={<FileText size={40} />} title="No quotes yet" description="Create your first quote."
                  action={<Link href="/quotes/new" className="btn btn-green btn-sm"><Plus size={14} /> Create Quote</Link>} />
              </td></tr>
            ) : quotes.map(q => (
              <tr key={q.id}>
                <td>
                  <Link href={`/quotes/${q.id}`} className="font-medium text-brand-navy hover:underline">
                    {q.quote_number}
                  </Link>
                </td>
                <td className="text-[#374151]">{q.title || "—"}</td>
                <td className="text-[#6B7280]">{q.contacts?.full_name || "—"}</td>
                <td className="font-semibold">{fmt(q.total)}</td>
                <td><StatusBadge status={q.status} /></td>
                <td className="text-[#9CA3AF] text-xs">{fmtDate(q.created_at)}</td>
                <td>
                  <ActionMenu items={[
                    { label: "View / Edit", icon: <Eye size={14} />, onClick: () => window.location.href = `/quotes/${q.id}` },
                    { label: "Delete", icon: <Trash2 size={14} />, onClick: () => setDeleteId(q.id), danger: true },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={del}
        title="Delete Quote" message="Delete this quote? This cannot be undone." danger />
    </div>
  );
}
