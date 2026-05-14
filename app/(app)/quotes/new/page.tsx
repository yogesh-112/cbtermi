"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui";
import { fmt } from "@/lib/utils";

const EMPTY_ITEM = { item_name: "", description: "", quantity: 1, unit: "", unit_price: 0, tax_rate: 0, discount: 0, total: 0 };

function calcItem(i: any) { const t = i.quantity * i.unit_price * (1 - i.discount/100); return { ...i, total: Math.round(t*100)/100 }; }

function QuoteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [contacts, setContacts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [form, setForm] = useState({ contact_id: params.get("contactId")||"", project_id: "", title: "", issue_date: new Date().toISOString().split("T")[0], valid_until: "", notes: "", terms: "", status: "draft" });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/contacts").then(r=>r.json()).then(d=>setContacts(d.contacts??[]));
    fetch("/api/projects").then(r=>r.json()).then(d=>setProjects(d.projects??[]));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => setForm({...form,[k]:e.target.value});
  const setItem = (i: number, k: string, v: any) => { const arr=[...items]; arr[i]=calcItem({...arr[i],[k]:Number.isNaN(parseFloat(v))?v:k==="item_name"||k==="description"||k==="unit"?v:parseFloat(v)||0}); setItems(arr); };
  const addItem = () => setItems([...items, { ...EMPTY_ITEM }]);
  const removeItem = (i: number) => setItems(items.filter((_,idx)=>idx!==i));

  const subtotal = items.reduce((s,i)=>s+i.total,0);
  const taxAmount = items.reduce((s,i)=>s+i.total*(i.tax_rate/100),0);
  const total = subtotal + taxAmount;

  const save = async (status = form.status) => {
    if (!form.contact_id) { toast("Select a contact","error"); return; }
    setSaving(true);
    const res = await fetch("/api/quotes", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({...form, status, items}) });
    setSaving(false);
    if (res.ok) { const d=await res.json(); toast("Quote saved"); router.push(`/quotes/${d.quote.id}`); }
    else toast("Failed to save","error");
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/quotes" className="btn-ghost btn btn-sm"><ArrowLeft size={14}/></Link>
        <h1 className="page-title">New Quote</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="form-section">
            <h2 className="section-title">Details</h2>
            <div className="form-row">
              <div><label className="label">Contact *</label>
                <select value={form.contact_id} onChange={set("contact_id")} className="field">
                  <option value="">Select contact</option>
                  {contacts.map(c=><option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div><label className="label">Project (optional)</label>
                <select value={form.project_id} onChange={set("project_id")} className="field">
                  <option value="">No project</option>
                  {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><label className="label">Quote title</label><input value={form.title} onChange={set("title")} placeholder="Kitchen Remodel Quote" className="field"/></div>
              <div><label className="label">Issue date</label><input type="date" value={form.issue_date} onChange={set("issue_date")} className="field"/></div>
              <div><label className="label">Valid until</label><input type="date" value={form.valid_until} onChange={set("valid_until")} className="field"/></div>
            </div>
          </div>

          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Line Items</h2>
              <button onClick={addItem} className="btn-outline btn btn-sm"><Plus size={13}/> Add Item</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200"><th className="text-left py-2 text-xs text-slate-500 font-semibold w-48">Item</th><th className="text-left py-2 text-xs text-slate-500 font-semibold w-16">Qty</th><th className="text-left py-2 text-xs text-slate-500 font-semibold w-24">Unit Price</th><th className="text-left py-2 text-xs text-slate-500 font-semibold w-16">Tax%</th><th className="text-left py-2 text-xs text-slate-500 font-semibold w-16">Disc%</th><th className="text-right py-2 text-xs text-slate-500 font-semibold">Total</th><th className="w-8"/></tr></thead>
                <tbody>
                  {items.map((item,i)=>(
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 pr-2"><input value={item.item_name} onChange={(e)=>setItem(i,"item_name",e.target.value)} placeholder="Item name" className="field text-xs"/></td>
                      <td className="py-2 pr-2"><input type="number" value={item.quantity} onChange={(e)=>setItem(i,"quantity",e.target.value)} className="field text-xs w-16"/></td>
                      <td className="py-2 pr-2"><input type="number" value={item.unit_price} onChange={(e)=>setItem(i,"unit_price",e.target.value)} className="field text-xs"/></td>
                      <td className="py-2 pr-2"><input type="number" value={item.tax_rate} onChange={(e)=>setItem(i,"tax_rate",e.target.value)} className="field text-xs w-16"/></td>
                      <td className="py-2 pr-2"><input type="number" value={item.discount} onChange={(e)=>setItem(i,"discount",e.target.value)} className="field text-xs w-16"/></td>
                      <td className="py-2 text-right font-semibold">{fmt(item.total)}</td>
                      <td className="py-2 pl-2"><button onClick={()=>removeItem(i)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-section">
            <div className="form-row">
              <div><label className="label">Notes</label><textarea value={form.notes} onChange={set("notes")} rows={3} className="field resize-none" placeholder="Internal notes…"/></div>
              <div><label className="label">Terms & Conditions</label><textarea value={form.terms} onChange={set("terms")} rows={3} className="field resize-none" placeholder="Payment terms…"/></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="section-title">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{fmt(taxAmount)}</span></div>
              <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-2"><span>Total</span><span className="text-brand-navy">{fmt(total)}</span></div>
            </div>
          </div>
          <div className="space-y-2">
            <button onClick={()=>save("draft")} disabled={saving} className="btn-primary btn w-full">{saving?"Saving…":"Save as Draft"}</button>
            <button onClick={()=>save("sent")} disabled={saving} className="btn-green btn w-full">{saving?"Saving…":"Save & Mark Sent"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewQuotePage() { return <Suspense><QuoteForm /></Suspense>; }
