"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { StatusBadge, EmptyState, toast } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); fetch("/api/invoices").then(r=>r.json()).then(d=>setInvoices(d.invoices??[])).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); },[]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <Link href="/invoices/new" className="btn-green btn"><Plus size={16}/> Create Invoice</Link>
      </div>
      <div className="table-wrapper">
        <table className="table-base">
          <thead><tr><th>Number</th><th className="hidden md:table-cell">Contact</th><th>Total</th><th>Due</th><th>Status</th><th className="hidden lg:table-cell">Date</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading…</td></tr>
            : invoices.length===0 ? <tr><td colSpan={7}><EmptyState icon={<Receipt size={40}/>} title="No invoices yet" description="Create your first invoice."/></td></tr>
            : invoices.map(inv=>(
              <tr key={inv.id}>
                <td><Link href={`/invoices/${inv.id}`} className="font-medium text-brand-navy hover:underline">{inv.invoice_number}</Link></td>
                <td className="hidden md:table-cell text-slate-500">{inv.contacts?.full_name||"—"}</td>
                <td className="font-semibold">{fmt(inv.total)}</td>
                <td className={inv.amount_due>0?"text-red-600 font-semibold":"text-green-600"}>{fmt(inv.amount_due)}</td>
                <td><StatusBadge status={inv.status}/></td>
                <td className="hidden lg:table-cell text-slate-500 text-xs">{fmtDate(inv.created_at)}</td>
                <td><Link href={`/invoices/${inv.id}`} className="btn-outline btn btn-sm">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
