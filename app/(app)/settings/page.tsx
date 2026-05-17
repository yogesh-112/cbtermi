"use client";
import { useEffect, useState } from "react";
import { toast, Tabs } from "@/components/ui";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("Business Profile");

  const load = () => fetch("/api/settings").then(r => r.json()).then(d => setSettings(d.settings)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSettings({ ...settings, [k]: e.target.value });

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
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 skeleton rounded-lg" />
        <div className="card p-6 space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-10 skeleton rounded-input" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-desc">Configure your business preferences</p>
        </div>
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <Tabs tabs={["Business Profile", "Preferences", "Numbering"]} active={tab} onChange={setTab} />

      {tab === "Business Profile" && (
        <div className="form-section max-w-2xl">
          <div className="form-row">
            <div>
              <label className="label">Business name</label>
              <input value={settings.name ?? ""} onChange={set("name")} className="field" />
            </div>
            <div>
              <label className="label">Legal name</label>
              <input value={settings.legal_name ?? ""} onChange={set("legal_name")} className="field" />
            </div>
            <div>
              <label className="label">Business email</label>
              <input type="email" value={settings.email ?? ""} onChange={set("email")} className="field" />
            </div>
            <div>
              <label className="label">Business phone</label>
              <input value={settings.phone ?? ""} onChange={set("phone")} className="field" />
            </div>
            <div>
              <label className="label">Business type</label>
              <input value={settings.business_type ?? ""} onChange={set("business_type")} className="field" placeholder="e.g. Construction, Plumbing" />
            </div>
            <div>
              <label className="label">Service area</label>
              <input value={settings.service_area ?? ""} onChange={set("service_area")} className="field" placeholder="e.g. Dallas–Fort Worth" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Address</label>
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
                <option value="BR">Brazil</option>
                <option value="MX">Mexico</option>
                <option value="CA">Canada</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {tab === "Preferences" && (
        <div className="form-section max-w-2xl">
          <div className="form-row">
            <div>
              <label className="label">Currency</label>
              <select value={settings.currency ?? ""} onChange={set("currency")} className="field">
                <option value="USD">USD — US Dollar</option>
                <option value="BRL">BRL — Brazilian Real</option>
                <option value="EUR">EUR — Euro</option>
                <option value="CAD">CAD — Canadian Dollar</option>
              </select>
            </div>
            <div>
              <label className="label">Default tax rate (%)</label>
              <input type="number" step="0.01" value={settings.default_tax_rate ?? ""} onChange={set("default_tax_rate")} className="field" />
            </div>
            <div>
              <label className="label">Payment terms</label>
              <select value={settings.payment_terms ?? ""} onChange={set("payment_terms")} className="field">
                {["Due on receipt", "Net 7", "Net 15", "Net 30", "Net 45", "Net 60"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Timezone</label>
              <input value={settings.timezone ?? ""} onChange={set("timezone")} className="field" placeholder="America/Chicago" />
            </div>
            <div>
              <label className="label">Date format</label>
              <select value={settings.date_format ?? ""} onChange={set("date_format")} className="field">
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {tab === "Numbering" && (
        <div className="form-section max-w-lg">
          <p className="text-sm text-[#4a5168] mb-5">Prefixes are automatically added to new quotes, invoices, and projects.</p>
          <div className="space-y-4">
            <div>
              <label className="label">Quote prefix</label>
              <input value={settings.quote_prefix ?? ""} onChange={set("quote_prefix")} className="field" placeholder="Q-" />
            </div>
            <div>
              <label className="label">Invoice prefix</label>
              <input value={settings.invoice_prefix ?? ""} onChange={set("invoice_prefix")} className="field" placeholder="INV-" />
            </div>
            <div>
              <label className="label">Project prefix</label>
              <input value={settings.project_prefix ?? ""} onChange={set("project_prefix")} className="field" placeholder="PRJ-" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
