"use client";
import { useEffect, useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import { Modal, EmptyState, toast } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";
import Link from "next/link";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [form, setForm] = useState({ contact_id:"", invoice_id:"", amount:"", payment_date:new Date().toISOString().split("T")[0], payment_method:"cash", reference_number:"", notes:"" });
  const [saving, setSaving] = useState(false);

  const load=()=>{ setLoading(true); fetch("/api/payments").then(r=>r.json()).then(d=>setPayments(d.payments??[])).finally(()=>setLoading(false)); };
  useEffect(()=>{
    load();
    fetch("/api/invoices").then(r=>r.json()).then(d=>setInvoices(d.invoices??[]));
    fetch("/api/contacts").then(r=>r.json()).then(d=>setContacts(d.contacts??[]));
  },[]);

  const save=async()=>{
    if(!form.amount||parseFloat(form.amount)<=0){ toast("Enter valid amount","error"); return; }
    setSaving(true);
    const res=await fetch("/api/payments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,amount:parseFloat(form.amount)})});
    setSaving(false);
    if(res.ok){ toast("Payment recorded"); setModal(false); load(); }
    else toast("Failed","error");
  };

  const total=payments.reduce((s,p)=>s+p.amount,0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="text-sm text-slate-500">Total received: <span className="font-semibold text-brand-green">{fmt(total)}</span></p>
        </div>
        <button className="btn-green btn" onClick={()=>setModal(true)}><Plus size={16}/> Record Payment</button>
      </div>
      <div className="table-wrapper">
        <table className="table-base">
          <thead><tr><th>Date</th><th className="hidden sm:table-cell">Contact</th><th className="hidden md:table-cell">Invoice</th><th>Amount</th><th className="hidden md:table-cell">Method</th><th className="hidden lg:table-cell">Ref #</th></tr></thead>
          <tbody>
            {loading?<tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading…</td></tr>
            :payments.length===0?<tr><td colSpan={6}><EmptyState icon={<CreditCard size={40}/>} title="No payments yet" description="Record your first payment."/></td></tr>
            :payments.map(p=>(
              <tr key={p.id}>
                <td>{fmtDate(p.payment_date)}</td>
                <td className="hidden sm:table-cell text-slate-500">{p.contacts?.full_name||"—"}</td>
                <td className="hidden md:table-cell text-slate-500">{p.invoices?.invoice_number||"—"}</td>
                <td className="font-semibold text-brand-green">{fmt(p.amount)}</td>
                <td className="hidden md:table-cell capitalize text-slate-500">{p.payment_method?.replace("_"," ")}</td>
                <td className="hidden lg:table-cell text-slate-400 text-xs">{p.reference_number||"—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Record Payment" size="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Contact</label>
            <select value={form.contact_id} onChange={e=>setForm({...form,contact_id:e.target.value})} className="field">
              <option value="">Select contact</option>
              {contacts.map(c=><option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div><label className="label">Invoice</label>
            <select value={form.invoice_id} onChange={e=>setForm({...form,invoice_id:e.target.value})} className="field">
              <option value="">No invoice</option>
              {invoices.filter(i=>!["paid","voided"].includes(i.status)).map(i=><option key={i.id} value={i.id}>{i.invoice_number} — {fmt(i.amount_due)} due</option>)}
            </select>
          </div>
          <div><label className="label">Amount *</label><input type="number" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00" className="field"/></div>
          <div><label className="label">Payment date</label><input type="date" value={form.payment_date} onChange={e=>setForm({...form,payment_date:e.target.value})} className="field"/></div>
          <div><label className="label">Method</label>
            <select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})} className="field">
              <option value="cash">Cash</option><option value="check">Check</option><option value="bank_transfer">Bank Transfer</option><option value="credit_card">Credit Card</option><option value="other">Other</option>
            </select>
          </div>
          <div><label className="label">Reference #</label><input value={form.reference_number} onChange={e=>setForm({...form,reference_number:e.target.value})} className="field"/></div>
          <div className="md:col-span-2"><label className="label">Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} className="field resize-none"/></div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button className="btn-ghost btn" onClick={()=>setModal(false)}>Cancel</button>
          <button className="btn-green btn" onClick={save} disabled={saving}>{saving?"Saving…":"Record Payment"}</button>
        </div>
      </Modal>
    </div>
  );
}
