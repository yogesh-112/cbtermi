"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Star, Send, CheckCircle } from "lucide-react";

const CATEGORIES = [
  { value: "general",       label: "General" },
  { value: "quality",       label: "Work quality" },
  { value: "communication", label: "Communication" },
  { value: "timeliness",    label: "Timeliness" },
  { value: "pricing",       label: "Pricing" },
];

export default function FeedbackRespondPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ rating: 0, category: "general", message: "" });
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/feedback/respond/${token}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setNotFound(true); return; }
        if (d.feedback.status === "received") setDone(true);
        setInfo(d.feedback);
      })
      .catch(() => setNotFound(true));
  }, [token]);

  const submit = async () => {
    if (!form.rating) { setErr("Please choose a star rating"); return; }
    setSaving(true); setErr("");
    const res = await fetch(`/api/feedback/respond/${token}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) setDone(true);
    else { const d = await res.json(); setErr(d.message || "Something went wrong"); }
  };

  if (notFound) return (
    <div className="min-h-screen bg-[#f6f6f3] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <p className="text-[18px] font-semibold text-[#0c1226]">Link not found</p>
        <p className="text-[14px] text-[#8a8fa3] mt-2">This feedback link is invalid or has expired.</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-[#f6f6f3] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <CheckCircle size={48} className="text-brand-green mx-auto mb-4" />
        <p className="text-[20px] font-bold text-[#0c1226]">Thank you!</p>
        <p className="text-[14px] text-[#4a5168] mt-2">Your feedback has been received. We really appreciate it.</p>
      </div>
    </div>
  );

  if (!info) return (
    <div className="min-h-screen bg-[#f6f6f3] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const bizName = info.businesses?.name || "Clear Build USA";

  return (
    <div className="min-h-screen bg-[#f6f6f3] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-md w-full">
        <div className="bg-brand-navy px-8 py-6 text-center">
          <Image src="/logo-white.png" alt={bizName} width={120} height={32} className="mx-auto object-contain mb-2" />
          <p className="text-white/70 text-[14px]">{bizName}</p>
        </div>
        <div className="p-8">
          <h1 className="text-[22px] font-bold text-[#0c1226] text-center">How did we do?</h1>
          <p className="text-[14px] text-[#8a8fa3] text-center mt-1 mb-6">
            Hi {info.contacts?.full_name} — share your honest experience
            {info.projects?.name ? ` for ${info.projects.name}` : ""}.
          </p>

          {/* Star rating */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button"
                onClick={() => setForm(f => ({ ...f, rating: n }))}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="p-1 transition-transform hover:scale-110">
                <Star size={36}
                  className={(hover || form.rating) >= n ? "text-amber-400 fill-amber-400" : "text-[#d8d6cf]"}
                  strokeWidth={1.5} />
              </button>
            ))}
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-[13px] font-medium text-[#4a5168] mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c.value} type="button"
                  onClick={() => setForm(f => ({ ...f, category: c.value }))}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors
                    ${form.category === c.value
                      ? "bg-brand-navy text-white border-brand-navy"
                      : "border-[#e7e6e1] text-[#4a5168] hover:border-brand-navy"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-[13px] font-medium text-[#4a5168] mb-2">Message (optional)</label>
            <textarea value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={4} placeholder="Tell us more about your experience…"
              className="w-full border border-[#e7e6e1] rounded-xl px-4 py-3 text-[14px] text-[#0c1226] resize-none focus:outline-none focus:ring-2 focus:ring-brand-navy/20" />
          </div>

          {err && <p className="text-[13px] text-red-500 mb-3">{err}</p>}

          <button type="button" onClick={submit} disabled={saving || !form.rating}
            className="w-full py-3 bg-brand-navy text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors hover:bg-brand-navy/90 disabled:opacity-50">
            <Send size={15} /> {saving ? "Submitting…" : "Submit Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}
