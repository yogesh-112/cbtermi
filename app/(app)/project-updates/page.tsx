"use client";
import { useEffect, useState } from "react";
import { Plus, MessageSquare } from "lucide-react";
import { Modal, toast } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export default function ProjectUpdatesPage() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [form, setForm] = useState({ project_id: "", update_type: "progress", message: "", is_client_visible: true });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/project-updates").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
    ]).then(([ur, pr]) => {
      setUpdates(ur.updates ?? []);
      setProjects(pr.projects ?? []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.project_id || !form.message) { toast("Project and message required", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/project-updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast("Update posted");
      setModal(false);
      setForm({ project_id: "", update_type: "progress", message: "", is_client_visible: true });
      load();
    } else {
      const d = await res.json();
      toast(d.message || "Failed", "error");
    }
  };

  const typeColor: Record<string, string> = {
    progress: "bg-blue-100 text-blue-700",
    milestone: "bg-green-100 text-green-700",
    issue: "bg-red-100 text-red-700",
    note: "bg-slate-100 text-slate-600",
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Project Updates</h1>
        <button className="btn-green btn" onClick={() => setModal(true)}><Plus size={16} /> Post Update</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>
      ) : updates.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium mb-1">No project updates yet</p>
          <p className="text-sm">Post updates to track progress and communicate with clients.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((u: any) => (
            <div key={u.id} className="card px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`badge capitalize ${typeColor[u.update_type] ?? "bg-slate-100 text-slate-600"}`}>{u.update_type}</span>
                    {u.projects?.name && <span className="text-sm font-medium text-slate-700">{u.projects.name}</span>}
                    {u.is_client_visible && <span className="badge bg-brand-green/10 text-brand-green text-xs">Client visible</span>}
                  </div>
                  <p className="text-slate-800 mt-1">{u.message}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{fmtDate(u.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Post Project Update" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Project *</label>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="field">
              <option value="">Select project…</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Update type</label>
            <select value={form.update_type} onChange={e => setForm({ ...form, update_type: e.target.value })} className="field">
              <option value="progress">Progress</option>
              <option value="milestone">Milestone</option>
              <option value="issue">Issue</option>
              <option value="note">Note</option>
            </select>
          </div>
          <div>
            <label className="label">Message *</label>
            <textarea
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              className="field min-h-[100px] resize-y"
              placeholder="Describe the update…"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="client_visible"
              checked={form.is_client_visible}
              onChange={e => setForm({ ...form, is_client_visible: e.target.checked })}
              className="rounded border-slate-300"
            />
            <label htmlFor="client_visible" className="text-sm text-slate-700 cursor-pointer">Visible to client</label>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button className="btn-ghost btn" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-green btn" onClick={save} disabled={saving}>{saving ? "Posting…" : "Post Update"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
