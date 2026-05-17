"use client";
import { useEffect, useState, useCallback } from "react";
import { AdminTable, AdminTr, AdminTd, MonoId, Pagination, AdminEmpty } from "@/components/admin/ui";
import { RefreshCw, DollarSign } from "lucide-react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [mrr, setMrr] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/payments?page=${page}`)
      .then(r => r.json())
      .then(d => { setPayments(d.payments ?? []); setTotal(d.total ?? 0); setMrr(d.mrr30d ?? 0); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#0d1117]">Payments & Billing</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">{total} total payments</p>
        </div>
        <button onClick={load} className="p-2 rounded-[8px] text-[#6b7280] hover:text-[#0d1117] hover:bg-white border border-[#e8e9ed] transition-colors shadow-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Revenue card */}
      <div className="bg-white border border-[#e8e9ed] rounded-[12px] p-5 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 bg-emerald-50 rounded-[10px] flex items-center justify-center flex-shrink-0">
          <DollarSign size={20} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#9399a8] uppercase tracking-widest mb-0.5">30-Day Revenue</p>
          <p className="text-[28px] font-bold text-[#0d1117] leading-none">{fmt(mrr)}</p>
        </div>
      </div>

      <AdminTable headers={["Payment ID", "Business", "Contact", "Invoice #", "Amount", "Method", "Date"]}>
        {loading && <tr><td colSpan={7} className="py-10 text-center text-[#9399a8] text-[13px]">Loading…</td></tr>}
        {!loading && payments.length === 0 && <AdminEmpty message="No payments found" />}
        {payments.map((p: any) => (
          <AdminTr key={p.id}>
            <AdminTd><MonoId id={p.id} prefix="pay" /></AdminTd>
            <AdminTd className="font-medium text-[#0d1117] text-[13px]">{p.businesses?.name ?? "—"}</AdminTd>
            <AdminTd className="text-[12px]">{p.contacts?.full_name ?? "—"}</AdminTd>
            <AdminTd className="font-mono text-[12px]">{p.invoices?.invoice_number ?? "—"}</AdminTd>
            <AdminTd className="font-semibold text-emerald-700">{fmt(p.amount ?? 0)}</AdminTd>
            <AdminTd className="text-[12px] text-[#6b7280] capitalize">
              {(p.payment_method ?? "").replace(/_/g, " ") || "—"}
            </AdminTd>
            <AdminTd className="text-[12px] text-[#9399a8]">
              {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </AdminTd>
          </AdminTr>
        ))}
      </AdminTable>

      <Pagination page={page} total={total} limit={25} onChange={setPage} />
    </div>
  );
}
