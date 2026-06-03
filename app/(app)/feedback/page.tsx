"use client";
import { useEffect, useState } from "react";
import { Plus, Star, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { Modal, toast, EmptyState } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export default function FeedbackPage() {
  const t = useT();
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
    if (!form.message) { toast(t.common.required, "error"); return; }
    setSaving(true);
    const res = await fetch("/api/feedback", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast(t.feedback.saved); setModal(false);
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
    <Star key={i} size={12} className={i < r ? "text-amber-400 fill-amber-400" : "text-[#d8d6cf]"} />
  ));

  const avg = feedback.length ? (feedback.reduce((s, f) => s + (f.rating ?? 0), 0) / feedback.length).toFixed(1) : null;

  const CATEGORIES = [
    { value: "general",       label: t.feedback.catGeneral },
    { value: "quality",       label: t.feedback.catQuality },
    { value: "communication", label: t.feedback.catCommunication },
    { value: "timeliness",    label: t.feedback.catTimeliness },
    { value: "pricing",       label: t.feedback.catPricing },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.feedback.title}</h1>
          <p className="page-desc">{t.feedback.subtitle}</p>
        </div>
        <button className="btn btn-green" onClick={() => setModal(true)}><Plus size={15} /> {t.feedback.recordFeedback}</button>
      </div>

      {feedback.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="mini-stat mini-stat-amber">
            <span className="mini-stat-label">{t.feedback.avgRating}</span>
            <span className="mini-stat-value">{avg ?? "—"}</span>
            <span className="mini-stat-sub">{t.feedback.outOf5}</span>
          </div>
          <div className="mini-stat mini-stat-navy">
            <span className="mini-stat-label">{t.feedback.totalFeedback}</span>
            <span className="mini-stat-value">{feedback.length}</span>
          </div>
          <div className="mini-stat mini-stat-green">
            <span className="mini-stat-label">{t.feedback.positive}</span>
            <span className="mini-stat-value">{feedback.filter(f => f.rating >= 4).length}</span>
          </div>
          <div className="mini-stat mini-stat-rose">
            <span className="mini-stat-label">{t.feedback.needsAttention}</span>
            <span className="mini-stat-value">{feedback.filter(f => f.rating <= 2).length}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse skeleton" />)}
        </div>
      ) : feedback.length === 0 ? (
        <EmptyState icon={<Star size={36} />} title={t.feedback.noFeedback}
          description={t.feedback.noFeedbackDesc}
          action={<button className="btn btn-green btn-sm" onClick={() => setModal(true)}><Plus size={14} /> {t.feedback.recordFeedback}</button>} />
      ) : (
        <>
          <div className="lg:hidden space-y-3">
            {feedback.map((f: any) => (
              <div key={f.id} className="mobile-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#0c1226]">{f.contacts?.full_name ?? "Anonymous"}</p>
                    {f.projects?.name && <p className="text-xs text-[#8a8fa3]">{f.projects.name}</p>}
                  </div>
                  <div className="flex items-center gap-0.5">{stars(f.rating)}</div>
                </div>
                <p className="text-sm text-[#4a5168] mt-2 leading-relaxed">{f.message}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-[#8a8fa3]">
                  <span className="badge bg-[#f0efea] text-[#4a5168] capitalize">{f.category}</span>
                  <span>{fmtDate(f.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block table-wrapper">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t.feedback.contactCol}</th>
                  <th>{t.feedback.projectCol}</th>
                  <th>{t.feedback.ratingCol}</th>
                  <th>{t.feedback.categoryCol}</th>
                  <th>{t.feedback.messageCol}</th>
                  <th>{t.feedback.dateCol}</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((f: any) => (
                  <tr key={f.id}>
                    <td className="font-medium">{f.contacts?.full_name ?? "—"}</td>
                    <td className="text-[#4a5168]">{f.projects?.name ?? "—"}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {ratingIcon(f.rating)}
                        <span className="text-sm font-semibold">{f.rating}/5</span>
                      </div>
                    </td>
                    <td><span className="badge bg-[#f0efea] text-[#4a5168] capitalize">{f.category}</span></td>
                    <td className="max-w-xs"><p className="truncate text-[#4a5168] text-sm">{f.message}</p></td>
                    <td className="text-[#8a8fa3] text-xs">{fmtDate(f.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={t.feedback.recordTitle} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.feedback.contactLabel}</label>
              <select value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })} className="field">
                <option value="">— {t.common.none} —</option>
                {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.feedback.projectLabel}</label>
              <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="field">
                <option value="">— {t.common.none} —</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.feedback.ratingLabel}</label>
              <select value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} className="field">
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ★</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.feedback.categoryLabel}</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="field">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t.feedback.messageRequired}</label>
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              className="field min-h-[100px] resize-y" placeholder={t.feedback.messagePlaceholder} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_public" checked={form.is_public}
              onChange={e => setForm({ ...form, is_public: e.target.checked })}
              className="rounded border-[#d8d6cf]" />
            <label htmlFor="is_public" className="text-sm text-[#4a5168] cursor-pointer">{t.feedback.publicTestimonial}</label>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-[#e7e6e1]">
            <button className="btn btn-outline" onClick={() => setModal(false)}>{t.feedback.cancelBtn}</button>
            <button className="btn btn-green" onClick={save} disabled={saving}>
              {saving ? t.feedback.saving : t.feedback.recordBtn}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
