"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MessageCircle, Edit2, Trash2, Plus, UserCheck } from "lucide-react";
import { StatusBadge, Tabs, ConfirmDialog, toast, PageSkeleton } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

const LEAD_SOURCES = ["Referral","Google","Facebook","Instagram","LinkedIn","Walk-in","Cold Call","Website","Other"];
const LEAD_STATUSES = ["New Lead","In Conversation","Meeting Scheduled","Site Visit","Proposal Sent","Negotiation","Won","Lost"];

export default function ContactDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("Overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [delConfirm, setDelConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => fetch(`/api/contacts/${id}`).then(r => r.json()).then(d => { setData(d); setForm(d.contact ?? {}); });
  useEffect(() => { load(); }, [id]);

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
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
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_type: "customer" }),
    });
    toast("Converted to customer"); load();
  };

  if (!data) return <PageSkeleton />;
  const c = data.contact;

  const initials = c.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/contacts" className="btn btn-ghost btn-sm p-2"><ArrowLeft size={15} /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="page-title truncate">{c.full_name}</h1>
          {c.business_name && <p className="page-desc">{c.business_name}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {c.contact_type === "lead" && (
            <button onClick={convertToCustomer} className="btn btn-outline btn-sm">
              <UserCheck size={13} /> Convert
            </button>
          )}
          <Link href={`/quotes/new?contactId=${id}`} className="btn btn-outline btn-sm"><Plus size={13} /> Quote</Link>
          <Link href={`/invoices/new?contactId=${id}`} className="btn btn-outline btn-sm"><Plus size={13} /> Invoice</Link>
          <button onClick={() => setEditing(!editing)} className="btn btn-outline btn-sm"><Edit2 size={13} /></button>
          <button onClick={() => setDelConfirm(true)} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Contact Info Sidebar */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-navy rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{initials}</span>
            </div>
            <div>
              <p className="font-semibold text-[#0c1226]">{c.full_name}</p>
              <StatusBadge status={c.contact_type} />
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              {[
                ["full_name","Full name"], ["business_name","Business name"],
                ["email","Email"], ["phone","Phone"], ["whatsapp","WhatsApp"],
                ["address","Address"], ["city","City"], ["state","State"], ["zip","Zipcode"],
              ].map(([k, l]) => (
                <div key={k}>
                  <label className="label">{l}</label>
                  <input value={form[k] ?? ""} onChange={e => setForm({ ...form, [k]: e.target.value })} className="field" />
                </div>
              ))}
              <div>
                <label className="label">Lead Source</label>
                <select value={form.source ?? ""} onChange={e => setForm({ ...form, source: e.target.value })} className="field">
                  <option value="">Select source</option>
                  {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Lead Status</label>
                <select value={form.lead_status ?? ""} onChange={e => setForm({ ...form, lead_status: e.target.value })} className="field">
                  {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Type</label>
                <select value={form.contact_type} onChange={e => setForm({ ...form, contact_type: e.target.value })} className="field">
                  <option value="lead">Lead</option>
                  <option value="customer">Customer</option>
                  <option value="direct_contact">Direct Contact</option>
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={form.notes ?? ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="field resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving} className="btn btn-primary btn-sm flex-1">{saving ? "Saving…" : "Save"}</button>
                <button onClick={() => setEditing(false)} className="btn btn-outline btn-sm flex-1">Cancel</button>
              </div>
            </div>
          ) : (
            <dl className="space-y-2.5 text-sm">
              {c.email && (
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-[#8a8fa3] flex-shrink-0" />
                  <a href={`mailto:${c.email}`} className="text-brand-navy hover:underline truncate">{c.email}</a>
                </div>
              )}
              {c.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-[#8a8fa3] flex-shrink-0" />
                  <a href={`tel:${c.phone}`} className="text-brand-navy hover:underline">{c.phone}</a>
                </div>
              )}
              {c.whatsapp && (
                <div className="flex items-center gap-2">
                  <MessageCircle size={13} className="text-[#8a8fa3] flex-shrink-0" />
                  <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                    className="text-brand-navy hover:underline">{c.whatsapp}</a>
                </div>
              )}
              {c.city && (
                <p className="text-[#4a5168]">{[c.city, c.state, c.zip].filter(Boolean).join(", ")}</p>
              )}
              {c.source && <p className="text-[#4a5168]">Source: {c.source}</p>}
              {c.lead_status && <p className="text-[#4a5168]">Status: {c.lead_status}</p>}
              {c.notes && (
                <p className="text-[#4a5168] mt-2 p-3 bg-[#f6f6f3] rounded-xl text-xs leading-relaxed">{c.notes}</p>
              )}
            </dl>
          )}
        </div>

        {/* Tabs */}
        <div className="lg:col-span-2">
          <Tabs tabs={["Overview", "Quotes", "Invoices", "Projects", "Payments", "Communications"]}
            active={tab} onChange={setTab} />

          {tab === "Overview" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="mini-stat mini-stat-navy">
                <span className="mini-stat-label">Quotes</span>
                <span className="mini-stat-value">{data.quotes?.length ?? 0}</span>
              </div>
              <div className="mini-stat mini-stat-blue">
                <span className="mini-stat-label">Invoices</span>
                <span className="mini-stat-value">{data.invoices?.length ?? 0}</span>
              </div>
              <div className="mini-stat mini-stat-green">
                <span className="mini-stat-label">Projects</span>
                <span className="mini-stat-value">{data.projects?.length ?? 0}</span>
              </div>
              <div className="mini-stat mini-stat-amber">
                <span className="mini-stat-label">Total Paid</span>
                <span className="mini-stat-value text-[18px]">{fmt(data.payments?.reduce((s: number, p: any) => s + (p.amount ?? 0), 0) ?? 0)}</span>
              </div>
            </div>
          )}

          {tab === "Quotes" && (
            <div className="table-wrapper">
              <table className="table-base">
                <thead><tr><th>Number</th><th>Title</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {(data.quotes ?? []).length === 0
                    ? <tr><td colSpan={5} className="text-center py-8 text-[#8a8fa3]">No quotes yet</td></tr>
                    : (data.quotes ?? []).map((q: any) => (
                      <tr key={q.id}>
                        <td><Link href={`/quotes/${q.id}`} className="text-brand-navy hover:underline font-medium">{q.quote_number}</Link></td>
                        <td className="text-[#4a5168]">{q.title || "—"}</td>
                        <td className="font-semibold">{fmt(q.total)}</td>
                        <td><StatusBadge status={q.status} /></td>
                        <td className="text-[#8a8fa3] text-xs">{fmtDate(q.created_at)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "Invoices" && (
            <div className="table-wrapper">
              <table className="table-base">
                <thead><tr><th>Number</th><th>Total</th><th>Due</th><th>Status</th></tr></thead>
                <tbody>
                  {(data.invoices ?? []).length === 0
                    ? <tr><td colSpan={4} className="text-center py-8 text-[#8a8fa3]">No invoices yet</td></tr>
                    : (data.invoices ?? []).map((i: any) => (
                      <tr key={i.id}>
                        <td><Link href={`/invoices/${i.id}`} className="text-brand-navy hover:underline font-medium">{i.invoice_number}</Link></td>
                        <td className="font-semibold">{fmt(i.total)}</td>
                        <td className={i.amount_due > 0 ? "text-red-600 font-semibold" : "text-brand-green"}>{fmt(i.amount_due)}</td>
                        <td><StatusBadge status={i.status} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "Projects" && (
            <div className="table-wrapper">
              <table className="table-base">
                <thead><tr><th>Name</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {(data.projects ?? []).length === 0
                    ? <tr><td colSpan={3} className="text-center py-8 text-[#8a8fa3]">No projects yet</td></tr>
                    : (data.projects ?? []).map((p: any) => (
                      <tr key={p.id}>
                        <td><Link href={`/projects/${p.id}`} className="text-brand-navy hover:underline font-medium">{p.name}</Link></td>
                        <td><StatusBadge status={p.status} /></td>
                        <td className="text-[#8a8fa3] text-xs">{fmtDate(p.created_at)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "Payments" && (
            <div className="table-wrapper">
              <table className="table-base">
                <thead><tr><th>Amount</th><th>Date</th><th>Method</th></tr></thead>
                <tbody>
                  {(data.payments ?? []).length === 0
                    ? <tr><td colSpan={3} className="text-center py-8 text-[#8a8fa3]">No payments yet</td></tr>
                    : (data.payments ?? []).map((p: any) => (
                      <tr key={p.id}>
                        <td className="font-semibold text-brand-green">{fmt(p.amount)}</td>
                        <td>{fmtDate(p.payment_date)}</td>
                        <td className="capitalize text-[#4a5168]">{p.payment_method?.replace("_", " ")}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "Communications" && (
            <div className="space-y-3">
              {(data.communications ?? []).length === 0
                ? <p className="text-sm text-[#8a8fa3] text-center py-8">No communications yet.</p>
                : (data.communications ?? []).map((comm: any) => (
                  <div key={comm.id} className="card p-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-brand-navy uppercase tracking-wide">{comm.type}</span>
                      <span className="text-xs text-[#8a8fa3]">{fmtDate(comm.created_at)}</span>
                    </div>
                    <p className="text-sm text-[#4a5168]">{comm.subject || comm.message}</p>
                    <p className="text-xs text-[#8a8fa3] mt-1">via {comm.channel}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={delConfirm} onClose={() => setDelConfirm(false)} onConfirm={del}
        title="Delete contact" message="This will permanently delete this contact and all related data." danger />
    </div>
  );
}
