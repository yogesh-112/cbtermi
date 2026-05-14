"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Copy, Trash2, CheckCircle } from "lucide-react";
import { StatusBadge, toast, ConfirmDialog } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

export default function QuoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [delConfirm, setDelConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  const load = () => fetch(`/api/quotes/${id}`).then(r=>r.json()).then(setData);
  useEffect(()=>{ load(); },[id]);

  const markStatus = async (status: string) => {
    await fetch(`/api/quotes/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
    toast(`Status updated to ${status}`); load();
  };

  const duplicate = async () => {
    if (!data) return;
    const { quote, items } = data;
    const res = await fetch("/api/quotes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...quote,id:undefined,quote_number:undefined,status:"draft",items})});
    if(res.ok){ const d=await res.json(); router.push(`/quotes/${d.quote.id}`); toast("Quote duplicated"); }
  };

  const del = async () => {
    await fetch(`/api/quotes/${id}`,{method:"DELETE"});
    toast("Quote deleted"); router.push("/quotes");
  };

  const convertToInvoice = async () => {
    if(!data) return;
    const { quote, items } = data;
    const res = await fetch("/api/invoices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contact_id:quote.contact_id,project_id:quote.project_id,notes:quote.notes,terms:quote.terms,items})});
    if(res.ok){ const d=await res.json(); await markStatus("converted"); router.push(`/invoices/${d.invoice.id}`); toast("Converted to invoice"); }
  };

  if (!data) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;
  const { quote, items } = data;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/quotes" className="btn-ghost btn btn-sm"><ArrowLeft size={14}/></Link>
        <div className="flex-1">
          <h1 className="page-title">{quote.quote_number} {quote.title ? `— ${quote.title}` : ""}</h1>
          <p className="text-sm text-slate-500">{quote.contacts?.full_name}</p>
        </div>
        <StatusBadge status={quote.status}/>
        <div className="flex gap-2 flex-wrap">
          {quote.status === "draft" && <button onClick={()=>markStatus("sent")} className="btn-green btn btn-sm"><Send size={13}/> Mark Sent</button>}
          {quote.status === "sent" && <button onClick={()=>markStatus("approved")} className="btn-green btn btn-sm"><CheckCircle size={13}/> Mark Approved</button>}
          {["approved","sent"].includes(quote.status) && <button onClick={convertToInvoice} className="btn-primary btn btn-sm">Convert to Invoice</button>}
          <button onClick={duplicate} className="btn-outline btn btn-sm"><Copy size={13}/> Duplicate</button>
          <Link href={`/quotes/new?contactId=${quote.contact_id}`} className="btn-outline btn btn-sm">New Quote</Link>
          <button onClick={()=>setDelConfirm(true)} className="btn-danger btn btn-sm"><Trash2 size={13}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
              <div><p className="text-slate-500 text-xs mb-1">Quote #</p><p className="font-semibold">{quote.quote_number}</p></div>
              <div><p className="text-slate-500 text-xs mb-1">Issue Date</p><p>{fmtDate(quote.issue_date)}</p></div>
              <div><p className="text-slate-500 text-xs mb-1">Valid Until</p><p>{fmtDate(quote.valid_until)}</p></div>
              <div><p className="text-slate-500 text-xs mb-1">Project</p><p>{quote.projects?.name||"—"}</p></div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-t border-slate-200">
                <thead><tr className="bg-slate-50"><th className="text-left px-3 py-2 text-xs text-slate-500">Item</th><th className="text-right px-3 py-2 text-xs text-slate-500">Qty</th><th className="text-right px-3 py-2 text-xs text-slate-500">Unit Price</th><th className="text-right px-3 py-2 text-xs text-slate-500">Tax</th><th className="text-right px-3 py-2 text-xs text-slate-500">Total</th></tr></thead>
                <tbody>
                  {(items??[]).map((item:any,i:number)=>(
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-3 py-2"><p className="font-medium">{item.item_name}</p>{item.description&&<p className="text-xs text-slate-400">{item.description}</p>}</td>
                      <td className="px-3 py-2 text-right">{item.quantity} {item.unit}</td>
                      <td className="px-3 py-2 text-right">{fmt(item.unit_price)}</td>
                      <td className="px-3 py-2 text-right">{item.tax_rate}%</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <div className="w-48 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmt(quote.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{fmt(quote.tax_amount)}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span className="text-brand-navy">{fmt(quote.total)}</span></div>
              </div>
            </div>
          </div>

          {(quote.notes||quote.terms) && (
            <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {quote.notes&&<div><p className="font-semibold mb-1 text-slate-700">Notes</p><p className="text-slate-500">{quote.notes}</p></div>}
              {quote.terms&&<div><p className="font-semibold mb-1 text-slate-700">Terms</p><p className="text-slate-500">{quote.terms}</p></div>}
            </div>
          )}
        </div>

        <div className="card p-5 h-fit space-y-3 text-sm">
          <h2 className="section-title">Contact</h2>
          <p className="font-semibold">{quote.contacts?.full_name}</p>
          {quote.contacts?.email&&<p className="text-slate-500">{quote.contacts.email}</p>}
          {quote.contacts?.phone&&<p className="text-slate-500">{quote.contacts.phone}</p>}
          <Link href={`/contacts/${quote.contact_id}`} className="btn-outline btn btn-sm w-full mt-2">View Contact</Link>
        </div>
      </div>

      <ConfirmDialog open={delConfirm} onClose={()=>setDelConfirm(false)} onConfirm={del} title="Delete quote" message="This will permanently delete this quote." danger />
    </div>
  );
}
