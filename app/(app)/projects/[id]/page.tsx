"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, CheckCircle, Edit2, MapPin, Calendar, DollarSign, Clock } from "lucide-react";
import { StatusBadge, Tabs, Modal, toast, PageSkeleton } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

function ProgressBar({ start, end }: { start: string; end: string }) {
  if (!start || !end) return null;
  const s   = new Date(start).getTime();
  const e   = new Date(end).getTime();
  const now = Date.now();
  const total   = Math.ceil((e - s) / 86400000);
  const elapsed = Math.max(0, Math.min(Math.ceil((now - s) / 86400000), total));
  const pct     = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  const overdue = now > e;

  return (
    <div className="mt-4 pt-4 border-t border-[#f0efea]">
      <div className="flex justify-between text-[12px] mb-1.5">
        <span className="text-[#8a8fa3]">Day {elapsed} of {total}</span>
        <span className={`font-semibold ${overdue ? "text-red-500" : pct >= 80 ? "text-amber-600" : "text-brand-green"}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-[#f0efea] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${overdue ? "bg-red-400" : pct >= 80 ? "bg-amber-400" : "bg-brand-green"}`}
          style={{ width: `${pct}%` }} />
      </div>
      {overdue && <p className="text-[11px] text-red-500 mt-1">Project is past end date</p>}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id }  = useParams();
  const [data, setData]           = useState<any>(null);
  const [tab, setTab]             = useState("Overview");
  const [editModal, setEditModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const [editForm, setEditForm]   = useState<any>({});
  const [updateForm, setUpdateForm] = useState({ title: "", message: "", status_milestone: "" });
  const [saving, setSaving]       = useState(false);

  const load = () =>
    fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { setData(d); setEditForm(d.project ?? {}); });
  useEffect(() => { load(); }, [id]);

  const saveEdit = async () => {
    setSaving(true);
    await fetch(`/api/projects/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm),
    });
    setSaving(false); toast("Project updated"); setEditModal(false); load();
  };

  const saveUpdate = async () => {
    if (!updateForm.title) { toast("Title required", "error"); return; }
    setSaving(true);
    await fetch("/api/project-updates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updateForm, project_id: id, contact_id: data?.project?.contact_id }),
    });
    setSaving(false); toast("Update sent"); setUpdateModal(false);
    setUpdateForm({ title: "", message: "", status_milestone: "" }); load();
  };

  const markComplete = async () => {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    toast("Project completed"); load();
  };

  if (!data) return <PageSkeleton />;
  const { project, quotes, invoices, payments, updates, feedback, lists, stats } = data;

  const initials = project.contacts?.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Link href="/projects" className="btn btn-ghost btn-sm p-2"><ArrowLeft size={15} /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title truncate">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="page-desc">
            {project.project_number}
            {project.project_type ? ` · ${project.project_type}` : ""}
            {project.contacts?.full_name ? ` · ${project.contacts.full_name}` : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {project.status !== "completed" && (
            <button onClick={markComplete} className="btn btn-green btn-sm">
              <CheckCircle size={13} /> Complete
            </button>
          )}
          <button onClick={() => setUpdateModal(true)} className="btn btn-outline btn-sm">
            <Plus size={13} /> Update
          </button>
          <Link href={`/quotes/new?contactId=${project.contact_id}`} className="btn btn-outline btn-sm">+ Quote</Link>
          <Link href={`/invoices/new?contactId=${project.contact_id}`} className="btn btn-outline btn-sm">+ Invoice</Link>
          <button onClick={() => setEditModal(true)} className="btn btn-outline btn-sm">
            <Edit2 size={13} /> Edit
          </button>
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="mini-stat mini-stat-navy">
          <span className="mini-stat-label">Budget</span>
          <span className="mini-stat-value text-[18px]">{project.budget ? fmt(project.budget) : "—"}</span>
        </div>
        <div className="mini-stat mini-stat-blue">
          <span className="mini-stat-label">Total quoted</span>
          <span className="mini-stat-value text-[18px]">{fmt(stats?.totalQuoted ?? 0)}</span>
        </div>
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">Total invoiced</span>
          <span className="mini-stat-value text-[18px]">{fmt(stats?.totalInvoiced ?? 0)}</span>
        </div>
        <div className="mini-stat mini-stat-amber">
          <span className="mini-stat-label">Amount due</span>
          <span className="mini-stat-value text-[18px]">{fmt(stats?.totalDue ?? 0)}</span>
        </div>
      </div>

      <Tabs tabs={["Overview","Quotes","Invoices","Payments","Updates","Feedback","Item Lists"]}
        active={tab} onChange={setTab} />

      {tab === "Overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Project details */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Project details</h3>
            <div className="space-y-3 text-[13px]">
              {project.project_type && (
                <div className="flex items-center justify-between">
                  <span className="text-[#8a8fa3]">Type</span>
                  <span className="font-medium text-[#0c1226]">{project.project_type}</span>
                </div>
              )}
              {project.address && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[#8a8fa3] flex items-center gap-1"><MapPin size={11} /> Address</span>
                  <span className="text-[#4a5168] text-right max-w-[200px]">{project.address}</span>
                </div>
              )}
              {project.start_date && (
                <div className="flex items-center justify-between">
                  <span className="text-[#8a8fa3] flex items-center gap-1"><Calendar size={11} /> Start</span>
                  <span className="text-[#4a5168]">{fmtDate(project.start_date)}</span>
                </div>
              )}
              {project.end_date && (
                <div className="flex items-center justify-between">
                  <span className="text-[#8a8fa3] flex items-center gap-1"><Clock size={11} /> End</span>
                  <span className="text-[#4a5168]">{fmtDate(project.end_date)}</span>
                </div>
              )}
              {project.budget && (
                <div className="flex items-center justify-between">
                  <span className="text-[#8a8fa3] flex items-center gap-1"><DollarSign size={11} /> Budget</span>
                  <span className="font-semibold text-[#0c1226]">{fmt(project.budget)}</span>
                </div>
              )}
              {project.description && (
                <p className="text-[#4a5168] leading-relaxed pt-1 border-t border-[#f0efea]">{project.description}</p>
              )}
            </div>

            <ProgressBar start={project.start_date} end={project.end_date} />
          </div>

          {/* Contact + financials */}
          <div className="space-y-4">
            {project.contacts && (
              <div className="card p-5">
                <h3 className="section-title mb-3">Customer</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-navy rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{initials}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0c1226]">{project.contacts.full_name}</p>
                    {project.contacts.email && <p className="text-[12px] text-[#8a8fa3]">{project.contacts.email}</p>}
                    {project.contacts.phone && <p className="text-[12px] text-[#8a8fa3]">{project.contacts.phone}</p>}
                  </div>
                </div>
                <Link href={`/contacts/${project.contact_id}`} className="btn btn-outline btn-sm mt-3 inline-flex">
                  View contact
                </Link>
              </div>
            )}

            <div className="card p-5">
              <h3 className="section-title mb-3">Financial summary</h3>
              <div className="space-y-2.5 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#8a8fa3]">Quotes</span>
                  <span className="font-medium">{quotes.length} · {fmt(stats?.totalQuoted ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8fa3]">Invoiced</span>
                  <span className="font-medium">{invoices.length} · {fmt(stats?.totalInvoiced ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8fa3]">Collected</span>
                  <span className="font-semibold text-brand-green">{fmt(payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0))}</span>
                </div>
                <div className="flex justify-between border-t border-[#f0efea] pt-2">
                  <span className="text-[#8a8fa3]">Outstanding</span>
                  <span className={`font-bold ${(stats?.totalDue ?? 0) > 0 ? "text-red-600" : "text-brand-green"}`}>
                    {fmt(stats?.totalDue ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "Quotes" && (
        <div className="table-wrapper">
          <table className="table-base">
            <thead><tr><th>Number</th><th>Title</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {quotes.length === 0
                ? <tr><td colSpan={4} className="text-center py-8 text-[#8a8fa3]">No quotes yet</td></tr>
                : quotes.map((q: any) => (
                  <tr key={q.id}>
                    <td><Link href={`/quotes/${q.id}`} className="text-brand-navy hover:underline font-medium">{q.quote_number}</Link></td>
                    <td className="text-[#4a5168]">{q.title || "—"}</td>
                    <td className="font-semibold">{fmt(q.total)}</td>
                    <td><StatusBadge status={q.status} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Invoices" && (
        <div className="table-wrapper">
          <table className="table-base">
            <thead><tr><th>Number</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              {invoices.length === 0
                ? <tr><td colSpan={5} className="text-center py-8 text-[#8a8fa3]">No invoices yet</td></tr>
                : invoices.map((i: any) => (
                  <tr key={i.id}>
                    <td><Link href={`/invoices/${i.id}`} className="text-brand-navy hover:underline font-medium">{i.invoice_number}</Link></td>
                    <td className="font-semibold">{fmt(i.total)}</td>
                    <td className="text-brand-green font-semibold">{fmt(i.amount_paid)}</td>
                    <td className={i.amount_due > 0 ? "text-red-600 font-semibold" : "text-brand-green"}>{fmt(i.amount_due)}</td>
                    <td><StatusBadge status={i.status} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Payments" && (
        <div className="table-wrapper">
          <table className="table-base">
            <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead>
            <tbody>
              {payments.length === 0
                ? <tr><td colSpan={4} className="text-center py-8 text-[#8a8fa3]">No payments yet</td></tr>
                : payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="text-[#8a8fa3] text-xs">{fmtDate(p.payment_date)}</td>
                    <td className="font-semibold text-brand-green">{fmt(p.amount)}</td>
                    <td className="capitalize text-[#4a5168]">{p.payment_method?.replace("_"," ")}</td>
                    <td className="text-[#8a8fa3] text-xs">{p.reference_number || "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Updates" && (
        <div className="space-y-3">
          {updates.length === 0
            ? <p className="text-sm text-[#8a8fa3] text-center py-8">No updates yet.</p>
            : updates.map((u: any) => (
              <div key={u.id} className="card p-4">
                <div className="flex justify-between mb-1">
                  <p className="font-semibold text-[#0c1226]">{u.title}</p>
                  <span className="text-xs text-[#8a8fa3]">{fmtDate(u.created_at)}</span>
                </div>
                {u.status_milestone && <span className="badge bg-blue-50 text-blue-700 mb-2">{u.status_milestone}</span>}
                <p className="text-sm text-[#4a5168] leading-relaxed">{u.message}</p>
              </div>
            ))}
        </div>
      )}

      {tab === "Feedback" && (
        <div className="space-y-3">
          {feedback.length === 0
            ? <p className="text-sm text-[#8a8fa3] text-center py-8">No feedback yet.</p>
            : feedback.map((f: any) => (
              <div key={f.id} className="card p-4">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-amber-400">{"★".repeat(f.rating || 0)}</span>
                  <span className="text-[#d8d6cf]">{"★".repeat(5 - (f.rating || 0))}</span>
                </div>
                <p className="text-sm text-[#4a5168]">{f.comments}</p>
              </div>
            ))}
        </div>
      )}

      {tab === "Item Lists" && (
        <div className="space-y-3">
          {lists.length === 0
            ? <p className="text-sm text-[#8a8fa3] text-center py-8">No requirement lists yet.</p>
            : lists.map((l: any) => (
              <div key={l.id} className="card p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-[#0c1226]">{l.title}</p>
                  <p className="text-xs text-[#8a8fa3]">{fmtDate(l.created_at)}</p>
                </div>
              </div>
            ))}
          <Link href="/item-requirements" className="btn btn-outline btn-sm">View All</Link>
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Project">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input value={editForm.name ?? ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">Status</label>
            <select value={editForm.status ?? ""} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="field">
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="label">Budget</label>
            <input type="number" step="0.01" value={editForm.budget ?? ""}
              onChange={e => setEditForm({ ...editForm, budget: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">Start date</label>
            <input type="date" value={editForm.start_date?.split("T")[0] ?? ""}
              onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">End date</label>
            <input type="date" value={editForm.end_date?.split("T")[0] ?? ""}
              onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">Address</label>
            <input value={editForm.address ?? ""} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="field" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea value={editForm.description ?? ""}
              onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-[#e7e6e1]">
          <button className="btn btn-outline" onClick={() => setEditModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </Modal>

      {/* Update Modal */}
      <Modal open={updateModal} onClose={() => setUpdateModal(false)} title="Send Project Update">
        <div className="space-y-4">
          <div>
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input value={updateForm.title} onChange={e => setUpdateForm({ ...updateForm, title: e.target.value })}
              placeholder="Project update title" className="field" />
          </div>
          <div>
            <label className="label">Status / Milestone</label>
            <input value={updateForm.status_milestone}
              onChange={e => setUpdateForm({ ...updateForm, status_milestone: e.target.value })}
              placeholder="e.g. Foundation Complete" className="field" />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea value={updateForm.message}
              onChange={e => setUpdateForm({ ...updateForm, message: e.target.value })}
              rows={4} className="field resize-none" />
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-[#e7e6e1]">
            <button className="btn btn-outline" onClick={() => setUpdateModal(false)}>Cancel</button>
            <button className="btn btn-green" onClick={saveUpdate} disabled={saving}>{saving ? "Saving…" : "Send Update"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
