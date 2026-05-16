"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, CheckCircle, Edit2 } from "lucide-react";
import { StatusBadge, Tabs, Modal, toast, PageSkeleton } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("Overview");
  const [editModal, setEditModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [updateForm, setUpdateForm] = useState({ title: "", message: "", status_milestone: "" });
  const [saving, setSaving] = useState(false);

  const load = () => fetch(`/api/projects/${id}`).then(r => r.json()).then(d => {
    setData(d); setEditForm(d.project ?? {});
  });
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

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/projects" className="btn btn-ghost btn-sm p-2"><ArrowLeft size={15} /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="page-title truncate">{project.name}</h1>
          <p className="page-desc">{project.project_number}{project.contacts?.full_name ? ` · ${project.contacts.full_name}` : ""}</p>
        </div>
        <StatusBadge status={project.status} />
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Budget",         val: project.budget ? fmt(project.budget) : "Not set" },
          { label: "Total Quoted",   val: fmt(stats?.totalQuoted ?? 0) },
          { label: "Total Invoiced", val: fmt(stats?.totalInvoiced ?? 0) },
          { label: "Amount Due",     val: fmt(stats?.totalDue ?? 0) },
        ].map(({ label, val }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-lg font-bold text-brand-navy">{val}</p>
            <p className="text-xs text-[#9CA3AF] mt-1">{label}</p>
          </div>
        ))}
      </div>

      <Tabs tabs={["Overview", "Quotes", "Invoices", "Payments", "Updates", "Feedback", "Item Lists"]}
        active={tab} onChange={setTab} />

      {tab === "Overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-5 space-y-3 text-sm">
            <h3 className="section-title">Project Details</h3>
            {[
              ["Type", project.project_type],
              ["Address", project.address],
              ["Start", fmtDate(project.start_date)],
              ["End", fmtDate(project.end_date)],
              ["Description", project.description],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-[#9CA3AF] w-20 flex-shrink-0">{k}</span>
                <span className="text-[#374151]">{v}</span>
              </div>
            ))}
          </div>
          {project.contacts && (
            <div className="card p-5 text-sm">
              <h3 className="section-title">Contact</h3>
              <p className="font-semibold text-[#111827]">{project.contacts.full_name}</p>
              {project.contacts.email && <p className="text-[#6B7280] mt-1">{project.contacts.email}</p>}
              {project.contacts.phone && <p className="text-[#6B7280]">{project.contacts.phone}</p>}
              <Link href={`/contacts/${project.contact_id}`} className="btn btn-outline btn-sm mt-3 inline-flex">
                View Contact
              </Link>
            </div>
          )}
        </div>
      )}

      {tab === "Quotes" && (
        <div className="table-wrapper">
          <table className="table-base">
            <thead><tr><th>Number</th><th>Title</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {quotes.length === 0
                ? <tr><td colSpan={4} className="text-center py-8 text-[#9CA3AF]">No quotes yet</td></tr>
                : quotes.map((q: any) => (
                  <tr key={q.id}>
                    <td><Link href={`/quotes/${q.id}`} className="text-brand-navy hover:underline font-medium">{q.quote_number}</Link></td>
                    <td className="text-[#374151]">{q.title || "—"}</td>
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
                ? <tr><td colSpan={5} className="text-center py-8 text-[#9CA3AF]">No invoices yet</td></tr>
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
            <thead><tr><th>Date</th><th>Amount</th><th>Method</th></tr></thead>
            <tbody>
              {payments.length === 0
                ? <tr><td colSpan={3} className="text-center py-8 text-[#9CA3AF]">No payments yet</td></tr>
                : payments.map((p: any) => (
                  <tr key={p.id}>
                    <td>{fmtDate(p.payment_date)}</td>
                    <td className="font-semibold text-brand-green">{fmt(p.amount)}</td>
                    <td className="capitalize text-[#6B7280]">{p.payment_method?.replace("_", " ")}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Updates" && (
        <div className="space-y-3">
          {updates.length === 0
            ? <p className="text-sm text-[#9CA3AF] text-center py-8">No updates yet.</p>
            : updates.map((u: any) => (
              <div key={u.id} className="card p-4">
                <div className="flex justify-between mb-1">
                  <p className="font-semibold text-[#111827]">{u.title}</p>
                  <span className="text-xs text-[#9CA3AF]">{fmtDate(u.created_at)}</span>
                </div>
                {u.status_milestone && <span className="badge bg-blue-50 text-blue-700 mb-2">{u.status_milestone}</span>}
                <p className="text-sm text-[#374151] leading-relaxed">{u.message}</p>
              </div>
            ))}
        </div>
      )}

      {tab === "Feedback" && (
        <div className="space-y-3">
          {feedback.length === 0
            ? <p className="text-sm text-[#9CA3AF] text-center py-8">No feedback yet.</p>
            : feedback.map((f: any) => (
              <div key={f.id} className="card p-4">
                <div className="flex items-center gap-1 mb-2">
                  {"★".repeat(f.rating || 0)}<span className="text-[#D1D5DB]">{"★".repeat(5 - (f.rating || 0))}</span>
                </div>
                <p className="text-sm text-[#374151]">{f.comments}</p>
              </div>
            ))}
        </div>
      )}

      {tab === "Item Lists" && (
        <div className="space-y-3">
          {lists.length === 0
            ? <p className="text-sm text-[#9CA3AF] text-center py-8">No requirement lists yet.</p>
            : lists.map((l: any) => (
              <div key={l.id} className="card p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-[#111827]">{l.title}</p>
                  <p className="text-xs text-[#9CA3AF]">{fmtDate(l.created_at)}</p>
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
            <label className="label">End date</label>
            <input type="date" value={editForm.end_date ?? ""}
              onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} className="field" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea value={editForm.description ?? ""}
              onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-[#E5E7EB]">
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
          <div className="flex gap-3 justify-end pt-2 border-t border-[#E5E7EB]">
            <button className="btn btn-outline" onClick={() => setUpdateModal(false)}>Cancel</button>
            <button className="btn btn-green" onClick={saveUpdate} disabled={saving}>{saving ? "Saving…" : "Send Update"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
