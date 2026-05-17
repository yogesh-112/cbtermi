"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui";
import {
  Building2, Sliders, Hash, Bell, Mail, Plug, Globe, Shield, Webhook, Upload,
  Trash2, Plus, Check, ExternalLink, AlertCircle,
} from "lucide-react";

function PasswordChangeForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast("New passwords do not match.", "error"); return; }
    if (form.newPassword.length < 8) { toast("Password must be at least 8 characters.", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { toast("Password changed successfully."); setForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
    else toast(data.message ?? "Failed to change password.", "error");
  };
  return (
    <form onSubmit={submit} className="space-y-4 max-w-sm">
      <div><label className="label">Current password</label><input type="password" value={form.currentPassword} onChange={setF("currentPassword")} className="field" required /></div>
      <div><label className="label">New password</label><input type="password" value={form.newPassword} onChange={setF("newPassword")} className="field" required minLength={8} /></div>
      <div><label className="label">Confirm new password</label><input type="password" value={form.confirmPassword} onChange={setF("confirmPassword")} className="field" required /></div>
      <button type="submit" disabled={saving} className="btn btn-primary btn-sm">{saving ? "Saving…" : "Change password"}</button>
    </form>
  );
}

const SECTIONS = [
  { key: "profile",       label: "Business profile",  icon: Building2 },
  { key: "preferences",   label: "Preferences",       icon: Sliders },
  { key: "numbering",     label: "Tax & numbering",   icon: Hash },
  { key: "notifications", label: "Notifications",     icon: Bell },
  { key: "email",         label: "Email templates",   icon: Mail },
  { key: "integrations",  label: "Integrations",      icon: Plug },
  { key: "region",        label: "Language & region", icon: Globe },
  { key: "security",      label: "Security",          icon: Shield },
  { key: "api",           label: "API & webhooks",    icon: Webhook },
];

const BUSINESS_TYPES = ["General Contractor","Remodeler","Electrician","Plumber","HVAC","Painter","Landscaper","Roofer","Flooring","Other"];

const TIMEZONES = [
  "America/New_York","America/Chicago","America/Denver","America/Los_Angeles",
  "America/Phoenix","America/Anchorage","Pacific/Honolulu",
  "America/Toronto","America/Vancouver","America/Sao_Paulo",
  "Europe/London","Europe/Paris","Europe/Berlin",
  "Asia/Dubai","Asia/Kolkata","Asia/Singapore","Asia/Tokyo",
  "Australia/Sydney","Australia/Melbourne",
];

const WEBHOOK_EVENTS = ["invoice.created","invoice.paid","invoice.overdue","quote.approved","quote.rejected","payment.recorded","contact.created","project.updated"];

const DEFAULT_TEMPLATES = [
  { name: "quote_sent",        label: "Quote sent",         subject: "Your quote from {{business_name}}", message: "Hi {{contact_name}},\n\nYour quote is ready to review. Please click the link below to view and approve it.\n\nThank you,\n{{business_name}}" },
  { name: "invoice_due",       label: "Invoice due reminder", subject: "Invoice due — {{business_name}}", message: "Hi {{contact_name}},\n\nThis is a friendly reminder that your invoice is due. Please make payment at your earliest convenience.\n\nThank you,\n{{business_name}}" },
  { name: "payment_received",  label: "Payment received",   subject: "Payment received — {{business_name}}", message: "Hi {{contact_name}},\n\nThank you for your payment. We've received it and your account is up to date.\n\nBest,\n{{business_name}}" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("profile");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Email templates state
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState<string | null>(null);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ url: "", events: [] as string[] });
  const [addingWebhook, setAddingWebhook] = useState(false);
  const [shownSecret, setShownSecret] = useState<Record<string, string>>({});

  const load = () => fetch("/api/settings").then(r => r.json()).then(d => setSettings(d.settings)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (section === "email" && templates.length === 0) {
      setTemplatesLoading(true);
      fetch("/api/notifications").then(r => r.json()).then(d => {
        const loaded = d.templates ?? [];
        const merged = DEFAULT_TEMPLATES.map(def => {
          const found = loaded.find((t: any) => t.name === def.name);
          return found ? { ...def, ...found } : { ...def, id: null };
        });
        setTemplates(merged);
      }).finally(() => setTemplatesLoading(false));
    }
    if (section === "api" && webhooks.length === 0) {
      setWebhooksLoading(true);
      fetch("/api/webhooks").then(r => r.json()).then(d => setWebhooks(d.webhooks ?? [])).finally(() => setWebhooksLoading(false));
    }
  }, [section]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setSettings((s: any) => ({ ...s, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    setSaving(false);
    if (res.ok) toast("Settings saved"); else toast("Failed to save", "error");
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "logos");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingLogo(false);
    if (!res.ok) { toast(data.message ?? "Upload failed", "error"); return; }
    setSettings((s: any) => ({ ...s, logo_url: data.url }));
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logo_url: data.url }) });
    toast("Logo updated");
  };

  const saveTemplate = async (tpl: any) => {
    setSavingTemplate(tpl.name);
    if (tpl.id) {
      const res = await fetch(`/api/notifications/${tpl.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: tpl.subject, message: tpl.message }) });
      const data = await res.json();
      if (res.ok) { setTemplates(ts => ts.map(t => t.name === tpl.name ? { ...t, ...data.template } : t)); toast("Template saved"); }
      else toast(data.message ?? "Failed", "error");
    } else {
      const res = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: tpl.name, channel: "email", subject: tpl.subject, message: tpl.message }) });
      const data = await res.json();
      if (res.ok) { setTemplates(ts => ts.map(t => t.name === tpl.name ? { ...t, id: data.template.id } : t)); toast("Template saved"); }
      else toast(data.message ?? "Failed", "error");
    }
    setSavingTemplate(null);
  };

  const addWebhook = async () => {
    if (!newWebhook.url) return;
    setAddingWebhook(true);
    const res = await fetch("/api/webhooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newWebhook) });
    const data = await res.json();
    setAddingWebhook(false);
    if (res.ok) {
      setWebhooks(w => [data.webhook, ...w]);
      setShownSecret(s => ({ ...s, [data.webhook.id]: data.secret }));
      setNewWebhook({ url: "", events: [] });
      toast("Webhook created — copy the secret now, it won't be shown again.", "info");
    } else toast(data.message ?? "Failed", "error");
  };

  const deleteWebhook = async (id: string) => {
    await fetch("/api/webhooks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setWebhooks(w => w.filter(wh => wh.id !== id));
    toast("Webhook deleted");
  };

  const toggleEvent = (ev: string) => setNewWebhook(w => ({
    ...w,
    events: w.events.includes(ev) ? w.events.filter(e => e !== ev) : [...w.events, ev],
  }));

  if (loading || !settings) {
    return (
      <div className="flex gap-6 animate-pulse">
        <div className="w-52 flex-shrink-0 space-y-1">{[...Array(9)].map((_, i) => <div key={i} className="h-9 skeleton rounded-xl" />)}</div>
        <div className="flex-1 space-y-4"><div className="h-8 w-40 skeleton rounded-lg" />{[...Array(6)].map((_, i) => <div key={i} className="h-10 skeleton rounded-xl" />)}</div>
      </div>
    );
  }

  const activeSection = SECTIONS.find(s => s.key === section);

  return (
    <div>
      <div className="flex items-start gap-6">
        {/* Left sidebar nav */}
        <div className="w-52 flex-shrink-0 hidden lg:block">
          <nav className="space-y-0.5">
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setSection(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors text-left
                  ${section === key ? "bg-brand-blue-50 text-brand-navy" : "text-[#4a5168] hover:bg-[#f6f6f3]"}`}>
                <Icon size={14} className="flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile section select */}
        <div className="lg:hidden w-full mb-4">
          <select value={section} onChange={e => setSection(e.target.value)} className="field">
            {SECTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-[22px] font-bold text-[#0c1226]" style={{ letterSpacing: "-0.02em" }}>
                {activeSection?.label ?? "Settings"}
              </h1>
              <p className="text-[13px] text-[#8a8fa3] mt-0.5">Configure how Clear Build runs for your business</p>
            </div>
            {["profile","preferences","numbering"].includes(section) && (
              <button onClick={save} disabled={saving} className="btn btn-primary btn-sm">
                {saving ? "Saving…" : "Save changes"}
              </button>
            )}
          </div>

          {section === "profile" && (
            <div className="space-y-5">
              <div className="card p-5">
                <h3 className="section-title mb-1">Business profile</h3>
                <p className="text-[12px] text-[#8a8fa3] mb-4">What customers see on quotes and invoices.</p>
                {/* Logo upload */}
                <div className="flex items-center gap-4 mb-5">
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-contain border border-[#e7e6e1] bg-white p-1" />
                  ) : (
                    <div className="w-16 h-16 bg-[#f0efea] rounded-xl flex items-center justify-center border-2 border-dashed border-[#e7e6e1]">
                      <Building2 size={22} className="text-[#d8d6cf]" />
                    </div>
                  )}
                  <div>
                    <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadLogo} />
                    <button className="btn btn-outline btn-sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                      {uploadingLogo ? "Uploading…" : "Change logo"}
                    </button>
                    <p className="text-[11px] text-[#8a8fa3] mt-1">PNG or JPG, max 2 MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="label">Business name</label><input value={settings.name ?? ""} onChange={set("name")} className="field" /></div>
                  <div><label className="label">Legal entity</label><input value={settings.legal_name ?? ""} onChange={set("legal_name")} className="field" placeholder="LLC, Inc, etc." /></div>
                  <div><label className="label">Public email</label><input type="email" value={settings.email ?? ""} onChange={set("email")} className="field" /></div>
                  <div><label className="label">Phone</label><input value={settings.phone ?? ""} onChange={set("phone")} className="field" /></div>
                  <div><label className="label">Website</label><input value={settings.website ?? ""} onChange={set("website")} className="field" placeholder="https://yourbusiness.com" /></div>
                  <div><label className="label">Trade license</label><input value={settings.trade_license ?? ""} onChange={set("trade_license")} className="field" placeholder="e.g. NC-GC-12345" /></div>
                  <div>
                    <label className="label">Business type</label>
                    <select value={settings.business_type ?? ""} onChange={set("business_type")} className="field">
                      <option value="">Select type</option>
                      {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Service area</label><input value={settings.service_area ?? ""} onChange={set("service_area")} className="field" placeholder="e.g. Dallas–Fort Worth" /></div>
                  <div className="md:col-span-2"><label className="label">Street address</label><input value={settings.address ?? ""} onChange={set("address")} className="field" /></div>
                  <div><label className="label">City</label><input value={settings.city ?? ""} onChange={set("city")} className="field" /></div>
                  <div><label className="label">State</label><input value={settings.state ?? ""} onChange={set("state")} className="field" /></div>
                  <div><label className="label">ZIP</label><input value={settings.zip ?? ""} onChange={set("zip")} className="field" /></div>
                  <div>
                    <label className="label">Country</label>
                    <select value={settings.country ?? "US"} onChange={set("country")} className="field">
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="MX">Mexico</option>
                      <option value="BR">Brazil</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === "preferences" && (
            <div className="card p-5">
              <h3 className="section-title mb-4">Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Currency</label>
                  <select value={settings.currency ?? "USD"} onChange={set("currency")} className="field">
                    <option value="USD">USD ($) — US Dollar</option>
                    <option value="CAD">CAD ($) — Canadian Dollar</option>
                    <option value="EUR">EUR (€) — Euro</option>
                    <option value="BRL">BRL (R$) — Brazilian Real</option>
                  </select>
                </div>
                <div>
                  <label className="label">Default payment terms</label>
                  <select value={settings.payment_terms ?? "Net 30"} onChange={set("payment_terms")} className="field">
                    {["Due on receipt","Net 7","Net 14","Net 15","Net 30","Net 45","Net 60"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <select value={settings.timezone ?? "America/New_York"} onChange={set("timezone")} className="field">
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date format</label>
                  <select value={settings.date_format ?? "MM/DD/YYYY"} onChange={set("date_format")} className="field">
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {section === "numbering" && (
            <div className="space-y-5">
              <div className="card p-5">
                <h3 className="section-title mb-1">Tax &amp; numbering</h3>
                <p className="text-[12px] text-[#8a8fa3] mb-4">Prefixes and tax settings for quotes, invoices, and projects.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Tax rate</label>
                    <div className="relative">
                      <input type="number" step="0.01" min="0" max="100" value={settings.default_tax_rate ?? "0"} onChange={set("default_tax_rate")} className="field pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8fa3] text-sm">%</span>
                    </div>
                  </div>
                  <div><label className="label">Tax label</label><input value={settings.tax_label ?? "Sales tax"} onChange={set("tax_label")} className="field" placeholder="Sales tax" /></div>
                  <div>
                    <label className="label">Currency</label>
                    <select value={settings.currency ?? "USD"} onChange={set("currency")} className="field">
                      <option value="USD">USD ($)</option><option value="CAD">CAD ($)</option><option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Quote prefix</label>
                    <div className="flex gap-2">
                      <input value={settings.quote_prefix ?? "Q-"} onChange={set("quote_prefix")} className="field w-20" placeholder="Q-" />
                      <input value={settings.quote_next_number ?? ""} onChange={set("quote_next_number")} className="field" placeholder="1058" type="number" min="1" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Invoice prefix</label>
                    <div className="flex gap-2">
                      <input value={settings.invoice_prefix ?? "INV-"} onChange={set("invoice_prefix")} className="field w-20" placeholder="INV-" />
                      <input value={settings.invoice_next_number ?? ""} onChange={set("invoice_next_number")} className="field" placeholder="019" type="number" min="1" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Default payment terms</label>
                    <select value={settings.payment_terms ?? "Net 30"} onChange={set("payment_terms")} className="field">
                      {["Due on receipt","Net 7","Net 14","Net 15","Net 30","Net 45","Net 60"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="card p-5">
                <h3 className="section-title mb-3">Notification defaults</h3>
                {[
                  { key: "notify_new_quote",   label: "New quote",         desc: "Email + WhatsApp" },
                  { key: "notify_invoice_due", label: "Invoice due",       desc: "Email + SMS" },
                  { key: "notify_payment",     label: "Payment received",  desc: "Email" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-[#f0efea] last:border-0">
                    <div><p className="text-[13px] font-medium text-[#0c1226]">{label}</p><p className="text-[11px] text-[#8a8fa3]">{desc}</p></div>
                    <button className={`w-10 h-6 rounded-full transition-colors relative ${settings[key] !== false ? "bg-brand-navy" : "bg-[#e7e6e1]"}`}
                      onClick={() => setSettings((s: any) => ({ ...s, [key]: s[key] === false ? true : false }))}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings[key] !== false ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "notifications" && (
            <div className="card p-5">
              <h3 className="section-title mb-4">Notification preferences</h3>
              <div className="space-y-1">
                {[
                  { key: "n_payment", label: "Payment received",          desc: "When a customer pays an invoice" },
                  { key: "n_quote",   label: "Quote approved or rejected", desc: "When a customer acts on a quote" },
                  { key: "n_invoice", label: "Invoice overdue",            desc: "When an invoice passes its due date" },
                  { key: "n_message", label: "New message",               desc: "When a customer replies to a message" },
                  { key: "n_review",  label: "New review submitted",       desc: "When a customer submits feedback" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3.5 border-b border-[#f0efea] last:border-0">
                    <div><p className="text-[13px] font-medium text-[#0c1226]">{label}</p><p className="text-[11px] text-[#8a8fa3] mt-0.5">{desc}</p></div>
                    <button className={`w-10 h-6 rounded-full transition-colors relative ${settings[key] !== false ? "bg-brand-navy" : "bg-[#e7e6e1]"}`}
                      onClick={() => setSettings((s: any) => ({ ...s, [key]: s[key] === false ? true : false }))}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings[key] !== false ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={save} disabled={saving} className="btn btn-primary btn-sm mt-4">{saving ? "Saving…" : "Save preferences"}</button>
            </div>
          )}

          {section === "email" && (
            <div className="space-y-5">
              <p className="text-[13px] text-[#8a8fa3]">Customize the emails sent to customers. Use <code className="text-[12px] bg-[#f0efea] px-1 rounded">{"{{contact_name}}"}</code> and <code className="text-[12px] bg-[#f0efea] px-1 rounded">{"{{business_name}}"}</code> as placeholders.</p>
              {templatesLoading ? (
                <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 skeleton rounded-xl animate-pulse" />)}</div>
              ) : templates.map(tpl => (
                <div key={tpl.name} className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="section-title">{tpl.label}</h3>
                    {!tpl.id && <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Default — not saved yet</span>}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="label">Subject</label>
                      <input value={tpl.subject ?? ""} className="field"
                        onChange={e => setTemplates(ts => ts.map(t => t.name === tpl.name ? { ...t, subject: e.target.value } : t))} />
                    </div>
                    <div>
                      <label className="label">Message</label>
                      <textarea rows={5} value={tpl.message ?? ""} className="field resize-none"
                        onChange={e => setTemplates(ts => ts.map(t => t.name === tpl.name ? { ...t, message: e.target.value } : t))} />
                    </div>
                    <button onClick={() => saveTemplate(tpl)} disabled={savingTemplate === tpl.name} className="btn btn-primary btn-sm">
                      {savingTemplate === tpl.name ? "Saving…" : "Save template"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === "region" && (
            <div className="space-y-5">
              <div className="card p-5">
                <h3 className="section-title mb-4">Language &amp; region</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Language</label>
                    <select value={settings.language ?? "en"} onChange={set("language")} className="field">
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Timezone</label>
                    <select value={settings.timezone ?? "America/New_York"} onChange={set("timezone")} className="field">
                      {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Date format</label>
                    <select value={settings.date_format ?? "MM/DD/YYYY"} onChange={set("date_format")} className="field">
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Currency</label>
                    <select value={settings.currency ?? "USD"} onChange={set("currency")} className="field">
                      <option value="USD">USD ($) — US Dollar</option>
                      <option value="CAD">CAD ($) — Canadian Dollar</option>
                      <option value="EUR">EUR (€) — Euro</option>
                      <option value="BRL">BRL (R$) — Brazilian Real</option>
                    </select>
                  </div>
                </div>
                <button onClick={save} disabled={saving} className="btn btn-primary btn-sm mt-5">{saving ? "Saving…" : "Save"}</button>
              </div>
            </div>
          )}

          {section === "integrations" && (
            <div className="space-y-4">
              {[
                {
                  name: "Stripe Payments",
                  desc: "Process subscriptions and billing through Stripe.",
                  status: "active",
                  statusLabel: "Configured",
                  action: { label: "Manage billing", href: "/subscription" },
                  icon: "💳",
                },
                {
                  name: "Resend Email",
                  desc: "Transactional emails for quotes, invoices, and notifications.",
                  status: "active",
                  statusLabel: "Configured",
                  action: null,
                  icon: "✉️",
                },
                {
                  name: "QuickBooks",
                  desc: "Sync invoices and payments with QuickBooks Online.",
                  status: "soon",
                  statusLabel: "Coming soon",
                  action: null,
                  icon: "📊",
                },
                {
                  name: "Zapier",
                  desc: "Connect Clear Build to 5,000+ apps via Zapier.",
                  status: "soon",
                  statusLabel: "Coming soon",
                  action: null,
                  icon: "⚡",
                },
                {
                  name: "Google Calendar",
                  desc: "Sync project schedules and deadlines to Google Calendar.",
                  status: "soon",
                  statusLabel: "Coming soon",
                  action: null,
                  icon: "📅",
                },
              ].map(intg => (
                <div key={intg.name} className="card p-5 flex items-center gap-4">
                  <div className="text-[28px] w-10 flex-shrink-0 text-center">{intg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-[14px] text-[#0c1226]">{intg.name}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${intg.status === "active" ? "bg-brand-green/10 text-brand-green" : "bg-[#f0efea] text-[#8a8fa3]"}`}>
                        {intg.statusLabel}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#8a8fa3]">{intg.desc}</p>
                  </div>
                  {intg.action && (
                    <a href={intg.action.href} className="btn btn-outline btn-sm flex items-center gap-1.5 flex-shrink-0">
                      {intg.action.label} <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {section === "security" && (
            <div className="card p-5">
              <h3 className="section-title mb-1">Change password</h3>
              <p className="text-[12px] text-[#8a8fa3] mb-4">You will need to log in again after changing your password.</p>
              <PasswordChangeForm />
            </div>
          )}

          {section === "api" && (
            <div className="space-y-5">
              {/* Webhook list */}
              <div className="card p-5">
                <h3 className="section-title mb-1">Webhook endpoints</h3>
                <p className="text-[12px] text-[#8a8fa3] mb-4">Clear Build will POST a JSON payload to these URLs when events occur.</p>
                {webhooksLoading ? (
                  <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-12 skeleton rounded-xl animate-pulse" />)}</div>
                ) : webhooks.length === 0 ? (
                  <p className="text-[13px] text-[#8a8fa3] py-3">No webhooks yet.</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {webhooks.map(wh => (
                      <div key={wh.id} className="border border-[#e7e6e1] rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-[#0c1226] truncate">{wh.url}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(wh.events ?? []).map((ev: string) => (
                                <span key={ev} className="text-[10px] bg-[#f0efea] text-[#4a5168] px-1.5 py-0.5 rounded">{ev}</span>
                              ))}
                            </div>
                            {shownSecret[wh.id] && (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-[11px] text-amber-700 font-medium mb-1 flex items-center gap-1"><AlertCircle size={11} /> Save this secret — shown once only</p>
                                <code className="text-[11px] text-amber-800 break-all">{shownSecret[wh.id]}</code>
                              </div>
                            )}
                          </div>
                          <button onClick={() => deleteWebhook(wh.id)} className="text-[#8a8fa3] hover:text-red-500 transition-colors flex-shrink-0 p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add webhook form */}
                <div className="border border-dashed border-[#e7e6e1] rounded-xl p-4 space-y-3">
                  <p className="text-[13px] font-medium text-[#0c1226]">Add endpoint</p>
                  <div>
                    <label className="label">URL</label>
                    <input value={newWebhook.url} onChange={e => setNewWebhook(w => ({ ...w, url: e.target.value }))}
                      className="field" placeholder="https://your-server.com/webhooks/clearbuilt" />
                  </div>
                  <div>
                    <label className="label">Events to send</label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {WEBHOOK_EVENTS.map(ev => (
                        <button key={ev} type="button" onClick={() => toggleEvent(ev)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${newWebhook.events.includes(ev) ? "bg-brand-navy text-white border-brand-navy" : "border-[#e7e6e1] text-[#4a5168] hover:border-brand-navy/40"}`}>
                          {newWebhook.events.includes(ev) && <Check size={9} className="inline mr-1" />}
                          {ev}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={addWebhook} disabled={addingWebhook || !newWebhook.url} className="btn btn-primary btn-sm gap-1.5">
                    <Plus size={13} /> {addingWebhook ? "Adding…" : "Add endpoint"}
                  </button>
                </div>
              </div>

              {/* API access note */}
              <div className="card p-5">
                <h3 className="section-title mb-1">API access</h3>
                <p className="text-[13px] text-[#8a8fa3]">
                  Programmatic API access for custom integrations is coming soon. In the meantime, use the webhook endpoints above to push data to your own systems.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
