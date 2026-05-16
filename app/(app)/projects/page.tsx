"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Briefcase, Eye } from "lucide-react";
import { StatusBadge, Modal, EmptyState, toast, ActionMenu } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

const EMPTY = { name: "", contact_id: "", project_type: "", address: "", start_date: "", end_date: "", status: "active", description: "", budget: "" };
const STATUS_FILTERS = ["", "active", "on_hold", "completed", "cancelled"];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const load = () => {
    setLoading(true);
    const q = filter ? `?status=${filter}` : "";
    fetch(`/api/projects${q}`).then(r => r.json()).then(d => setProjects(d.projects ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);
  useEffect(() => { fetch("/api/contacts").then(r => r.json()).then(d => setContacts(d.contacts ?? [])); }, []);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    if (!form.name.trim()) { toast("Project name required", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/projects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, budget: form.budget ? parseFloat(form.budget) : null }),
    });
    setSaving(false);
    if (res.ok) { toast("Project created"); setModal(false); setForm(EMPTY); load(); }
    else toast("Failed to create project", "error");
  };

  const STATUS_LABELS: Record<string, string> = { "": "All", active: "Active", on_hold: "On Hold", completed: "Completed", cancelled: "Cancelled" };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-desc">{projects.length} projects</p>
        </div>
        <button className="btn btn-green" onClick={() => setModal(true)}><Plus size={15} /> New Project</button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-outline"}`}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="mobile-card animate-pulse h-24 skeleton" />)
        ) : projects.length === 0 ? (
          <EmptyState icon={<Briefcase size={36} />} title="No projects yet" description="Create your first project."
            action={<button className="btn btn-green btn-sm" onClick={() => setModal(true)}><Plus size={14} /> New Project</button>} />
        ) : projects.map(p => (
          <Link key={p.id} href={`/projects/${p.id}`} className="mobile-card block hover:shadow-card-md transition-shadow">
            <div className="mobile-card-row">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#111827] truncate">{p.name}</p>
                <p className="text-xs text-[#9CA3AF]">{p.project_number}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#9CA3AF]">
              {p.contacts?.full_name && <span>{p.contacts.full_name}</span>}
              {p.budget && <span className="font-medium text-[#374151]">{fmt(p.budget)}</span>}
              {p.start_date && <span>{fmtDate(p.start_date)}</span>}
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>Project</th>
              <th>Contact</th>
              <th>Budget</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-[#9CA3AF]">Loading…</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={6}>
                <EmptyState icon={<Briefcase size={40} />} title="No projects yet" description="Create your first project."
                  action={<button className="btn btn-green btn-sm" onClick={() => setModal(true)}><Plus size={14} /> New Project</button>} />
              </td></tr>
            ) : projects.map(p => (
              <tr key={p.id}>
                <td>
                  <Link href={`/projects/${p.id}`} className="font-medium text-brand-navy hover:underline">{p.name}</Link>
                  <p className="text-xs text-[#9CA3AF]">{p.project_number}</p>
                </td>
                <td className="text-[#6B7280]">{p.contacts?.full_name || "—"}</td>
                <td>{p.budget ? fmt(p.budget) : "—"}</td>
                <td><StatusBadge status={p.status} /></td>
                <td className="text-[#9CA3AF] text-xs">{fmtDate(p.start_date)}</td>
                <td>
                  <ActionMenu items={[
                    { label: "View", icon: <Eye size={14} />, onClick: () => window.location.href = `/projects/${p.id}` },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Project" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Project name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={set("name")} placeholder="Kitchen Remodel" className="field" />
          </div>
          <div>
            <label className="label">Contact</label>
            <select value={form.contact_id} onChange={set("contact_id")} className="field">
              <option value="">No contact</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Project type</label>
            <input value={form.project_type} onChange={set("project_type")} placeholder="Remodel, Repair, etc." className="field" />
          </div>
          <div>
            <label className="label">Budget</label>
            <input type="number" step="0.01" value={form.budget} onChange={set("budget")} placeholder="0.00" className="field" />
          </div>
          <div>
            <label className="label">Start date</label>
            <input type="date" value={form.start_date} onChange={set("start_date")} className="field" />
          </div>
          <div>
            <label className="label">Estimated end date</label>
            <input type="date" value={form.end_date} onChange={set("end_date")} className="field" />
          </div>
          <div>
            <label className="label">Status</label>
            <select value={form.status} onChange={set("status")} className="field">
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="label">Address</label>
            <input value={form.address} onChange={set("address")} placeholder="123 Main St" className="field" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea value={form.description} onChange={set("description")} rows={2} className="field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-[#E5E7EB]">
          <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-green" onClick={save} disabled={saving}>{saving ? "Saving…" : "Create Project"}</button>
        </div>
      </Modal>
    </div>
  );
}
