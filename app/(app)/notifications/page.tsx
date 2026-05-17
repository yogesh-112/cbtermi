"use client";
import { useEffect, useState } from "react";
import { Plus, Send, Trash2, Bell, Mail, MessageCircle, Phone } from "lucide-react";
import { Modal, EmptyState, toast, ConfirmDialog } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

const CHANNEL_ICONS: Record<string, any> = {
  email: Mail, sms: Phone, whatsapp: MessageCircle,
};
const CHANNEL_COLORS: Record<string, string> = {
  email: "bg-blue-50 text-blue-700",
  sms: "bg-amber-50 text-amber-700",
  whatsapp: "bg-green-50 text-green-700",
};

export default function NotificationsPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [tModal, setTModal] = useState(false);
  const [tForm, setTForm] = useState({ name: "", channel: "email", subject: "", message: "" });
  const [tSaving, setTSaving] = useState(false);

  const [sModal, setSModal] = useState(false);
  const [sForm, setSForm] = useState({ template_id: "", contact_id: "", subject: "", message: "", channel: "email" });
  const [sSaving, setSSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/notifications").then(r => r.json()),
      fetch("/api/contacts").then(r => r.json()),
    ]).then(([nr, cr]) => {
      setTemplates(nr.templates ?? []);
      setContacts(cr.contacts ?? []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const saveTemplate = async () => {
    if (!tForm.name || !tForm.message) { toast("Name and message required", "error"); return; }
    setTSaving(true);
    const res = await fetch("/api/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tForm),
    });
    setTSaving(false);
    if (res.ok) {
      toast("Template saved"); setTModal(false);
      setTForm({ name: "", channel: "email", subject: "", message: "" }); load();
    } else {
      const d = await res.json(); toast(d.message || "Failed", "error");
    }
  };

  const deleteTemplate = async () => {
    if (!deleteId) return;
    await fetch("/api/notifications", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteId }),
    });
    toast("Template deleted"); setDeleteId(null); load();
  };

  const loadTemplate = (id: string) => {
    const t = templates.find(t => t.id === id);
    if (t) setSForm(f => ({ ...f, template_id: id, subject: t.subject ?? "", message: t.message ?? "", channel: t.channel ?? "email" }));
  };

  const send = async () => {
    if (!sForm.contact_id || !sForm.message) { toast("Contact and message required", "error"); return; }
    setSSaving(true);
    const res = await fetch("/api/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", ...sForm }),
    });
    setSSaving(false);
    if (res.ok) {
      const d = await res.json();
      if (d.link) {
        window.open(d.link, "_blank");
        toast(`${d.channel === "whatsapp" ? "WhatsApp" : "SMS"} draft opened — complete sending in the app`);
      } else {
        toast("Notification sent");
      }
      setSModal(false);
      setSForm({ template_id: "", contact_id: "", subject: "", message: "", channel: "email" });
    } else {
      const d = await res.json(); toast(d.message || "Failed", "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-desc">Reusable message templates</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => setTModal(true)}><Plus size={15} /> New Template</button>
          <button className="btn btn-green" onClick={() => setSModal(true)}><Send size={15} /> Send</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-20 animate-pulse skeleton" />)}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState icon={<Bell size={36} />} title="No templates yet"
          description="Create reusable notification templates for emails, SMS, and WhatsApp."
          action={<button className="btn btn-green btn-sm" onClick={() => setTModal(true)}><Plus size={14} /> New Template</button>} />
      ) : (
        <div className="space-y-3">
          <div className="card p-3 px-4">
            <p className="text-xs text-[#4a5168]">
              Available variables:{" "}
              <code className="bg-[#f0efea] px-1.5 py-0.5 rounded text-[#4a5168] text-[11px]">{"{{contact_name}}"}</code>{" "}
              <code className="bg-[#f0efea] px-1.5 py-0.5 rounded text-[#4a5168] text-[11px]">{"{{business_name}}"}</code>
            </p>
          </div>
          {templates.map((t: any) => {
            const ChanIcon = CHANNEL_ICONS[t.channel] ?? Bell;
            return (
              <div key={t.id} className="card p-4 hover:shadow-card-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${CHANNEL_COLORS[t.channel] ?? "bg-[#f0efea] text-[#4a5168]"}`}>
                    <ChanIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#0c1226]">{t.name}</p>
                      <span className={`badge capitalize ${CHANNEL_COLORS[t.channel] ?? "bg-[#f0efea] text-[#4a5168]"}`}>{t.channel}</span>
                      {t.subject && <span className="text-xs text-[#8a8fa3]">Subject: {t.subject}</span>}
                    </div>
                    <p className="text-sm text-[#4a5168] mt-1 line-clamp-2">{t.message}</p>
                    <p className="text-xs text-[#8a8fa3] mt-1">{fmtDate(t.created_at)}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { loadTemplate(t.id); setSModal(true); }}
                      className="btn btn-outline btn-sm gap-1.5">
                      <Send size={12} /> Use
                    </button>
                    <button onClick={() => setDeleteId(t.id)} className="btn btn-ghost btn-sm text-red-500 p-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Template Modal */}
      <Modal open={tModal} onClose={() => setTModal(false)} title="New Notification Template" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Template name <span className="text-red-500">*</span></label>
              <input value={tForm.name} onChange={e => setTForm({ ...tForm, name: e.target.value })}
                className="field" placeholder="e.g. Appointment Reminder" />
            </div>
            <div>
              <label className="label">Channel</label>
              <select value={tForm.channel} onChange={e => setTForm({ ...tForm, channel: e.target.value })} className="field">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>
          {tForm.channel === "email" && (
            <div>
              <label className="label">Subject</label>
              <input value={tForm.subject} onChange={e => setTForm({ ...tForm, subject: e.target.value })}
                className="field" placeholder="Email subject line" />
            </div>
          )}
          <div>
            <label className="label">Message <span className="text-red-500">*</span></label>
            <textarea value={tForm.message} onChange={e => setTForm({ ...tForm, message: e.target.value })}
              className="field min-h-[120px] resize-y"
              placeholder={"Hi {{contact_name}}, this is a message from {{business_name}}…"} />
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-[#e7e6e1]">
            <button className="btn btn-outline" onClick={() => setTModal(false)}>Cancel</button>
            <button className="btn btn-green" onClick={saveTemplate} disabled={tSaving}>{tSaving ? "Saving…" : "Save Template"}</button>
          </div>
        </div>
      </Modal>

      {/* Send Modal */}
      <Modal open={sModal} onClose={() => setSModal(false)} title="Send Notification" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Load template (optional)</label>
            <select value={sForm.template_id}
              onChange={e => { setSForm(f => ({ ...f, template_id: e.target.value })); loadTemplate(e.target.value); }}
              className="field">
              <option value="">— Start from scratch —</option>
              {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact <span className="text-red-500">*</span></label>
              <select value={sForm.contact_id} onChange={e => setSForm({ ...sForm, contact_id: e.target.value })} className="field">
                <option value="">Select contact…</option>
                {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Channel</label>
              <select value={sForm.channel} onChange={e => setSForm({ ...sForm, channel: e.target.value })} className="field">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>
          {sForm.channel === "email" && (
            <div>
              <label className="label">Subject</label>
              <input value={sForm.subject} onChange={e => setSForm({ ...sForm, subject: e.target.value })} className="field" />
            </div>
          )}
          <div>
            <label className="label">Message <span className="text-red-500">*</span></label>
            <textarea value={sForm.message} onChange={e => setSForm({ ...sForm, message: e.target.value })}
              className="field min-h-[100px] resize-y" />
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-[#e7e6e1]">
            <button className="btn btn-outline" onClick={() => setSModal(false)}>Cancel</button>
            <button className="btn btn-green" onClick={send} disabled={sSaving}>{sSaving ? "Sending…" : "Send"}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={deleteTemplate}
        title="Delete Template" message="Delete this notification template? This cannot be undone." danger />
    </div>
  );
}
