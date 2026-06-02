"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle, Trash2, Link2, Copy } from "lucide-react";
import { ConfirmDialog, toast } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-[#f0efea] text-[#4a5168]",
  sent: "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
  converted: "bg-purple-50 text-purple-700",
};

export default function ChangeOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [co, setCo] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sending, setSending] = useState(false);
  const [approving, setApproving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/change-orders/${id}`).then(r => r.json()).then(d => {
      setCo(d.changeOrder);
      setItems(d.items ?? []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status: string) => {
    const body: any = { status };
    if (status === "sent") { body.sent_at = new Date().toISOString(); setSending(true); }
    if (status === "approved") { body.approved_at = new Date().toISOString(); setApproving(true); }
    const res = await fetch(`/api/change-orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSending(false); setApproving(false);
    if (res.ok) { toast(`Change order ${status}`); load(); }
    else toast(data.message ?? "Failed", "error");
  };

  const deleteCO = async () => {
    setDeleting(true);
    const res = await fetch(`/api/change-orders/${id}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);
    if (res.ok) { toast("Deleted"); router.push("/change-orders"); }
    else toast(data.message ?? "Failed to delete", "error");
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 skeleton rounded-lg" /><div className="card h-40 skeleton" /></div>;
  if (!co) return <div className="text-[#8a8fa3] py-20 text-center">Change order not found.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/change-orders" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /></Link>
        <div className="flex-1">
          <h1 className="page-title mb-0">{co.co_number}{co.title ? ` — ${co.title}` : ""}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge text-[11px] capitalize ${STATUS_COLORS[co.status] ?? ""}`}>{co.status}</span>
            {co.created_at && <span className="text-[12px] text-[#8a8fa3]">Created {fmtDate(co.created_at)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {co.status === "draft" && (
            <button onClick={() => updateStatus("sent")} disabled={sending} className="btn btn-primary btn-sm gap-1.5">
              <Send size={13} /> {sending ? "Sending…" : "Send for Approval"}
            </button>
          )}
          {co.status === "sent" && (
            <button onClick={() => updateStatus("approved")} disabled={approving} className="btn btn-green btn-sm gap-1.5">
              <CheckCircle size={13} /> {approving ? "Approving…" : "Mark Approved"}
            </button>
          )}
          {["draft","sent"].includes(co.status) && (
            <button onClick={() => setConfirmDelete(true)} className="btn btn-danger btn-sm gap-1.5">
              <Trash2 size={13} /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Info */}
          <div className="card p-5">
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              {co.contacts && (
                <div>
                  <p className="text-[11px] text-[#8a8fa3] uppercase tracking-wider font-semibold mb-1">Contact</p>
                  <Link href={`/contacts/${co.contact_id}`} className="text-brand-navy hover:underline font-medium">{co.contacts.full_name}</Link>
                </div>
              )}
              {co.projects && (
                <div>
                  <p className="text-[11px] text-[#8a8fa3] uppercase tracking-wider font-semibold mb-1">Project</p>
                  <Link href={`/projects/${co.project_id}`} className="text-brand-navy hover:underline font-medium">{co.projects.name}</Link>
                </div>
              )}
              {co.sent_at && (
                <div>
                  <p className="text-[11px] text-[#8a8fa3] uppercase tracking-wider font-semibold mb-1">Sent</p>
                  <p className="font-medium text-[#0c1226]">{fmtDate(co.sent_at)}</p>
                </div>
              )}
              {co.approved_at && (
                <div>
                  <p className="text-[11px] text-[#8a8fa3] uppercase tracking-wider font-semibold mb-1">Approved</p>
                  <p className="font-medium text-brand-green">{fmtDate(co.approved_at)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-[#e7e6e1]">
              <h3 className="section-title mb-0">Line Items</h3>
            </div>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Tax</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6 text-[#8a8fa3] text-[13px]">No line items</td></tr>
                ) : items.map((item, i) => (
                  <tr key={i}>
                    <td className="text-[13px]">{item.description || "—"}</td>
                    <td className="text-right text-[13px] text-[#4a5168]">{item.qty}</td>
                    <td className="text-right text-[13px] text-[#4a5168]">{fmt(item.rate)}</td>
                    <td className="text-right text-[12px] text-[#8a8fa3]">{item.tax_rate}%</td>
                    <td className="text-right font-medium text-[13px]">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(co.notes || co.terms) && (
            <div className="card p-5 space-y-3">
              {co.notes && <div><p className="text-[11px] text-[#8a8fa3] uppercase tracking-wider font-semibold mb-1">Notes</p><p className="text-[13px] text-[#4a5168] whitespace-pre-wrap">{co.notes}</p></div>}
              {co.terms && <div><p className="text-[11px] text-[#8a8fa3] uppercase tracking-wider font-semibold mb-1">Terms</p><p className="text-[13px] text-[#4a5168] whitespace-pre-wrap">{co.terms}</p></div>}
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="section-title mb-3">Summary</h3>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between text-[#4a5168]"><span>Subtotal</span><span>{fmt(co.subtotal)}</span></div>
              <div className="flex justify-between text-[#4a5168]"><span>Tax</span><span>{fmt(co.tax_amount)}</span></div>
              <div className="flex justify-between font-bold text-[#0c1226] pt-2 border-t border-[#e7e6e1] text-[15px]"><span>Total</span><span>{fmt(co.total)}</span></div>
            </div>
          </div>

          {/* Customer approval link */}
          <div className="card p-5">
            <h3 className="section-title mb-2 flex items-center gap-1.5">
              <Link2 size={13} className="text-[#8a8fa3]" /> Customer Approval
            </h3>
            <p className="text-[12px] text-[#8a8fa3] mb-3">
              Share this link for the customer to review and approve the change order online.
            </p>
            <button
              onClick={() => {
                const url = `${window.location.origin}/change-orders/${id}/preview`;
                navigator.clipboard.writeText(url).then(() => toast("Link copied!"));
              }}
              className="btn btn-outline btn-sm w-full">
              <Copy size={12} /> Copy approval link
            </button>
            <a
              href={`/change-orders/${id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm w-full mt-1.5 text-[#8a8fa3]">
              Preview as customer ↗
            </a>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteCO}
        title="Delete change order?"
        message={`This will permanently delete ${co.co_number}. This action cannot be undone.`}
        danger
      />
    </div>
  );
}
