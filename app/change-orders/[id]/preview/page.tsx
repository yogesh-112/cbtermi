"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, AlertCircle } from "lucide-react";
import { fmt, fmtDate } from "@/lib/utils";

export default function ChangeOrderPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [co, setCo]           = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved]   = useState(false);
  const [rejected, setRejected]   = useState(false);
  const [error, setError]     = useState("");
  const [signModal, setSignModal] = useState(false);
  const [signerName, setSignerName] = useState("");

  useEffect(() => {
    fetch(`/api/change-orders/${id}/preview`)
      .then(r => r.json())
      .then(d => {
        if (d.changeOrder) {
          setCo(d.changeOrder);
          if (d.changeOrder.status === "approved") setApproved(true);
          if (d.changeOrder.status === "rejected") setRejected(true);
        } else {
          setError("Change order not found.");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const approve = async () => {
    if (!signerName.trim()) return;
    setSignModal(false);
    setApproving(true);
    const res = await fetch(`/api/change-orders/${id}/preview`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved", approved_by: signerName.trim() }),
    });
    setApproving(false);
    if (res.ok) setApproved(true);
  };

  const requestChanges = async () => {
    const res = await fetch(`/api/change-orders/${id}/preview`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    if (res.ok) setRejected(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f6f6f3] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !co) return (
    <div className="min-h-screen bg-[#f6f6f3] flex items-center justify-center">
      <div className="text-center">
        <AlertCircle size={40} className="mx-auto text-[#8a8fa3] mb-3" />
        <p className="text-[#4a5168]">{error || "Change order not found."}</p>
      </div>
    </div>
  );

  const biz     = co.businesses;
  const contact = co.contacts;
  const items   = co.change_order_items ?? [];
  const subtotal  = items.reduce((s: number, i: any) => s + (i.total ?? 0), 0);
  const taxAmount = items.reduce((s: number, i: any) => s + (i.total ?? 0) * ((i.tax_rate ?? 0) / 100), 0);
  const total     = subtotal + taxAmount;
  const bizInitials = biz?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "CB";
  const contactName = contact?.full_name ?? "Customer";

  return (
    <div className="min-h-screen bg-[#f6f6f3]">
      {/* Header */}
      <header className="bg-white border-b border-[#e7e6e1] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-navy rounded flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">{bizInitials}</span>
          </div>
          <span className="font-semibold text-[14px] text-[#0c1226]">{biz?.name ?? "Clear Build USA"}</span>
        </div>
        <p className="text-[12px] text-[#8a8fa3]">Secure customer view · Powered by Clear Build</p>
      </header>

      <div className="max-w-[820px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">

          {/* Change Order card */}
          <div className="bg-white rounded-2xl border border-[#e7e6e1] shadow-sm overflow-hidden">
            <div className="px-7 pt-7 pb-5 border-b border-[#f0efea]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-navy rounded-lg flex items-center justify-center">
                    <span className="text-white text-[13px] font-bold">{bizInitials}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[14px] text-[#0c1226]">{biz?.name}</p>
                    <p className="text-[12px] text-[#8a8fa3]">
                      {[biz?.address, biz?.city, biz?.state].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider">Change Order</p>
                  <p className="text-[16px] font-bold text-[#0c1226]">{co.co_number}</p>
                  {approved ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full mt-1">
                      <CheckCircle size={10} /> Approved
                    </span>
                  ) : rejected ? (
                    <span className="inline-flex text-[11px] font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full mt-1">
                      Changes requested
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full mt-1">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Awaiting approval
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-[10px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-1">Prepared for</p>
                  <p className="text-[13px] font-semibold text-[#0c1226]">{contactName}</p>
                </div>
                {co.projects?.name && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-1">Project</p>
                    <p className="text-[13px] font-semibold text-[#0c1226]">{co.projects.name}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-[#f0efea]">
                <p className="text-[36px] font-bold text-[#0c1226] tracking-tight">{fmt(total)}</p>
                <p className="text-[12px] text-[#8a8fa3] mt-0.5">Additional scope total</p>
              </div>
            </div>

            <div className="px-7 py-5">
              {co.title && <h2 className="text-[18px] font-bold text-[#0c1226] mb-3">{co.title}</h2>}
              {co.description && (
                <p className="text-[13px] text-[#4a5168] leading-relaxed mb-5">{co.description}</p>
              )}

              {items.length > 0 && (
                <table className="w-full text-[13px]">
                  <tbody>
                    {items.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-[#f6f6f3]">
                        <td className="py-2.5 pr-4">
                          <p className="font-medium text-[#0c1226]">{item.item_name}</p>
                          {item.description && <p className="text-[11px] text-[#8a8fa3]">{item.description}</p>}
                        </td>
                        <td className="py-2.5 px-2 text-[#8a8fa3] whitespace-nowrap">
                          {item.quantity ? `${item.quantity}` : "—"}
                        </td>
                        <td className="py-2.5 pl-2 text-right font-semibold text-[#0c1226] whitespace-nowrap">
                          {fmt(item.total ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="mt-4 flex justify-end">
                <div className="w-56 space-y-1 text-[13px]">
                  <div className="flex justify-between text-[#4a5168]">
                    <span>Subtotal</span><span>{fmt(subtotal)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-[#4a5168]">
                      <span>Tax</span><span>{fmt(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-[15px] border-t border-[#e7e6e1] pt-2 mt-1">
                    <span>Total</span><span>{fmt(total)}</span>
                  </div>
                </div>
              </div>

              {co.terms && (
                <div className="mt-5 pt-4 border-t border-[#f0efea]">
                  <p className="text-[10px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-1">Terms</p>
                  <p className="text-[12px] text-[#4a5168] leading-relaxed">{co.terms}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar — decision */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#e7e6e1] p-5">
              <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-2">Your decision</p>
              {approved ? (
                <div className="text-center py-3">
                  <CheckCircle size={32} className="mx-auto text-brand-green mb-2" />
                  <p className="text-[14px] font-semibold text-brand-green">Change order approved!</p>
                  <p className="text-[12px] text-[#8a8fa3] mt-1">The contractor has been notified.</p>
                </div>
              ) : rejected ? (
                <div className="text-center py-3">
                  <p className="text-[14px] font-semibold text-[#4a5168]">Changes requested</p>
                  <p className="text-[12px] text-[#8a8fa3] mt-1">The contractor will be in touch shortly.</p>
                </div>
              ) : (
                <>
                  <p className="text-[12px] text-[#4a5168] mb-4 leading-relaxed">
                    Review the scope changes above. Approving authorizes additional work and cost.
                  </p>
                  <button onClick={() => { setSignerName(contactName); setSignModal(true); }}
                    disabled={approving}
                    className="w-full flex items-center justify-center gap-2 h-[42px] bg-brand-green text-white text-[14px] font-semibold rounded-xl hover:bg-brand-green/90 transition-colors mb-2">
                    {approving ? "Approving…" : <><CheckCircle size={16} /> Approve change order</>}
                  </button>
                  <button onClick={requestChanges}
                    className="w-full h-[38px] border border-[#e7e6e1] text-[13px] font-medium text-[#4a5168] rounded-xl hover:bg-[#f6f6f3] transition-colors">
                    Request changes
                  </button>
                  <p className="text-[11px] text-[#8a8fa3] mt-3 leading-relaxed text-center">
                    ✦ Approving authorizes the additional scope and cost shown above.
                  </p>
                </>
              )}
            </div>

            {/* Business contact */}
            {biz && (
              <div className="bg-white rounded-2xl border border-[#e7e6e1] p-5 text-[13px]">
                <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-2">Questions?</p>
                <p className="font-semibold text-[#0c1226]">{biz.name}</p>
                {biz.phone && <p className="text-[#4a5168] mt-1">{biz.phone}</p>}
                {biz.email && <p className="text-[#4a5168]">{biz.email}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sign modal */}
      {signModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-[16px] font-bold text-[#0c1226] mb-1">Confirm your name</h3>
            <p className="text-[13px] text-[#6b7280] mb-4">
              Type your full name to approve this change order. This serves as your e-signature.
            </p>
            <input
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              placeholder="Your full name"
              className="w-full border border-[#e7e6e1] rounded-xl px-3 py-2.5 text-[14px] mb-4 focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
            <div className="flex gap-2">
              <button onClick={() => setSignModal(false)}
                className="flex-1 h-10 border border-[#e7e6e1] text-[13px] font-medium text-[#4a5168] rounded-xl hover:bg-[#f6f6f3] transition-colors">
                Cancel
              </button>
              <button onClick={approve} disabled={!signerName.trim()}
                className="flex-1 h-10 bg-brand-green text-white text-[13px] font-semibold rounded-xl hover:bg-brand-green/90 disabled:opacity-50 transition-colors">
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
