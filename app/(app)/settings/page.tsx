"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui";
import {
  Building2, Sliders, Hash, Bell, Mail, Plug, Globe, Shield, Webhook,
} from "lucide-react";

const SECTIONS = [
  { key: "profile",       label: "Business profile",    icon: Building2 },
  { key: "preferences",   label: "Preferences",         icon: Sliders },
  { key: "numbering",     label: "Tax & numbering",     icon: Hash },
  { key: "notifications", label: "Notifications",       icon: Bell },
  { key: "email",         label: "Email templates",     icon: Mail },
  { key: "integrations",  label: "Integrations",        icon: Plug },
  { key: "region",        label: "Language & region",   icon: Globe },
  { key: "security",      label: "Security",            icon: Shield },
  { key: "api",           label: "API & webhooks",      icon: Webhook },
];

const BUSINESS_TYPES = ["General Contractor","Remodeler","Electrician","Plumber","HVAC","Painter","Landscaper","Roofer","Flooring","Other"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("profile");

  const load = () => fetch("/api/settings").then(r => r.json()).then(d => setSettings(d.settings)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setSettings((s: any) => ({ ...s, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (res.ok) toast("Settings saved"); else toast("Failed to save", "error");
  };

  if (loading || !settings) {
    return (
      <div className="flex gap-6 animate-pulse">
        <div className="w-52 flex-shrink-0 space-y-1">
          {[...Array(9)].map((_, i) => <div key={i} className="h-9 skeleton rounded-xl" />)}
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-8 w-40 skeleton rounded-lg" />
          {[...Array(6)].map((_, i) => <div key={i} className="h-10 skeleton rounded-xl" />)}
        </div>
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
                {/* Logo placeholder */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 bg-[#f0efea] rounded-xl flex items-center justify-center border-2 border-dashed border-[#e7e6e1]">
                    <Building2 size={22} className="text-[#d8d6cf]" />
                  </div>
                  <div>
                    <button className="btn btn-outline btn-sm">Change logo</button>
                    <p className="text-[11px] text-[#8a8fa3] mt-1">PNG or JPG, max 2MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Business name</label>
                    <input value={settings.name ?? ""} onChange={set("name")} className="field" />
                  </div>
                  <div>
                    <label className="label">Legal entity</label>
                    <input value={settings.legal_name ?? ""} onChange={set("legal_name")} className="field" placeholder="LLC, Inc, etc." />
                  </div>
                  <div>
                    <label className="label">Public email</label>
                    <input type="email" value={settings.email ?? ""} onChange={set("email")} className="field" />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input value={settings.phone ?? ""} onChange={set("phone")} className="field" />
                  </div>
                  <div>
                    <label className="label">Website</label>
                    <input value={settings.website ?? ""} onChange={set("website")} className="field" placeholder="https://yourbusiness.com" />
                  </div>
                  <div>
                    <label className="label">Trade license</label>
                    <input value={settings.trade_license ?? ""} onChange={set("trade_license")} className="field" placeholder="e.g. NC-GC-12345" />
                  </div>
                  <div>
                    <label className="label">Business type</label>
                    <select value={settings.business_type ?? ""} onChange={set("business_type")} className="field">
                      <option value="">Select type</option>
                      {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Service area</label>
                    <input value={settings.service_area ?? ""} onChange={set("service_area")} className="field" placeholder="e.g. Dallas–Fort Worth" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Street address</label>
                    <input value={settings.address ?? ""} onChange={set("address")} className="field" />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input value={settings.city ?? ""} onChange={set("city")} className="field" />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input value={settings.state ?? ""} onChange={set("state")} className="field" />
                  </div>
                  <div>
                    <label className="label">ZIP</label>
                    <input value={settings.zip ?? ""} onChange={set("zip")} className="field" />
                  </div>
                  <div>
                    <label className="label">Country</label>
                    <select value={settings.country ?? ""} onChange={set("country")} className="field">
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
                  <input value={settings.timezone ?? ""} onChange={set("timezone")} className="field" placeholder="America/Chicago" />
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
                      <input type="number" step="0.01" min="0" max="100"
                        value={settings.default_tax_rate ?? "0"} onChange={set("default_tax_rate")} className="field pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8fa3] text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="label">Tax label</label>
                    <input value={settings.tax_label ?? "Sales tax"} onChange={set("tax_label")} className="field" placeholder="Sales tax" />
                  </div>
                  <div>
                    <label className="label">Currency</label>
                    <select value={settings.currency ?? "USD"} onChange={set("currency")} className="field">
                      <option value="USD">USD ($)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Quote prefix</label>
                    <div className="flex gap-2">
                      <input value={settings.quote_prefix ?? "Q-"} onChange={set("quote_prefix")} className="field w-20" placeholder="Q-" />
                      <input value={settings.quote_next_number ?? ""} onChange={set("quote_next_number")} className="field" placeholder="1058" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Invoice prefix</label>
                    <div className="flex gap-2">
                      <input value={settings.invoice_prefix ?? "INV-"} onChange={set("invoice_prefix")} className="field w-20" placeholder="INV-" />
                      <input value={settings.invoice_next_number ?? ""} onChange={set("invoice_next_number")} className="field" placeholder="019" />
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
                  { key: "notify_new_quote",    label: "New quote",     desc: "Email + WhatsApp" },
                  { key: "notify_invoice_due",  label: "Invoice due",   desc: "Email + SMS" },
                  { key: "notify_payment",      label: "Payment received", desc: "Email" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-[#f0efea] last:border-0">
                    <div>
                      <p className="text-[13px] font-medium text-[#0c1226]">{label}</p>
                      <p className="text-[11px] text-[#8a8fa3]">{desc}</p>
                    </div>
                    <button
                      className={`w-10 h-6 rounded-full transition-colors relative ${settings[key] !== false ? "bg-brand-navy" : "bg-[#e7e6e1]"}`}
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
                  { key: "n_payment",   label: "Payment received",        desc: "When a customer pays an invoice" },
                  { key: "n_quote",     label: "Quote approved or rejected", desc: "When a customer acts on a quote" },
                  { key: "n_invoice",   label: "Invoice overdue",         desc: "When an invoice passes its due date" },
                  { key: "n_message",   label: "New message",             desc: "When a customer replies to a message" },
                  { key: "n_review",    label: "New review submitted",    desc: "When a customer submits feedback" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3.5 border-b border-[#f0efea] last:border-0">
                    <div>
                      <p className="text-[13px] font-medium text-[#0c1226]">{label}</p>
                      <p className="text-[11px] text-[#8a8fa3] mt-0.5">{desc}</p>
                    </div>
                    <button
                      className={`w-10 h-6 rounded-full transition-colors relative ${settings[key] !== false ? "bg-brand-navy" : "bg-[#e7e6e1]"}`}
                      onClick={() => setSettings((s: any) => ({ ...s, [key]: s[key] === false ? true : false }))}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings[key] !== false ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={save} disabled={saving} className="btn btn-primary btn-sm mt-4">
                {saving ? "Saving…" : "Save preferences"}
              </button>
            </div>
          )}

          {["email","integrations","region","security","api"].includes(section) && (
            <div className="card p-8 text-center">
              <div className="w-12 h-12 bg-[#f0efea] rounded-2xl flex items-center justify-center mx-auto mb-3">
                {(() => { const S = SECTIONS.find(s => s.key === section); return S ? <S.icon size={20} className="text-[#8a8fa3]" /> : null; })()}
              </div>
              <p className="font-semibold text-[#0c1226] mb-1">{activeSection?.label}</p>
              <p className="text-[13px] text-[#8a8fa3]">This section is coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
