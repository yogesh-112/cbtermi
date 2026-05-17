"use client";
import { useEffect, useState } from "react";
import {
  AdminTable, AdminTr, AdminTd, StatusPill,
  AdminModal, AdminInput, AdminLabel, AdminSelect, AdminBtn, AdminEmpty,
} from "@/components/admin/ui";
import { Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

const ROLES = ["super_admin", "developer", "billing", "support", "readonly"];

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "support" });
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/admins").then(r => r.json()).then(d => setAdmins(d.admins ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function createAdmin() {
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.message ?? "Error"); setSaving(false); return; }
    load(); setCreateModal(false);
    setForm({ name: "", email: "", password: "", role: "support" });
    setSaving(false);
  }

  async function doAction(id: string, action: string, extra?: Record<string, unknown>) {
    await fetch(`/api/admin/admins/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    load();
  }

  async function deleteAdmin(id: string, name: string) {
    if (!confirm(`Delete admin "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0d1117]">Admins</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">{admins.length} admin accounts</p>
        </div>
        <AdminBtn onClick={() => setCreateModal(true)} variant="default">
          <Plus size={13} /> Add Admin
        </AdminBtn>
      </div>

      <AdminTable headers={["Admin", "Role", "Status", "Last Login", "Actions"]}>
        {loading && <tr><td colSpan={5} className="py-10 text-center text-white/30 text-[13px]">Loading…</td></tr>}
        {!loading && admins.length === 0 && <AdminEmpty />}
        {admins.map((a: any) => (
          <AdminTr key={a.id}>
            <AdminTd>
              <div>
                <p className="text-white font-medium text-[13px]">{a.name}</p>
                <p className="text-[11px] text-white/30">{a.email}</p>
              </div>
            </AdminTd>
            <AdminTd><StatusPill status={a.role} /></AdminTd>
            <AdminTd>
              {a.is_active
                ? <span className="text-[12px] text-emerald-400">Active</span>
                : <span className="text-[12px] text-white/30">Inactive</span>}
            </AdminTd>
            <AdminTd className="text-[12px] text-white/40">
              {a.last_login_at ? new Date(a.last_login_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never"}
            </AdminTd>
            <AdminTd>
              <div className="flex items-center gap-1.5">
                {/* Role select */}
                <select
                  value={a.role}
                  onChange={e => doAction(a.id, "role", { role: e.target.value })}
                  className="bg-white/[0.04] border border-white/[0.06] text-white/60 rounded-[6px] px-2 py-1 text-[11px] outline-none"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <AdminBtn
                  onClick={() => doAction(a.id, a.is_active ? "deactivate" : "activate")}
                  variant="ghost"
                >
                  {a.is_active ? <ToggleRight size={14} className="text-emerald-400" /> : <ToggleLeft size={14} className="text-white/30" />}
                </AdminBtn>
                <AdminBtn onClick={() => deleteAdmin(a.id, a.name)} variant="red">
                  <Trash2 size={12} />
                </AdminBtn>
              </div>
            </AdminTd>
          </AdminTr>
        ))}
      </AdminTable>

      {/* Create admin modal */}
      <AdminModal open={createModal} onClose={() => { setCreateModal(false); setError(""); }} title="Add New Admin">
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] rounded-[7px] px-3 py-2 mb-3">{error}</div>}
        <div className="space-y-3">
          <div>
            <AdminLabel>Full Name</AdminLabel>
            <AdminInput value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Jane Smith" />
          </div>
          <div>
            <AdminLabel>Email</AdminLabel>
            <AdminInput type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="jane@clearbuildusa.com" />
          </div>
          <div>
            <AdminLabel>Password</AdminLabel>
            <AdminInput type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="Min 8 characters" />
          </div>
          <div>
            <AdminLabel>Role</AdminLabel>
            <AdminSelect value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
              {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
            </AdminSelect>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <AdminBtn onClick={() => setCreateModal(false)} variant="ghost">Cancel</AdminBtn>
            <AdminBtn onClick={createAdmin} variant="default" disabled={saving || !form.name || !form.email || !form.password}>
              {saving ? "Creating…" : "Create Admin"}
            </AdminBtn>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
