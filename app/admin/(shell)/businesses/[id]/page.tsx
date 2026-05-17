"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MonoId, StatusPill, AdminTable, AdminTr, AdminTd,
  AdminModal, AdminInput, AdminLabel, AdminBtn, AdminEmpty, InfoCard,
} from "@/components/admin/ui";
import { ArrowLeft, AlertTriangle, CheckCircle, StickyNote, Building2 } from "lucide-react";

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
    <div className="flex items-center justify-center h-64 text-[#9399a8] text-[13px]">Loading…</div>
  );
  if (!data?.business) return (
    <div className="text-center py-16 text-[#9399a8]">Business not found</div>
  );

  const { business, members, subscription, invoices, payments } = data;
  const isSuspended = business.admin_status === "suspended";

  return (
    <div className="space-y-5 max-w-[960px]">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push("/admin/businesses")}
          className="mt-1 p-1.5 rounded-[7px] text-[#6b7280] hover:text-[#0d1117] hover:bg-white border border-[#e8e9ed] transition-colors shadow-sm flex-shrink-0">
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-full bg-[#f0f1f5] flex items-center justify-center text-[14px] font-bold text-[#374151] flex-shrink-0">
              {business.name?.charAt(0)?.toUpperCase()}
            </div>
            <h1 className="text-[20px] font-bold text-[#0d1117]">{business.name}</h1>
            <StatusPill status={isSuspended ? "suspended" : "active"} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-[12px] text-[#9399a8] flex-wrap">
            <MonoId id={business.id} prefix="biz" />
            {business.email && <><span>·</span><span>{business.email}</span></>}
            <span>·</span>
            <span>Created {new Date(business.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <AdminBtn onClick={() => setNotesModal(true)}>
            <StickyNote size={12} /> Notes
          </AdminBtn>
          {isSuspended ? (
            <AdminBtn onClick={() => doAction("reactivate")} disabled={saving}>
              <CheckCircle size={12} /> Reactivate
            </AdminBtn>
          ) : (
            <AdminBtn onClick={() => setSuspendModal(true)} variant="red">
              <AlertTriangle size={12} /> Suspend
            </AdminBtn>
          )}
        </div>
      </div>

      {/* Suspension banner */}
      {isSuspended && (
        <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
          <p className="text-red-700 text-[13px] font-semibold">
            Suspended {business.suspended_at ? new Date(business.suspended_at).toLocaleDateString() : ""}
          </p>
          {business.suspended_reason && (
            <p className="text-red-600 text-[12px] mt-0.5">{business.suspended_reason}</p>
          )}
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard label="Subscription">
          {subscription ? (
            <div className="space-y-1.5">
              <p className="text-[#0d1117] font-semibold text-[14px]">{subscription.plans?.name ?? "Unknown Plan"}</p>
              <StatusPill status={subscription.status} />
              {subscription.trial_ends_at && (
                <p className="text-[11px] text-[#9399a8]">Trial ends {new Date(subscription.trial_ends_at).toLocaleDateString()}</p>
              )}
            </div>
          ) : <p className="text-[#9399a8] text-[13px]">No subscription</p>}
        </InfoCard>

        <InfoCard label="Team">
          <p className="text-[#0d1117] font-bold text-[22px] leading-none">{members?.length ?? 0}</p>
          <p className="text-[11px] text-[#9399a8] mt-1">members</p>
        </InfoCard>

        <InfoCard label="Admin Notes">
          <p className="text-[#6b7280] text-[12px] line-clamp-3">{business.notes || "No notes added"}</p>
          <button onClick={() => setNotesModal(true)} className="text-[11px] text-[#b33a4b] hover:underline mt-1">Edit notes</button>
        </InfoCard>
      </div>

      {/* Members */}
      <div>
        <p className="text-[14px] font-semibold text-[#0d1117] mb-3">Team Members</p>
        <AdminTable headers={["User", "Role", "Status", "Joined"]}>
          {(members ?? []).length === 0 && <AdminEmpty />}
          {(members ?? []).map((m: any) => (
            <AdminTr key={m.user_id} onClick={() => router.push(`/admin/users/${m.user_id}`)}>
              <AdminTd>
                <div>
                  <p className="text-[#0d1117] font-medium text-[13px]">{m.users?.name ?? "—"}</p>
                  <p className="text-[11px] text-[#9399a8]">{m.users?.email}</p>
                </div>
              </AdminTd>
              <AdminTd><StatusPill status={m.role} /></AdminTd>
              <AdminTd><StatusPill status={m.users?.is_banned ? "banned" : "active"} /></AdminTd>
              <AdminTd className="text-[12px] text-[#9399a8]">
                {m.users?.created_at ? new Date(m.users.created_at).toLocaleDateString() : "—"}
              </AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      </div>

      {/* Recent invoices */}
      <div>
        <p className="text-[14px] font-semibold text-[#0d1117] mb-3">Recent Invoices</p>
        <AdminTable headers={["Invoice #", "Total", "Status", "Date"]}>
          {(invoices ?? []).length === 0 && <AdminEmpty message="No invoices" />}
          {(invoices ?? []).map((inv: any) => (
            <AdminTr key={inv.id}>
              <AdminTd className="font-mono text-[12px] text-[#374151]">{inv.invoice_number}</AdminTd>
              <AdminTd className="font-semibold text-[#0d1117]">
                ${(inv.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </AdminTd>
              <AdminTd><StatusPill status={inv.status} /></AdminTd>
              <AdminTd className="text-[12px] text-[#9399a8]">{new Date(inv.created_at).toLocaleDateString()}</AdminTd>
            </AdminTr>
          ))}
        </AdminTable>
      </div>

      {/* Suspend modal */}
      <AdminModal open={suspendModal} onClose={() => setSuspendModal(false)} title="Suspend Business">
        <p className="text-[13px] text-[#6b7280] mb-4">
          Suspending <strong className="text-[#0d1117]">{business.name}</strong> will prevent all users from accessing the platform.
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
          className="w-full bg-white border border-[#e2e4e9] text-[#1a2030] placeholder-[#c0c3cc] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#b33a4b] resize-none mb-4"
          placeholder="Internal notes about this business…"
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
