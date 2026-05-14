"use client";
import { useEffect, useState } from "react";
import { Plus, UserCog, Trash2, Mail, RefreshCw } from "lucide-react";
import { Modal, StatusBadge, toast } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ email: "", role: "staff" });
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); fetch("/api/team").then(r=>r.json()).then(d=>{ setMembers(d.members??[]); setInvitations(d.invitations??[]); }).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); },[]);

  const invite = async () => {
    if(!form.email){ toast("Email required","error"); return; }
    setSaving(true);
    const res=await fetch("/api/team",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    setSaving(false);
    if(res.ok){ toast("Invitation sent"); setModal(false); setForm({email:"",role:"staff"}); load(); }
    else{ const d=await res.json(); toast(d.message||"Failed","error"); }
  };

  const removeMember = async (userId: string) => {
    if(!confirm("Remove this team member?")) return;
    await fetch("/api/team",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId})});
    toast("Member removed"); load();
  };

  const cancelInvite = async (invitationId: string) => {
    await fetch("/api/team",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({invitationId})});
    toast("Invitation cancelled"); load();
  };

  const ROLES = ["owner","manager","staff","viewer"];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Team</h1>
        <button className="btn-green btn" onClick={()=>setModal(true)}><Plus size={16}/> Invite Member</button>
      </div>

      <div className="space-y-6">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">Team Members</h2></div>
          {loading ? <div className="p-8 text-center text-slate-400">Loading…</div> : (
            <table className="table-base">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {members.map((m:any)=>(
                  <tr key={m.id}>
                    <td className="font-medium">{m.users?.full_name??"—"}</td>
                    <td className="text-slate-500">{m.users?.email}</td>
                    <td><span className="capitalize badge bg-brand-navy/10 text-brand-navy">{m.role}</span></td>
                    <td className="text-slate-500 text-xs">{fmtDate(m.joined_at)}</td>
                    <td>
                      {m.role!=="owner"&&(
                        <button onClick={()=>removeMember(m.user_id)} className="btn-ghost btn btn-sm text-red-500"><Trash2 size={13}/></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {invitations.length>0&&(
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">Pending Invitations</h2></div>
            <table className="table-base">
              <thead><tr><th>Email</th><th>Role</th><th>Expires</th><th>Actions</th></tr></thead>
              <tbody>
                {invitations.map((inv:any)=>(
                  <tr key={inv.id}>
                    <td className="flex items-center gap-2"><Mail size={13} className="text-slate-400"/>{inv.email}</td>
                    <td><span className="capitalize badge bg-yellow-100 text-yellow-700">{inv.role}</span></td>
                    <td className="text-slate-500 text-xs">{fmtDate(inv.expires_at)}</td>
                    <td className="flex gap-1">
                      <button onClick={()=>cancelInvite(inv.id)} className="btn-ghost btn btn-sm text-red-500"><Trash2 size={13}/> Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Invite Team Member" size="sm">
        <div className="space-y-4">
          <div><label className="label">Email address *</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="colleague@example.com" className="field"/></div>
          <div><label className="label">Role</label>
            <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="field">
              <option value="manager">Manager — manage business operations</option>
              <option value="staff">Staff — create/edit assigned data</option>
              <option value="viewer">Viewer — read-only access</option>
            </select>
          </div>
          <p className="text-xs text-slate-500">If the person is not registered, they will be invited to create an account.</p>
          <div className="flex gap-3 justify-end">
            <button className="btn-ghost btn" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn-green btn" onClick={invite} disabled={saving}>{saving?"Sending…":"Send Invitation"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
