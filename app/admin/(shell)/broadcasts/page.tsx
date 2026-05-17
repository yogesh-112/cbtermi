"use client";
import { useEffect, useState } from "react";
import { AdminBtn, AdminInput, AdminLabel } from "@/components/admin/ui";
import { Send, Users, CheckCircle } from "lucide-react";

const TARGETS = [
  { value: "all", label: "All Verified Users", description: "Every user with a verified email address" },
  { value: "active", label: "Active Subscribers", description: "Users in businesses with an active subscription" },
  { value: "trial", label: "Trial Users", description: "Users in businesses currently on a trial" },
];

export default function AdminBroadcastsPage() {
  const [audiences, setAudiences] = useState<Record<string, number>>({});
  const [target, setTarget] = useState("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<{ recipientCount: number; preview: string[] } | null>(null);
  const [sent, setSent] = useState<{ sent: number; total: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/broadcasts")
      .then(r => r.json())
      .then(d => setAudiences(d.audiences ?? {}));
  }, []);

  const audienceCount = {
    all: audiences.all_verified ?? 0,
    active: audiences.active_subscribers ?? 0,
    trial: audiences.trial_users ?? 0,
  }[target] ?? 0;

  async function handlePreview() {
    if (!subject.trim() || !body.trim()) return alert("Subject and body are required");
    setPreviewing(true);
    const res = await fetch("/api/admin/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, target, preview_only: true }),
    });
    const d = await res.json();
    if (res.ok) setPreview(d);
    else alert(d.message ?? "Failed");
    setPreviewing(false);
  }

  async function handleSend() {
    if (!preview) return;
    if (!confirm(`Send to ${preview.recipientCount} recipients? This cannot be undone.`)) return;
    setSending(true);
    const res = await fetch("/api/admin/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, target, preview_only: false }),
    });
    const d = await res.json();
    if (res.ok) {
      setSent(d);
      setPreview(null);
      setSubject("");
      setBody("");
    } else {
      alert(d.message ?? "Send failed");
    }
    setSending(false);
  }

  return (
    <div className="space-y-5 max-w-[720px]">
      <div>
        <h1 className="text-[22px] font-bold text-[#0d1117]">Broadcasts</h1>
        <p className="text-[13px] text-[#6b7280] mt-0.5">Send email announcements to user segments</p>
      </div>

      {sent && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-[10px] px-4 py-3 flex items-center gap-3">
          <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-[13px] font-medium">
            Broadcast sent to {sent.sent} of {sent.total} recipients
          </p>
          <button onClick={() => setSent(null)} className="ml-auto text-emerald-500 hover:text-emerald-700 text-[12px]">Dismiss</button>
        </div>
      )}

      {/* Audience selector */}
      <div className="bg-white border border-[#e8e9ed] rounded-[12px] p-5 shadow-sm">
        <p className="text-[14px] font-semibold text-[#0d1117] mb-3">Audience</p>
        <div className="space-y-2">
          {TARGETS.map(t => (
            <label key={t.value}
              className={`flex items-start gap-3 p-3 rounded-[10px] border cursor-pointer transition-colors
                ${target === t.value ? "border-[#b33a4b] bg-[#fdf2f3]" : "border-[#e8e9ed] hover:bg-[#fafbfc]"}`}
            >
              <input
                type="radio"
                name="target"
                value={t.value}
                checked={target === t.value}
                onChange={() => { setTarget(t.value); setPreview(null); }}
                className="mt-0.5 accent-[#b33a4b]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-semibold ${target === t.value ? "text-[#b33a4b]" : "text-[#0d1117]"}`}>
                    {t.label}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-[#6b7280] bg-[#f0f1f5] px-2 py-0.5 rounded-full font-medium">
                    <Users size={10} />
                    {target === t.value ? audienceCount : (
                      t.value === "all" ? audiences.all_verified :
                      t.value === "active" ? audiences.active_subscribers :
                      audiences.trial_users
                    ) ?? 0} users
                  </span>
                </div>
                <p className="text-[12px] text-[#9399a8] mt-0.5">{t.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Compose */}
      <div className="bg-white border border-[#e8e9ed] rounded-[12px] p-5 shadow-sm space-y-4">
        <p className="text-[14px] font-semibold text-[#0d1117]">Compose</p>
        <div>
          <AdminLabel>Subject line</AdminLabel>
          <AdminInput
            value={subject}
            onChange={e => { setSubject(e.target.value); setPreview(null); }}
            placeholder="Important update from Clear Build USA"
          />
        </div>
        <div>
          <AdminLabel>Message body</AdminLabel>
          <textarea
            value={body}
            onChange={e => { setBody(e.target.value); setPreview(null); }}
            rows={8}
            placeholder="Write your message here… Plain text will be formatted into a branded email."
            className="w-full bg-white border border-[#e2e4e9] text-[#1a2030] placeholder-[#c0c3cc] rounded-[8px] px-3 py-2.5 text-[13px] outline-none focus:border-[#b33a4b] resize-y"
          />
        </div>

        {/* Preview result */}
        {preview && (
          <div className="bg-[#f8f9fb] border border-[#e8e9ed] rounded-[10px] p-4">
            <p className="text-[13px] font-semibold text-[#0d1117] mb-2">
              Preview — {preview.recipientCount} recipients
            </p>
            <p className="text-[12px] text-[#6b7280] mb-1">Sample emails:</p>
            <ul className="space-y-0.5">
              {preview.preview.map((email: string, i: number) => (
                <li key={i} className="text-[12px] text-[#374151] font-mono">{email}</li>
              ))}
            </ul>
            {preview.recipientCount > 5 && (
              <p className="text-[11px] text-[#9399a8] mt-1.5">… and {preview.recipientCount - 5} more</p>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <AdminBtn onClick={handlePreview} disabled={previewing || !subject.trim() || !body.trim()} variant="ghost">
            {previewing ? "Checking…" : "Preview Recipients"}
          </AdminBtn>
          <AdminBtn
            onClick={handleSend}
            disabled={sending || !preview}
            variant="red"
          >
            <Send size={13} />
            {sending ? "Sending…" : `Send to ${preview ? preview.recipientCount : audienceCount} users`}
          </AdminBtn>
        </div>
      </div>
    </div>
  );
}
