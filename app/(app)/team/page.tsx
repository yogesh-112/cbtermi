"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Mail, Users, Clock, CheckCircle } from "lucide-react";
import { Modal, EmptyState, toast, ConfirmDialog } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

const ROLE_BADGE: Record<string, string> = {
  owner:   "bg-brand-navy/10 text-brand-navy",
  manager: "bg-blue-50 text-blue-700",
  staff:   "bg-[#f0efea] text-[#4a5168]",
  viewer:  "bg-[#f0efea] text-[#8a8fa3]",
};
const ROLE_LABEL: Record<string, string> = {
  owner: "Owner", manager: "Manager", staff: "Staff", viewer: "Viewer",
};

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ email: "", role: "staff" });
  const [saving, setSaving] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-desc">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={15} /> Invite Member
        </button>
      </div>

      <div className="space-y-5">
        {/* Members */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e7e6e1] flex items-center gap-2">
            <Users size={15} className="text-brand-navy" />
            <h2 className="font-semibold text-[#0c1226] text-sm">Team Members</h2>
            <span className="ml-auto text-xs text-[#8a8fa3]">{members.length} member{members.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Mobile member cards */}
          <div className="lg:hidden divide-y divide-[#f0efea]">
            {loading ? (
              <div className="p-6 text-center text-[#8a8fa3] text-sm">Loading…</div>
            ) : members.length === 0 ? (
              <EmptyState icon={<Users size={32} />} title="No team members yet"
                description="Invite a colleague to collaborate on this business." />
            ) : members.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 bg-brand-navy rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{getInitials(m.users?.full_name ?? "?")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#0c1226] truncate">{m.users?.full_name ?? "—"}</p>
                  <p className="text-xs text-[#8a8fa3] truncate">{m.users?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge capitalize ${ROLE_BADGE[m.role] ?? "bg-[#f0efea] text-[#4a5168]"}`}>{ROLE_LABEL[m.role] ?? m.role}</span>
                  {m.role !== "owner" && (
                    <button onClick={() => setRemoveId(m.user_id)} className="btn btn-ghost btn-sm text-red-500 p-1.5">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          {loading ? null : (
            <table className="table-base hidden lg:table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={5}>
                    <EmptyState icon={<Users size={36} />} title="No team members yet"
                      description="Invite a colleague to collaborate on this business." />
                  </td></tr>
                ) : members.map((m: any) => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-brand-navy rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[10px] font-bold">{getInitials(m.users?.full_name ?? "?")}</span>
                        </div>
                        <span className="font-medium text-[#0c1226]">{m.users?.full_name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="text-[#4a5168]">{m.users?.email}</td>
                    <td><span className={`badge capitalize ${ROLE_BADGE[m.role] ?? "bg-[#f0efea] text-[#4a5168]"}`}>{ROLE_LABEL[m.role] ?? m.role}</span></td>
                    <td className="text-[#8a8fa3] text-xs">{fmtDate(m.joined_at)}</td>
                    <td>
                      {m.role !== "owner" && (
                        <button onClick={() => setRemoveId(m.user_id)} className="btn btn-ghost btn-sm text-red-500">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pending Invitations */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e7e6e1] flex items-center gap-2">
            <Clock size={15} className="text-amber-500" />
            <h2 className="font-semibold text-[#0c1226] text-sm">Pending Invitations</h2>
            {invitations.length > 0 && (
              <span className="ml-auto text-xs text-amber-600 font-medium">{invitations.length} pending</span>
            )}
          </div>
          {invitations.length === 0 ? (
            <p className="text-center text-sm text-[#8a8fa3] py-6">No pending invitations.</p>
          ) : (
            <div className="divide-y divide-[#f0efea]">
              {invitations.map((inv: any) => (
                <div key={inv.id} className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail size={14} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#4a5168] truncate">{inv.email}</p>
                    <p className="text-xs text-[#8a8fa3]">Expires {fmtDate(inv.expires_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge bg-amber-50 text-amber-700 capitalize">{inv.role}</span>
                    <button onClick={() => setCancelId(inv.id)} className="btn btn-ghost btn-sm text-red-500 p-1.5">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Invite Team Member" size="sm">
        <div className="space-y-4">
          <div className="bg-[#f6f6f3] border border-[#e7e6e1] rounded-xl p-4 text-sm text-[#4a5168]">
            <div className="flex items-start gap-2">
              <CheckCircle size={15} className="text-brand-green mt-0.5 flex-shrink-0" />
              <p>If this person already uses Clear Build, they'll receive a notification to join. Otherwise, they'll be invited to create an account first.</p>
            </div>
          </div>
          <div>
            <label className="label">Email Address <span className="text-red-500">*</span></label>
            <input type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="colleague@example.com" className="field" />
          </div>
          <div>
            <label className="label">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="field">
              <option value="manager">Manager — manage business operations</option>
              <option value="staff">Staff — create and edit assigned data</option>
              <option value="viewer">Viewer — read-only access</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-[#e7e6e1]">
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={invite} disabled={saving}>
              {saving ? "Sending…" : "Send Invitation"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!removeId} onClose={() => setRemoveId(null)} onConfirm={removeMember}
        title="Remove Team Member"
        message="This person will lose access to this business. You can re-invite them later." danger />
      <ConfirmDialog open={!!cancelId} onClose={() => setCancelId(null)} onConfirm={cancelInvite}
        title="Cancel Invitation" message="The invitation link will become invalid immediately." danger />
    </div>
  );
}
