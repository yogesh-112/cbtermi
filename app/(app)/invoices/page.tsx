"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Receipt, Eye } from "lucide-react";
import { StatusBadge, EmptyState, ActionMenu } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/invoices").then(r => r.json()).then(d => setInvoices(d.invoices ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-desc">{invoices.length} invoices</p>
        </div>
        <Link href="/invoices/new" className="btn btn-green"><Plus size={15} /> Create Invoice</Link>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="mobile-card animate-pulse h-28 skeleton" />)
        ) : invoices.length === 0 ? (
          <EmptyState icon={<Receipt size={36} />} title="No invoices yet" description="Create your first invoice."
            action={<Link href="/invoices/new" className="btn btn-green btn-sm"><Plus size={14} /> Create Invoice</Link>} />
        ) : invoices.map(inv => (
          <Link key={inv.id} href={`/invoices/${inv.id}`} className="mobile-card block hover:shadow-card-md transition-shadow">
            <div className="mobile-card-row">
              <div>
                <p className="font-semibold text-[#111827]">{inv.invoice_number}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{inv.contacts?.full_name || "—"}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-navy">{fmt(inv.total)}</p>
                <StatusBadge status={inv.status} />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F3F4F6]">
              <span className="text-xs text-[#9CA3AF]">{fmtDate(inv.created_at)}</span>
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
              <tr><td colSpan={7} className="text-center py-10 text-[#9CA3AF]">Loading…</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState icon={<Receipt size={40} />} title="No invoices yet" description="Create your first invoice."
                  action={<Link href="/invoices/new" className="btn btn-green btn-sm"><Plus size={14} /> Create Invoice</Link>} />
              </td></tr>
            ) : invoices.map(inv => (
              <tr key={inv.id}>
                <td>
                  <Link href={`/invoices/${inv.id}`} className="font-medium text-brand-navy hover:underline">
                    {inv.invoice_number}
                  </Link>
                </td>
                <td className="text-[#6B7280]">{inv.contacts?.full_name || "—"}</td>
                <td className="font-semibold">{fmt(inv.total)}</td>
                <td className={inv.amount_due > 0 ? "text-red-600 font-semibold" : "text-brand-green font-semibold"}>
                  {fmt(inv.amount_due)}
                </td>
                <td><StatusBadge status={inv.status} /></td>
                <td className="text-[#9CA3AF] text-xs">{fmtDate(inv.created_at)}</td>
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
