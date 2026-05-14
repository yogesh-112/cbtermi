"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui";
import { fmt } from "@/lib/utils";

const EMPTY_ITEM = { item_name:"", description:"", quantity:1, unit:"", unit_price:0, tax_rate:0, discount:0, total:0 };
const calcItem = (i:any) => ({...i, total: Math.round(i.quantity*i.unit_price*(1-i.discount/100)*100)/100});

function InvoiceForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [contacts, setContacts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [form, setForm] = useState({ contact_id:params.get("contactId")||"", project_id:"", issue_date:new Date().toISOString().split("T")[0], due_date:"", payment_terms:"Net 30", notes:"", terms:"" });
  const [items, setItems] = useState([{...EMPTY_ITEM}]);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    fetch("/api/contacts").then(r=>r.json()).then(d=>setContacts(d.contacts??[]));
    fetch("/api/projects").then(r=>r.json()).then(d=>setProjects(d.projects??[]));
  },[]);

  const set=(k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>setForm({...form,[k]:e.target.value});
  const setItem=(i:number,k:string,v:any)=>{ const arr=[...items]; arr[i]=calcItem({...arr[i],[k]:["item_name","description","unit"].includes(k)?v:parseFloat(v)||0}); setItems(arr); };

  const subtotal=items.reduce((s,i)=>s+i.total,0);
  const taxAmount=items.reduce((s,i)=>s+i.total*(i.tax_rate/100),0);
  const total=subtotal+taxAmount;

  const save=async(status="draft")=>{
    if(!form.contact_id){ toast("Select a contact","error"); return; }
    setSaving(true);
    const res=await fetch("/api/invoices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,status,items})});
    setSaving(false);
    if(res.ok){ const d=await res.json(); toast("Invoice saved"); router.push(`/invoices/${d.invoice.id}`); }
    else toast("Failed to save","error");
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/invoices" className="btn-ghost btn btn-sm"><ArrowLeft size={14}/></Link>
        <h1 className="page-title">New Invoice</h1>
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
                  <option value="">Auto-create project</option>
                  {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><label className="label">Issue date</label><input type="date" value={form.issue_date} onChange={set("issue_date")} className="field"/></div>
              <div><label className="label">Due date</label><input type="date" value={form.due_date} onChange={set("due_date")} className="field"/></div>
              <div><label className="label">Payment terms</label>
                <select value={form.payment_terms} onChange={set("payment_terms")} className="field">
                  {["Due on receipt","Net 7","Net 15","Net 30","Net 45","Net 60"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Line Items</h2>
              <button onClick={()=>setItems([...items,{...EMPTY_ITEM}])} className="btn-outline btn btn-sm"><Plus size={13}/> Add Item</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-xs text-slate-500 font-semibold">Item</th>
                  <th className="text-left py-2 text-xs text-slate-500 font-semibold w-16">Qty</th>
                  <th className="text-left py-2 text-xs text-slate-500 font-semibold w-24">Price</th>
                  <th className="text-left py-2 text-xs text-slate-500 font-semibold w-16">Tax%</th>
                  <th className="text-right py-2 text-xs text-slate-500 font-semibold">Total</th>
                  <th className="w-8"/>
                </tr></thead>
                <tbody>
                  {items.map((item,i)=>(
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 pr-2"><input value={item.item_name} onChange={e=>setItem(i,"item_name",e.target.value)} placeholder="Item name" className="field text-xs"/></td>
                      <td className="py-2 pr-2"><input type="number" value={item.quantity} onChange={e=>setItem(i,"quantity",e.target.value)} className="field text-xs w-16"/></td>
                      <td className="py-2 pr-2"><input type="number" value={item.unit_price} onChange={e=>setItem(i,"unit_price",e.target.value)} className="field text-xs"/></td>
                      <td className="py-2 pr-2"><input type="number" value={item.tax_rate} onChange={e=>setItem(i,"tax_rate",e.target.value)} className="field text-xs w-16"/></td>
                      <td className="py-2 text-right font-semibold">{fmt(item.total)}</td>
                      <td className="py-2 pl-2"><button onClick={()=>setItems(items.filter((_,idx)=>idx!==i))} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-section">
            <div className="form-row">
              <div><label className="label">Notes</label><textarea value={form.notes} onChange={set("notes")} rows={3} className="field resize-none"/></div>
              <div><label className="label">Terms</label><textarea value={form.terms} onChange={set("terms")} rows={3} className="field resize-none"/></div>
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
          <button onClick={()=>save("draft")} disabled={saving} className="btn-primary btn w-full">{saving?"Saving…":"Save as Draft"}</button>
          <button onClick={()=>save("sent")} disabled={saving} className="btn-green btn w-full">{saving?"Saving…":"Save & Send"}</button>
        </div>
      </div>
    </div>
  );
}

export default function NewInvoicePage() { return <Suspense><InvoiceForm/></Suspense>; }
