"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MonoId, StatusPill, AdminTable, AdminTr, AdminTd,
  AdminModal, AdminInput, AdminLabel, AdminBtn, AdminEmpty,
} from "@/components/admin/ui";
import { ArrowLeft, Ban, CheckCircle, MailCheck, StickyNote } from "lucide-react";

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [banModal, setBanModal] = useState(false);
  const [notesModal, setNotesModal] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/users/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setNotes(d.user?.admin_notes ?? ""); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  async function doAction(action: string, payload?: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    if (res.ok) { load(); setBanModal(false); setNotesModal(false); }
    setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-white/30 text-[13px]">Loading…</div>;
  if (!data?.user) return <div className="text-center py-16 text-white/30">User not found</div>;

  const { user, memberships, auditEvents } = data;

  return (
    <div className="space-y-6 animate-fade-in max-w-[860px]">
      <div className="flex items-start gap-4">
        <button onClick={() => router.push("/admin/users")}
          className="mt-1 p-1.5 rounded-[7px] text-[#6b7280] hover:text-[#0d1117] hover:bg-white border border-[#e5e7eb] transition-colors flex-shrink-0">
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[22px] font-semibold text-[#0d1117]">{user.name}</h1>
            <StatusPill status={user.is_banned ? "banned" : user.email_verified ? "active" : "inactive"} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-[12px] text-[#6b7280]">
            <MonoId id={user.id} prefix="usr" />
            <span>·</span>
            <span>{user.email}</span>
            <span>·</span>
            <span>Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!user.email_verified && (
            <AdminBtn onClick={() => doAction("verify_email")} variant="default" disabled={saving}>
              <MailCheck size={12} /> Verify Email
            </AdminBtn>
          )}
          <AdminBtn onClick={() => setNotesModal(true)} variant="default">
            <StickyNote size={12} /> Notes
          </AdminBtn>
          {user.is_banned ? (
            <AdminBtn onClick={() => doAction("unban")} variant="default" disabled={saving}>
              <CheckCircle size={12} /> Unban
            </AdminBtn>
          ) : (
            <AdminBtn onClick={() => setBanModal(true)} variant="red">
              <Ban size={12} /> Ban User
            </AdminBtn>
          )}
        </div>
      </div>

      {user.is_banned && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] px-4 py-3">
          <p className="text-red-400 text-[13px] font-medium">
            Banned {user.banned_at ? new Date(user.banned_at).toLocaleDateString() : ""}
          </p>
          {user.banned_reason && <p className="text-red-400/70 text-[12px] mt-0.5">{user.banned_reason}</p>}
        </div>
      )}

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-[12px] p-4">
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2">Account</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[12px]">
              <span className="text-white/40">Email verified</span>
              <span className={user.email_verified ? "text-emerald-400" : "text-amber-400"}>
                {user.email_verified ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-white/40">Businesses</span>
              <span className="text-white">{memberships?.length ?? 0}</span>
            </div>
          </div>
        </div>
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-[12px] p-4 md:col-span-2">
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2">Admin Notes</p>
          <p className="text-white/50 text-[12px] whitespace-pre-wrap">{user.admin_notes || "No notes"}</p>
        </div>
      </div>

      {/* Business memberships */}
      <div>
        <p className="text-[13px] font-semibold text-[#0d1117] mb-3">Business Memberships</p>
        <AdminTable headers={["Business", "Role", "Status"]}>
          {(memberships ?? []).length === 0 && <AdminEmpty message="No business memberships" />}
          {(memberships ?? []).map((m: any) => (
            <AdminTr key={m.business_id} onClick={() => router.push(`/admin/businesses/${m.business_id}`)}>
              <AdminTd>
                <div>
                  <p className="text-white font-medium text-[13px]">{m.businesses?.name ?? "—"}</p>
                  <MonoId id={m.business_id} prefix="biz" />
                </div>
              </AdminTd>
              <AdminTd><StatusPill status={m.role} /></AdminTd>
              <AdminTd><StatusPill status={m.businesses?.admin_status ?? "active"} /></AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      </div>

      {/* Recent activity */}
      <div>
        <p className="text-[13px] font-semibold text-[#0d1117] mb-3">Recent Activity</p>
        <AdminTable headers={["Action", "Entity", "When"]}>
          {(auditEvents ?? []).length === 0 && <AdminEmpty message="No activity" />}
          {(auditEvents ?? []).map((e: any, i: number) => (
            <AdminTr key={i}>
              <AdminTd className="font-medium text-white">{e.action}</AdminTd>
              <AdminTd className="text-[12px] text-white/50">{e.entity_type ?? "—"}</AdminTd>
              <AdminTd className="text-[12px] text-white/40">{new Date(e.created_at).toLocaleString()}</AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      </div>

      {/* Ban modal */}
      <AdminModal open={banModal} onClose={() => setBanModal(false)} title="Ban User">
        <p className="text-[13px] text-white/50 mb-4">
          Banning <strong className="text-white">{user.name}</strong> will prevent them from logging in.
        </p>
        <AdminLabel>Reason (optional)</AdminLabel>
        <AdminInput value={reason} onChange={e => setReason(e.target.value)} placeholder="TOS violation, fraud, etc." className="mb-4" />
        <div className="flex gap-2 justify-end">
          <AdminBtn onClick={() => setBanModal(false)} variant="ghost">Cancel</AdminBtn>
          <AdminBtn onClick={() => doAction("ban", { reason })} variant="red" disabled={saving}>
            {saving ? "Banning…" : "Ban User"}
          </AdminBtn>
        </div>
      </AdminModal>

      {/* Notes modal */}
      <AdminModal open={notesModal} onClose={() => setNotesModal(false)} title="Admin Notes">
        <AdminLabel>Internal notes</AdminLabel>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#b33a4b]/50 resize-none mb-4"
          placeholder="Internal notes…"
        />
        <div className="flex gap-2 justify-end">
          <AdminBtn onClick={() => setNotesModal(false)} variant="ghost">Cancel</AdminBtn>
          <AdminBtn onClick={() => doAction("notes", { notes })} variant="default" disabled={saving}>
            {saving ? "Saving…" : "Save Notes"}
          </AdminBtn>
        </div>
      </AdminModal>
    </div>
  );
}
