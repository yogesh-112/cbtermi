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
    setError(""); setSaving(true);
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#0d1117]">Admins</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">{admins.length} admin accounts</p>
        </div>
        <AdminBtn onClick={() => setCreateModal(true)}>
          <Plus size={13} /> Add Admin
        </AdminBtn>
      </div>

      <AdminTable headers={["Admin", "Role", "Status", "Last Login", "Actions"]}>
        {loading && <tr><td colSpan={5} className="py-10 text-center text-[#9399a8] text-[13px]">Loading…</td></tr>}
        {!loading && admins.length === 0 && <AdminEmpty />}
        {admins.map((a: any) => (
          <AdminTr key={a.id}>
            <AdminTd>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#b33a4b]/10 flex items-center justify-center text-[11px] font-bold text-[#b33a4b] flex-shrink-0">
                  {a.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="text-[#0d1117] font-medium text-[13px]">{a.name}</p>
                  <p className="text-[11px] text-[#9399a8]">{a.email}</p>
                </div>
              </div>
            </AdminTd>
            <AdminTd><StatusPill status={a.role} /></AdminTd>
            <AdminTd>
              {a.is_active
                ? <span className="text-[12px] font-medium text-emerald-600">Active</span>
                : <span className="text-[12px] text-[#9399a8]">Inactive</span>}
            </AdminTd>
            <AdminTd className="text-[12px] text-[#9399a8]">
              {a.last_login_at
                ? new Date(a.last_login_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Never"}
            </AdminTd>
            <AdminTd>
              <div className="flex items-center gap-1.5">
                <select
                  value={a.role}
                  onChange={e => doAction(a.id, "role", { role: e.target.value })}
                  className="bg-white border border-[#e2e4e9] text-[#374151] rounded-[6px] px-2 py-1 text-[11px] outline-none focus:border-[#b33a4b]"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                </select>
                <AdminBtn onClick={() => doAction(a.id, a.is_active ? "deactivate" : "activate")} variant="ghost">
                  {a.is_active
                    ? <ToggleRight size={14} className="text-emerald-500" />
                    : <ToggleLeft size={14} className="text-[#c0c3cc]" />}
                </AdminBtn>
                <AdminBtn onClick={() => deleteAdmin(a.id, a.name)} variant="red">
                  <Trash2 size={12} />
                </AdminBtn>
              </div>
            </AdminTd>
          </AdminTr>
        ))}
      </AdminTable>

      <AdminModal open={createModal} onClose={() => { setCreateModal(false); setError(""); }} title="Add New Admin">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-[7px] px-3 py-2 mb-3">{error}</div>
        )}
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
            <AdminBtn onClick={createAdmin} disabled={saving || !form.name || !form.email || !form.password}>
              {saving ? "Creating…" : "Create Admin"}
            </AdminBtn>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
