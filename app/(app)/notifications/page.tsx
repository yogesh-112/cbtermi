"use client";
import { useEffect, useState } from "react";
import {
  Plus, Send, Trash2, Bell, Mail, MessageCircle, Phone,
  DollarSign, FileText, CheckCircle, AlertCircle, Star, Package, Settings,
} from "lucide-react";
import { Modal, ConfirmDialog, toast } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

const CHANNEL_COLORS: Record<string, string> = {
  email:        "bg-blue-50 text-blue-700",
  sms:          "bg-amber-50 text-amber-700",
  whatsapp:     "bg-green-50 text-green-700",
};

const TYPE_ICON: Record<string, any> = {
  payment:     DollarSign,
  quote:       FileText,
  invoice:     FileText,
  notification:Bell,
  message:     MessageCircle,
  feedback:    Star,
  item:        Package,
};

const TYPE_COLOR: Record<string, string> = {
  payment:     "bg-brand-green/10 text-brand-green",
  quote:       "bg-blue-50 text-blue-600",
  invoice:     "bg-amber-50 text-amber-600",
  notification:"bg-violet-50 text-violet-600",
  message:     "bg-[#f0efea] text-[#4a5168]",
  feedback:    "bg-yellow-50 text-yellow-600",
  item:        "bg-[#f0efea] text-[#4a5168]",
};

type TabKey = "all" | "unread" | "system";

export default function NotificationsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const [tModal, setTModal] = useState(false);
  const [tForm, setTForm] = useState({ name: "", channel: "email", subject: "", message: "" });
  const [tSaving, setTSaving] = useState(false);

  const [sModal, setSModal] = useState(false);
  const [sForm, setSForm] = useState({ template_id: "", contact_id: "", subject: "", message: "", channel: "email" });
  const [sSaving, setSSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/communications").then(r => r.json()),
      fetch("/api/notifications").then(r => r.json()),
      fetch("/api/contacts").then(r => r.json()),
    ]).then(([comm, notif, cont]) => {
      setLogs(comm.logs ?? []);
      setTemplates(notif.templates ?? []);
      setContacts(cont.contacts ?? []);
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
    if (res.ok) { toast("Template saved"); setTModal(false); setTForm({ name: "", channel: "email", subject: "", message: "" }); load(); }
    else { const d = await res.json(); toast(d.message || "Failed", "error"); }
  };

  const deleteTemplate = async () => {
    if (!deleteId) return;
    await fetch("/api/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteId }) });
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
        toast(`${d.channel === "whatsapp" ? "WhatsApp" : "SMS"} draft opened`);
      } else {
        toast("Notification sent");
      }
      setSModal(false); setSForm({ template_id: "", contact_id: "", subject: "", message: "", channel: "email" }); load();
    } else {
      const d = await res.json(); toast(d.message || "Failed", "error");
    }
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "all",    label: "All",    count: logs.length },
    { key: "unread", label: "Unread", count: logs.filter(l => !l.read_at).length },
    { key: "system", label: "Templates", count: templates.length },
  ];

  const displayItems = activeTab === "system" ? templates : logs;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-desc">{logs.length > 0 ? `${logs.filter(l => !l.read_at).length} unread · everything that needs your attention` : "Sent and received messages appear here"}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={() => setTModal(true)}><Plus size={13} /> New Template</button>
          <button className="btn btn-primary btn-sm" onClick={() => setSModal(true)}><Send size={13} /> Send</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[#e7e6e1]">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px
              ${activeTab === t.key ? "border-brand-navy text-brand-navy" : "border-transparent text-[#8a8fa3] hover:text-[#4a5168]"}`}>
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium
                ${activeTab === t.key ? "bg-brand-navy text-white" : "bg-[#f0efea] text-[#8a8fa3]"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
        {logs.length > 0 && (
          <button className="ml-auto flex items-center gap-1.5 text-[12px] text-[#8a8fa3] hover:text-[#4a5168] px-3 py-2 transition-colors">
            <CheckCircle size={12} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-16 animate-pulse skeleton" />)}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={32} className="text-[#d8d6cf] mx-auto mb-3" />
          <p className="font-medium text-[#4a5168]">{activeTab === "system" ? "No templates yet" : "No notifications yet"}</p>
          <p className="text-[13px] text-[#8a8fa3] mt-1">
            {activeTab === "system" ? "Create reusable message templates." : "Sent messages and activity will appear here."}
          </p>
        </div>
      ) : activeTab === "system" ? (
        /* Templates view */
        <div className="space-y-2">
          {templates.map((t: any) => {
            const ChanIcon = t.channel === "email" ? Mail : t.channel === "whatsapp" ? MessageCircle : Phone;
            return (
              <div key={t.id} className="card p-4 hover:shadow-card-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${CHANNEL_COLORS[t.channel] ?? "bg-[#f0efea] text-[#4a5168]"}`}>
                    <ChanIcon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#0c1226] text-[13px]">{t.name}</p>
                      <span className={`badge capitalize ${CHANNEL_COLORS[t.channel] ?? "bg-[#f0efea] text-[#4a5168]"}`}>{t.channel}</span>
                    </div>
                    <p className="text-[12px] text-[#8a8fa3] mt-0.5 line-clamp-1">{t.message}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { loadTemplate(t.id); setSModal(true); }}
                      className="btn btn-outline btn-sm gap-1"><Send size={11} /> Use</button>
                    <button onClick={() => setDeleteId(t.id)} className="btn btn-ghost btn-sm text-red-500 p-1.5"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Notification feed view */
        <div className="space-y-1">
          {logs.map((log: any) => {
            const Icon = TYPE_ICON[log.type] ?? Bell;
            const iconColor = TYPE_COLOR[log.type] ?? "bg-[#f0efea] text-[#4a5168]";
            const unread = !log.read_at;
            return (
              <div key={log.id}
                className={`flex items-start gap-3 p-4 rounded-xl transition-colors cursor-pointer
                  ${unread ? "bg-white border border-[#e7e6e1] shadow-card" : "hover:bg-[#f6f6f3]"}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-[13px] ${unread ? "font-semibold text-[#0c1226]" : "font-medium text-[#0c1226]"}`}>
                        {log.subject || log.type}
                        {unread && <span className="ml-1.5 w-1.5 h-1.5 bg-brand-navy rounded-full inline-block align-middle" />}
                      </p>
                      <p className="text-[12px] text-[#4a5168] mt-0.5 line-clamp-1">{log.message || log.contacts?.full_name}</p>
                      {log.channel && <p className="text-[11px] text-[#8a8fa3] mt-0.5">via {log.channel}</p>}
                    </div>
                    <span className="text-[11px] text-[#8a8fa3] whitespace-nowrap flex-shrink-0">{fmtDate(log.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Template Modal */}
      <Modal open={tModal} onClose={() => setTModal(false)} title="New notification template" size="md">
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
            <button className="btn btn-primary" onClick={saveTemplate} disabled={tSaving}>{tSaving ? "Saving…" : "Save template"}</button>
          </div>
        </div>
      </Modal>

      {/* Send Modal */}
      <Modal open={sModal} onClose={() => setSModal(false)} title="Send notification" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Load template</label>
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
            <button className="btn btn-primary" onClick={send} disabled={sSaving}>{sSaving ? "Sending…" : "Send"}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={deleteTemplate}
        title="Delete template" message="Delete this notification template? This cannot be undone." danger />
    </div>
  );
}
