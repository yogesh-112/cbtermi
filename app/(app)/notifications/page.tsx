"use client";
import { useEffect, useState } from "react";
import { Plus, Send, Trash2, Bell } from "lucide-react";
import { Modal, toast } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export default function NotificationsPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [tab, setTab] = useState<"templates" | "send">("templates");

  // Template modal
  const [tModal, setTModal] = useState(false);
  const [tForm, setTForm] = useState({ name: "", channel: "email", subject: "", message: "" });
  const [tSaving, setTSaving] = useState(false);

  // Send modal
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tForm),
    });
    setTSaving(false);
    if (res.ok) {
      toast("Template saved");
      setTModal(false);
      setTForm({ name: "", channel: "email", subject: "", message: "" });
      load();
    } else {
      const d = await res.json();
      toast(d.message || "Failed", "error");
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await fetch("/api/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    toast("Template deleted");
    load();
  };

  const loadTemplate = (id: string) => {
    const t = templates.find(t => t.id === id);
    if (t) setSForm(f => ({ ...f, template_id: id, subject: t.subject ?? "", message: t.message ?? "", channel: t.channel ?? "email" }));
  };

  const send = async () => {
    if (!sForm.contact_id || !sForm.message) { toast("Contact and message required", "error"); return; }
    setSSaving(true);
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      const d = await res.json();
      toast(d.message || "Failed", "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        <div className="flex gap-2">
          <button className="btn-outline btn" onClick={() => setTModal(true)}><Plus size={16} /> New Template</button>
          <button className="btn-green btn" onClick={() => setSModal(true)}><Send size={16} /> Send Notification</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>
      ) : templates.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <Bell size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium mb-1">No notification templates yet</p>
          <p className="text-sm">Create reusable templates to quickly send messages to contacts.</p>
          <p className="text-xs mt-2">Available variables: <code className="bg-slate-100 px-1 rounded">{"{{contact_name}}"}</code> <code className="bg-slate-100 px-1 rounded">{"{{business_name}}"}</code></p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500">Available variables: <code className="bg-white border border-slate-200 px-1 rounded">{"{{contact_name}}"}</code> <code className="bg-white border border-slate-200 px-1 rounded">{"{{business_name}}"}</code></p>
          </div>
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Channel</th>
                <th>Subject</th>
                <th>Preview</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t: any) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.name}</td>
                  <td><span className="badge bg-blue-100 text-blue-700 capitalize">{t.channel}</span></td>
                  <td className="text-slate-500">{t.subject || "—"}</td>
                  <td className="max-w-xs"><p className="truncate text-slate-600 text-sm">{t.message}</p></td>
                  <td className="text-slate-400 text-xs">{fmtDate(t.created_at)}</td>
                  <td className="flex gap-1">
                    <button
                      onClick={() => { loadTemplate(t.id); setSModal(true); }}
                      className="btn-ghost btn btn-sm text-brand-navy"
                    >
                      <Send size={13} /> Use
                    </button>
                    <button onClick={() => deleteTemplate(t.id)} className="btn-ghost btn btn-sm text-red-500"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Template Modal */}
      <Modal open={tModal} onClose={() => setTModal(false)} title="New Notification Template" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Template name *</label>
              <input value={tForm.name} onChange={e => setTForm({ ...tForm, name: e.target.value })} className="field" placeholder="e.g. Appointment Reminder" />
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
              <input value={tForm.subject} onChange={e => setTForm({ ...tForm, subject: e.target.value })} className="field" placeholder="Email subject line" />
            </div>
          )}
          <div>
            <label className="label">Message *</label>
            <textarea
              value={tForm.message}
              onChange={e => setTForm({ ...tForm, message: e.target.value })}
              className="field min-h-[120px] resize-y"
              placeholder={"Hi {{contact_name}}, this is a message from {{business_name}}…"}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-ghost btn" onClick={() => setTModal(false)}>Cancel</button>
            <button className="btn-green btn" onClick={saveTemplate} disabled={tSaving}>{tSaving ? "Saving…" : "Save Template"}</button>
          </div>
        </div>
      </Modal>

      {/* Send Modal */}
      <Modal open={sModal} onClose={() => setSModal(false)} title="Send Notification" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Load template (optional)</label>
            <select value={sForm.template_id} onChange={e => { setSForm(f => ({ ...f, template_id: e.target.value })); loadTemplate(e.target.value); }} className="field">
              <option value="">— Start from scratch —</option>
              {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact *</label>
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
            <label className="label">Message *</label>
            <textarea
              value={sForm.message}
              onChange={e => setSForm({ ...sForm, message: e.target.value })}
              className="field min-h-[100px] resize-y"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-ghost btn" onClick={() => setSModal(false)}>Cancel</button>
            <button className="btn-green btn" onClick={send} disabled={sSaving}>{sSaving ? "Sending…" : "Send"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
