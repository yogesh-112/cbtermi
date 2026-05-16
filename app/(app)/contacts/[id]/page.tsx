"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MessageCircle, Edit2, Trash2, Plus, UserCheck } from "lucide-react";
import { StatusBadge, Tabs, ConfirmDialog, toast } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

export default function ContactDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("Overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [delConfirm, setDelConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => fetch(`/api/contacts/${id}`).then((r) => r.json()).then((d) => { setData(d); setForm(d.contact ?? {}); });
  useEffect(() => { load(); }, [id]);

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/contacts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { toast("Contact updated"); setEditing(false); load(); }
    else toast("Failed to update", "error");
  };

  const del = async () => {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    toast("Contact deleted");
    router.push("/contacts");
  };

  const convertToCustomer = async () => {
    await fetch(`/api/contacts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contact_type: "customer" }) });
    toast("Converted to customer"); load();
  };

  if (!data) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;
  const c = data.contact;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/contacts" className="btn-ghost btn btn-sm"><ArrowLeft size={14} /></Link>
        <div className="flex-1">
          <h1 className="page-title">{c.full_name}</h1>
          {c.business_name && <p className="text-sm text-slate-500">{c.business_name}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {c.contact_type === "lead" && (
            <button onClick={convertToCustomer} className="btn-outline btn btn-sm"><UserCheck size={14} /> Convert to Customer</button>
          )}
          <Link href={`/quotes?new=1&contactId=${id}`} className="btn-outline btn btn-sm"><Plus size={14} /> Quote</Link>
          <Link href={`/invoices?new=1&contactId=${id}`} className="btn-outline btn btn-sm"><Plus size={14} /> Invoice</Link>
          <Link href={`/projects?new=1&contactId=${id}`} className="btn-outline btn btn-sm"><Plus size={14} /> Project</Link>
          <button onClick={() => setEditing(true)} className="btn-outline btn btn-sm"><Edit2 size={14} /></button>
          <button onClick={() => setDelConfirm(true)} className="btn-danger btn btn-sm"><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-navy rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{c.full_name[0]?.toUpperCase()}</span>
            </div>
            <div><p className="font-semibold text-slate-900">{c.full_name}</p><StatusBadge status={c.contact_type} /></div>
          </div>
          {editing ? (
            <div className="space-y-3">
              {[["full_name","Full name"],["business_name","Business name"],["email","Email"],["phone","Phone"],["whatsapp","WhatsApp"],["address","Address"],["city","City"],["state","State"],["zip","Zipcode"]].map(([k,l]) => (
                <div key={k}><label className="label">{l}</label>
                  <input value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="field" />
                </div>
              ))}
              <div><label className="label">Lead Source</label>
                <select value={form.source ?? ""} onChange={(e) => setForm({ ...form, source: e.target.value })} className="field">
                  <option value="">Select source</option>
                  {["Referral","Google","Facebook","Instagram","LinkedIn","Walk-in","Cold Call","Website","Other"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="label">Lead Status</label>
                <select value={form.lead_status ?? ""} onChange={(e) => setForm({ ...form, lead_status: e.target.value })} className="field">
                  {["New Lead","In Conversation","Meeting Scheduled","Site Visit","Proposal Sent","Negotiation","Won","Lost"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="label">Type</label>
                <select value={form.contact_type} onChange={(e) => setForm({ ...form, contact_type: e.target.value })} className="field">
                  <option value="lead">Lead</option><option value="customer">Customer</option><option value="direct_contact">Direct Contact</option>
                </select>
              </div>
              <div><label className="label">Notes</label><textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="field resize-none" /></div>
              <div className="flex gap-2"><button onClick={save} disabled={saving} className="btn btn-primary btn-sm flex-1">{saving?"Saving…":"Save"}</button><button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm flex-1">Cancel</button></div>
            </div>
          ) : (
            <dl className="space-y-2 text-sm">
              {c.email && <div className="flex items-center gap-2"><Mail size={13} className="text-slate-400"/><a href={`mailto:${c.email}`} className="text-brand-navy hover:underline">{c.email}</a></div>}
              {c.phone && <div className="flex items-center gap-2"><Phone size={13} className="text-slate-400"/><a href={`tel:${c.phone}`} className="text-brand-navy hover:underline">{c.phone}</a></div>}
              {c.whatsapp && <div className="flex items-center gap-2"><MessageCircle size={13} className="text-slate-400"/><a href={`https://wa.me/${c.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="text-brand-navy hover:underline">{c.whatsapp}</a></div>}
              {c.city && <p className="text-slate-500">{[c.city,c.state,c.zip].filter(Boolean).join(", ")}</p>}
              {c.source && <p className="text-slate-500">Source: {c.source}</p>}
              {c.notes && <p className="text-slate-600 mt-2 p-2 bg-slate-50 rounded">{c.notes}</p>}
            </dl>
          )}
        </div>

        {/* Tabs */}
        <div className="lg:col-span-2">
          <Tabs tabs={["Overview","Quotes","Invoices","Projects","Payments","Communications"]} active={tab} onChange={setTab} />

          {tab === "Overview" && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Quotes",    val: data.quotes?.length ?? 0 },
                { label: "Invoices",  val: data.invoices?.length ?? 0 },
                { label: "Projects",  val: data.projects?.length ?? 0 },
                { label: "Payments",  val: fmt(data.payments?.reduce((s:number,p:any)=>s+(p.amount??0),0)??0) },
              ].map(({ label, val }) => (
                <div key={label} className="card p-4 text-center">
                  <p className="text-2xl font-bold text-brand-navy">{val}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "Quotes" && (
            <div className="table-wrapper"><table className="table-base"><thead><tr><th>Number</th><th>Title</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>{(data.quotes??[]).map((q:any)=>(<tr key={q.id}><td><Link href={`/quotes/${q.id}`} className="text-brand-navy hover:underline">{q.quote_number}</Link></td><td>{q.title||"—"}</td><td>{fmt(q.total)}</td><td><StatusBadge status={q.status}/></td><td>{fmtDate(q.created_at)}</td></tr>))}</tbody>
            </table></div>
          )}

          {tab === "Invoices" && (
            <div className="table-wrapper"><table className="table-base"><thead><tr><th>Number</th><th>Total</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>{(data.invoices??[]).map((i:any)=>(<tr key={i.id}><td><Link href={`/invoices/${i.id}`} className="text-brand-navy hover:underline">{i.invoice_number}</Link></td><td>{fmt(i.total)}</td><td>{fmt(i.amount_due)}</td><td><StatusBadge status={i.status}/></td></tr>))}</tbody>
            </table></div>
          )}

          {tab === "Projects" && (
            <div className="table-wrapper"><table className="table-base"><thead><tr><th>Name</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>{(data.projects??[]).map((p:any)=>(<tr key={p.id}><td><Link href={`/projects/${p.id}`} className="text-brand-navy hover:underline">{p.name}</Link></td><td><StatusBadge status={p.status}/></td><td>{fmtDate(p.created_at)}</td></tr>))}</tbody>
            </table></div>
          )}

          {tab === "Payments" && (
            <div className="table-wrapper"><table className="table-base"><thead><tr><th>Amount</th><th>Date</th><th>Method</th></tr></thead>
              <tbody>{(data.payments??[]).map((p:any)=>(<tr key={p.id}><td className="font-semibold">{fmt(p.amount)}</td><td>{fmtDate(p.payment_date)}</td><td className="capitalize">{p.payment_method?.replace("_"," ")}</td></tr>))}</tbody>
            </table></div>
          )}

          {tab === "Communications" && (
            <div className="space-y-3">
              {(data.communications??[]).length === 0
                ? <p className="text-sm text-slate-400 text-center py-8">No communications yet.</p>
                : (data.communications??[]).map((c:any)=>(<div key={c.id} className="card p-4"><div className="flex justify-between mb-1"><span className="text-xs font-semibold text-brand-navy uppercase">{c.type}</span><span className="text-xs text-slate-400">{fmtDate(c.created_at)}</span></div><p className="text-sm text-slate-700">{c.subject||c.message}</p><p className="text-xs text-slate-400 mt-1">via {c.channel}</p></div>))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={delConfirm} onClose={() => setDelConfirm(false)} onConfirm={del} title="Delete contact" message="This will permanently delete this contact and all related data." danger />
    </div>
  );
}
