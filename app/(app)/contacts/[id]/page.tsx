"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, MessageCircle, Edit2, Trash2, Plus,
  UserCheck, MapPin, Tag, Calendar, DollarSign,
} from "lucide-react";
import { StatusBadge, Tabs, ConfirmDialog, toast, PageSkeleton } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

const LEAD_SOURCES  = ["Referral","Google","Facebook","Instagram","LinkedIn","Walk-in","Cold Call","Website","Other"];
const LEAD_STATUSES = ["New Lead","In Conversation","Meeting Scheduled","Site Visit","Proposal Sent","Negotiation","Won","Lost"];

const TYPE_COLOR: Record<string, string> = {
  lead:           "bg-amber-50 text-amber-700",
  customer:       "bg-brand-green/10 text-brand-green",
  direct_contact: "bg-blue-50 text-brand-navy",
};

const COMM_ICONS: Record<string, string> = {
  email: "✉", whatsapp: "💬", sms: "💬", call: "📞", note: "📝",
};

export default function ContactDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const [data, setData]         = useState<any>(null);
  const [tab, setTab]           = useState("Overview");
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState<any>({});
  const [delConfirm, setDelConfirm] = useState(false);
  const [saving, setSaving]     = useState(false);

  const load = () =>
    fetch(`/api/contacts/${id}`).then(r => r.json()).then(d => { setData(d); setForm(d.contact ?? {}); });
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
  const lifetimeValue = (data.payments ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
  const location = [c.city, c.state].filter(Boolean).join(", ");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
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
          <button onClick={() => setEditing(!editing)} className="btn btn-outline btn-sm"><Edit2 size={13} /> Edit</button>
          <button onClick={() => setDelConfirm(true)} aria-label="Delete contact" className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        {c.phone && (
          <a href={`tel:${c.phone}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e7e6e1] rounded-lg text-[13px] font-medium text-[#4a5168] hover:border-brand-navy hover:text-brand-navy transition-colors">
            <Phone size={13} /> Call
          </a>
        )}
        {c.email && (
          <a href={`mailto:${c.email}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e7e6e1] rounded-lg text-[13px] font-medium text-[#4a5168] hover:border-brand-navy hover:text-brand-navy transition-colors">
            <Mail size={13} /> Email
          </a>
        )}
        {c.whatsapp && (
          <a href={`https://wa.me/${c.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e7e6e1] rounded-lg text-[13px] font-medium text-[#4a5168] hover:border-[#25D366] hover:text-[#25D366] transition-colors">
            <MessageCircle size={13} /> WhatsApp
          </a>
        )}
        <Link href={`/quotes/new?contactId=${id}`}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e7e6e1] rounded-lg text-[13px] font-medium text-[#4a5168] hover:border-brand-navy hover:text-brand-navy transition-colors">
          <Plus size={13} /> New Quote
        </Link>
        <Link href={`/invoices/new?contactId=${id}`}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e7e6e1] rounded-lg text-[13px] font-medium text-[#4a5168] hover:border-brand-navy hover:text-brand-navy transition-colors">
          <Plus size={13} /> New Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Contact card */}
          <div className="card p-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#f0efea]">
              <div className="w-14 h-14 bg-brand-navy rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">{initials}</span>
              </div>
              <div>
                <p className="font-semibold text-[#0c1226] leading-tight">{c.full_name}</p>
                {c.business_name && <p className="text-[12px] text-[#8a8fa3]">{c.business_name}</p>}
                <span className={`badge mt-1 text-[11px] ${TYPE_COLOR[c.contact_type] ?? "bg-[#f0efea] text-[#8a8fa3]"}`}>
                  {c.contact_type?.replace("_", " ") ?? "contact"}
                </span>
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
                <div className="flex gap-2 pt-1">
                  <button onClick={save} disabled={saving} className="btn btn-primary btn-sm flex-1">{saving ? "Saving…" : "Save"}</button>
                  <button onClick={() => setEditing(false)} className="btn btn-outline btn-sm flex-1">Cancel</button>
                </div>
              </div>
            ) : (
              <dl className="space-y-2.5 text-[13px]">
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-[#8a8fa3] flex-shrink-0" />
                    <a href={`mailto:${c.email}`} className="text-brand-navy hover:underline truncate">{c.email}</a>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-[#8a8fa3] flex-shrink-0" />
                    <a href={`tel:${c.phone}`} className="text-brand-navy hover:underline">{c.phone}</a>
                  </div>
                )}
                {c.whatsapp && (
                  <div className="flex items-center gap-2">
                    <MessageCircle size={12} className="text-[#8a8fa3] flex-shrink-0" />
                    <a href={`https://wa.me/${c.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                      className="text-brand-navy hover:underline">{c.whatsapp}</a>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-[#8a8fa3] flex-shrink-0" />
                    <span className="text-[#4a5168]">{location}</span>
                  </div>
                )}
                {c.source && (
                  <div className="flex items-center gap-2">
                    <Tag size={12} className="text-[#8a8fa3] flex-shrink-0" />
                    <span className="text-[#4a5168]">Source: {c.source}</span>
                  </div>
                )}
                {c.lead_status && (
                  <div className="pt-1">
                    <span className="badge bg-amber-50 text-amber-700">{c.lead_status}</span>
                  </div>
                )}
                {c.notes && (
                  <p className="text-[#4a5168] mt-2 p-3 bg-[#f6f6f3] rounded-xl text-xs leading-relaxed">{c.notes}</p>
                )}
              </dl>
            )}
          </div>

          {/* Metrics card */}
          {!editing && (
            <div className="card p-5 space-y-3">
              <h3 className="section-title">At a glance</h3>
              <div className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-1.5 text-[#8a8fa3]"><Calendar size={12} /> Customer since</span>
                <span className="font-medium text-[#0c1226]">{fmtDate(c.created_at)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-1.5 text-[#8a8fa3]"><DollarSign size={12} /> Lifetime value</span>
                <span className="font-semibold text-brand-green">{fmt(lifetimeValue)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#8a8fa3]">Projects</span>
                <span className="font-medium text-[#0c1226]">{data.projects?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#8a8fa3]">Invoices</span>
                <span className="font-medium text-[#0c1226]">{data.invoices?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#8a8fa3]">Open balance</span>
                <span className={`font-semibold ${(data.invoices ?? []).reduce((s: number, i: any) => s + (i.amount_due ?? 0), 0) > 0 ? "text-red-600" : "text-brand-green"}`}>
                  {fmt((data.invoices ?? []).reduce((s: number, i: any) => s + (i.amount_due ?? 0), 0))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="lg:col-span-2">
          <Tabs tabs={["Overview","Quotes","Invoices","Projects","Payments","Communications"]}
            active={tab} onChange={setTab} />

          {tab === "Overview" && (
            <div className="space-y-4">
              {/* Summary stats */}
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
                  <span className="mini-stat-label">Total paid</span>
                  <span className="mini-stat-value text-[18px]">{fmt(lifetimeValue)}</span>
                </div>
              </div>

              {/* Recent activity feed */}
              {(data.communications ?? []).length > 0 && (
                <div className="card p-5">
                  <h3 className="section-title mb-3">Recent activity</h3>
                  <div className="space-y-0">
                    {(data.communications ?? []).slice(0, 8).map((comm: any, i: number) => (
                      <div key={comm.id ?? i} className="flex gap-3 py-3 border-b border-[#f0efea] last:border-0">
                        <div className="w-7 h-7 bg-[#f0efea] rounded-full flex items-center justify-center flex-shrink-0 text-[13px]">
                          {COMM_ICONS[comm.type] ?? "📌"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[#0c1226] truncate">{comm.subject || comm.type}</p>
                          <p className="text-[11px] text-[#8a8fa3]">via {comm.channel} · {fmtDate(comm.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <thead><tr><th>Name</th><th>Status</th><th>Budget</th><th>Date</th></tr></thead>
                <tbody>
                  {(data.projects ?? []).length === 0
                    ? <tr><td colSpan={4} className="text-center py-8 text-[#8a8fa3]">No projects yet</td></tr>
                    : (data.projects ?? []).map((p: any) => (
                      <tr key={p.id}>
                        <td><Link href={`/projects/${p.id}`} className="text-brand-navy hover:underline font-medium">{p.name}</Link></td>
                        <td><StatusBadge status={p.status} /></td>
                        <td className="font-medium text-[#4a5168]">{p.budget ? fmt(p.budget) : "—"}</td>
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
                <thead><tr><th>Amount</th><th>Date</th><th>Method</th><th>Invoice</th></tr></thead>
                <tbody>
                  {(data.payments ?? []).length === 0
                    ? <tr><td colSpan={4} className="text-center py-8 text-[#8a8fa3]">No payments yet</td></tr>
                    : (data.payments ?? []).map((p: any) => (
                      <tr key={p.id}>
                        <td className="font-semibold text-brand-green">{fmt(p.amount)}</td>
                        <td className="text-[#8a8fa3] text-xs">{fmtDate(p.payment_date)}</td>
                        <td className="capitalize text-[#4a5168]">{p.payment_method?.replace("_"," ")}</td>
                        <td className="text-[#4a5168]">{p.invoices?.invoice_number || "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "Communications" && (
            <div className="space-y-2">
              {(data.communications ?? []).length === 0
                ? <p className="text-sm text-[#8a8fa3] text-center py-8">No communications yet.</p>
                : (data.communications ?? []).map((comm: any) => (
                  <div key={comm.id} className="card p-4">
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px]">{COMM_ICONS[comm.type] ?? "📌"}</span>
                        <span className="text-xs font-bold text-brand-navy uppercase tracking-wide">{comm.type}</span>
                        {comm.channel && <span className="badge bg-[#f0efea] text-[#8a8fa3]">{comm.channel}</span>}
                      </div>
                      <span className="text-xs text-[#8a8fa3]">{fmtDate(comm.created_at)}</span>
                    </div>
                    <p className="text-[13px] text-[#4a5168] leading-relaxed">{comm.subject || comm.message}</p>
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
