"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, CreditCard, TrendingUp, RotateCcw } from "lucide-react";
import { Modal, ConfirmDialog, EmptyState, toast } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export default function PaymentsPage() {
  const t = useT();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [form, setForm] = useState({
    contact_id: "", invoice_id: "", amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash", reference_number: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [reversing, setReversing] = useState<string | null>(null);
  const [confirmReverse, setConfirmReverse] = useState<any>(null);

  const METHODS = [
    { value: "cash",          label: t.payments.cash },
    { value: "check",         label: t.payments.check },
    { value: "bank_transfer", label: t.payments.transfer },
    { value: "credit_card",   label: t.payments.card },
    { value: "other",         label: t.payments.other },
  ];

  const METHOD_LABEL: Record<string, string> = {
    cash: t.payments.cash, check: t.payments.check,
    bank_transfer: t.payments.transfer, credit_card: t.payments.card, other: t.payments.other,
  };

  const PAGE_SIZE = 50;
  const [page, setPage] = useState(0);
  const [recordCount, setRecordCount] = useState(0);

  const load = (p = 0) => {
    setLoading(true);
    fetch(`/api/payments?limit=${PAGE_SIZE}&offset=${p * PAGE_SIZE}`).then(r => r.json()).then(d => {
      setPayments(d.payments ?? []);
      setRecordCount(d.total ?? 0);
    }).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    fetch("/api/invoices?limit=100").then(r => r.json()).then(d => setInvoices(d.invoices ?? []));
    fetch("/api/contacts?limit=100").then(r => r.json()).then(d => setContacts(d.contacts ?? []));
  }, []);

  const reversePayment = async (payment: any) => {
    setReversing(payment.id);
    const res = await fetch(`/api/payments/${payment.id}/reverse`, { method: "POST" });
    const data = await res.json();
    setReversing(null);
    setConfirmReverse(null);
    if (res.ok) { toast("Payment reversed successfully"); load(); }
    else toast(data.message ?? "Failed to reverse payment", "error");
  };

  const save = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast(t.common.required, "error"); return; }
    setSaving(true);
    const res = await fetch("/api/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setSaving(false);
    if (res.ok) { toast(t.payments.title); setModal(false); load(); }
    else toast("Failed to record payment", "error");
  };

  const now = new Date();
  const total     = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const thisMonth = payments.filter(p => {
    const d = new Date(p.payment_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, p) => s + (p.amount ?? 0), 0);
  const cashTotal = payments.filter(p => ["cash","check"].includes(p.payment_method)).reduce((s, p) => s + (p.amount ?? 0), 0);
  const bankTotal = payments.filter(p => p.payment_method === "bank_transfer").reduce((s, p) => s + (p.amount ?? 0), 0);
  const cardTotal = payments.filter(p => p.payment_method === "credit_card").reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.payments.title}</h1>
          <p className="page-desc">{fmt(total)} {t.payments.received} · {payments.length} {t.payments.totalPayments}</p>
        </div>
        <button className="btn btn-green" onClick={() => setModal(true)}>
          <Plus size={15} /> {t.payments.recordPayment}
        </button>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">{t.payments.cashCheck}</span>
          <span className="mini-stat-value text-[20px]">{fmt(cashTotal)}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">
            {payments.filter(p => ["cash","check"].includes(p.payment_method)).length} payments
          </span>
        </div>
        <div className="mini-stat mini-stat-blue">
          <span className="mini-stat-label">{t.payments.bankTransfer}</span>
          <span className="mini-stat-value text-[20px]">{fmt(bankTotal)}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">
            {payments.filter(p => p.payment_method === "bank_transfer").length} payments
          </span>
        </div>
        <div className="mini-stat mini-stat-navy">
          <span className="mini-stat-label">{t.payments.creditCard}</span>
          <span className="mini-stat-value text-[20px]">{fmt(cardTotal)}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">
            {payments.filter(p => p.payment_method === "credit_card").length} payments
          </span>
        </div>
        <div className="mini-stat mini-stat-amber">
          <span className="mini-stat-label">{t.payments.thisMonth}</span>
          <span className="mini-stat-value text-[20px]">{fmt(thisMonth)}</span>
          <span className="text-[11px] text-brand-green flex items-center gap-1 mt-0.5">
            <TrendingUp size={10} /> {t.payments.totalReceivedLabel}
          </span>
        </div>
      </div>

      {/* Mini bar chart */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title mb-0">{t.payments.paymentHistory}</h2>
            <p className="text-[12px] text-[#8a8fa3] mt-0.5">{t.payments.dailyReceipts}</p>
          </div>
          <span className="text-[13px] font-semibold text-brand-green">{fmt(thisMonth)} {t.payments.thisMonth.toLowerCase()}</span>
        </div>
        <div className="flex items-end gap-1.5 h-20 w-full">
          {Array.from({ length: 14 }, (_, i) => {
            const val = [0.3,0.5,0.2,0.7,0.4,0.9,0.6,0.3,0.8,0.5,0.4,0.7,0.6,0.9][i] ?? 0.5;
            return (
              <div key={i} className="flex-1 rounded-t bg-brand-green/25 hover:bg-brand-green/50 transition-colors cursor-default"
                style={{ height: `${Math.max(val * 100, 8)}%` }} />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-[#8a8fa3] mt-2">
          <span>May 4</span><span>May 10</span><span>May 17</span>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="mobile-card animate-pulse h-20 skeleton" />)
        ) : payments.length === 0 ? (
          <EmptyState icon={<CreditCard size={36} />} title={t.payments.noPayments} description={t.payments.noPaymentsDesc}
            action={<button className="btn btn-green btn-sm" onClick={() => setModal(true)}><Plus size={14} /> {t.payments.recordPayment}</button>} />
        ) : payments.map(p => (
          <div key={p.id} className="mobile-card">
            <div className="mobile-card-row">
              <div>
                <p className="font-semibold text-brand-green">{fmt(p.amount)}</p>
                <p className="text-xs text-[#8a8fa3] mt-0.5">{p.contacts?.full_name || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[#4a5168]">{METHOD_LABEL[p.payment_method] || p.payment_method}</p>
                <p className="text-xs text-[#8a8fa3]">{fmtDate(p.payment_date)}</p>
              </div>
            </div>
            {(p.invoices?.invoice_number || p.reference_number) && (
              <div className="flex gap-3 mt-2 text-xs text-[#8a8fa3]">
                {p.invoices?.invoice_number && <span>{t.payments.invoiceCol}: {p.invoices.invoice_number}</span>}
                {p.reference_number && <span>Ref: {p.reference_number}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t.payments.dateCol}</th>
              <th>{t.payments.contactCol}</th>
              <th>{t.payments.invoiceCol}</th>
              <th>{t.payments.amountCol}</th>
              <th>{t.payments.methodCol}</th>
              <th>{t.payments.referenceCol}</th>
              <th>{t.payments.statusCol}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-[#8a8fa3]">{t.payments.loading}</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={8}>
                <EmptyState icon={<CreditCard size={40} />} title={t.payments.noPayments} description={t.payments.noPaymentsDesc}
                  action={<button className="btn btn-green btn-sm" onClick={() => setModal(true)}><Plus size={14} /> {t.payments.recordPayment}</button>} />
              </td></tr>
            ) : payments.map(p => (
              <tr key={p.id}>
                <td className="text-[#8a8fa3] text-[12px]">{fmtDate(p.payment_date)}</td>
                <td className="text-[#4a5168] text-[13px]">{p.contacts?.full_name || "—"}</td>
                <td>
                  {p.invoices?.invoice_number
                    ? <Link href={`/invoices/${p.invoice_id}`} className="text-brand-navy hover:underline text-[13px] font-medium">
                        {p.invoices.invoice_number}
                      </Link>
                    : <span className="text-[#8a8fa3]">—</span>}
                </td>
                <td className="font-semibold text-brand-green text-[13px]">{fmt(p.amount)}</td>
                <td className="text-[13px] text-[#4a5168]">{METHOD_LABEL[p.payment_method] || p.payment_method}</td>
                <td className="text-[12px] text-[#8a8fa3]">{p.reference_number || "—"}</td>
                <td><span className="badge bg-brand-green/10 text-brand-green">● {t.payments.cleared}</span></td>
                <td>
                  <button onClick={() => setConfirmReverse(p)}
                    className="flex items-center gap-1 text-[11px] text-[#8a8fa3] hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50">
                    <RotateCcw size={11} /> {t.payments.reverse}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {recordCount > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f0efea]">
          <span className="text-[13px] text-[#8a8fa3]">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, recordCount)} of {recordCount}
          </span>
          <div className="flex gap-2">
            <button onClick={() => { const p = page - 1; setPage(p); load(p); }} disabled={page === 0}
              className="btn btn-outline btn-sm disabled:opacity-40">Previous</button>
            <button onClick={() => { const p = page + 1; setPage(p); load(p); }} disabled={(page + 1) * PAGE_SIZE >= recordCount}
              className="btn btn-outline btn-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmReverse}
        onClose={() => setConfirmReverse(null)}
        onConfirm={() => confirmReverse && reversePayment(confirmReverse)}
        title={t.payments.reversePayment}
        message={confirmReverse ? `This will reverse ${fmt(confirmReverse.amount)} recorded on ${fmtDate(confirmReverse.payment_date)}. The invoice balance will be restored. This cannot be undone.` : ""}
        danger
      />

      <Modal open={modal} onClose={() => setModal(false)} title={t.payments.recordPayment} size="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t.payments.contactRequired}</label>
            <select value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })} className="field">
              <option value="">{t.payments.selectContact}</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.common.invoice}</label>
            <select value={form.invoice_id} onChange={e => setForm({ ...form, invoice_id: e.target.value })} className="field">
              <option value="">{t.payments.noInvoice}</option>
              {invoices.filter(i => !["paid","voided"].includes(i.status)).map(i =>
                <option key={i.id} value={i.id}>{i.invoice_number} — {fmt(i.amount_due)} due</option>
              )}
            </select>
          </div>
          <div>
            <label className="label">{t.payments.amountRequired}</label>
            <input type="number" step="0.01" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="field" />
          </div>
          <div>
            <label className="label">{t.payments.paymentDate}</label>
            <input type="date" value={form.payment_date}
              onChange={e => setForm({ ...form, payment_date: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">{t.payments.method}</label>
            <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className="field">
              {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.payments.referenceNum}</label>
            <input value={form.reference_number}
              onChange={e => setForm({ ...form, reference_number: e.target.value })} className="field" />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t.payments.notesLabel}</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-[#e7e6e1]">
          <button className="btn btn-outline" onClick={() => setModal(false)}>{t.payments.cancelBtn}</button>
          <button className="btn btn-green" onClick={save} disabled={saving}>{saving ? t.common.saving : t.payments.recordPayment}</button>
        </div>
      </Modal>
    </div>
  );
}
