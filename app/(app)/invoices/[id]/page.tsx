"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Download, CreditCard, Copy, Ban, Trash2, Send,
  CheckCircle2, Mail, MessageCircle, Phone, Clock,
} from "lucide-react";
import { toast, ConfirmDialog } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

const PAYMENT_AMOUNTS = ["Full", "50%", "Deposit", "Custom"] as const;
const PAYMENT_METHODS = [
  { value: "credit_card",   label: "Card",         sub: "Visa / Mastercard" },
  { value: "bank_transfer", label: "Bank · ACH",   sub: "No fee" },
  { value: "check",         label: "Check",        sub: "" },
  { value: "cash",          label: "Cash",         sub: "" },
];

const ACTIVITY_ICONS: Record<string, any> = {
  created: Clock, sent: Mail, viewed: CheckCircle2, paid: CreditCard, whatsapp: MessageCircle,
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const [data, setData]         = useState<any>(null);
  const [payModal, setPayModal] = useState(false);
  const [amtMode, setAmtMode]   = useState<typeof PAYMENT_AMOUNTS[number]>("Full");
  const [payForm, setPayForm]   = useState({
    amount: "", payment_date: new Date().toISOString().split("T")[0],
    payment_method: "credit_card", reference_number: "", notes: "",
  });
  const [saving, setSaving]     = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  const load = () => fetch(`/api/invoices/${id}`).then(r => r.json()).then(setData);
  useEffect(() => { load(); }, [id]);

  const markSent = async () => {
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sent", is_sent: true }),
    });
    toast("Marked as sent"); load();
  };

  const voidInvoice = async () => {
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "voided" }),
    });
    toast("Invoice voided"); load();
  };

  const recordPayment = async () => {
    const amt = parseFloat(payForm.amount);
    if (!amt || amt <= 0) { toast("Enter a valid amount", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payForm, amount: amt,
        invoice_id: id,
        contact_id: data?.invoice?.contact_id,
        project_id: data?.invoice?.project_id,
      }),
    });
    setSaving(false);
    if (res.ok) { toast("Payment recorded"); setPayModal(false); load(); }
    else toast("Failed to record payment", "error");
  };

  const del = async () => {
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    toast("Invoice deleted"); router.push("/invoices");
  };

  const duplicate = async () => {
    if (!data) return;
    const { invoice, items } = data;
    const res = await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_id: invoice.contact_id, project_id: invoice.project_id, payment_terms: invoice.payment_terms, notes: invoice.notes, terms: invoice.terms, items }),
    });
    if (res.ok) { const d = await res.json(); router.push(`/invoices/${d.invoice.id}`); toast("Duplicated"); }
  };

  if (!data) return <div className="flex items-center justify-center h-64 text-[#8a8fa3]">Loading…</div>;
  const { invoice, items, payments } = data;

  const amtDue   = invoice.amountDue    ?? invoice.amount_due ?? 0;
  const amtPaid  = invoice.amount_paid  ?? 0;
  const total    = invoice.total        ?? 0;
  const subtotal = invoice.subtotal     ?? 0;
  const taxAmt   = invoice.tax_amount   ?? 0;

  const now = new Date();
  const dueDate  = invoice.due_date ? new Date(invoice.due_date) : null;
  const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / 86400000) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0 && invoice.status !== "paid";

  const openPayModal = () => {
    setAmtMode("Full");
    setPayForm(f => ({ ...f, amount: String(amtDue) }));
    setPayModal(true);
  };

  const handleAmtMode = (mode: typeof PAYMENT_AMOUNTS[number]) => {
    setAmtMode(mode);
    if (mode === "Full")    setPayForm(f => ({ ...f, amount: String(amtDue) }));
    if (mode === "50%")     setPayForm(f => ({ ...f, amount: String(Math.round(amtDue * 0.5 * 100) / 100) }));
    if (mode === "Deposit") setPayForm(f => ({ ...f, amount: String(Math.round(amtDue * 0.3 * 100) / 100) }));
    if (mode === "Custom")  setPayForm(f => ({ ...f, amount: "" }));
  };

  /* synthetic activity from payments + status */
  const activity = [
    { icon: Clock,          label: "Invoice created",          date: invoice.created_at,  color: "bg-[#f0efea]  text-[#8a8fa3]" },
    invoice.is_sent && { icon: Mail, label: "Sent via Email", date: invoice.updated_at,   color: "bg-blue-50 text-brand-navy" },
    ...((payments ?? []).map((p: any) => ({ icon: CreditCard, label: `Payment · ${fmt(p.amount)}`, date: p.created_at, color: "bg-brand-green/10 text-brand-green" }))),
  ].filter(Boolean) as any[];

  return (
    <>
      <style>{`@media print { body * { visibility:hidden } #inv-print,#inv-print * { visibility:visible } #inv-print { position:absolute;left:0;top:0;width:100% } .no-print{display:none!important} }`}</style>

      {/* Top action bar */}
      <div className="no-print flex items-center gap-3 mb-5 flex-wrap">
        <Link href="/invoices" className="btn btn-ghost btn-sm p-2"><ArrowLeft size={14} /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="page-title">{invoice.invoice_number}</h1>
          <p className="text-[13px] text-[#8a8fa3]">{invoice.contacts?.full_name}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {invoice.status === "draft" && (
            <button onClick={markSent} className="btn btn-outline btn-sm"><Send size={13} /> Mark sent</button>
          )}
          <button onClick={() => window.print()} className="btn btn-outline btn-sm"><Download size={13} /> Download PDF</button>
          {!["paid","voided"].includes(invoice.status) && (
            <button onClick={openPayModal} className="btn btn-green btn-sm"><CreditCard size={13} /> Record payment</button>
          )}
          <button onClick={duplicate} className="btn btn-outline btn-sm"><Copy size={13} /></button>
          {invoice.status !== "voided" && (
            <button onClick={voidInvoice} className="btn btn-ghost btn-sm text-[#4a5168]"><Ban size={13} /></button>
          )}
          <button onClick={() => setDelConfirm(true)} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
        </div>
      </div>

      <div id="inv-print" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: invoice body ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden">
            {/* Company header strip */}
            <div className="bg-brand-navy px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-[15px]">{invoice.businesses?.name ?? "Clear Build USA"}</p>
                <p className="text-white/60 text-[12px] mt-0.5">{invoice.businesses?.address ?? ""}</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-[11px] uppercase tracking-wider mb-0.5">Invoice</p>
                <p className="text-white font-bold text-[18px]">{invoice.invoice_number}</p>
                {daysLeft !== null && invoice.status !== "paid" && invoice.status !== "voided" && (
                  <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    isOverdue ? "bg-red-400/20 text-red-200" : daysLeft <= 7 ? "bg-amber-400/20 text-amber-200" : "bg-white/10 text-white/70"
                  }`}>
                    {isOverdue ? `Overdue ${Math.abs(daysLeft)}d` : `Due in ${daysLeft}d`}
                  </span>
                )}
                {invoice.status === "paid" && (
                  <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-green/20 text-green-200">● Paid</span>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* 4-col metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 pb-6 border-b border-[#f0efea] text-[13px]">
                <div>
                  <p className="text-[11px] text-[#8a8fa3] uppercase tracking-wide mb-1">Billed to</p>
                  <p className="font-semibold text-[#0c1226]">{invoice.contacts?.full_name ?? "—"}</p>
                  {invoice.contacts?.address && <p className="text-[#8a8fa3] text-[12px] mt-0.5">{invoice.contacts.address}</p>}
                </div>
                <div>
                  <p className="text-[11px] text-[#8a8fa3] uppercase tracking-wide mb-1">Issued</p>
                  <p className="font-medium text-[#0c1226]">{fmtDate(invoice.issue_date)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#8a8fa3] uppercase tracking-wide mb-1">Due</p>
                  <p className={`font-medium ${isOverdue ? "text-red-500" : "text-[#0c1226]"}`}>
                    {invoice.due_date ? fmtDate(invoice.due_date) : "—"}
                  </p>
                </div>
                {invoice.projects?.name && (
                  <div>
                    <p className="text-[11px] text-[#8a8fa3] uppercase tracking-wide mb-1">Project</p>
                    <Link href={`/projects/${invoice.project_id}`} className="font-medium text-brand-navy hover:underline text-[13px]">
                      {invoice.projects.name}
                    </Link>
                  </div>
                )}
              </div>

              {/* Line items */}
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#e7e6e1]">
                    <th className="text-left py-2 text-[11px] text-[#8a8fa3] uppercase tracking-wide font-semibold">Description</th>
                    <th className="text-right py-2 text-[11px] text-[#8a8fa3] uppercase tracking-wide font-semibold w-14">Qty</th>
                    <th className="text-right py-2 text-[11px] text-[#8a8fa3] uppercase tracking-wide font-semibold w-20">Rate</th>
                    <th className="text-right py-2 text-[11px] text-[#8a8fa3] uppercase tracking-wide font-semibold w-22">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(items ?? []).map((item: any, i: number) => (
                    <tr key={i} className="border-b border-[#f6f6f3]">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-[#0c1226]">{item.item_name}</p>
                        {item.description && <p className="text-[12px] text-[#8a8fa3] mt-0.5">{item.description}</p>}
                        {item.unit && <p className="text-[11px] text-[#8a8fa3]">{item.unit}</p>}
                      </td>
                      <td className="py-3 text-right text-[#4a5168]">{item.quantity}</td>
                      <td className="py-3 text-right text-[#4a5168]">{fmt(item.unit_price)}</td>
                      <td className="py-3 text-right font-semibold text-[#0c1226]">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mt-5">
                <div className="w-56 space-y-2 text-[13px]">
                  <div className="flex justify-between text-[#8a8fa3]">
                    <span>Subtotal</span><span>{fmt(subtotal)}</span>
                  </div>
                  {taxAmt > 0 && (
                    <div className="flex justify-between text-[#8a8fa3]">
                      <span>Tax</span><span>{fmt(taxAmt)}</span>
                    </div>
                  )}
                  {amtPaid > 0 && (
                    <div className="flex justify-between text-brand-green">
                      <span>Credit</span><span>− {fmt(amtPaid)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-[18px] border-t border-[#e7e6e1] pt-3 mt-1">
                    <span>Balance due</span>
                    <span className={amtDue > 0 && invoice.status !== "paid" ? "text-[#0c1226]" : "text-brand-green"}>{fmt(amtDue)}</span>
                  </div>
                </div>
              </div>

              {/* Pay CTA */}
              {amtDue > 0 && !["paid","voided"].includes(invoice.status) && (
                <div className="mt-5 pt-5 border-t border-[#f0efea] no-print">
                  <p className="text-[12px] text-[#8a8fa3] mb-2 text-center">Pay with card or ACH · processed via Stripe</p>
                  <button onClick={openPayModal}
                    className="w-full py-3 bg-[#2453E4] hover:bg-[#1a3fbf] text-white font-semibold text-[14px] rounded-xl transition-colors">
                    Pay {fmt(amtDue)}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {(invoice.notes || invoice.terms) && (
            <div className="card p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-[13px]">
              {invoice.notes && (
                <div>
                  <p className="font-semibold text-[#0c1226] mb-1.5">Note to customer</p>
                  <p className="text-[#4a5168] leading-relaxed whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="font-semibold text-[#0c1226] mb-1.5">Terms</p>
                  <p className="text-[#4a5168] leading-relaxed whitespace-pre-line">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4 no-print">
          {/* Payment summary */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Payment summary</h3>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#8a8fa3]">Invoice total</span>
                <span className="font-semibold text-[#0c1226]">{fmt(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a8fa3]">Paid</span>
                <span className="font-semibold text-brand-green">{fmt(amtPaid)}</span>
              </div>
              {/* Progress bar */}
              <div>
                <div className="h-2 bg-[#f0efea] rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-brand-green rounded-full transition-all"
                    style={{ width: total > 0 ? `${Math.min((amtPaid / total) * 100, 100)}%` : "0%" }} />
                </div>
                <div className="flex justify-between text-[11px] text-[#8a8fa3] mt-1">
                  <span>{total > 0 ? Math.round((amtPaid / total) * 100) : 0}% paid</span>
                  <span>{fmt(amtDue)} outstanding</span>
                </div>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#f0efea]">
                <span className="text-[#8a8fa3]">Balance due</span>
                <span className={`font-bold text-[15px] ${amtDue > 0 && invoice.status !== "paid" ? "text-[#0c1226]" : "text-brand-green"}`}>
                  {fmt(amtDue)}
                </span>
              </div>
            </div>
            {!["paid","voided"].includes(invoice.status) && amtDue > 0 && (
              <button onClick={openPayModal}
                className="btn btn-green w-full mt-4"><CreditCard size={13} /> Record payment</button>
            )}
          </div>

          {/* Activity */}
          <div className="card p-5">
            <h3 className="section-title mb-3">Activity</h3>
            <div className="space-y-0">
              {activity.map((a: any, i: number) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex gap-3 py-2.5 border-b border-[#f0efea] last:border-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${a.color}`}>
                      <Icon size={11} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#0c1226]">{a.label}</p>
                      <p className="text-[11px] text-[#8a8fa3]">{fmtDate(a.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer */}
          {invoice.contacts && (
            <div className="card p-5 text-[13px]">
              <h3 className="section-title mb-3">Customer</h3>
              <p className="font-semibold text-[#0c1226]">{invoice.contacts.full_name}</p>
              {invoice.contacts.email && <p className="text-[#4a5168] mt-1">{invoice.contacts.email}</p>}
              {invoice.contacts.phone && <p className="text-[#4a5168]">{invoice.contacts.phone}</p>}
              <Link href={`/contacts/${invoice.contact_id}`} className="btn btn-outline btn-sm w-full mt-3">View contact</Link>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {data && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${payModal ? "" : "hidden"}`}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setPayModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-[16px] text-[#0c1226] mb-0.5">Record payment</h2>
            <p className="text-[12px] text-[#8a8fa3] mb-4">
              {invoice.invoice_number} · {invoice.contacts?.full_name} · balance {fmt(amtDue)}
            </p>

            {/* Amount tabs */}
            <div className="flex rounded-xl border border-[#e7e6e1] overflow-hidden mb-4">
              {PAYMENT_AMOUNTS.map(m => (
                <button key={m} onClick={() => handleAmtMode(m)}
                  className={`flex-1 py-2 text-[12px] font-medium transition-colors ${amtMode === m ? "bg-brand-navy text-white" : "text-[#4a5168] hover:bg-[#f6f6f3]"}`}>
                  {m}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div className="mb-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8fa3] text-[15px] font-medium">$</span>
                <input type="number" step="0.01" value={payForm.amount}
                  onChange={e => { setAmtMode("Custom"); setPayForm(f => ({ ...f, amount: e.target.value })); }}
                  className="field pl-7 text-[18px] font-bold" placeholder="0.00" />
              </div>
            </div>

            {/* Method cards */}
            <label className="label mb-2">Method</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PAYMENT_METHODS.map(m => (
                <button key={m.value} onClick={() => setPayForm(f => ({ ...f, payment_method: m.value }))}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                    payForm.payment_method === m.value ? "border-brand-navy bg-[#eef2ff]" : "border-[#e7e6e1] hover:border-[#d8d6cf]"
                  }`}>
                  <div>
                    <p className={`text-[12px] font-semibold ${payForm.payment_method === m.value ? "text-brand-navy" : "text-[#0c1226]"}`}>{m.label}</p>
                    {m.sub && <p className="text-[10px] text-[#8a8fa3]">{m.sub}</p>}
                  </div>
                  {payForm.payment_method === m.value && <CheckCircle2 size={14} className="text-brand-navy flex-shrink-0" />}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="label">Received on</label>
                <input type="date" value={payForm.payment_date}
                  onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} className="field" />
              </div>
              <div>
                <label className="label">Reference / memo</label>
                <input value={payForm.reference_number}
                  onChange={e => setPayForm(f => ({ ...f, reference_number: e.target.value }))}
                  placeholder="Check #, wire ID…" className="field" />
              </div>
            </div>

            <p className="text-[11px] text-[#8a8fa3] mb-4 flex items-start gap-1.5">
              <CheckCircle2 size={12} className="text-brand-green mt-0.5 flex-shrink-0" />
              Customer will receive a paid receipt by email. Invoice auto-marks as paid in full.
            </p>

            <div className="flex gap-3">
              <button className="btn btn-outline flex-1" onClick={() => setPayModal(false)}>Cancel</button>
              <button className="btn btn-green flex-1" onClick={recordPayment} disabled={saving}>
                {saving ? "Saving…" : "Record payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={delConfirm} onClose={() => setDelConfirm(false)} onConfirm={del}
        title="Delete Invoice" message="This will permanently delete this invoice and all related records." danger />
    </>
  );
}
