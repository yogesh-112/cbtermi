"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { StatusBadge, EmptyState, toast } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/quotes").then(r=>r.json()).then(d=>setQuotes(d.quotes??[])).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const del = async (id: string) => {
    if (!confirm("Delete this quote?")) return;
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    toast("Quote deleted"); load();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quotes</h1>
        <Link href="/quotes/new" className="btn-green btn"><Plus size={16} /> Create Quote</Link>
      </div>
      <div className="table-wrapper">
        <table className="table-base">
          <thead><tr><th>Number</th><th>Title</th><th className="hidden md:table-cell">Contact</th><th>Total</th><th>Status</th><th className="hidden lg:table-cell">Date</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading…</td></tr>
            : quotes.length === 0 ? <tr><td colSpan={7}><EmptyState icon={<FileText size={40}/>} title="No quotes yet" description="Create your first quote." /></td></tr>
            : quotes.map(q=>(
              <tr key={q.id}>
                <td><Link href={`/quotes/${q.id}`} className="font-medium text-brand-navy hover:underline">{q.quote_number}</Link></td>
                <td className="text-slate-700">{q.title||"—"}</td>
                <td className="hidden md:table-cell text-slate-500">{q.contacts?.full_name||"—"}</td>
                <td className="font-semibold">{fmt(q.total)}</td>
                <td><StatusBadge status={q.status}/></td>
                <td className="hidden lg:table-cell text-slate-500 text-xs">{fmtDate(q.created_at)}</td>
                <td>
                  <div className="flex gap-1">
                    <Link href={`/quotes/${q.id}`} className="btn-outline btn btn-sm">Edit</Link>
                    <button onClick={()=>del(q.id)} className="btn-ghost btn btn-sm text-red-500">Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
