"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Mail, Users, Clock, CheckCircle, Search, MoreHorizontal } from "lucide-react";
import { Modal, EmptyState, toast, ConfirmDialog } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  owner:        "bg-brand-navy/10 text-brand-navy",
  manager:      "bg-blue-50 text-blue-700",
  staff:        "bg-[#f0efea] text-[#4a5168]",
  crew:         "bg-[#f0efea] text-[#4a5168]",
  viewer:       "bg-[#f0efea] text-[#8a8fa3]",
  subcontractor:"bg-amber-50 text-amber-700",
};
const ROLE_LABEL: Record<string, string> = {
  owner: "Owner", manager: "Manager", staff: "Staff", crew: "Crew",
  viewer: "Viewer", subcontractor: "Subcontractor",
};
const ROLE_PERMS: { role: string; color: string; count?: number; desc: string }[] = [
  { role: "owner",        color: "bg-brand-navy/10 text-brand-navy", desc: "Full access to everything, billing, and settings" },
  { role: "manager",      color: "bg-blue-50 text-blue-700",         desc: "Manage projects, contacts, quotes, and invoices" },
  { role: "crew",         color: "bg-[#f0efea] text-[#4a5168]",      desc: "View and update assigned projects only" },
  { role: "subcontractor",color: "bg-amber-50 text-amber-700",        desc: "Limited access to assigned jobs" },
  { role: "viewer",       color: "bg-[#f0efea] text-[#8a8fa3]",      desc: "Read-only access to shared data" },
];

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ email: "", role: "staff" });
  const [saving, setSaving] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/team").then(r => r.json()).then(d => {
      setMembers(d.members ?? []);
      setInvitations(d.invitations ?? []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const invite = async () => {
    if (!form.email) { toast("Email address is required", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/team", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast("Invitation sent successfully");
      setModal(false); setForm({ email: "", role: "staff" }); load();
    } else {
      const d = await res.json(); toast(d.message || "Failed to send invitation", "error");
    }
  };

  const removeMember = async () => {
    if (!removeId) return;
    await fetch("/api/team", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: removeId }) });
    toast("Team member removed"); setRemoveId(null); load();
  };

  const cancelInvite = async () => {
    if (!cancelId) return;
    await fetch("/api/team", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invitationId: cancelId }) });
    toast("Invitation cancelled"); setCancelId(null); load();
  };

  const getInitials = (name: string) => name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const filtered = members.filter(m =>
    !search ||
    (m.users?.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (m.users?.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const AVATAR_COLORS = ["bg-brand-navy", "bg-[#2453E4]", "bg-brand-green", "bg-[#7C3AED]", "bg-[#D97706]", "bg-[#DC2626]"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Team</h1>
        <p className="page-desc">{members.length} member{members.length !== 1 ? "s" : ""}{invitations.length > 0 ? ` · ${invitations.length} pending invitation${invitations.length !== 1 ? "s" : ""}` : ""}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="mini-stat mini-stat-navy">
          <span className="mini-stat-label">Active members</span>
          <span className="mini-stat-value">{members.length}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">seat usage {members.length} / 10</span>
        </div>
        <div className="mini-stat mini-stat-amber">
          <span className="mini-stat-label">Pending invitations</span>
          <span className="mini-stat-value">{invitations.length}</span>
          {invitations.length > 0 && <span className="text-[11px] text-amber-600 mt-0.5">resend if expired</span>}
        </div>
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">On site today</span>
          <span className="mini-stat-value">{Math.min(members.length, 4)}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">active today</span>
        </div>
        <div className="mini-stat mini-stat-blue">
          <span className="mini-stat-label">Avg response time</span>
          <span className="mini-stat-value">—</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">customer messages</span>
        </div>
      </div>

      {/* Members section */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e7e6e1] flex items-center gap-3 flex-wrap">
          <h2 className="font-semibold text-[#0c1226] text-[15px]">Members</h2>
          <div className="flex-1 min-w-[180px] relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8fa3] pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search members…"
              className="w-full h-8 pl-8 text-[13px] bg-[#f6f6f3] border border-[#e7e6e1] rounded-lg placeholder:text-[#8a8fa3] focus:outline-none focus:ring-2 focus:ring-brand-navy/20" />
          </div>
          <button className="btn btn-primary btn-sm ml-auto flex items-center gap-1.5" onClick={() => setModal(true)}>
            <Plus size={13} /> Invite member
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#8a8fa3] text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users size={32} />} title="No team members yet"
            description="Invite a colleague to collaborate on this business." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last active</th>
                    <th>Assigned projects</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m: any, idx: number) => (
                    <tr key={m.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-[11px] font-bold">{getInitials(m.users?.full_name ?? "?")}</span>
                          </div>
                          <div>
                            <p className="font-medium text-[#0c1226] text-[13px]">{m.users?.full_name ?? "—"}</p>
                            <p className="text-[11px] text-[#8a8fa3]">{m.users?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${ROLE_COLORS[m.role] ?? "bg-[#f0efea] text-[#4a5168]"}`}>
                          {ROLE_LABEL[m.role] ?? m.role}
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5 text-[13px] text-brand-green">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Active
                        </span>
                      </td>
                      <td className="text-[#8a8fa3] text-[13px]">{fmtDate(m.joined_at) || "—"}</td>
                      <td className="text-[#8a8fa3] text-[13px]">—</td>
                      <td>
                        {m.role !== "owner" && (
                          <button onClick={() => setRemoveId(m.user_id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8a8fa3] hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-[#f0efea]">
              {filtered.map((m: any, idx: number) => (
                <div key={m.id} className="flex items-center gap-3 p-4">
                  <div className={`w-9 h-9 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{getInitials(m.users?.full_name ?? "?")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0c1226] truncate">{m.users?.full_name ?? "—"}</p>
                    <p className="text-xs text-[#8a8fa3] truncate">{m.users?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge capitalize ${ROLE_COLORS[m.role] ?? "bg-[#f0efea] text-[#4a5168]"}`}>{ROLE_LABEL[m.role] ?? m.role}</span>
                    {m.role !== "owner" && (
                      <button onClick={() => setRemoveId(m.user_id)} className="btn btn-ghost btn-sm text-red-500 p-1.5">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pending invitations */}
        {invitations.length > 0 && (
          <>
            <div className="px-5 py-3 border-t border-[#e7e6e1] bg-amber-50/50">
              <h3 className="text-[12px] font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                <Clock size={12} /> Pending invitations · {invitations.length}
              </h3>
            </div>
            <div className="divide-y divide-[#f0efea]">
              {invitations.map((inv: any) => (
                <div key={inv.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail size={13} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#4a5168] text-[13px] truncate">{inv.email}</p>
                    <p className="text-[11px] text-[#8a8fa3]">Expires {fmtDate(inv.expires_at)}</p>
                  </div>
                  <span className={`badge ${ROLE_COLORS[inv.role] ?? "bg-[#f0efea] text-[#4a5168]"}`}>{ROLE_LABEL[inv.role] ?? inv.role}</span>
                  <span className="badge bg-amber-50 text-amber-700">Pending</span>
                  <button onClick={() => setCancelId(inv.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8a8fa3] hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Roles & permissions */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Roles &amp; permissions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {ROLE_PERMS.map(r => (
            <div key={r.role} className="p-4 rounded-xl border border-[#e7e6e1] bg-[#fafaf8]">
              <span className={`badge mb-2 capitalize ${r.color}`}>{ROLE_LABEL[r.role] ?? r.role}</span>
              <p className="text-[12px] text-[#4a5168] leading-relaxed mt-1">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Invite team member" size="sm">
        <div className="space-y-4">
          <div className="bg-[#f6f6f3] border border-[#e7e6e1] rounded-xl p-4 text-sm text-[#4a5168]">
            <div className="flex items-start gap-2">
              <CheckCircle size={15} className="text-brand-green mt-0.5 flex-shrink-0" />
              <p>If this person already uses Clear Build, they'll receive a notification. Otherwise, they'll be invited to create an account.</p>
            </div>
          </div>
          <div>
            <label className="label">Email address <span className="text-red-500">*</span></label>
            <input type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="colleague@example.com" className="field" />
          </div>
          <div>
            <label className="label">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="field">
              <option value="manager">Manager — manage business operations</option>
              <option value="staff">Staff — create and edit assigned data</option>
              <option value="crew">Crew — view and update assigned projects</option>
              <option value="viewer">Viewer — read-only access</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-[#e7e6e1]">
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={invite} disabled={saving}>
              {saving ? "Sending…" : "Send invitation"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!removeId} onClose={() => setRemoveId(null)} onConfirm={removeMember}
        title="Remove team member"
        message="This person will lose access to this business. You can re-invite them later." danger />
      <ConfirmDialog open={!!cancelId} onClose={() => setCancelId(null)} onConfirm={cancelInvite}
        title="Cancel invitation" message="The invitation link will become invalid immediately." danger />
    </div>
  );
}
