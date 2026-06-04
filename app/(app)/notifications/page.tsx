"use client";
import { useEffect, useRef, useState } from "react";
import {
  Plus, Send, Trash2, Bell, Mail, MessageCircle, Phone,
  DollarSign, FileText, CheckCircle, Star, Package, Pencil,
  Users, ChevronRight, X, Hash,
} from "lucide-react";
import { Modal, ConfirmDialog, EmptyState, toast } from "@/components/ui";
import ContactSelect from "@/components/ui/ContactSelect";
import { fmtDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

/* ── Variables available for insertion ──────────────────────────── */
const VARIABLES: { label: string; value: string; desc: string }[] = [
  { label: "contact_name",   value: "{{contact_name}}",   desc: "Contact's full name" },
  { label: "business_name",  value: "{{business_name}}",  desc: "Your business name" },
  { label: "project_name",   value: "{{project_name}}",   desc: "Project name" },
  { label: "quote_number",   value: "{{quote_number}}",   desc: "Quote reference number" },
  { label: "invoice_number", value: "{{invoice_number}}", desc: "Invoice reference number" },
  { label: "amount_due",     value: "{{amount_due}}",     desc: "Amount currently due" },
  { label: "due_date",       value: "{{due_date}}",        desc: "Payment due date" },
  { label: "booking_link",   value: "{{booking_link}}",   desc: "Booking page URL" },
];

const CHANNELS = [
  { value: "email",    label: "Email",    icon: Mail,          color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "sms",      label: "SMS",      icon: Phone,         color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "bg-green-50 text-green-700 border-green-200" },
];

const TYPE_ICON: Record<string, any> = {
  payment: DollarSign, quote: FileText, invoice: FileText,
  notification: Bell, message: MessageCircle, feedback: Star, item: Package,
};
const TYPE_COLOR: Record<string, string> = {
  payment: "bg-brand-green/10 text-brand-green", quote: "bg-blue-50 text-blue-600",
  invoice: "bg-amber-50 text-amber-600", notification: "bg-violet-50 text-violet-600",
  message: "bg-[#f0efea] text-[#4a5168]", feedback: "bg-yellow-50 text-yellow-600",
};

/* Resolve {{variable}} in message with real values */
function resolveVars(msg: string, contact?: any, biz?: any) {
  return msg
    .replace(/\{\{contact_name\}\}/g, contact?.full_name ?? "[Contact Name]")
    .replace(/\{\{business_name\}\}/g, biz ?? "[Business Name]")
    .replace(/\{\{project_name\}\}/g, "[Project Name]")
    .replace(/\{\{quote_number\}\}/g, "[Quote #]")
    .replace(/\{\{invoice_number\}\}/g, "[Invoice #]")
    .replace(/\{\{amount_due\}\}/g, "[Amount Due]")
    .replace(/\{\{due_date\}\}/g, "[Due Date]")
    .replace(/\{\{booking_link\}\}/g, "[Booking Link]");
}

export default function NotificationsPage() {
  const t = useT();

  /* ── State ─────────────────────────────────────────────────────── */
  const [templates, setTemplates] = useState<any[]>([]);
  const [contacts,  setContacts]  = useState<any[]>([]);
  const [logs,      setLogs]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab, setTab] = useState<"templates" | "history">("templates");

  /* template create / edit */
  const [tModal,  setTModal]  = useState(false);
  const [editTpl, setEditTpl] = useState<any | null>(null);
  const [tForm,   setTForm]   = useState({ name: "", subject: "", message: "" });
  const [tSaving, setTSaving] = useState(false);
  const msgRef = useRef<HTMLTextAreaElement>(null);

  /* send */
  const [sModal,  setSModal]  = useState(false);
  const [sForm,   setSForm]   = useState({ contact_id: "", template_id: "", subject: "", message: "", channel: "email" });
  const [sSaving, setSSaving] = useState(false);

  /* delete */
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* contact search */
  const [contactSearch, setContactSearch] = useState("");

  /* ── Load ──────────────────────────────────────────────────────── */
  const load = async () => {
    setLoading(true);
    try {
      const safe = (r: Response) => r.ok ? r.json() : Promise.resolve({});
      const [notif, comm, cont] = await Promise.all([
        fetch("/api/notifications").then(safe),
        fetch("/api/communications").then(safe),
        fetch("/api/contacts").then(safe),
      ]);
      setTemplates(notif.templates ?? []);
      setLogs(comm.logs ?? []);
      setContacts(cont.contacts ?? []);
    } catch (e) {
      console.error("[notifications] load failed:", e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  /* ── Insert variable at cursor ─────────────────────────────────── */
  const insertVariable = (v: string) => {
    const el = msgRef.current;
    if (!el) {
      setTForm(f => ({ ...f, message: f.message + v }));
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end   = el.selectionEnd   ?? el.value.length;
    const next  = el.value.slice(0, start) + v + el.value.slice(end);
    setTForm(f => ({ ...f, message: next }));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + v.length, start + v.length);
    });
  };

  /* ── Template CRUD ─────────────────────────────────────────────── */
  const openCreate = () => {
    setEditTpl(null);
    setTForm({ name: "", subject: "", message: "" });
    setTModal(true);
  };

  const openEdit = (tpl: any) => {
    setEditTpl(tpl);
    setTForm({ name: tpl.name, subject: tpl.subject ?? "", message: tpl.message ?? "" });
    setTModal(true);
  };

  const saveTemplate = async () => {
    if (!tForm.name.trim() || !tForm.message.trim()) { toast("Name and message are required", "error"); return; }
    setTSaving(true);
    const url = editTpl ? `/api/notifications/${editTpl.id}` : "/api/notifications";
    const method = editTpl ? "PATCH" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tForm }),
    });
    setTSaving(false);
    if (res.ok) {
      toast(editTpl ? "Template updated" : "Template created", "success");
      setTModal(false);
      load();
    } else {
      const d = await res.json(); toast(d.message || "Failed to save", "error");
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

  /* ── Send ──────────────────────────────────────────────────────── */
  const openSend = (prefillContact?: string, prefillTemplate?: any) => {
    setSForm({
      contact_id: prefillContact ?? "",
      template_id: prefillTemplate?.id ?? "",
      subject: prefillTemplate?.subject ?? "",
      message: prefillTemplate?.message ?? "",
      channel: "email",
    });
    setSModal(true);
  };

  const loadTemplateIntoSend = (id: string) => {
    const tpl = templates.find(t => t.id === id);
    if (tpl) setSForm(f => ({ ...f, template_id: id, subject: tpl.subject ?? "", message: tpl.message ?? "" }));
    else setSForm(f => ({ ...f, template_id: id }));
  };

  const send = async () => {
    if (!sForm.contact_id) { toast("Please select a contact", "error"); return; }
    if (!sForm.message.trim()) { toast("Message is required", "error"); return; }
    setSSaving(true);
    const res = await fetch("/api/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", ...sForm }),
    });
    const d = await res.json().catch(() => ({}));
    setSSaving(false);
    if (res.ok) {
      if (d.link) {
        window.open(d.link, "_blank");
        toast(`${d.channel === "whatsapp" ? "WhatsApp" : "SMS"} draft opened in new tab`);
      } else {
        toast("Notification sent", "success");
      }
      setSModal(false); load();
    } else {
      toast(d.message || "Failed to send", "error");
    }
  };

  /* ── Derived ───────────────────────────────────────────────────── */
  const selectedContact = contacts.find(c => c.id === sForm.contact_id);
  const filteredContacts = contacts.filter(c =>
    !contactSearch || c.full_name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(contactSearch.toLowerCase())
  );
  const previewMsg = sForm.message
    ? resolveVars(sForm.message, selectedContact)
    : "";

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.notifications.title}</h1>
          <p className="page-desc">Manage reusable templates and send messages to contacts.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-1.5" onClick={openCreate}>
            <Plus size={13} /> New Template
          </button>
          <button className="btn btn-primary btn-sm gap-1.5" onClick={() => openSend()}>
            <Send size={13} /> Send Notification
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-5 border-b border-[#e7e6e1]">
        {[
          { key: "templates", label: "Templates", count: templates.length },
          { key: "history",   label: "Send History", count: logs.length },
        ].map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors
              ${tab === tb.key ? "border-brand-navy text-brand-navy" : "border-transparent text-[#8a8fa3] hover:text-[#4a5168]"}`}>
            {tb.label}
            {tb.count > 0 && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium
                ${tab === tb.key ? "bg-brand-navy text-white" : "bg-[#f0efea] text-[#8a8fa3]"}`}>
                {tb.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse skeleton" />)}</div>
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="card h-14 animate-pulse skeleton" />)}</div>
        </div>
      ) : tab === "templates" ? (
        /* ── Templates tab: two-panel layout ── */
        <div className="grid lg:grid-cols-3 gap-5 items-start">

          {/* Left — Templates list (2/3) */}
          <div className="lg:col-span-2 space-y-3">
            {templates.length === 0 ? (
              <EmptyState icon={Bell} title="No templates yet"
                description="Create reusable message templates that work across Email, SMS, and WhatsApp."
                action={<button className="btn btn-primary btn-sm gap-1" onClick={openCreate}><Plus size={13} /> New Template</button>} />
            ) : templates.map(tpl => (
              <div key={tpl.id} className="card p-4 hover:shadow-card-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Bell size={15} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[13px] text-[#0c1226]">{tpl.name}</p>
                      {/* Show applicable channels — all channels since template is agnostic */}
                      <div className="flex items-center gap-1">
                        {["email","sms","whatsapp"].map(ch => {
                          const C = ch === "email" ? Mail : ch === "whatsapp" ? MessageCircle : Phone;
                          return <C key={ch} size={11} className="text-[#8a8fa3]" />;
                        })}
                        <span className="text-[10px] text-[#8a8fa3] font-medium uppercase tracking-wider ml-0.5">All channels</span>
                      </div>
                    </div>
                    {tpl.subject && <p className="text-[12px] text-[#4a5168] mt-0.5 font-medium">Subject: {tpl.subject}</p>}
                    <p className="text-[12px] text-[#8a8fa3] mt-0.5 line-clamp-2">{tpl.message}</p>
                    {/* Variables used */}
                    {(tpl.message || "").includes("{{") && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {VARIABLES.filter(v => (tpl.message || "").includes(v.value)).map(v => (
                          <span key={v.value} className="text-[10px] font-mono bg-[#f0efea] text-[#4a5168] px-1.5 py-0.5 rounded">
                            {v.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openSend(undefined, tpl)} title="Send with this template"
                      className="btn btn-primary btn-sm gap-1"><Send size={11} /> Use</button>
                    <button onClick={() => openEdit(tpl)} title="Edit" className="btn btn-ghost btn-sm p-1.5"><Pencil size={13} /></button>
                    <button onClick={() => setDeleteId(tpl.id)} title="Delete" className="btn btn-ghost btn-sm text-red-500 p-1.5"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right — Contacts quick-send (1/3) */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e7e6e1] flex items-center gap-2">
              <Users size={14} className="text-[#4a5168]" />
              <span className="font-semibold text-[13px] text-[#0c1226]">Quick Send to Contact</span>
            </div>
            <div className="px-3 py-2 border-b border-[#e7e6e1]">
              <input value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                placeholder="Search contacts…" className="field text-[13px] py-1.5" />
            </div>
            <div className="max-h-[420px] overflow-y-auto divide-y divide-[#f0efea]">
              {filteredContacts.length === 0 ? (
                <p className="text-[13px] text-[#8a8fa3] text-center py-6">No contacts found</p>
              ) : filteredContacts.slice(0, 30).map(c => (
                <button key={c.id} type="button"
                  onClick={() => openSend(c.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f6f6f3] transition-colors group">
                  <div className="w-7 h-7 rounded-full bg-brand-navy/10 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-brand-navy">
                    {c.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#0c1226] truncate">{c.full_name}</p>
                    <p className="text-[11px] text-[#8a8fa3] truncate">{c.email || c.phone || "—"}</p>
                  </div>
                  <Send size={12} className="text-[#d8d6cf] group-hover:text-brand-navy transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

      ) : (
        /* ── History tab ── */
        <div className="space-y-1">
          {logs.length === 0 ? (
            <EmptyState icon={Bell} title="No messages sent yet"
              description="Your sent notifications and messages will appear here." />
          ) : logs.map((log: any) => {
            const Icon = TYPE_ICON[log.type] ?? Bell;
            const iconColor = TYPE_COLOR[log.type] ?? "bg-[#f0efea] text-[#4a5168]";
            const ChanIcon = log.channel === "email" ? Mail : log.channel === "whatsapp" ? MessageCircle : Phone;
            return (
              <div key={log.id} className="flex items-start gap-3 p-4 rounded-xl hover:bg-[#f6f6f3] transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-[#0c1226]">
                        {log.subject || log.contacts?.full_name || log.type}
                      </p>
                      <p className="text-[12px] text-[#4a5168] mt-0.5 line-clamp-1">{log.message}</p>
                      {log.channel && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#8a8fa3] mt-0.5">
                          <ChanIcon size={10} /> via {log.channel}
                          {log.contacts?.full_name && ` · ${log.contacts.full_name}`}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8a8fa3] whitespace-nowrap flex-shrink-0">{fmtDate(log.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── New / Edit Template Modal ────────────────────────────── */}
      <Modal open={tModal} onClose={() => setTModal(false)}
        title={editTpl ? "Edit Template" : "New Notification Template"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Template name <span className="text-red-500">*</span></label>
              <input value={tForm.name} onChange={e => setTForm(f => ({ ...f, name: e.target.value }))}
                className="field" placeholder="e.g. Payment reminder, Quote follow-up" autoFocus />
            </div>
            <div>
              <label className="label">Subject <span className="text-[#8a8fa3] font-normal">(optional — used for email)</span></label>
              <input value={tForm.subject} onChange={e => setTForm(f => ({ ...f, subject: e.target.value }))}
                className="field" placeholder="Your invoice is ready" />
            </div>
          </div>

          {/* Message + Variables side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="label">Message body <span className="text-red-500">*</span></label>
              <textarea
                ref={msgRef}
                value={tForm.message}
                onChange={e => setTForm(f => ({ ...f, message: e.target.value }))}
                className="field min-h-[200px] resize-y font-mono text-[13px]"
                placeholder="Hi {{contact_name}},&#10;&#10;Your invoice is ready. Please review and pay at your earliest convenience.&#10;&#10;Thanks,&#10;{{business_name}}" />
              <p className="text-[11px] text-[#8a8fa3] mt-1">
                This template works for Email, SMS, and WhatsApp — no channel restriction.
              </p>
            </div>

            {/* Variables panel */}
            <div>
              <label className="label flex items-center gap-1.5"><Hash size={12} /> Variables</label>
              <div className="bg-[#f6f6f3] border border-[#e7e6e1] rounded-xl p-3 space-y-1.5">
                <p className="text-[11px] text-[#8a8fa3] mb-2">Click to insert at cursor</p>
                {VARIABLES.map(v => (
                  <button key={v.value} type="button"
                    onClick={() => insertVariable(v.value)}
                    className="w-full flex items-start gap-2 text-left px-2.5 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group"
                    title={v.desc}>
                    <span className="font-mono text-[11px] text-brand-navy bg-brand-navy/8 px-1.5 py-0.5 rounded flex-shrink-0 group-hover:bg-brand-navy group-hover:text-white transition-colors">
                      {`{{${v.label}}}`}
                    </span>
                    <span className="text-[11px] text-[#8a8fa3] mt-0.5 leading-tight">{v.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#e7e6e1]">
            <button className="btn btn-outline" onClick={() => setTModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveTemplate} disabled={tSaving}>
              {tSaving ? "Saving…" : editTpl ? "Save Changes" : "Create Template"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Send Notification Modal ──────────────────────────────── */}
      <Modal open={sModal} onClose={() => setSModal(false)} title="Send Notification" size="md">
        <div className="space-y-4">

          {/* Step 1: Contact */}
          <div>
            <label className="label">1. Select contact <span className="text-red-500">*</span></label>
            <ContactSelect
              contacts={contacts}
              value={sForm.contact_id}
              onChange={id => setSForm(f => ({ ...f, contact_id: id }))}
              onContactCreated={c => { setContacts(cs => [c, ...cs]); setSForm(f => ({ ...f, contact_id: c.id })); }}
              placeholder="Choose who to notify"
            />
            {selectedContact && (
              <div className="flex items-center gap-2 mt-1.5 text-[12px] text-[#4a5168] bg-[#f0f5ff] rounded-lg px-3 py-1.5">
                <CheckCircle size={12} className="text-brand-navy flex-shrink-0" />
                <span>{selectedContact.full_name}</span>
                {selectedContact.email && <span className="text-[#8a8fa3]">· {selectedContact.email}</span>}
              </div>
            )}
          </div>

          {/* Step 2: Template */}
          <div>
            <label className="label">2. Load a template <span className="text-[#8a8fa3] font-normal">(optional)</span></label>
            <select value={sForm.template_id}
              onChange={e => { setSForm(f => ({ ...f, template_id: e.target.value })); loadTemplateIntoSend(e.target.value); }}
              className="field">
              <option value="">— Write from scratch —</option>
              {templates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
            </select>
          </div>

          {/* Subject (optional) */}
          <div>
            <label className="label">Subject <span className="text-[#8a8fa3] font-normal">(email only)</span></label>
            <input value={sForm.subject} onChange={e => setSForm(f => ({ ...f, subject: e.target.value }))}
              className="field" placeholder="Invoice reminder" />
          </div>

          {/* Message */}
          <div>
            <label className="label">Message <span className="text-red-500">*</span></label>
            <textarea value={sForm.message} onChange={e => setSForm(f => ({ ...f, message: e.target.value }))}
              className="field min-h-[110px] resize-y" placeholder="Type your message…" />
            {/* Preview with resolved variables */}
            {sForm.message && selectedContact && (
              <div className="mt-2 p-3 bg-[#f6f6f3] rounded-xl border border-[#e7e6e1]">
                <p className="text-[10px] text-[#8a8fa3] uppercase tracking-wider font-semibold mb-1">Preview (variables resolved)</p>
                <p className="text-[12px] text-[#4a5168] whitespace-pre-wrap">{previewMsg}</p>
              </div>
            )}
          </div>

          {/* Step 3: Channel */}
          <div>
            <label className="label">3. Send via</label>
            <div className="flex gap-2 flex-wrap">
              {CHANNELS.map(ch => {
                const Icon = ch.icon;
                const active = sForm.channel === ch.value;
                return (
                  <button key={ch.value} type="button"
                    onClick={() => setSForm(f => ({ ...f, channel: ch.value }))}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-[13px] font-medium transition-all
                      ${active ? ch.color + " border-current shadow-sm" : "border-[#e7e6e1] text-[#4a5168] hover:border-[#d8d6cf]"}`}>
                    <Icon size={14} /> {ch.label}
                    {active && <CheckCircle size={12} className="ml-0.5" />}
                  </button>
                );
              })}
            </div>
            {sForm.channel === "email" && selectedContact && !selectedContact.email && (
              <p className="text-[12px] text-amber-600 mt-1.5 flex items-center gap-1">
                <X size={12} /> This contact has no email address.
              </p>
            )}
            {sForm.channel === "sms" && selectedContact && !selectedContact.phone && (
              <p className="text-[12px] text-amber-600 mt-1.5 flex items-center gap-1">
                <X size={12} /> This contact has no phone number.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#e7e6e1]">
            <button className="btn btn-outline" onClick={() => setSModal(false)}>Cancel</button>
            <button className="btn btn-primary gap-1.5" onClick={send} disabled={sSaving}>
              <Send size={13} /> {sSaving ? "Sending…" : "Send Notification"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={deleteTemplate}
        title="Delete Template" message="This template will be permanently deleted." danger />
    </div>
  );
}
