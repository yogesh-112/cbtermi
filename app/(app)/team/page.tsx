"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Mail, Users, Clock, CheckCircle } from "lucide-react";
import { Modal, StatusBadge, EmptyState, toast, ConfirmDialog } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

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
    fetch("/api/team")
      .then(r => r.json())
      .then(d => { setMembers(d.members ?? []); setInvitations(d.invitations ?? []); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const invite = async () => {
    if (!form.email) { toast("Email address is required", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast("Invitation sent successfully");
      setModal(false);
      setForm({ email: "", role: "staff" });
      load();
    } else {
      const d = await res.json();
      toast(d.message || "Failed to send invitation", "error");
    }
  };

  const removeMember = async () => {
    if (!removeId) return;
    await fetch("/api/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: removeId }),
    });
    toast("Team member removed");
    setRemoveId(null);
    load();
  };

  const cancelInvite = async () => {
    if (!cancelId) return;
    await fetch("/api/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId: cancelId }),
    });
    toast("Invitation cancelled");
    setCancelId(null);
    load();
  };

  const roleLabel = (role: string) => ({
    owner: "Owner", manager: "Manager", staff: "Staff", viewer: "Viewer",
  }[role] ?? role);

  const roleBadge = (role: string) => ({
    owner: "bg-brand-navy/10 text-brand-navy",
    manager: "bg-blue-50 text-blue-700",
    staff: "bg-[#F5F7FA] text-[#6B7280]",
    viewer: "bg-[#F5F7FA] text-[#9CA3AF]",
  }[role] ?? "bg-[#F5F7FA] text-[#6B7280]");

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Team</h1>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={15} /> Invite Member
        </button>
      </div>

      <div className="space-y-6">
        {/* Members Table */}
        <div className="table-wrapper">
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center gap-2">
            <Users size={15} className="text-brand-navy" />
            <h2 className="font-semibold text-[#1F2937] text-sm">Team Members</h2>
            <span className="ml-auto text-xs text-[#9CA3AF]">{members.length} member{members.length !== 1 ? "s" : ""}</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-[#9CA3AF] text-sm">Loading…</div>
          ) : members.length === 0 ? (
            <EmptyState
              icon={<Users size={36} />}
              title="No team members yet"
              description="Invite a colleague to collaborate on this business."
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="hidden sm:table-cell">Email</th>
                  <th>Role</th>
                  <th className="hidden md:table-cell">Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m: any) => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-brand-navy/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-navy text-xs font-bold">
                            {m.users?.full_name?.[0]?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <span className="font-medium text-[#1F2937]">{m.users?.full_name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell text-[#6B7280]">{m.users?.email}</td>
                    <td>
                      <span className={`badge capitalize ${roleBadge(m.role)}`}>{roleLabel(m.role)}</span>
                    </td>
                    <td className="hidden md:table-cell text-[#9CA3AF] text-xs">{fmtDate(m.joined_at)}</td>
                    <td>
                      {m.role !== "owner" && (
                        <button onClick={() => setRemoveId(m.user_id)}
                          className="btn btn-ghost btn-sm text-red-500">
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
        {(invitations.length > 0 || !loading) && (
          <div className="table-wrapper">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center gap-2">
              <Clock size={15} className="text-amber-500" />
              <h2 className="font-semibold text-[#1F2937] text-sm">Pending Invitations</h2>
              {invitations.length > 0 && (
                <span className="ml-auto text-xs text-amber-600 font-medium">{invitations.length} pending</span>
              )}
            </div>
            {invitations.length === 0 ? (
              <p className="text-center text-sm text-[#9CA3AF] py-6">No pending invitations.</p>
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th className="hidden md:table-cell">Expires</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv: any) => (
                    <tr key={inv.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-[#9CA3AF]" />
                          <span className="text-[#374151]">{inv.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-amber-50 text-amber-700 capitalize">{inv.role}</span>
                      </td>
                      <td className="hidden md:table-cell text-[#9CA3AF] text-xs">{fmtDate(inv.expires_at)}</td>
                      <td>
                        <button onClick={() => setCancelId(inv.id)}
                          className="btn btn-ghost btn-sm text-red-500">
                          <Trash2 size={13} /> Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Invite Team Member" size="sm">
        <div className="space-y-4">
          <div className="bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg p-4 text-sm text-[#6B7280]">
            <div className="flex items-start gap-2">
              <CheckCircle size={15} className="text-brand-green mt-0.5 flex-shrink-0" />
              <p>
                If this person already uses Clear Build, they&apos;ll receive a notification to join your business.
                Otherwise, they&apos;ll be invited to create an account first.
              </p>
            </div>
          </div>
          <div>
            <label className="label">Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="colleague@example.com"
              className="field"
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="field">
              <option value="manager">Manager — manage business operations</option>
              <option value="staff">Staff — create and edit assigned data</option>
              <option value="viewer">Viewer — read-only access</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-[#E5E7EB]">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={invite} disabled={saving}>
              {saving ? "Sending…" : "Send Invitation"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={removeMember}
        title="Remove Team Member"
        message="This person will lose access to this business. You can re-invite them later."
        danger
      />
      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={cancelInvite}
        title="Cancel Invitation"
        message="The invitation link will become invalid immediately."
        danger
      />
    </div>
  );
}
