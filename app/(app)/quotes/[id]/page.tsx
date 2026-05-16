"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Send, Copy, Trash2, CheckCircle, Printer, Briefcase,
  Receipt, XCircle, ChevronRight,
} from "lucide-react";
import { StatusBadge, toast, ConfirmDialog } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

const STATUS_FLOW = ["draft", "sent", "viewed", "approved", "converted"];

export default function QuoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [delConfirm, setDelConfirm] = useState(false);
  const [converting, setConverting] = useState(false);

  const load = () => fetch(`/api/quotes/${id}`).then(r => r.json()).then(setData);
  useEffect(() => { load(); }, [id]);

  const markStatus = async (status: string) => {
    await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast(`Marked as ${status}`);
    load();
  };

  const duplicate = async () => {
    if (!data) return;
    const { quote, items } = data;
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...quote, id: undefined, quote_number: undefined, status: "draft", items }),
    });
    if (res.ok) {
      const d = await res.json();
      router.push(`/quotes/${d.quote.id}`);
      toast("Quote duplicated");
    }
  };

  const convertToProject = async () => {
    if (!data) return;
    setConverting(true);
    const { quote } = data;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: quote.title || `Project from ${quote.quote_number}`,
        contact_id: quote.contact_id,
        description: quote.notes,
        address: quote.project_address,
        status: "active",
      }),
    });
    if (res.ok) {
      await markStatus("converted");
      const d = await res.json();
      setConverting(false);
      router.push(`/projects/${d.project.id}`);
      toast("Converted to project");
    } else {
      setConverting(false);
      toast("Failed to convert", "error");
    }
  };

  const convertToInvoice = async () => {
    if (!data) return;
    const { quote, items } = data;
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact_id: quote.contact_id,
        project_id: quote.project_id,
        notes: quote.notes,
        terms: quote.terms,
        issue_date: new Date().toISOString().split("T")[0],
        items,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      await markStatus("converted");
      router.push(`/invoices/${d.invoice.id}`);
      toast("Converted to invoice");
    }
  };

  const del = async () => {
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    toast("Quote deleted");
    router.push("/quotes");
  };

  const printQuote = () => window.print();

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-[#9CA3AF]">Loading…</div>
  );
  const { quote, items } = data;
  const isApproved = quote.status === "approved";
  const canSend = quote.status === "draft";
  const canApprove = ["sent", "viewed"].includes(quote.status);
  const canConvert = isApproved;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #quote-print, #quote-print * { visibility: visible; }
          #quote-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6 flex-wrap">
          <Link href="/quotes" className="btn btn-ghost btn-sm mt-0.5"><ArrowLeft size={14} /></Link>
          <div className="flex-1">
            <h1 className="page-title">{quote.quote_number}{quote.title ? ` — ${quote.title}` : ""}</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{quote.contacts?.full_name}</p>
          </div>
          <StatusBadge status={quote.status} />
        </div>

        {/* Status Flow */}
        <div className="card p-4 mb-5 no-print">
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_FLOW.map((s, i) => {
              const current = s === quote.status;
              const past = STATUS_FLOW.indexOf(quote.status) > i;
              return (
                <div key={s} className="flex items-center gap-1">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded ${
                    current ? "bg-brand-navy text-white" :
                    past ? "bg-[#ECFDF5] text-brand-green" :
                    "bg-[#F5F7FA] text-[#9CA3AF]"
                  }`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                  {i < STATUS_FLOW.length - 1 && <ChevronRight size={12} className="text-[#D1D5DB]" />}
                </div>
              );
            })}
            {quote.status === "rejected" && (
              <span className="text-xs font-medium px-2.5 py-1 rounded bg-red-50 text-red-600 ml-2">Rejected</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap mb-6 no-print">
          {canSend && (
            <button onClick={() => markStatus("sent")} className="btn btn-primary btn-sm">
              <Send size={13} /> Mark Sent
            </button>
          )}
          {canApprove && (
            <>
              <button onClick={() => markStatus("approved")} className="btn btn-green btn-sm">
                <CheckCircle size={13} /> Mark Approved
              </button>
              <button onClick={() => markStatus("rejected")} className="btn btn-danger btn-sm">
                <XCircle size={13} /> Reject
              </button>
            </>
          )}
          {canConvert && (
            <>
              <button onClick={convertToProject} disabled={converting} className="btn btn-primary btn-sm">
                <Briefcase size={13} /> {converting ? "Creating…" : "Convert to Project"}
              </button>
              <button onClick={convertToInvoice} className="btn btn-outline btn-sm">
                <Receipt size={13} /> Create Invoice
              </button>
            </>
          )}
          <button onClick={duplicate} className="btn btn-ghost border border-[#E5E7EB] btn-sm">
            <Copy size={13} /> Duplicate
          </button>
          <button onClick={printQuote} className="btn btn-ghost border border-[#E5E7EB] btn-sm">
            <Printer size={13} /> Download PDF
          </button>
          <button onClick={() => setDelConfirm(true)} className="btn btn-danger btn-sm">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Printable Quote */}
      <div id="quote-print">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Quote Info */}
            <div className="card p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-[#6B7280] text-xs mb-1">Quote #</p>
                  <p className="font-semibold text-[#1F2937]">{quote.quote_number}</p>
                </div>
                <div>
                  <p className="text-[#6B7280] text-xs mb-1">Issue Date</p>
                  <p>{fmtDate(quote.issue_date)}</p>
                </div>
                <div>
                  <p className="text-[#6B7280] text-xs mb-1">Valid Until</p>
                  <p>{quote.valid_until ? fmtDate(quote.valid_until) : "—"}</p>
                </div>
                <div>
                  <p className="text-[#6B7280] text-xs mb-1">Project Type</p>
                  <p>{quote.project_type || "—"}</p>
                </div>
                {quote.project_address && (
                  <div className="col-span-2 sm:col-span-4">
                    <p className="text-[#6B7280] text-xs mb-1">Project Address</p>
                    <p>{quote.project_address}</p>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-t border-[#E5E7EB]">
                  <thead>
                    <tr className="bg-[#F5F7FA]">
                      <th className="text-left px-3 py-2.5 text-xs text-[#6B7280] font-semibold">Item</th>
                      <th className="text-right px-3 py-2.5 text-xs text-[#6B7280] font-semibold">Qty</th>
                      <th className="text-right px-3 py-2.5 text-xs text-[#6B7280] font-semibold">Unit Price</th>
                      <th className="text-right px-3 py-2.5 text-xs text-[#6B7280] font-semibold">Tax</th>
                      <th className="text-right px-3 py-2.5 text-xs text-[#6B7280] font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(items ?? []).map((item: any, i: number) => (
                      <tr key={i} className="border-b border-[#F5F7FA]">
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-[#1F2937]">{item.item_name}</p>
                          {item.description && <p className="text-xs text-[#9CA3AF]">{item.description}</p>}
                          {item.category && <p className="text-xs text-[#9CA3AF]">{item.category}</p>}
                          {item.optional && <span className="text-xs text-amber-600 font-medium">(Optional)</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right text-[#6B7280]">{item.quantity} {item.unit}</td>
                        <td className="px-3 py-2.5 text-right text-[#6B7280]">{fmt(item.unit_price)}</td>
                        <td className="px-3 py-2.5 text-right text-[#6B7280]">{item.tax_rate}%</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-[#1F2937]">{fmt(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mt-5">
                <div className="w-52 space-y-2 text-sm">
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Subtotal</span><span>{fmt(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Tax</span><span>{fmt(quote.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-[#E5E7EB] pt-2">
                    <span>Grand Total</span><span className="text-brand-navy">{fmt(quote.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            {(quote.notes || quote.terms) && (
              <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {quote.notes && (
                  <div>
                    <p className="font-semibold text-[#1F2937] mb-2">Notes</p>
                    <p className="text-[#6B7280] whitespace-pre-line">{quote.notes}</p>
                  </div>
                )}
                {quote.terms && (
                  <div>
                    <p className="font-semibold text-[#1F2937] mb-2">Terms & Conditions</p>
                    <p className="text-[#6B7280] whitespace-pre-line">{quote.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-5 text-sm">
              <h2 className="section-title">Customer</h2>
              <p className="font-semibold text-[#1F2937]">{quote.contacts?.full_name}</p>
              {quote.contacts?.business_name && <p className="text-[#6B7280]">{quote.contacts.business_name}</p>}
              {quote.contacts?.email && <p className="text-[#6B7280] mt-1">{quote.contacts.email}</p>}
              {quote.contacts?.phone && <p className="text-[#6B7280]">{quote.contacts.phone}</p>}
              {quote.contacts?.address && <p className="text-[#6B7280] mt-1">{quote.contacts.address}</p>}
              <Link href={`/contacts/${quote.contact_id}`}
                className="btn btn-outline btn-sm w-full mt-3 no-print">View Contact</Link>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={delConfirm}
        onClose={() => setDelConfirm(false)}
        onConfirm={del}
        title="Delete Quote"
        message="This will permanently delete this quote and all its line items."
        danger
      />
    </>
  );
}
