"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MonoId, StatusPill, AdminTable, AdminTr, AdminTd,
  AdminModal, AdminInput, AdminLabel, AdminBtn, AdminEmpty,
} from "@/components/admin/ui";
import { ArrowLeft, AlertTriangle, CheckCircle, StickyNote } from "lucide-react";

export default function AdminBusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [suspendModal, setSuspendModal] = useState(false);
  const [notesModal, setNotesModal] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/businesses/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setNotes(d.business?.notes ?? ""); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  async function doAction(action: string, payload?: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/admin/businesses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    if (res.ok) { load(); setSuspendModal(false); setNotesModal(false); }
    setSaving(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-white/30 text-[13px]">Loading…</div>
  );
  if (!data?.business) return (
    <div className="text-center py-16 text-white/30">Business not found</div>
  );

  const { business, members, subscription, invoices, payments } = data;
  const isSuspended = business.admin_status === "suspended";

  return (
    <div className="space-y-6 animate-fade-in max-w-[960px]">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push("/admin/businesses")}
          className="mt-1 p-1.5 rounded-[7px] text-[#6b7280] hover:text-[#0d1117] hover:bg-white border border-[#e5e7eb] transition-colors flex-shrink-0">
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[22px] font-semibold text-[#0d1117]">{business.name}</h1>
            <StatusPill status={isSuspended ? "suspended" : "active"} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-[12px] text-[#6b7280]">
            <MonoId id={business.id} prefix="biz" />
            <span>·</span>
            <span>{business.email ?? "—"}</span>
            <span>·</span>
            <span>Created {new Date(business.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AdminBtn onClick={() => setNotesModal(true)} variant="default">
            <StickyNote size={12} /> Notes
          </AdminBtn>
          {isSuspended ? (
            <AdminBtn onClick={() => doAction("reactivate")} variant="default" disabled={saving}>
              <CheckCircle size={12} /> Reactivate
            </AdminBtn>
          ) : (
            <AdminBtn onClick={() => setSuspendModal(true)} variant="red">
              <AlertTriangle size={12} /> Suspend
            </AdminBtn>
          )}
        </div>
      </div>

      {/* Suspension notice */}
      {isSuspended && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] px-4 py-3">
          <p className="text-red-400 text-[13px] font-medium">Suspended {business.suspended_at ? new Date(business.suspended_at).toLocaleDateString() : ""}</p>
          {business.suspended_reason && <p className="text-red-400/70 text-[12px] mt-0.5">{business.suspended_reason}</p>}
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-[12px] p-4">
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-1">Subscription</p>
          {subscription ? (
            <>
              <p className="text-white font-medium text-[14px]">{subscription.plans?.name ?? "Unknown Plan"}</p>
              <StatusPill status={subscription.status} />
              {subscription.trial_ends_at && (
                <p className="text-[11px] text-white/30 mt-1">Trial ends {new Date(subscription.trial_ends_at).toLocaleDateString()}</p>
              )}
            </>
          ) : <p className="text-white/30 text-[13px]">No subscription</p>}
        </div>
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-[12px] p-4">
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-1">Team</p>
          <p className="text-white font-medium text-[14px]">{members?.length ?? 0} members</p>
        </div>
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-[12px] p-4">
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-1">Admin Notes</p>
          <p className="text-white/50 text-[12px] line-clamp-3">{business.notes || "No notes"}</p>
        </div>
      </div>

      {/* Members */}
      <div>
        <p className="text-[13px] font-semibold text-[#0d1117] mb-3">Team Members</p>
        <AdminTable headers={["User", "Role", "Joined"]}>
          {(members ?? []).length === 0 && <AdminEmpty />}
          {(members ?? []).map((m: any) => (
            <AdminTr key={m.user_id} onClick={() => router.push(`/admin/users/${m.user_id}`)}>
              <AdminTd>
                <div>
                  <p className="text-white font-medium text-[13px]">{m.users?.name ?? "—"}</p>
                  <p className="text-[11px] text-white/30">{m.users?.email}</p>
                </div>
              </AdminTd>
              <AdminTd><StatusPill status={m.role} /></AdminTd>
              <AdminTd className="text-[12px] text-white/40">
                {m.users?.created_at ? new Date(m.users.created_at).toLocaleDateString() : "—"}
              </AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      </div>

      {/* Recent invoices */}
      <div>
        <p className="text-[13px] font-semibold text-[#0d1117] mb-3">Recent Invoices</p>
        <AdminTable headers={["Invoice #", "Total", "Status", "Date"]}>
          {(invoices ?? []).length === 0 && <AdminEmpty message="No invoices" />}
          {(invoices ?? []).map((inv: any) => (
            <AdminTr key={inv.id}>
              <AdminTd className="font-mono text-[12px]">{inv.invoice_number}</AdminTd>
              <AdminTd className="font-medium text-white">${(inv.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</AdminTd>
              <AdminTd><StatusPill status={inv.status} /></AdminTd>
              <AdminTd className="text-[12px] text-white/40">{new Date(inv.created_at).toLocaleDateString()}</AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      </div>

      {/* Suspend modal */}
      <AdminModal open={suspendModal} onClose={() => setSuspendModal(false)} title="Suspend Business">
        <p className="text-[13px] text-white/50 mb-4">
          Suspending <strong className="text-white">{business.name}</strong> will prevent all users from accessing the platform.
        </p>
        <AdminLabel>Reason (optional)</AdminLabel>
        <AdminInput
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Policy violation, payment issue, etc."
          className="mb-4"
        />
        <div className="flex gap-2 justify-end">
          <AdminBtn onClick={() => setSuspendModal(false)} variant="ghost">Cancel</AdminBtn>
          <AdminBtn onClick={() => doAction("suspend", { reason })} variant="red" disabled={saving}>
            {saving ? "Suspending…" : "Suspend Business"}
          </AdminBtn>
        </div>
      </AdminModal>

      {/* Notes modal */}
      <AdminModal open={notesModal} onClose={() => setNotesModal(false)} title="Admin Notes">
        <AdminLabel>Internal notes (not visible to business)</AdminLabel>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#b33a4b]/50 resize-none mb-4"
          placeholder="Internal notes about this business…"
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
