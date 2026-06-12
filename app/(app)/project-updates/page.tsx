"use client";
import { useEffect, useState } from "react";
import { Plus, MessageSquare } from "lucide-react";
import { Modal, toast, EmptyState } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const TYPE_COLORS: Record<string, string> = {
  progress:  "bg-blue-50 text-blue-700",
  milestone: "bg-brand-green-light text-brand-green",
  issue:     "bg-red-50 text-red-700",
  note:      "bg-[#f0efea] text-[#4a5168]",
};

export default function ProjectUpdatesPage() {
  const t = useT();
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
    if (!form.project_id || !form.message) { toast(t.common.required, "error"); return; }
    setSaving(true);
    const res = await fetch("/api/project-updates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast(t.projectUpdates.posted); setModal(false);
      setForm({ project_id: "", update_type: "progress", message: "", is_client_visible: true });
      load();
    } else {
      const d = await res.json(); toast(d.message || "Failed", "error");
    }
  };

  const TYPE_LABELS: Record<string, string> = {
    progress:  t.projectUpdates.progress,
    milestone: t.projectUpdates.milestone,
    issue:     t.projectUpdates.issue,
    note:      t.projectUpdates.note,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.projectUpdates.title}</h1>
          <p className="page-desc">{updates.length} {t.projectUpdates.title.toLowerCase()}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15} /> {t.projectUpdates.postUpdate}</button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-20 animate-pulse skeleton" />)}
        </div>
      ) : updates.length === 0 ? (
        <EmptyState icon={<MessageSquare size={36} />} title={t.projectUpdates.noUpdates}
          description={t.projectUpdates.noUpdatesDesc}
          action={<button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={14} /> {t.projectUpdates.postUpdate}</button>} />
      ) : (
        <div className="space-y-3">
          {updates.map((u: any) => (
            <div key={u.id} className="card px-5 py-4 hover:shadow-card-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`badge capitalize ${TYPE_COLORS[u.update_type] ?? "bg-[#f0efea] text-[#4a5168]"}`}>
                      {TYPE_LABELS[u.update_type] ?? u.update_type}
                    </span>
                    {u.projects?.name && (
                      <span className="text-sm font-medium text-[#4a5168]">{u.projects.name}</span>
                    )}
                    {u.is_client_visible && (
                      <span className="badge bg-brand-green-light text-brand-green text-xs">{t.projectUpdates.clientVisibleBadge}</span>
                    )}
                  </div>
                  <p className="text-[#4a5168] leading-relaxed">{u.message}</p>
                </div>
                <span className="text-xs text-[#8a8fa3] whitespace-nowrap flex-shrink-0">{fmtDate(u.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={t.projectUpdates.postTitle} size="md">
        <div className="space-y-4">
          <div>
            <label className="label">{t.projectUpdates.projectLabel}</label>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="field">
              <option value="">{t.projectUpdates.selectProject}</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.projectUpdates.updateType}</label>
            <select value={form.update_type} onChange={e => setForm({ ...form, update_type: e.target.value })} className="field">
              <option value="progress">{t.projectUpdates.progress}</option>
              <option value="milestone">{t.projectUpdates.milestone}</option>
              <option value="issue">{t.projectUpdates.issue}</option>
              <option value="note">{t.projectUpdates.note}</option>
            </select>
          </div>
          <div>
            <label className="label">{t.projectUpdates.messageLabel}</label>
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              className="field min-h-[100px] resize-y" placeholder={t.projectUpdates.messagePlaceholder} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="client_visible" checked={form.is_client_visible}
              onChange={e => setForm({ ...form, is_client_visible: e.target.checked })}
              className="rounded border-[#d8d6cf]" />
            <label htmlFor="client_visible" className="text-sm text-[#4a5168] cursor-pointer">{t.projectUpdates.clientVisible}</label>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-[#e7e6e1]">
            <button className="btn btn-outline" onClick={() => setModal(false)}>{t.projectUpdates.cancelBtn}</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? t.projectUpdates.posting : t.projectUpdates.postBtn}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
