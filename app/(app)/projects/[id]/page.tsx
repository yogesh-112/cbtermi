"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Edit2, MapPin, Calendar, UserPlus, X,
  FileText, Upload, MoreHorizontal, CheckSquare, Square,
} from "lucide-react";
import { StatusBadge, Modal, toast, PageSkeleton } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

/* ── Gantt helpers ───────────────────────────────────────────────── */
const GANTT_COLORS = [
  "bg-brand-green", "bg-[#2453E4]", "bg-[#7C3AED]",
  "bg-[#D97706]", "bg-[#0D9488]", "bg-[#DC2626]", "bg-[#8a8fa3]",
];

function GanttBar({ tasks, start, end }: { tasks: string[]; start: string; end: string }) {
  if (!start || !end || tasks.length === 0) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const total = e - s;
  const segLen = total / tasks.length;
  const now = Date.now();
  const nowPct = Math.max(0, Math.min(100, ((now - s) / total) * 100));

  const cols: string[] = [];
  for (let d = new Date(s); d <= new Date(e); d.setDate(d.getDate() + 4)) {
    cols.push(`${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`);
  }
  const displayCols = cols.slice(0, 7);

  return (
    <div className="overflow-x-auto">
      {/* Column headers */}
      <div className="flex mb-2 ml-[140px]">
        {displayCols.map((c, i) => (
          <div key={i} className="flex-1 text-[10px] text-[#8a8fa3] text-center truncate">{c}</div>
        ))}
      </div>
      {/* Today line + rows */}
      <div className="relative">
        {/* Today marker */}
        {nowPct > 0 && nowPct < 100 && (
          <div className="absolute top-0 bottom-0 w-px bg-brand-navy/30 z-10"
            style={{ left: `calc(140px + ${nowPct}% * (100% - 140px) / 100)` }} />
        )}
        <div className="space-y-1.5">
          {tasks.map((task, i) => {
            const barStart = (i * segLen) / total;
            const barEnd = ((i + 1) * segLen) / total;
            const isActive = now >= s + i * segLen && now < s + (i + 1) * segLen;
            const isDone = now >= s + (i + 1) * segLen;
            const color = isDone ? "bg-brand-green" : isActive ? "bg-[#2453E4]" : "bg-[#d8d6cf]";
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="w-[132px] text-[12px] text-[#4a5168] truncate flex-shrink-0">{task}</span>
                <div className="flex-1 h-6 bg-[#f0efea] rounded relative overflow-hidden">
                  <div
                    className={`absolute top-0 h-full ${color} rounded transition-all`}
                    style={{ left: `${barStart * 100}%`, width: `${(barEnd - barStart) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Progress bar ────────────────────────────────────────────────── */
function ProgressBar({ start, end }: { start: string; end: string }) {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  const total = Math.ceil((e - s) / 86400000);
  const elapsed = Math.max(0, Math.min(Math.ceil((now - s) / 86400000), total));
  const pct = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  const overdue = now > e;
  const daysLeft = Math.ceil((e - now) / 86400000);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-[28px] font-bold text-[#0c1226]">Day {elapsed} of {total}</p>
        <span className="text-[12px] text-[#8a8fa3]">
          {overdue ? "Overdue" : `${pct}% complete · ${daysLeft} days ${daysLeft >= 0 ? "ahead" : "behind"}`}
        </span>
      </div>
      <div className="h-2 bg-[#f0efea] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${overdue ? "bg-red-400" : pct >= 80 ? "bg-amber-400" : "bg-brand-green"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("Overview");
  const [editModal, setEditModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [updateForm, setUpdateForm] = useState({ title: "", message: "", status_milestone: "" });
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignedTeam, setAssignedTeam] = useState<Array<{ id: string; userId: string; name: string }>>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; label: string; done: boolean }>>([]);
  const [newTask, setNewTask] = useState("");
  const [docs, setDocs] = useState<Array<{ name: string; size: string }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    fetch(`/api/projects/${id}`).then(r => r.json()).then(d => {
      setData(d);
      setEditForm(d.project ?? {});
      setTasks((d.tasks ?? []).map((t: any) => ({ id: t.id, label: t.label, done: t.done })));
      setAssignedTeam((d.members ?? []).map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        name: m.users?.full_name ?? m.users?.email ?? "Member",
      })));
    });

  useEffect(() => {
    load();
    fetch("/api/team").then(r => r.json()).then(d => {
      setTeamMembers((d.members ?? []).map((m: any) => ({
        id: m.user_id,
        name: m.users?.full_name ?? m.users?.email ?? "Member",
        role: m.role,
      })));
    });
  }, [id]);

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

  const addTask = async () => {
    if (!newTask.trim()) return;
    const label = newTask.trim();
    setNewTask("");
    const res = await fetch(`/api/projects/${id}/tasks`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label }),
    });
    if (res.ok) {
      const d = await res.json();
      setTasks(t => [...t, { id: d.task.id, label: d.task.label, done: d.task.done }]);
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setTasks(t => t.map(x => x.id === taskId ? { ...x, done: !x.done } : x));
    await fetch(`/api/projects/${id}/tasks/${taskId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !task.done }),
    });
  };

  const deleteTask = async (taskId: string) => {
    setTasks(t => t.filter(x => x.id !== taskId));
    await fetch(`/api/projects/${id}/tasks/${taskId}`, { method: "DELETE" });
  };

  const clearDoneTasks = async () => {
    const doneTasks = tasks.filter(t => t.done);
    setTasks(t => t.filter(x => !x.done));
    await Promise.all(doneTasks.map(t => fetch(`/api/projects/${id}/tasks/${t.id}`, { method: "DELETE" })));
  };

  const assignMember = async (m: any) => {
    if (assignedTeam.find(t => t.userId === m.id)) { setAssignOpen(false); return; }
    setAssignOpen(false);
    const res = await fetch(`/api/projects/${id}/team`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: m.id }),
    });
    if (res.ok) {
      const d = await res.json();
      setAssignedTeam(p => [...p, { id: d.member.id, userId: m.id, name: m.name }]);
    }
  };

  const removeMember = async (memberId: string) => {
    setAssignedTeam(t => t.filter(x => x.id !== memberId));
    await fetch(`/api/projects/${id}/team/${memberId}`, { method: "DELETE" });
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setDocs(d => [...d, ...files.map(f => ({ name: f.name, size: `${(f.size / 1024).toFixed(0)} KB` }))]);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (!data) return <PageSkeleton />;
  const { project, quotes, invoices, payments, updates, feedback, stats } = data;
  const initials = project.contacts?.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const ganttTasks = quotes
    .flatMap((q: any) => q.quote_items ?? [])
    .map((i: any) => i.item_name)
    .filter(Boolean)
    .slice(0, 8);

  const TABS = ["Overview", "Tasks", "Updates", "Files", "Financials"];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4 flex-wrap">
        <Link href="/projects" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4a5168] hover:bg-[#f6f6f3] mt-0.5">
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title truncate">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-[12px] text-[#8a8fa3] flex-wrap">
            {project.address && (
              <span className="flex items-center gap-1"><MapPin size={11} />{project.address}</span>
            )}
            {project.start_date && project.end_date && (
              <span className="flex items-center gap-1">
                <Calendar size={11} />{fmtDate(project.start_date)} – {fmtDate(project.end_date)}
              </span>
            )}
            {project.contacts?.full_name && (
              <Link href={`/contacts/${project.contact_id}`}
                className="flex items-center gap-1.5 hover:text-brand-navy transition-colors">
                <div className="w-4 h-4 bg-brand-navy rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">{initials}</span>
                </div>
                {project.contacts.full_name}
              </Link>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setUpdateModal(true)} className="btn btn-outline btn-sm gap-1.5">
            <Plus size={13} /> Add update
          </button>
          <button onClick={() => setEditModal(true)} className="btn btn-primary btn-sm gap-1.5">
            <Edit2 size={13} /> Edit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar mb-5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab-btn ${tab === t ? "active" : ""}`}>{t}</button>
        ))}
      </div>

      {/* Two-column layout: main + right sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-5">

        {/* Main content */}
        <div className="space-y-5 min-w-0">

          {/* ── OVERVIEW TAB ── */}
          {tab === "Overview" && (
            <>
              {/* Schedule card */}
              {project.start_date && project.end_date && (
                <div className="card p-5">
                  <p className="text-[10px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-3">Schedule</p>
                  <ProgressBar start={project.start_date} end={project.end_date} />
                </div>
              )}

              {/* Financial stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="mini-stat mini-stat-navy">
                  <span className="mini-stat-label">Invoiced</span>
                  <span className="mini-stat-value text-[17px]">{fmt(stats?.totalInvoiced ?? 0)}</span>
                  <span className="text-[11px] text-[#8a8fa3] mt-0.5">of {fmt(project.budget ?? 0)}</span>
                </div>
                <div className="mini-stat mini-stat-blue">
                  <span className="mini-stat-label">Approved</span>
                  <span className="mini-stat-value text-[17px]">{fmt(stats?.totalQuoted ?? 0)}</span>
                  <span className="text-[11px] text-[#8a8fa3] mt-0.5">{quotes.length} invoices</span>
                </div>
                <div className="mini-stat mini-stat-green">
                  <span className="mini-stat-label">Paid</span>
                  <span className="mini-stat-value text-[17px]">
                    {fmt(payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0))}
                  </span>
                  <span className="text-[11px] text-brand-green mt-0.5">collected</span>
                </div>
                <div className="mini-stat mini-stat-amber">
                  <span className="mini-stat-label">Outstanding</span>
                  <span className="mini-stat-value text-[17px]">{fmt(stats?.totalDue ?? 0)}</span>
                  <span className="text-[11px] text-[#8a8fa3] mt-0.5">balance due</span>
                </div>
              </div>

              {/* Gantt timeline */}
              {project.start_date && project.end_date && ganttTasks.length > 0 && (
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="section-title mb-0">Project timeline</p>
                    <button className="text-[12px] text-brand-navy font-medium hover:underline">Full schedule</button>
                  </div>
                  <GanttBar tasks={ganttTasks} start={project.start_date} end={project.end_date} />
                </div>
              )}

              {/* Latest updates */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="section-title mb-0">Latest updates</p>
                  <button onClick={() => setUpdateModal(true)}
                    className="text-[12px] text-brand-navy font-medium hover:underline flex items-center gap-1">
                    <Plus size={11} /> Add update
                  </button>
                </div>
                {updates.length === 0 ? (
                  <p className="text-[13px] text-[#8a8fa3] text-center py-4">No updates yet.</p>
                ) : (
                  <div className="space-y-3">
                    {updates.slice(0, 3).map((u: any) => (
                      <div key={u.id} className="flex gap-3">
                        <div className="w-7 h-7 bg-brand-navy/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-brand-navy text-[10px] font-bold">✦</span>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#0c1226]">{u.title}</p>
                          <p className="text-[11px] text-[#8a8fa3]">{fmtDate(u.created_at)}</p>
                          {u.message && <p className="text-[12px] text-[#4a5168] mt-1">{u.message}</p>}
                        </div>
                      </div>
                    ))}
                    {updates.length > 3 && (
                      <button onClick={() => setTab("Updates")} className="text-[12px] text-brand-navy hover:underline">
                        View all {updates.length} updates →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── TASKS TAB ── */}
          {tab === "Tasks" && (
            <div className="card p-5">
              <h3 className="section-title mb-4">Tasks</h3>
              <div className="space-y-2 mb-4">
                {tasks.length === 0 && (
                  <p className="text-[13px] text-[#8a8fa3] text-center py-6">No tasks yet. Add one below.</p>
                )}
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 py-2 border-b border-[#f6f6f3] group">
                    <button onClick={() => toggleTask(t.id)} className="text-[#8a8fa3] hover:text-brand-green transition-colors flex-shrink-0">
                      {t.done ? <CheckSquare size={16} className="text-brand-green" /> : <Square size={16} />}
                    </button>
                    <span className={`flex-1 text-[13px] ${t.done ? "line-through text-[#8a8fa3]" : "text-[#0c1226]"}`}>{t.label}</span>
                    <button onClick={() => deleteTask(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#d8d6cf] hover:text-red-500 transition-all">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newTask} onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTask()}
                  placeholder="Add a task…" className="field flex-1 text-[13px]" />
                <button onClick={addTask} className="btn btn-primary btn-sm gap-1">
                  <Plus size={13} /> Add
                </button>
              </div>
              {tasks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#f0efea] flex justify-between text-[12px] text-[#8a8fa3]">
                  <span>{tasks.filter(t => t.done).length} of {tasks.length} completed</span>
                  <button onClick={clearDoneTasks}
                    className="text-red-500 hover:underline">Clear done</button>
                </div>
              )}
            </div>
          )}

          {/* ── UPDATES TAB ── */}
          {tab === "Updates" && (
            <div>
              <div className="flex justify-end mb-3">
                <button onClick={() => setUpdateModal(true)} className="btn btn-primary btn-sm gap-1.5">
                  <Plus size={13} /> Add update
                </button>
              </div>
              <div className="space-y-3">
                {updates.length === 0 ? (
                  <p className="text-[13px] text-[#8a8fa3] text-center py-8">No updates yet.</p>
                ) : updates.map((u: any) => (
                  <div key={u.id} className="card p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-[13px] text-[#0c1226]">{u.title}</p>
                      <span className="text-[11px] text-[#8a8fa3]">{fmtDate(u.created_at)}</span>
                    </div>
                    {u.status_milestone && (
                      <span className="inline-block bg-blue-50 text-blue-700 text-[11px] font-medium px-2 py-0.5 rounded-full mb-2">
                        {u.status_milestone}
                      </span>
                    )}
                    <p className="text-[13px] text-[#4a5168] leading-relaxed">{u.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FILES TAB ── */}
          {tab === "Files" && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title mb-0">Files</h3>
                <button onClick={() => fileRef.current?.click()} className="btn btn-outline btn-sm gap-1.5">
                  <Upload size={13} /> Upload
                </button>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileAdd} />
              </div>
              {docs.length === 0 ? (
                <div className="border-2 border-dashed border-[#e7e6e1] rounded-xl p-10 flex flex-col items-center text-center">
                  <Upload size={28} className="text-[#8a8fa3] mb-3 opacity-50" />
                  <p className="text-[13px] font-medium text-[#4a5168]">Drop files here or click Upload</p>
                  <p className="text-[11px] text-[#8a8fa3] mt-1">PDFs, images, spreadsheets</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {docs.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 px-3 bg-[#f6f6f3] rounded-lg">
                      <FileText size={16} className="text-[#4a5168] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#0c1226] truncate">{d.name}</p>
                        <p className="text-[11px] text-[#8a8fa3]">{d.size}</p>
                      </div>
                      <button onClick={() => setDocs(docs.filter((_, j) => j !== i))}
                        className="text-[#8a8fa3] hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── FINANCIALS TAB ── */}
          {tab === "Financials" && (
            <div className="space-y-5">
              <div className="card p-5">
                <h3 className="section-title mb-3">Quotes</h3>
                {quotes.length === 0 ? (
                  <p className="text-[13px] text-[#8a8fa3] text-center py-4">No quotes.</p>
                ) : (
                  <div className="table-wrapper -mx-5 -mb-5">
                    <table className="table-base">
                      <thead><tr><th>Number</th><th>Title</th><th>Total</th><th>Status</th></tr></thead>
                      <tbody>
                        {quotes.map((q: any) => (
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
              </div>

              <div className="card p-5">
                <h3 className="section-title mb-3">Invoices</h3>
                {invoices.length === 0 ? (
                  <p className="text-[13px] text-[#8a8fa3] text-center py-4">No invoices.</p>
                ) : (
                  <div className="table-wrapper -mx-5 -mb-5">
                    <table className="table-base">
                      <thead><tr><th>Number</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th></tr></thead>
                      <tbody>
                        {invoices.map((inv: any) => (
                          <tr key={inv.id}>
                            <td><Link href={`/invoices/${inv.id}`} className="text-brand-navy hover:underline font-medium">{inv.invoice_number}</Link></td>
                            <td className="font-semibold">{fmt(inv.total)}</td>
                            <td className="text-brand-green font-semibold">{fmt(inv.amount_paid)}</td>
                            <td className={inv.amount_due > 0 ? "text-red-600 font-semibold" : "text-brand-green"}>{fmt(inv.amount_due)}</td>
                            <td><StatusBadge status={inv.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="card p-5">
                <h3 className="section-title mb-3">Payments</h3>
                {payments.length === 0 ? (
                  <p className="text-[13px] text-[#8a8fa3] text-center py-4">No payments.</p>
                ) : (
                  <div className="table-wrapper -mx-5 -mb-5">
                    <table className="table-base">
                      <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead>
                      <tbody>
                        {payments.map((p: any) => (
                          <tr key={p.id}>
                            <td className="text-[#8a8fa3] text-xs">{fmtDate(p.payment_date)}</td>
                            <td className="font-semibold text-brand-green">{fmt(p.amount)}</td>
                            <td className="capitalize text-[#4a5168]">{p.payment_method?.replace("_", " ") || "—"}</td>
                            <td className="text-[#8a8fa3] text-xs">{p.reference_number || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR (always visible) ── */}
        <div className="space-y-4">

          {/* Team panel */}
          <div className="card p-4">
            <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-3">Team</p>
            <div className="space-y-2.5 mb-3">
              {assignedTeam.length === 0 && (
                <p className="text-[12px] text-[#8a8fa3]">No team assigned yet.</p>
              )}
              {assignedTeam.map((m, i) => {
                const ini = m.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                const roleLabel = i === 0 ? "Project lead" : "Team member";
                const avatarColor = ["bg-brand-navy", "bg-brand-green", "bg-[#7C3AED]", "bg-[#D97706]"][i % 4];
                return (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 ${avatarColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-[9px] font-bold">{ini}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#0c1226] truncate">{m.name}</p>
                      <p className="text-[10px] text-[#8a8fa3] capitalize">{roleLabel}</p>
                    </div>
                    <button onClick={() => removeMember(m.id)}
                      className="text-[#d8d6cf] hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="relative">
              <button onClick={() => setAssignOpen(!assignOpen)}
                className="flex items-center gap-1.5 text-[12px] text-brand-green font-medium hover:text-brand-green/70 transition-colors">
                <UserPlus size={13} /> Assign team member
              </button>
              {assignOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAssignOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 bg-white border border-[#e7e6e1] rounded-xl shadow-dropdown z-20 w-52 overflow-hidden">
                    {teamMembers.length === 0 ? (
                      <div className="px-3 py-2 text-[12px] text-[#8a8fa3]">No team members</div>
                    ) : teamMembers.map(m => (
                      <button key={m.id} onClick={() => assignMember(m)}
                        className={`w-full text-left px-3 py-2.5 text-[13px] hover:bg-[#f6f6f3] transition-colors ${assignedTeam.find(t => t.userId === m.id) ? "opacity-40 pointer-events-none" : ""}`}>
                        {m.name}
                        <span className="text-[10px] text-[#8a8fa3] ml-2 capitalize">{m.role}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Documents panel */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider">Documents</p>
              <button onClick={() => fileRef.current?.click()}
                className="text-[11px] text-brand-navy font-medium hover:underline">Upload</button>
            </div>
            {docs.length === 0 ? (
              <div>
                <p className="text-[12px] text-[#8a8fa3] mb-2">No files uploaded yet.</p>
                <button onClick={() => fileRef.current?.click()}
                  className="btn btn-outline btn-sm w-full gap-1.5 text-[12px]">
                  <Upload size={12} /> Choose files
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {docs.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <FileText size={13} className="text-[#4a5168] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#0c1226] truncate">{d.name}</p>
                      <p className="text-[10px] text-[#8a8fa3]">{d.size}</p>
                    </div>
                    <button onClick={() => setDocs(docs.filter((_, j) => j !== i))}
                      className="opacity-0 group-hover:opacity-100 text-[#8a8fa3] hover:text-red-500 transition-all">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="card p-4">
            <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-3">Quick actions</p>
            <div className="space-y-1.5">
              <Link href={`/quotes/new`}
                className="flex items-center justify-between py-1.5 text-[12px] text-[#4a5168] hover:text-brand-navy transition-colors">
                <span>New quote</span>
                <span className="text-[#d8d6cf]">›</span>
              </Link>
              <Link href={`/invoices/new`}
                className="flex items-center justify-between py-1.5 text-[12px] text-[#4a5168] hover:text-brand-navy transition-colors">
                <span>New invoice</span>
                <span className="text-[#d8d6cf]">›</span>
              </Link>
              {project.contacts?.phone && (
                <a href={`tel:${project.contacts.phone}`}
                  className="flex items-center justify-between py-1.5 text-[12px] text-[#4a5168] hover:text-brand-navy transition-colors">
                  <span>Call customer</span>
                  <span className="text-[#d8d6cf]">›</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

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
              placeholder="e.g. Day 10 · Electrical rough-in passed inspection" className="field" />
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
