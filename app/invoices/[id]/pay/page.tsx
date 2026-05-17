"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CreditCard, CheckCircle, AlertCircle, Lock } from "lucide-react";

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InvoicePayPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/invoices/${id}/pay`)
      .then(r => r.json())
      .then(d => {
        if (d.invoice) setInvoice(d.invoice);
        else setError("Invoice not found.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const startPayment = async () => {
    setPaying(true);
    setError("");
    const res = await fetch(`/api/invoices/${id}/pay`, { method: "POST" });
    const data = await res.json();
    setPaying(false);
    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      setError(data.message ?? "Could not initiate payment.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f6f3] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const biz = invoice?.businesses;
  const contact = invoice?.contacts;
  const bizInitials = biz?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "CB";

  return (
    <div className="min-h-screen bg-[#f6f6f3]">
      <header className="bg-white border-b border-[#e7e6e1] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#1B3A5C] rounded flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">{bizInitials}</span>
          </div>
          <span className="font-semibold text-[14px] text-[#0c1226]">{biz?.name ?? "Clear Build USA"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#8a8fa3]">
          <Lock size={11} /> Secure payment
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-12">
        {success ? (
          <div className="bg-white rounded-2xl border border-[#e7e6e1] p-8 text-center shadow-sm">
            <CheckCircle size={48} className="mx-auto text-[#3FA66B] mb-4" />
            <h1 className="text-[22px] font-bold text-[#0c1226] mb-2">Payment received!</h1>
            <p className="text-[14px] text-[#8a8fa3]">
              Thank you{contact?.full_name ? `, ${contact.full_name}` : ""}. Your payment has been processed successfully.
            </p>
            {invoice && (
              <p className="text-[13px] text-[#8a8fa3] mt-2">Invoice {invoice.invoice_number}</p>
            )}
          </div>
        ) : error && !invoice ? (
          <div className="bg-white rounded-2xl border border-[#e7e6e1] p-8 text-center shadow-sm">
            <AlertCircle size={40} className="mx-auto text-[#8a8fa3] mb-3" />
            <p className="text-[#4a5168]">{error}</p>
          </div>
        ) : invoice ? (
          <div className="bg-white rounded-2xl border border-[#e7e6e1] shadow-sm overflow-hidden">
            <div className="bg-[#1B3A5C] px-6 py-5">
              <p className="text-white/60 text-[11px] font-semibold uppercase tracking-wider mb-1">Invoice</p>
              <p className="text-white text-[22px] font-bold">{invoice.invoice_number}</p>
              {contact?.full_name && (
                <p className="text-white/70 text-[13px] mt-0.5">Prepared for {contact.full_name}</p>
              )}
            </div>

            <div className="px-6 py-5">
              <div className="flex justify-between items-center py-3 border-b border-[#f0efea]">
                <span className="text-[13px] text-[#8a8fa3]">Invoice total</span>
                <span className="text-[13px] font-medium text-[#0c1226]">{fmt(invoice.total ?? 0)}</span>
              </div>
              {(invoice.amount_paid ?? 0) > 0 && (
                <div className="flex justify-between items-center py-3 border-b border-[#f0efea]">
                  <span className="text-[13px] text-[#8a8fa3]">Already paid</span>
                  <span className="text-[13px] font-medium text-[#3FA66B]">−{fmt(invoice.amount_paid)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-4">
                <span className="text-[15px] font-bold text-[#0c1226]">Amount due</span>
                <span className="text-[22px] font-bold text-[#0c1226]">{fmt(invoice.amount_due ?? 0)}</span>
              </div>

              {invoice.status === "paid" ? (
                <div className="flex items-center justify-center gap-2 py-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl text-[#16a34a] font-semibold text-[14px]">
                  <CheckCircle size={16} /> Paid in full
                </div>
              ) : (
                <>
                  {error && (
                    <p className="text-[13px] text-red-600 mb-3">{error}</p>
                  )}
                  <button onClick={startPayment} disabled={paying}
                    className="w-full flex items-center justify-center gap-2 h-[48px] bg-[#3FA66B] text-white text-[15px] font-semibold rounded-xl hover:bg-[#3FA66B]/90 transition-colors disabled:opacity-60 mb-3">
                    <CreditCard size={17} />
                    {paying ? "Redirecting to checkout…" : `Pay ${fmt(invoice.amount_due ?? 0)}`}
                  </button>
                  <p className="text-[11px] text-[#8a8fa3] text-center flex items-center justify-center gap-1">
                    <Lock size={10} /> Secured by Stripe · Card details never touch our servers
                  </p>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
