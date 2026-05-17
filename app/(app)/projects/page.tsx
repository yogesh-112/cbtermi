"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Briefcase, Eye, MapPin, Calendar, DollarSign } from "lucide-react";
import { StatusBadge, Modal, EmptyState, toast, ActionMenu } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

const EMPTY = { name: "", contact_id: "", project_type: "", address: "", start_date: "", end_date: "", status: "active", description: "", budget: "" };
const STATUS_FILTERS = [
  { key: "",           label: "All" },
  { key: "active",     label: "Active" },
  { key: "scheduled",  label: "Scheduled" },
  { key: "on_hold",    label: "On hold" },
  { key: "completed",  label: "Completed" },
];

const CARD_GRADIENTS = [
  "from-[#1a2f5a] to-[#2453E4]",
  "from-[#0f4c2a] to-[#2f8a4a]",
  "from-[#4c1d95] to-[#7C3AED]",
  "from-[#92400e] to-[#D97706]",
  "from-[#0e4f6b] to-[#0D9488]",
  "from-[#6b1a30] to-[#DC2626]",
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [all, setAll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/projects").then(r => r.json()),
    ]).then(([d]) => {
      setAll(d.projects ?? []);
      setProjects(filter ? (d.projects ?? []).filter((p: any) => p.status === filter) : (d.projects ?? []));
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch("/api/contacts").then(r => r.json()).then(d => setContacts(d.contacts ?? []));
  }, []);

  useEffect(() => {
    setProjects(filter ? all.filter(p => p.status === filter) : all);
  }, [filter, all]);

  const set = (k: keyof typeof EMPTY) =>
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

  const counts = {
    active:    all.filter(p => p.status === "active").length,
    scheduled: all.filter(p => p.status === "scheduled").length,
    on_hold:   all.filter(p => p.status === "on_hold").length,
    completed: all.filter(p => p.status === "completed").length,
  };

  const getDayCount = (start: string, end: string) => {
    if (!start || !end) return null;
    const s = new Date(start), e = new Date(end), now = new Date();
    const total = Math.ceil((e.getTime() - s.getTime()) / 86400000);
    const elapsed = Math.ceil((now.getTime() - s.getTime()) / 86400000);
    return { total, elapsed: Math.max(0, Math.min(elapsed, total)) };
  };

  return (
    <div>
      <div className="mb-1">
        <h1 className="page-title">Projects</h1>
        <p className="page-desc">{counts.active} in progress · {counts.scheduled} scheduled this month</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">Active</span>
          <span className="mini-stat-value">{counts.active}</span>
          <span className="text-[11px] text-brand-green mt-0.5">{counts.active} on schedule today</span>
        </div>
        <div className="mini-stat mini-stat-blue">
          <span className="mini-stat-label">Scheduled</span>
          <span className="mini-stat-value">{counts.scheduled}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">next 30 days</span>
        </div>
        <div className="mini-stat mini-stat-navy">
          <span className="mini-stat-label">Completed</span>
          <span className="mini-stat-value">{counts.completed}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">+6% vs 2025</span>
        </div>
        <div className="mini-stat mini-stat-amber">
          <span className="mini-stat-label">Avg completion</span>
          <span className="mini-stat-value">—</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">across last 10 jobs</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="tabs-bar mb-5">
        {STATUS_FILTERS.map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`tab-btn ${filter === s.key ? "active" : ""} flex items-center gap-1.5`}>
            {s.label}
            {s.key && counts[s.key as keyof typeof counts] > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0efea] text-[#8a8fa3]">
                {counts[s.key as keyof typeof counts]}
              </span>
            )}
          </button>
        ))}
        <button className="ml-auto btn btn-outline btn-sm flex-shrink-0">Filters</button>
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
                <p className="font-semibold text-[#0c1226] truncate">{p.name}</p>
                <p className="text-xs text-[#8a8fa3]">{p.project_number}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#8a8fa3]">
              {p.contacts?.full_name && <span>{p.contacts.full_name}</span>}
              {p.budget && <span className="font-medium text-[#4a5168]">{fmt(p.budget)}</span>}
              {p.start_date && <span>{fmtDate(p.start_date)}</span>}
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop card grid */}
      <div className="hidden lg:block">
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="card h-52 animate-pulse skeleton" />)}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState icon={<Briefcase size={40} />} title="No projects yet" description="Create your first project."
            action={<button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={14} /> New Project</button>} />
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((p, idx) => {
              const grad = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
              const days = getDayCount(p.start_date, p.end_date);
              const pct = days ? Math.round((days.elapsed / days.total) * 100) : 0;
              const initials = p.contacts?.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
              return (
                <Link key={p.id} href={`/projects/${p.id}`}
                  className="card hover:shadow-card-md transition-all duration-200 block overflow-hidden group">
                  {/* Colored header */}
                  <div className={`bg-gradient-to-br ${grad} h-[80px] relative px-4 py-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-white/60 text-[11px]">
                        <span>{p.project_number}</span>
                        {p.project_type && <span>· {p.project_type}</span>}
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    {p.contacts?.full_name && (
                      <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">{initials}</span>
                        </div>
                        <span className="text-white/80 text-[11px] truncate max-w-[120px]">{p.contacts.full_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <p className="font-semibold text-[14px] text-[#0c1226] leading-snug mb-2 group-hover:text-brand-navy transition-colors">{p.name}</p>

                    {/* Date range */}
                    {(p.start_date || p.end_date) && (
                      <p className="text-[12px] text-[#8a8fa3] mb-3">
                        {fmtDate(p.start_date)}{p.end_date ? ` – ${fmtDate(p.end_date)}` : ""}
                      </p>
                    )}

                    {/* Progress bar */}
                    {days && (
                      <div className="mb-3">
                        <div className="flex justify-between text-[11px] text-[#8a8fa3] mb-1">
                          <span>Day {days.elapsed} of {days.total}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-[#f0efea] rounded-full overflow-hidden">
                          <div className="h-full bg-brand-green rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Budget row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-[#8a8fa3] uppercase tracking-wide">Budget</p>
                        <p className="text-[13px] font-semibold text-[#0c1226]">{p.budget ? fmt(p.budget) : "—"}</p>
                      </div>
                      {p.address && (
                        <div className="flex items-center gap-1 text-[11px] text-[#8a8fa3] max-w-[120px] truncate">
                          <MapPin size={10} className="flex-shrink-0" />
                          <span className="truncate">{p.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
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
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-[#e7e6e1]">
          <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-green" onClick={save} disabled={saving}>{saving ? "Saving…" : "Create Project"}</button>
        </div>
      </Modal>
    </div>
  );
}
