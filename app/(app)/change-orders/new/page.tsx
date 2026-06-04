"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast, InfoTooltip } from "@/components/ui";
import ContactSelect from "@/components/ui/ContactSelect";
import { fmt } from "@/lib/utils";

const EMPTY_ITEM = { description: "", qty: 1, unit: "", rate: 0, tax_rate: 0, total: 0 };

function calcItem(i: any) {
  const base = i.qty * i.rate;
  const tax  = base * (i.tax_rate / 100);
  return { ...i, total: Math.round((base + tax) * 100) / 100 };
}

export default function NewChangeOrderPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    contact_id: "", project_id: "", title: "",
    notes: "", terms: "Change order is due upon approval.",
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  useEffect(() => {
    fetch("/api/contacts").then(r => r.json()).then(d => setContacts(d.contacts ?? []));
    fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects ?? []));
  }, []);

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const updateItem = (i: number, k: string, v: any) => {
    setItems(items => {
      const next = [...items];
      next[i] = calcItem({ ...next[i], [k]: v });
      return next;
    });
  };

  const subtotal = items.reduce((s, i) => s + (i.total ?? 0), 0);
  const tax_amount = items.reduce((s, i) => s + (i.total ?? 0) * (i.tax_rate ?? 0) / 100, 0);
  const total = subtotal;

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/change-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      toast("Change order created");
      router.push(`/change-orders/${data.changeOrder.id}`);
    } else {
      toast(data.message ?? "Failed to create", "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/change-orders" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /></Link>
        <h1 className="page-title mb-0">New Change Order</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <h3 className="section-title mb-4">Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Contact</label>
                <ContactSelect contacts={contacts} value={form.contact_id}
                  onChange={id => setForm(f => ({ ...f, contact_id: id }))}
                  onContactCreated={c => setContacts(cs => [c, ...cs])}
                  placeholder="Select contact" />
              </div>
              <div>
                <label className="label">Project</label>
                <select value={form.project_id} onChange={setF("project_id")} className="field">
                  <option value="">No project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label flex items-center gap-1">
                  Title
                  <InfoTooltip text="A short title for the scope change — e.g. 'Add recessed lighting in kitchen'. This appears on the customer-facing approval page." side="right" />
                </label>
                <input value={form.title} onChange={setF("title")} className="field" placeholder="Brief description of the change" />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Line Items</h3>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    {i === 0 && <label className="label">Description</label>}
                    <input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} className="field" placeholder="Work description" />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="label">Qty</label>}
                    <input type="number" step="0.01" value={item.qty} onChange={e => updateItem(i, "qty", parseFloat(e.target.value) || 0)} className="field" />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="label">Rate</label>}
                    <input type="number" step="0.01" value={item.rate} onChange={e => updateItem(i, "rate", parseFloat(e.target.value) || 0)} className="field" />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="label">Tax %</label>}
                    <input type="number" step="0.1" value={item.tax_rate} onChange={e => updateItem(i, "tax_rate", parseFloat(e.target.value) || 0)} className="field" />
                  </div>
                  <div className="col-span-1">
                    {i === 0 && <label className="label">Total</label>}
                    <div className="h-[38px] flex items-center text-[13px] font-medium text-[#0c1226]">{fmt(item.total)}</div>
                  </div>
                  <div className="col-span-1">
                    {i === 0 && <div className="label invisible">×</div>}
                    <button onClick={() => setItems(items.filter((_, j) => j !== i))}
                      className="h-[38px] w-full flex items-center justify-center text-[#8a8fa3] hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setItems([...items, { ...EMPTY_ITEM }])}
              className="btn btn-ghost btn-sm mt-3 gap-1.5">
              <Plus size={13} /> Add line item
            </button>
          </div>

          <div className="card p-5">
            <h3 className="section-title mb-3">Notes & Terms</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Notes</label>
                <textarea value={form.notes} onChange={setF("notes")} rows={2} className="field resize-none" placeholder="Additional notes for the customer…" />
              </div>
              <div>
                <label className="label flex items-center gap-1">
                  Terms
                  <InfoTooltip text="Payment and legal terms for this scope change. The default requires payment upon customer approval. You can customize per project." side="right" />
                </label>
                <textarea value={form.terms} onChange={setF("terms")} rows={2} className="field resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="section-title mb-3">Summary</h3>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between text-[#4a5168]">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#4a5168]">
                <span>Tax</span><span>{fmt(tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#0c1226] pt-2 border-t border-[#e7e6e1]">
                <span>Total</span><span>{fmt(total)}</span>
              </div>
            </div>
          </div>

          <button onClick={save} disabled={saving} className="btn btn-primary w-full">
            {saving ? "Creating…" : "Create Change Order"}
          </button>
          <Link href="/change-orders" className="btn btn-outline w-full text-center block">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
