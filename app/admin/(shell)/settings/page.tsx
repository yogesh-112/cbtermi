"use client";
import { useEffect, useState } from "react";
import { AdminInput, AdminLabel, AdminBtn } from "@/components/admin/ui";
import { Save, RefreshCw } from "lucide-react";

const SETTING_DEFS = [
  { key: "app_name",           label: "App Name",            placeholder: "Clear Build USA" },
  { key: "support_email",      label: "Support Email",       placeholder: "support@clearbuildusa.com" },
  { key: "trial_days",         label: "Trial Duration (days)", placeholder: "14" },
  { key: "max_trial_days",     label: "Max Trial Days",      placeholder: "30" },
  { key: "maintenance_mode",   label: "Maintenance Mode",    placeholder: "false" },
  { key: "signup_enabled",     label: "Signups Enabled",     placeholder: "true" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => setSettings(d.settings ?? {}))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function saveSettings() {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-[640px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0d1117]">Settings</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">Platform configuration</p>
        </div>
        <button onClick={load} className="p-2 rounded-[8px] text-[#6b7280] hover:bg-white hover:text-[#0d1117] transition-colors border border-[#e5e7eb]">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-white/30 text-[13px]">Loading…</div>
      ) : (
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-[16px] p-6">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-5">Platform Settings</p>
          <div className="space-y-4">
            {SETTING_DEFS.map(def => (
              <div key={def.key}>
                <AdminLabel>{def.label}</AdminLabel>
                <AdminInput
                  value={settings[def.key] ?? ""}
                  onChange={e => setSettings(s => ({ ...s, [def.key]: e.target.value }))}
                  placeholder={def.placeholder}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/[0.06]">
            <AdminBtn onClick={saveSettings} variant="default" disabled={saving}>
              <Save size={13} />
              {saving ? "Saving…" : "Save Settings"}
            </AdminBtn>
            {saved && <span className="text-[12px] text-emerald-400">Saved successfully</span>}
          </div>
        </div>
      )}

      {/* Version info */}
      <div className="bg-white border border-[#e5e7eb] rounded-[12px] p-4">
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-3">System Info</p>
        <div className="space-y-2">
          {[
            ["App", "Clear Build USA Admin Panel"],
            ["Framework", "Next.js 15 (App Router)"],
            ["Database", "Supabase PostgreSQL"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-[12px]">
              <span className="text-[#9399a8]">{k}</span>
              <span className="text-[#1a2030] font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
