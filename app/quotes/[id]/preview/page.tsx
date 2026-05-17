"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle, Phone, Mail, AlertCircle } from "lucide-react";
import { fmt, fmtDate } from "@/lib/utils";

export default function QuotePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/quotes/${id}/preview`)
      .then(r => r.json())
      .then(d => {
        if (d.quote) {
          setQuote(d.quote);
          if (d.quote.status === "approved") setApproved(true);
          if (d.quote.status === "rejected") setRejected(true);
        } else {
          setError("Quote not found.");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const approve = async () => {
    setApproving(true);
    const res = await fetch(`/api/quotes/${id}/preview`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    setApproving(false);
    if (res.ok) setApproved(true);
  };

  const requestChanges = async () => {
    const res = await fetch(`/api/quotes/${id}/preview`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    if (res.ok) setRejected(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f6f3] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-[#f6f6f3] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={40} className="mx-auto text-[#8a8fa3] mb-3" />
          <p className="text-[#4a5168]">{error || "Quote not found."}</p>
        </div>
      </div>
    );
  }

  const biz = quote.businesses;
  const contact = quote.contacts;
  const items = quote.quote_items ?? [];
  const subtotal = items.reduce((s: number, i: any) => s + (i.total ?? 0), 0);
  const taxAmount = items.reduce((s: number, i: any) => s + (i.total ?? 0) * ((i.tax_rate ?? 0) / 100), 0);
  const total = subtotal + taxAmount;
  const bizInitials = biz?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "CB";
  const contactName = contact?.full_name ?? "Customer";
  const contactAddress = [contact?.address, contact?.city, contact?.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-[#f6f6f3]">
      {/* Minimal topbar */}
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

          {/* Quote card */}
          <div className="bg-white rounded-2xl border border-[#e7e6e1] shadow-sm overflow-hidden">
            {/* Quote header */}
            <div className="px-7 pt-7 pb-5 border-b border-[#f0efea]">
              <div className="flex items-start justify-between mb-4">
                {/* Business info */}
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
                {/* Quote number + status */}
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider">Quote</p>
                  <p className="text-[16px] font-bold text-[#0c1226]">{quote.quote_number}</p>
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

              {/* Prepared for + valid through + amount */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-[10px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-1">Prepared for</p>
                  <p className="text-[13px] font-semibold text-[#0c1226]">{contactName}</p>
                  {contactAddress && <p className="text-[12px] text-[#8a8fa3]">{contactAddress}</p>}
                </div>
                {quote.valid_until && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-1">Valid through</p>
                    <p className="text-[13px] font-semibold text-[#0c1226]">{fmtDate(quote.valid_until)}</p>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="mt-4 pt-4 border-t border-[#f0efea]">
                <p className="text-[36px] font-bold text-[#0c1226] tracking-tight">{fmt(total)}</p>
                <p className="text-[12px] text-[#8a8fa3] mt-0.5">Total · incl. {items.some((i: any) => i.tax_rate > 0) ? `${items.find((i: any) => i.tax_rate > 0)?.tax_rate ?? 0}%` : "0%"} tax</p>
              </div>
            </div>

            {/* Quote title + notes */}
            <div className="px-7 py-5">
              {quote.title && (
                <h2 className="text-[18px] font-bold text-[#0c1226] mb-3">{quote.title}</h2>
              )}
              {quote.notes && (
                <p className="text-[13px] text-[#4a5168] leading-relaxed mb-5">{quote.notes}</p>
              )}

              {/* Line items */}
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
                          {item.quantity && item.unit ? `${item.quantity} ${item.unit}` : item.quantity ? `${item.quantity}` : "—"}
                        </td>
                        <td className="py-2.5 px-2 text-[#8a8fa3] whitespace-nowrap">
                          {item.unit_price ? `${fmt(item.unit_price)}/${item.unit || "ea"}` : "—"}
                        </td>
                        <td className="py-2.5 pl-2 text-right font-semibold text-[#0c1226] whitespace-nowrap">
                          {fmt(item.total ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Totals summary */}
              <div className="mt-4 flex justify-end">
                <div className="w-56 space-y-1 text-[13px]">
                  <div className="flex justify-between text-[#4a5168]">
                    <span>Subtotal</span><span>{fmt(subtotal)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-[#4a5168]">
                      <span>Tax · {items.find((i: any) => i.tax_rate > 0)?.tax_rate ?? 0}%</span>
                      <span>{fmt(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-[15px] border-t border-[#e7e6e1] pt-2 mt-1">
                    <span>Total</span><span>{fmt(total)}</span>
                  </div>
                </div>
              </div>

              {quote.terms && (
                <div className="mt-5 pt-4 border-t border-[#f0efea]">
                  <p className="text-[10px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-1">Terms</p>
                  <p className="text-[12px] text-[#4a5168] leading-relaxed">{quote.terms}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Decision card */}
            <div className="bg-white rounded-2xl border border-[#e7e6e1] p-5">
              <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-2">Your decision</p>
              {approved ? (
                <div className="text-center py-3">
                  <CheckCircle size={32} className="mx-auto text-brand-green mb-2" />
                  <p className="text-[14px] font-semibold text-brand-green">Quote approved!</p>
                  <p className="text-[12px] text-[#8a8fa3] mt-1">We've sent you a confirmation email.</p>
                </div>
              ) : rejected ? (
                <div className="text-center py-3">
                  <p className="text-[14px] font-semibold text-[#4a5168]">Changes requested</p>
                  <p className="text-[12px] text-[#8a8fa3] mt-1">The contractor will be in touch shortly.</p>
                </div>
              ) : (
                <>
                  <p className="text-[12px] text-[#4a5168] mb-4 leading-relaxed">
                    One click to approve — we'll auto-send a confirmation and schedule your start date.
                  </p>
                  <button onClick={approve} disabled={approving}
                    className="w-full flex items-center justify-center gap-2 h-[42px] bg-brand-green text-white text-[14px] font-semibold rounded-xl hover:bg-brand-green/90 transition-colors mb-2">
                    {approving ? "Approving…" : (
                      <><CheckCircle size={16} /> Approve quote</>
                    )}
                  </button>
                  <button onClick={requestChanges}
                    className="w-full h-[38px] border border-[#e7e6e1] text-[13px] font-medium text-[#4a5168] rounded-xl hover:bg-[#f6f6f3] transition-colors">
                    Request changes
                  </button>
                  <p className="text-[11px] text-[#8a8fa3] mt-3 leading-relaxed text-center">
                    ✦ Signing acts as your e-signature. You'll get a copy by email.
                  </p>
                </>
              )}
            </div>

            {/* Contractor card */}
            <div className="bg-white rounded-2xl border border-[#e7e6e1] p-5">
              <p className="text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-3">Your contractor</p>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-brand-navy rounded-full flex items-center justify-center">
                  <span className="text-white text-[11px] font-bold">{bizInitials}</span>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#0c1226]">{biz?.name}</p>
                  <p className="text-[11px] text-[#8a8fa3]">Owner · {biz?.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {biz?.phone && (
                  <a href={`tel:${biz.phone}`}
                    className="flex items-center justify-center gap-1.5 h-[34px] border border-[#e7e6e1] rounded-lg text-[12px] text-[#4a5168] hover:bg-[#f6f6f3] transition-colors">
                    <Phone size={12} /> Call
                  </a>
                )}
                {biz?.email && (
                  <a href={`mailto:${biz.email}`}
                    className="flex items-center justify-center gap-1.5 h-[34px] border border-[#e7e6e1] rounded-lg text-[12px] text-[#4a5168] hover:bg-[#f6f6f3] transition-colors">
                    <Mail size={12} /> Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
