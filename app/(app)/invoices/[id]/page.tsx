"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, CreditCard, Copy, Ban, Trash2, Printer } from "lucide-react";
import { StatusBadge, Modal, toast, ConfirmDialog } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: "", payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash", reference_number: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  const load = () => fetch(`/api/invoices/${id}`).then(r => r.json()).then(setData);
  useEffect(() => { load(); }, [id]);

  const markSent = async () => {
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sent", is_sent: true }),
    });
    toast("Marked as sent"); load();
  };

  const voidInvoice = async () => {
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "voided" }),
    });
    toast("Invoice voided"); load();
  };

  const recordPayment = async () => {
    if (!payForm.amount || parseFloat(payForm.amount) <= 0) {
      toast("Enter a valid amount", "error"); return;
    }
    setSaving(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payForm,
        amount: parseFloat(payForm.amount),
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
    toast("Invoice deleted");
    router.push("/invoices");
  };

  const duplicate = async () => {
    if (!data) return;
    const { invoice, items } = data;
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact_id: invoice.contact_id,
        project_id: invoice.project_id,
        payment_terms: invoice.payment_terms,
        notes: invoice.notes,
        terms: invoice.terms,
        items,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      router.push(`/invoices/${d.invoice.id}`);
      toast("Invoice duplicated");
    }
  };

  const printInvoice = () => window.print();

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-[#9CA3AF]">Loading…</div>
  );
  const { invoice, items, payments } = data;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print">
        <div className="flex items-start gap-3 mb-6 flex-wrap">
          <Link href="/invoices" className="btn btn-ghost btn-sm mt-0.5"><ArrowLeft size={14} /></Link>
          <div className="flex-1">
            <h1 className="page-title">{invoice.invoice_number}</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{invoice.contacts?.full_name}</p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="flex gap-2 flex-wrap mb-6 no-print">
          {invoice.status === "draft" && (
            <button onClick={markSent} className="btn btn-primary btn-sm">
              <Send size={13} /> Mark Sent
            </button>
          )}
          {!["paid", "voided"].includes(invoice.status) && (
            <button onClick={() => setPayModal(true)} className="btn btn-green btn-sm">
              <CreditCard size={13} /> Record Payment
            </button>
          )}
          <button onClick={duplicate} className="btn btn-ghost border border-[#E5E7EB] btn-sm">
            <Copy size={13} /> Duplicate
          </button>
          <button onClick={printInvoice} className="btn btn-ghost border border-[#E5E7EB] btn-sm">
            <Printer size={13} /> Download PDF
          </button>
          {invoice.status !== "voided" && (
            <button onClick={voidInvoice} className="btn btn-ghost border border-[#E5E7EB] btn-sm text-[#6B7280]">
              <Ban size={13} /> Void
            </button>
          )}
          <button onClick={() => setDelConfirm(true)} className="btn btn-danger btn-sm">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Printable Invoice */}
      <div id="invoice-print">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">Invoice #</p>
                  <p className="font-semibold">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">Issue Date</p>
                  <p>{fmtDate(invoice.issue_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">Due Date</p>
                  <p>{invoice.due_date ? fmtDate(invoice.due_date) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">Terms</p>
                  <p>{invoice.payment_terms || "—"}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-t border-[#E5E7EB]">
                  <thead>
                    <tr className="bg-[#F5F7FA]">
                      <th className="text-left px-3 py-2.5 text-xs text-[#6B7280] font-semibold">Item</th>
                      <th className="text-right px-3 py-2.5 text-xs text-[#6B7280] font-semibold">Qty</th>
                      <th className="text-right px-3 py-2.5 text-xs text-[#6B7280] font-semibold">Price</th>
                      <th className="text-right px-3 py-2.5 text-xs text-[#6B7280] font-semibold">Tax</th>
                      <th className="text-right px-3 py-2.5 text-xs text-[#6B7280] font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(items ?? []).map((item: any, i: number) => (
                      <tr key={i} className="border-b border-[#F5F7FA]">
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-[#1F2937]">{item.item_name}</p>
                          {item.description && <p className="text-xs text-[#9CA3AF]">{item.description}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-right text-[#6B7280]">
                          {item.quantity}{item.unit && ` ${item.unit}`}
                        </td>
                        <td className="px-3 py-2.5 text-right text-[#6B7280]">{fmt(item.unit_price)}</td>
                        <td className="px-3 py-2.5 text-right text-[#6B7280]">{item.tax_rate}%</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-[#1F2937]">{fmt(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-5">
                <div className="w-52 space-y-2 text-sm">
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Subtotal</span><span>{fmt(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Tax</span><span>{fmt(invoice.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-[#E5E7EB] pt-2">
                    <span>Total</span><span className="text-brand-navy">{fmt(invoice.total)}</span>
                  </div>
                  {invoice.amount_paid > 0 && (
                    <div className="flex justify-between text-brand-green">
                      <span>Paid</span><span>- {fmt(invoice.amount_paid)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between font-bold border-t border-[#E5E7EB] pt-2 ${invoice.amount_due > 0 ? "text-red-600" : "text-brand-green"}`}>
                    <span>Amount Due</span><span>{fmt(invoice.amount_due)}</span>
                  </div>
                </div>
              </div>
            </div>

            {(invoice.notes || invoice.terms) && (
              <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {invoice.notes && (
                  <div>
                    <p className="font-semibold text-[#1F2937] mb-2">Notes</p>
                    <p className="text-[#6B7280] whitespace-pre-line">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <p className="font-semibold text-[#1F2937] mb-2">Terms</p>
                    <p className="text-[#6B7280] whitespace-pre-line">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}

            {payments?.length > 0 && (
              <div className="card p-5">
                <h3 className="section-title">Payment History</h3>
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Date</th><th>Amount</th><th>Method</th><th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p.id}>
                        <td>{fmtDate(p.payment_date)}</td>
                        <td className="font-semibold text-brand-green">{fmt(p.amount)}</td>
                        <td className="capitalize text-[#6B7280]">{p.payment_method?.replace("_", " ")}</td>
                        <td className="text-[#9CA3AF] text-xs">{p.reference_number || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-5 text-sm">
              <h2 className="section-title">Bill To</h2>
              <p className="font-semibold text-[#1F2937]">{invoice.contacts?.full_name}</p>
              {invoice.contacts?.business_name && (
                <p className="text-[#6B7280]">{invoice.contacts.business_name}</p>
              )}
              {invoice.contacts?.email && <p className="text-[#6B7280] mt-1">{invoice.contacts.email}</p>}
              {invoice.contacts?.phone && <p className="text-[#6B7280]">{invoice.contacts.phone}</p>}
              {invoice.contacts?.address && <p className="text-[#6B7280] mt-1 text-xs">{invoice.contacts.address}</p>}
              <Link href={`/contacts/${invoice.contact_id}`}
                className="btn btn-outline btn-sm w-full mt-3 no-print">View Contact</Link>
              {invoice.project_id && (
                <Link href={`/projects/${invoice.project_id}`}
                  className="btn btn-ghost border border-[#E5E7EB] btn-sm w-full mt-2 no-print">View Project</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Record Payment" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Amount <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" value={payForm.amount}
              onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
              placeholder={`Max: ${fmt(invoice.amount_due)}`} className="field" />
          </div>
          <div>
            <label className="label">Payment Date</label>
            <input type="date" value={payForm.payment_date}
              onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">Method</label>
            <select value={payForm.payment_method}
              onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })} className="field">
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit_card">Credit Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Reference #</label>
            <input value={payForm.reference_number}
              onChange={e => setPayForm({ ...payForm, reference_number: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={payForm.notes}
              onChange={e => setPayForm({ ...payForm, notes: e.target.value })}
              rows={2} className="field resize-none" />
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-[#E5E7EB]">
            <button className="btn btn-ghost" onClick={() => setPayModal(false)}>Cancel</button>
            <button className="btn btn-green" onClick={recordPayment} disabled={saving}>
              {saving ? "Saving…" : "Record Payment"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={delConfirm}
        onClose={() => setDelConfirm(false)}
        onConfirm={del}
        title="Delete Invoice"
        message="This will permanently delete this invoice and all related records."
        danger
      />
    </>
  );
}
