"use client";
import { useEffect, useState } from "react";
import { Plus, Star, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { Modal, toast } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [form, setForm] = useState({ project_id: "", contact_id: "", rating: 5, category: "general", message: "", is_public: false });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/feedback").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/contacts").then(r => r.json()),
    ]).then(([fr, pr, cr]) => {
      setFeedback(fr.feedback ?? []);
      setProjects(pr.projects ?? []);
      setContacts(cr.contacts ?? []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.message) { toast("Message required", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast("Feedback recorded");
      setModal(false);
      setForm({ project_id: "", contact_id: "", rating: 5, category: "general", message: "", is_public: false });
      load();
    } else {
      const d = await res.json();
      toast(d.message || "Failed", "error");
    }
  };

  const ratingIcon = (r: number) => {
    if (r >= 4) return <ThumbsUp size={14} className="text-green-600" />;
    if (r <= 2) return <ThumbsDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-yellow-500" />;
  };

  const avg = feedback.length ? (feedback.reduce((s, f) => s + (f.rating ?? 0), 0) / feedback.length).toFixed(1) : null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Feedback</h1>
        <button className="btn-green btn" onClick={() => setModal(true)}><Plus size={16} /> Record Feedback</button>
      </div>

      {avg && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <p className="stat-label">Average rating</p>
            <p className="stat-value flex items-center gap-1"><Star size={18} className="text-yellow-400" /> {avg}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Total feedback</p>
            <p className="stat-value">{feedback.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Positive (4–5★)</p>
            <p className="stat-value text-green-600">{feedback.filter(f => f.rating >= 4).length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Needs attention (1–2★)</p>
            <p className="stat-value text-red-500">{feedback.filter(f => f.rating <= 2).length}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>
      ) : feedback.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <Star size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium mb-1">No feedback recorded yet</p>
          <p className="text-sm">Record client feedback to track satisfaction and improve your services.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table-base">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Project</th>
                <th>Rating</th>
                <th>Category</th>
                <th>Message</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((f: any) => (
                <tr key={f.id}>
                  <td className="font-medium">{f.contacts?.full_name ?? "—"}</td>
                  <td className="text-slate-500">{f.projects?.name ?? "—"}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      {ratingIcon(f.rating)}
                      <span className="text-sm font-semibold">{f.rating}/5</span>
                    </div>
                  </td>
                  <td><span className="badge bg-slate-100 text-slate-600 capitalize">{f.category}</span></td>
                  <td className="max-w-xs">
                    <p className="truncate text-slate-700 text-sm">{f.message}</p>
                  </td>
                  <td className="text-slate-400 text-xs">{fmtDate(f.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Record Feedback" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact</label>
              <select value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })} className="field">
                <option value="">— None —</option>
                {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Project</label>
              <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="field">
                <option value="">— None —</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Rating (1–5)</label>
              <select value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} className="field">
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} star{r !== 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="field">
                <option value="general">General</option>
                <option value="quality">Quality</option>
                <option value="communication">Communication</option>
                <option value="timeliness">Timeliness</option>
                <option value="pricing">Pricing</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Message *</label>
            <textarea
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              className="field min-h-[100px] resize-y"
              placeholder="What did the client say?"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={form.is_public}
              onChange={e => setForm({ ...form, is_public: e.target.checked })}
              className="rounded border-slate-300"
            />
            <label htmlFor="is_public" className="text-sm text-slate-700 cursor-pointer">Mark as public testimonial</label>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button className="btn-ghost btn" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-green btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Record Feedback"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
