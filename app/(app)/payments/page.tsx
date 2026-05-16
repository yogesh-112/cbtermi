"use client";
import { useEffect, useState } from "react";
import { Plus, CreditCard, TrendingUp } from "lucide-react";
import { Modal, EmptyState, toast, StatCard } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "other", label: "Other" },
];

export default function PaymentsPage() {
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

  const load = () => {
    setLoading(true);
    fetch("/api/payments").then(r => r.json()).then(d => setPayments(d.payments ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    fetch("/api/invoices").then(r => r.json()).then(d => setInvoices(d.invoices ?? []));
    fetch("/api/contacts").then(r => r.json()).then(d => setContacts(d.contacts ?? []));
  }, []);

  const save = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast("Enter a valid amount", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setSaving(false);
    if (res.ok) { toast("Payment recorded"); setModal(false); load(); }
    else toast("Failed to record payment", "error");
  };

  const total = payments.reduce((s, p) => s + p.amount, 0);
  const thisMonth = payments.filter(p => {
    const d = new Date(p.payment_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-desc">All recorded payments</p>
        </div>
        <button className="btn btn-green" onClick={() => setModal(true)}><Plus size={15} /> Record Payment</button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Total Received" value={fmt(total)} icon={<TrendingUp size={16} />} color="green" />
        <StatCard label="This Month" value={fmt(thisMonth)} icon={<CreditCard size={16} />} color="navy" />
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="mobile-card animate-pulse h-20 skeleton" />)
        ) : payments.length === 0 ? (
          <EmptyState icon={<CreditCard size={36} />} title="No payments yet" description="Record your first payment."
            action={<button className="btn btn-green btn-sm" onClick={() => setModal(true)}><Plus size={14} /> Record Payment</button>} />
        ) : payments.map(p => (
          <div key={p.id} className="mobile-card">
            <div className="mobile-card-row">
              <div>
                <p className="font-semibold text-brand-green">{fmt(p.amount)}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{p.contacts?.full_name || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[#374151] capitalize">{p.payment_method?.replace("_", " ")}</p>
                <p className="text-xs text-[#9CA3AF]">{fmtDate(p.payment_date)}</p>
              </div>
            </div>
            {(p.invoices?.invoice_number || p.reference_number) && (
              <div className="flex gap-3 mt-2 text-xs text-[#9CA3AF]">
                {p.invoices?.invoice_number && <span>Invoice: {p.invoices.invoice_number}</span>}
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
              <th>Date</th>
              <th>Contact</th>
              <th>Invoice</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference #</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-[#9CA3AF]">Loading…</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={6}>
                <EmptyState icon={<CreditCard size={40} />} title="No payments yet" description="Record your first payment."
                  action={<button className="btn btn-green btn-sm" onClick={() => setModal(true)}><Plus size={14} /> Record Payment</button>} />
              </td></tr>
            ) : payments.map(p => (
              <tr key={p.id}>
                <td>{fmtDate(p.payment_date)}</td>
                <td className="text-[#6B7280]">{p.contacts?.full_name || "—"}</td>
                <td className="text-[#6B7280]">{p.invoices?.invoice_number || "—"}</td>
                <td className="font-semibold text-brand-green">{fmt(p.amount)}</td>
                <td className="capitalize text-[#6B7280]">{p.payment_method?.replace("_", " ")}</td>
                <td className="text-[#9CA3AF] text-xs">{p.reference_number || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Record Payment" size="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Contact</label>
            <select value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })} className="field">
              <option value="">Select contact</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Invoice</label>
            <select value={form.invoice_id} onChange={e => setForm({ ...form, invoice_id: e.target.value })} className="field">
              <option value="">No invoice</option>
              {invoices.filter(i => !["paid", "voided"].includes(i.status)).map(i =>
                <option key={i.id} value={i.id}>{i.invoice_number} — {fmt(i.amount_due)} due</option>
              )}
            </select>
          </div>
          <div>
            <label className="label">Amount <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="field" />
          </div>
          <div>
            <label className="label">Payment date</label>
            <input type="date" value={form.payment_date}
              onChange={e => setForm({ ...form, payment_date: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">Method</label>
            <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className="field">
              {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Reference #</label>
            <input value={form.reference_number}
              onChange={e => setForm({ ...form, reference_number: e.target.value })} className="field" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-[#E5E7EB]">
          <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-green" onClick={save} disabled={saving}>{saving ? "Saving…" : "Record Payment"}</button>
        </div>
      </Modal>
    </div>
  );
}
