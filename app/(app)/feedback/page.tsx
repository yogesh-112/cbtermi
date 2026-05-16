"use client";
import { useEffect, useState } from "react";
import { Plus, Star, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { Modal, toast, StatCard, EmptyState } from "@/components/ui";
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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast("Feedback recorded"); setModal(false);
      setForm({ project_id: "", contact_id: "", rating: 5, category: "general", message: "", is_public: false });
      load();
    } else {
      const d = await res.json(); toast(d.message || "Failed", "error");
    }
  };

  const ratingIcon = (r: number) => {
    if (r >= 4) return <ThumbsUp size={14} className="text-brand-green" />;
    if (r <= 2) return <ThumbsDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-amber-500" />;
  };

  const stars = (r: number) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} size={12} className={i < r ? "text-amber-400 fill-amber-400" : "text-[#D1D5DB]"} />
  ));

  const avg = feedback.length ? (feedback.reduce((s, f) => s + (f.rating ?? 0), 0) / feedback.length).toFixed(1) : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Feedback</h1>
          <p className="page-desc">Client satisfaction tracking</p>
        </div>
        <button className="btn btn-green" onClick={() => setModal(true)}><Plus size={15} /> Record Feedback</button>
      </div>

      {feedback.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Average Rating" value={avg ?? "—"} icon={<Star size={16} />} color="yellow" />
          <StatCard label="Total Feedback" value={feedback.length} icon={<ThumbsUp size={16} />} color="navy" />
          <StatCard label="Positive (4–5★)" value={feedback.filter(f => f.rating >= 4).length} icon={<ThumbsUp size={16} />} color="green" />
          <StatCard label="Needs Attention" value={feedback.filter(f => f.rating <= 2).length} icon={<ThumbsDown size={16} />} color="red" />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse skeleton" />)}
        </div>
      ) : feedback.length === 0 ? (
        <EmptyState icon={<Star size={36} />} title="No feedback yet"
          description="Record client feedback to track satisfaction and improve your services."
          action={<button className="btn btn-green btn-sm" onClick={() => setModal(true)}><Plus size={14} /> Record Feedback</button>} />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {feedback.map((f: any) => (
              <div key={f.id} className="mobile-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#111827]">{f.contacts?.full_name ?? "Anonymous"}</p>
                    {f.projects?.name && <p className="text-xs text-[#9CA3AF]">{f.projects.name}</p>}
                  </div>
                  <div className="flex items-center gap-0.5">{stars(f.rating)}</div>
                </div>
                <p className="text-sm text-[#374151] mt-2 leading-relaxed">{f.message}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-[#9CA3AF]">
                  <span className="badge bg-[#F3F4F6] text-[#6B7280] capitalize">{f.category}</span>
                  <span>{fmtDate(f.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block table-wrapper">
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
                    <td className="text-[#6B7280]">{f.projects?.name ?? "—"}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {ratingIcon(f.rating)}
                        <span className="text-sm font-semibold">{f.rating}/5</span>
                      </div>
                    </td>
                    <td><span className="badge bg-[#F3F4F6] text-[#6B7280] capitalize">{f.category}</span></td>
                    <td className="max-w-xs"><p className="truncate text-[#374151] text-sm">{f.message}</p></td>
                    <td className="text-[#9CA3AF] text-xs">{fmtDate(f.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
            <label className="label">Message <span className="text-red-500">*</span></label>
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              className="field min-h-[100px] resize-y" placeholder="What did the client say?" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_public" checked={form.is_public}
              onChange={e => setForm({ ...form, is_public: e.target.checked })}
              className="rounded border-[#D1D5DB]" />
            <label htmlFor="is_public" className="text-sm text-[#374151] cursor-pointer">Mark as public testimonial</label>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-[#E5E7EB]">
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-green" onClick={save} disabled={saving}>{saving ? "Saving…" : "Record Feedback"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
