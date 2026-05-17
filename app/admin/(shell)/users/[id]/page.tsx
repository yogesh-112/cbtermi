"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MonoId, StatusPill, AdminTable, AdminTr, AdminTd,
  AdminModal, AdminInput, AdminLabel, AdminBtn, AdminEmpty, InfoCard,
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

  if (loading) return <div className="flex items-center justify-center h-64 text-[#9399a8] text-[13px]">Loading…</div>;
  if (!data?.user) return <div className="text-center py-16 text-[#9399a8]">User not found</div>;

  const { user, memberships, auditEvents } = data;

  return (
    <div className="space-y-5 max-w-[860px]">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push("/admin/users")}
          className="mt-1 p-1.5 rounded-[7px] text-[#6b7280] hover:text-[#0d1117] hover:bg-white border border-[#e8e9ed] transition-colors shadow-sm flex-shrink-0">
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-full bg-[#f0f1f5] flex items-center justify-center text-[14px] font-bold text-[#374151] flex-shrink-0">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <h1 className="text-[20px] font-bold text-[#0d1117]">{user.name}</h1>
            <StatusPill status={user.is_banned ? "banned" : user.email_verified ? "active" : "inactive"} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-[12px] text-[#9399a8] flex-wrap">
            <MonoId id={user.id} prefix="usr" />
            <span>·</span><span>{user.email}</span>
            <span>·</span>
            <span>Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          {!user.email_verified && (
            <AdminBtn onClick={() => doAction("verify_email")} disabled={saving}>
              <MailCheck size={12} /> Verify Email
            </AdminBtn>
          )}
          <AdminBtn onClick={() => setNotesModal(true)}>
            <StickyNote size={12} /> Notes
          </AdminBtn>
          {user.is_banned ? (
            <AdminBtn onClick={() => doAction("unban")} disabled={saving}>
              <CheckCircle size={12} /> Unban
            </AdminBtn>
          ) : (
            <AdminBtn onClick={() => setBanModal(true)} variant="red">
              <Ban size={12} /> Ban User
            </AdminBtn>
          )}
        </div>
      </div>

      {/* Ban banner */}
      {user.is_banned && (
        <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
          <p className="text-red-700 text-[13px] font-semibold">
            Banned {user.banned_at ? new Date(user.banned_at).toLocaleDateString() : ""}
          </p>
          {user.banned_reason && <p className="text-red-600 text-[12px] mt-0.5">{user.banned_reason}</p>}
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard label="Account">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[12px]">
              <span className="text-[#9399a8]">Email verified</span>
              <span className={user.email_verified ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                {user.email_verified ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-[#9399a8]">Businesses</span>
              <span className="text-[#0d1117] font-medium">{memberships?.length ?? 0}</span>
            </div>
          </div>
        </InfoCard>
        <InfoCard label="Admin Notes">
          <p className="text-[#6b7280] text-[12px] whitespace-pre-wrap line-clamp-3">{user.admin_notes || "No notes"}</p>
          <button onClick={() => setNotesModal(true)} className="text-[11px] text-[#b33a4b] hover:underline mt-1">Edit</button>
        </InfoCard>
        <InfoCard label="Recent Activity">
          <p className="text-[#0d1117] font-bold text-[22px] leading-none">{auditEvents?.length ?? 0}</p>
          <p className="text-[11px] text-[#9399a8] mt-1">recent actions</p>
        </InfoCard>
      </div>

      {/* Business memberships */}
      <div>
        <p className="text-[14px] font-semibold text-[#0d1117] mb-3">Business Memberships</p>
        <AdminTable headers={["Business", "Role", "Status"]}>
          {(memberships ?? []).length === 0 && <AdminEmpty message="No business memberships" />}
          {(memberships ?? []).map((m: any) => (
            <AdminTr key={m.business_id} onClick={() => router.push(`/admin/businesses/${m.business_id}`)}>
              <AdminTd>
                <p className="text-[#0d1117] font-medium text-[13px]">{m.businesses?.name ?? "—"}</p>
                <MonoId id={m.business_id} prefix="biz" />
              </AdminTd>
              <AdminTd><StatusPill status={m.role} /></AdminTd>
              <AdminTd><StatusPill status={m.businesses?.admin_status ?? "active"} /></AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      </div>

      {/* Activity */}
      <div>
        <p className="text-[14px] font-semibold text-[#0d1117] mb-3">Recent Activity</p>
        <AdminTable headers={["Action", "Entity", "When"]}>
          {(auditEvents ?? []).length === 0 && <AdminEmpty message="No activity" />}
          {(auditEvents ?? []).map((e: any, i: number) => (
            <AdminTr key={i}>
              <AdminTd className="font-medium text-[#0d1117]">{e.action}</AdminTd>
              <AdminTd className="text-[12px] text-[#6b7280]">{e.entity_type ?? "—"}</AdminTd>
              <AdminTd className="text-[12px] text-[#9399a8]">{new Date(e.created_at).toLocaleString()}</AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      </div>

      {/* Ban modal */}
      <AdminModal open={banModal} onClose={() => setBanModal(false)} title="Ban User">
        <p className="text-[13px] text-[#6b7280] mb-4">
          Banning <strong className="text-[#0d1117]">{user.name}</strong> will prevent them from logging in.
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
          className="w-full bg-white border border-[#e2e4e9] text-[#1a2030] placeholder-[#c0c3cc] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#b33a4b] resize-none mb-4"
          placeholder="Internal notes…"
        />
        <div className="flex gap-2 justify-end">
          <AdminBtn onClick={() => setNotesModal(false)} variant="ghost">Cancel</AdminBtn>
          <AdminBtn onClick={() => doAction("notes", { notes })} disabled={saving}>
            {saving ? "Saving…" : "Save Notes"}
          </AdminBtn>
        </div>
      </AdminModal>
    </div>
  );
}
