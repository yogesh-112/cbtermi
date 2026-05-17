"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Copy, Trash2, CheckCircle, Printer, Briefcase,
  Receipt, XCircle, Mail, MessageCircle, Phone, Clock, Send,
} from "lucide-react";
import { StatusBadge, toast, ConfirmDialog } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

const STATUS_FLOW = ["draft","sent","viewed","approved","converted"];

export default function QuoteDetailPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const [data, setData]         = useState<any>(null);
  const [delConfirm, setDelConfirm] = useState(false);
  const [converting, setConverting] = useState(false);
  /* send channel state */
  const [sendEmail, setSendEmail]       = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendSMS, setSendSMS]           = useState(false);

  const load = () => fetch(`/api/quotes/${id}`).then(r => r.json()).then(setData);
  useEffect(() => { load(); }, [id]);

  const markStatus = async (status: string) => {
    await fetch(`/api/quotes/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast(`Marked as ${status}`); load();
  };

  const duplicate = async () => {
    if (!data) return;
    const { quote, items } = data;
    const res = await fetch("/api/quotes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...quote, id: undefined, quote_number: undefined, status: "draft", items }),
    });
    if (res.ok) { const d = await res.json(); router.push(`/quotes/${d.quote.id}`); toast("Quote duplicated"); }
  };

  const convertToProject = async () => {
    if (!data) return;
    setConverting(true);
    const { quote } = data;
    const res = await fetch("/api/projects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: quote.title || `Project from ${quote.quote_number}`,
        contact_id: quote.contact_id, description: quote.notes,
        address: quote.project_address, status: "active",
      }),
    });
    if (res.ok) {
      await markStatus("converted");
      const d = await res.json();
      setConverting(false); router.push(`/projects/${d.project.id}`); toast("Converted to project");
    } else { setConverting(false); toast("Failed to convert", "error"); }
  };

  const convertToInvoice = async () => {
    if (!data) return;
    const { quote, items } = data;
    const res = await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_id: quote.contact_id, project_id: quote.project_id, notes: quote.notes, terms: quote.terms, issue_date: new Date().toISOString().split("T")[0], items }),
    });
    if (res.ok) { const d = await res.json(); await markStatus("converted"); router.push(`/invoices/${d.invoice.id}`); toast("Converted to invoice"); }
  };

  const del = async () => {
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    toast("Quote deleted"); router.push("/quotes");
  };

  if (!data) return <div className="flex items-center justify-center h-64 text-[#8a8fa3]">Loading…</div>;
  const { quote, items } = data;
  const canSend    = quote.status === "draft";
  const canApprove = ["sent","viewed"].includes(quote.status);
  const canConvert = quote.status === "approved";
  const statusIdx  = STATUS_FLOW.indexOf(quote.status);

  /* synthetic activity */
  const activity = [
    { icon: Clock,         label: "Quote created",       date: quote.created_at, color: "bg-[#f0efea] text-[#8a8fa3]" },
    quote.status !== "draft" && { icon: Send, label: "Sent to customer", date: quote.updated_at, color: "bg-blue-50 text-brand-navy" },
    ["viewed","approved","converted"].includes(quote.status) && { icon: CheckCircle, label: "Customer viewed quote", date: quote.updated_at, color: "bg-amber-50 text-amber-700" },
    quote.status === "approved" && { icon: CheckCircle, label: "Marked as approved", date: quote.updated_at, color: "bg-brand-green/10 text-brand-green" },
  ].filter(Boolean) as any[];

  return (
    <>
      <style>{`@media print{body *{visibility:hidden}#q-print,#q-print *{visibility:visible}#q-print{position:absolute;left:0;top:0;width:100%}.no-print{display:none!important}}`}</style>

      {/* Header */}
      <div className="no-print flex items-start gap-3 mb-5 flex-wrap">
        <Link href="/quotes" className="btn btn-ghost btn-sm p-2 mt-0.5"><ArrowLeft size={14} /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title truncate">{quote.title || quote.quote_number}</h1>
            <StatusBadge status={quote.status} />
          </div>
          <p className="text-[12px] text-[#8a8fa3] mt-0.5">
            Quote {quote.quote_number} · Created {fmtDate(quote.created_at)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={duplicate} className="btn btn-outline btn-sm"><Copy size={13} /> Duplicate</button>
          {canConvert && (
            <button onClick={convertToProject} disabled={converting} className="btn btn-primary btn-sm">
              <Briefcase size={13} /> {converting ? "Creating…" : "Convert to project"}
            </button>
          )}
          <button onClick={() => window.print()} className="btn btn-outline btn-sm"><Printer size={13} /></button>
          <button onClick={() => setDelConfirm(true)} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Status flow */}
      <div className="no-print flex items-center gap-1.5 flex-wrap mb-5">
        {STATUS_FLOW.map((s, i) => {
          const isCurrent = s === quote.status;
          const isPast    = statusIdx > i;
          return (
            <span key={s} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              isCurrent ? "bg-brand-navy text-white" :
              isPast    ? "bg-brand-green/10 text-brand-green" :
                          "bg-[#f0efea] text-[#8a8fa3]"
            }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          );
        })}
        {quote.status === "rejected" && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600">Rejected</span>
        )}
      </div>

      <div id="q-print" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: quote body ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            {/* Metadata */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-5 border-b border-[#f0efea] text-[13px]">
              <div>
                <p className="text-[11px] text-[#8a8fa3] uppercase tracking-wide mb-1">Customer</p>
                {quote.contacts && (
                  <>
                    <p className="font-semibold text-[#0c1226]">{quote.contacts.full_name}</p>
                    <p className="text-[12px] text-[#8a8fa3]">{quote.contacts.email}</p>
                  </>
                )}
              </div>
              {quote.project_address && (
                <div>
                  <p className="text-[11px] text-[#8a8fa3] uppercase tracking-wide mb-1">Job site</p>
                  <p className="text-[#4a5168]">{quote.project_address}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-[#8a8fa3] uppercase tracking-wide mb-1">Valid through</p>
                <p className="text-[#4a5168]">{quote.valid_until ? fmtDate(quote.valid_until) : "—"}</p>
                {quote.valid_until && (
                  <p className="text-[11px] text-[#8a8fa3]">
                    {Math.ceil((new Date(quote.valid_until).getTime() - Date.now()) / 86400000)} days
                  </p>
                )}
              </div>
            </div>

            {/* Line items */}
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e7e6e1]">
                  <th className="text-left py-2 text-[11px] text-[#8a8fa3] uppercase tracking-wide font-semibold">Item</th>
                  <th className="text-right py-2 text-[11px] text-[#8a8fa3] uppercase tracking-wide font-semibold w-14">Unit</th>
                  <th className="text-right py-2 text-[11px] text-[#8a8fa3] uppercase tracking-wide font-semibold w-12">Qty</th>
                  <th className="text-right py-2 text-[11px] text-[#8a8fa3] uppercase tracking-wide font-semibold w-20">Rate</th>
                  <th className="text-right py-2 text-[11px] text-[#8a8fa3] uppercase tracking-wide font-semibold w-22">Total</th>
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((item: any, i: number) => (
                  <tr key={i} className="border-b border-[#f6f6f3]">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-[#0c1226]">{item.item_name}</p>
                      {item.description && <p className="text-[12px] text-[#8a8fa3] mt-0.5">{item.description}</p>}
                      {item.optional && <span className="text-[11px] text-amber-600 font-medium">(Optional)</span>}
                    </td>
                    <td className="py-3 text-right text-[#4a5168]">{item.unit || "—"}</td>
                    <td className="py-3 text-right text-[#4a5168]">{item.quantity}</td>
                    <td className="py-3 text-right text-[#4a5168]">{fmt(item.unit_price)}</td>
                    <td className="py-3 text-right font-semibold text-[#0c1226]">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mt-5">
              <div className="w-52 space-y-2 text-[13px]">
                <div className="flex justify-between text-[#8a8fa3]">
                  <span>Subtotal</span><span>{fmt(quote.subtotal)}</span>
                </div>
                {(quote.tax_amount ?? 0) > 0 && (
                  <div className="flex justify-between text-[#8a8fa3]">
                    <span>Tax {quote.tax_rate ? `${quote.tax_rate}%` : ""}</span>
                    <span>{fmt(quote.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[17px] border-t border-[#e7e6e1] pt-2 mt-1">
                  <span>Total</span><span className="text-[#0c1226]">{fmt(quote.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(quote.notes || quote.terms) && (
            <div className="card p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-[13px]">
              {quote.notes && (
                <div>
                  <p className="font-semibold text-[#0c1226] mb-1.5">Note to customer</p>
                  <p className="text-[#4a5168] leading-relaxed whitespace-pre-line">{quote.notes}</p>
                </div>
              )}
              {quote.terms && (
                <div>
                  <p className="font-semibold text-[#0c1226] mb-1.5">Terms</p>
                  <p className="text-[#4a5168] leading-relaxed whitespace-pre-line">{quote.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4 no-print">
          {/* Send panel */}
          <div className="card p-5">
            <h3 className="section-title mb-3">Send</h3>

            {/* Channel toggles */}
            <div className="space-y-2 mb-4">
              {[
                { label: "Email",     icon: Mail,           val: sendEmail,    set: setSendEmail },
                { label: "WhatsApp",  icon: MessageCircle,  val: sendWhatsApp, set: setSendWhatsApp },
                { label: "SMS",       icon: Phone,          val: sendSMS,      set: setSendSMS },
              ].map(ch => (
                <div key={ch.label} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-[#0c1226]">
                    <ch.icon size={14} className="text-[#8a8fa3]" />
                    {ch.label}
                  </div>
                  <button onClick={() => ch.set(!ch.val)}
                    className={`w-9 h-5 rounded-full transition-colors ${ch.val ? "bg-brand-navy" : "bg-[#e7e6e1]"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${ch.val ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              {canSend && (
                <button onClick={() => markStatus("sent")} className="btn btn-primary w-full">
                  <Send size={13} /> Send to customer
                </button>
              )}
              {canApprove && (
                <>
                  <button onClick={() => markStatus("approved")} className="btn btn-green w-full">
                    <CheckCircle size={13} /> Mark approved
                  </button>
                  <button onClick={() => markStatus("rejected")} className="btn btn-danger w-full">
                    <XCircle size={13} /> Reject
                  </button>
                </>
              )}
              {canConvert && (
                <button onClick={convertToInvoice} className="btn btn-outline w-full">
                  <Receipt size={13} /> Create invoice
                </button>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="card p-5">
            <h3 className="section-title mb-3">Activity</h3>
            <div className="space-y-0">
              {activity.map((a: any, i: number) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex gap-3 py-2.5 border-b border-[#f0efea] last:border-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${a.color}`}>
                      <Icon size={11} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#0c1226]">{a.label}</p>
                      <p className="text-[11px] text-[#8a8fa3]">{fmtDate(a.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer */}
          {quote.contacts && (
            <div className="card p-5 text-[13px]">
              <h3 className="section-title mb-3">Customer</h3>
              <p className="font-semibold text-[#0c1226]">{quote.contacts.full_name}</p>
              {quote.contacts.business_name && <p className="text-[#8a8fa3]">{quote.contacts.business_name}</p>}
              {quote.contacts.email && <p className="text-[#4a5168] mt-1">{quote.contacts.email}</p>}
              {quote.contacts.phone && <p className="text-[#4a5168]">{quote.contacts.phone}</p>}
              <Link href={`/contacts/${quote.contact_id}`} className="btn btn-outline btn-sm w-full mt-3">View contact</Link>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={delConfirm} onClose={() => setDelConfirm(false)} onConfirm={del}
        title="Delete Quote" message="This will permanently delete this quote and all its line items." danger />
    </>
  );
}
