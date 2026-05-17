"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft, UserPlus, Users } from "lucide-react";
import { toast } from "@/components/ui";
import { fmt } from "@/lib/utils";

const EMPTY_ITEM = {
  item_name: "", description: "", quantity: 1,
  unit: "", unit_price: 0, tax_rate: 0, discount: 0, total: 0,
};

const LEAD_SOURCES = [
  "Referral", "Google", "Facebook", "Instagram", "LinkedIn",
  "Walk-in", "Cold Call", "Website", "Other",
];

function calcItem(i: any) {
  const t = i.quantity * i.unit_price * (1 - i.discount / 100);
  return { ...i, total: Math.round(t * 100) / 100 };
}

function InvoiceForm() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [contactMode, setContactMode] = useState<"existing" | "new">("existing");
  const [form, setForm] = useState({
    contact_id: "",
    project_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    payment_terms: "Net 30",
    notes: "",
    terms: "",
  });
  const [newContact, setNewContact] = useState({
    full_name: "", business_name: "", email: "", phone: "",
    address: "", city: "", state: "", zip: "", lead_source: "",
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/contacts").then(r => r.json()).then(d => setContacts(d.contacts ?? []));
    fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects ?? []));
  }, []);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const setNC = (k: keyof typeof newContact) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setNewContact({ ...newContact, [k]: e.target.value });

  const setItem = (i: number, k: string, v: any) => {
    const arr = [...items];
    const numFields = ["quantity", "unit_price", "tax_rate", "discount"];
    arr[i] = calcItem({ ...arr[i], [k]: numFields.includes(k) ? parseFloat(v) || 0 : v });
    setItems(arr);
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = items.reduce((s, i) => s + i.total * (i.tax_rate / 100), 0);
  const total = subtotal + taxAmount;

  const save = async (status = "draft") => {
    let contact_id = form.contact_id;

    if (contactMode === "new") {
      if (!newContact.full_name.trim() || !newContact.email.trim() || !newContact.phone.trim()) {
        toast("Full name, email, and phone are required", "error");
        return;
      }
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newContact, contact_type: "customer", lead_status: "New Lead" }),
      });
      if (!res.ok) { toast("Failed to create contact", "error"); return; }
      const d = await res.json();
      contact_id = d.contact.id;
    } else if (!contact_id) {
      toast("Please select a contact", "error");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, contact_id, status, items }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      toast("Invoice saved");
      router.push(`/invoices/${d.invoice.id}`);
    } else {
      toast("Failed to save", "error");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/invoices" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /></Link>
        <h1 className="page-title">New Invoice</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          {/* Contact */}
          <div className="form-section">
            <h2 className="section-title">Bill To</h2>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setContactMode("existing")}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border transition-colors ${contactMode === "existing" ? "bg-brand-navy text-white border-brand-navy" : "border-[#e7e6e1] text-[#4a5168] hover:bg-[#f6f6f3]"}`}>
                <Users size={14} /> Select Existing
              </button>
              <button onClick={() => setContactMode("new")}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border transition-colors ${contactMode === "new" ? "bg-brand-navy text-white border-brand-navy" : "border-[#e7e6e1] text-[#4a5168] hover:bg-[#f6f6f3]"}`}>
                <UserPlus size={14} /> Add New Contact
              </button>
            </div>

            {contactMode === "existing" ? (
              <div>
                <label className="label">Select Contact <span className="text-red-500">*</span></label>
                <select value={form.contact_id} onChange={set("contact_id")} className="field max-w-sm">
                  <option value="">Choose a contact…</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}{c.business_name ? ` — ${c.business_name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name <span className="text-red-500">*</span></label>
                  <input value={newContact.full_name} onChange={setNC("full_name")} placeholder="John Doe" className="field" />
                </div>
                <div>
                  <label className="label">Business Name</label>
                  <input value={newContact.business_name} onChange={setNC("business_name")} placeholder="Company Inc." className="field" />
                </div>
                <div>
                  <label className="label">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={newContact.email} onChange={setNC("email")} placeholder="john@example.com" className="field" />
                </div>
                <div>
                  <label className="label">Phone <span className="text-red-500">*</span></label>
                  <input value={newContact.phone} onChange={setNC("phone")} placeholder="+1 (555) 000-0000" className="field" />
                </div>
                <div>
                  <label className="label">Address</label>
                  <input value={newContact.address} onChange={setNC("address")} placeholder="123 Main St" className="field" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input value={newContact.city} onChange={setNC("city")} placeholder="Dallas" className="field" />
                </div>
                <div>
                  <label className="label">State</label>
                  <input value={newContact.state} onChange={setNC("state")} placeholder="TX" className="field" />
                </div>
                <div>
                  <label className="label">Zipcode</label>
                  <input value={newContact.zip} onChange={setNC("zip")} placeholder="75001" className="field" />
                </div>
              </div>
            )}
          </div>

          {/* Invoice Details */}
          <div className="form-section">
            <h2 className="section-title">Invoice Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Issue Date</label>
                <input type="date" value={form.issue_date} onChange={set("issue_date")} className="field" />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="date" value={form.due_date} onChange={set("due_date")} className="field" />
              </div>
              <div>
                <label className="label">Payment Terms</label>
                <select value={form.payment_terms} onChange={set("payment_terms")} className="field">
                  {["Due on receipt", "Net 7", "Net 15", "Net 30", "Net 45", "Net 60"].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Project (optional)</label>
                <select value={form.project_id} onChange={set("project_id")} className="field">
                  <option value="">Auto-create project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Line Items</h2>
              <button onClick={() => setItems([...items, { ...EMPTY_ITEM }])}
                className="btn btn-outline btn-sm"><Plus size={13} /> Add Item</button>
            </div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-[#e7e6e1]">
                    <th className="text-left py-2 px-1 text-xs text-[#4a5168] font-semibold">Item</th>
                    <th className="text-left py-2 px-1 text-xs text-[#4a5168] font-semibold w-12">Qty</th>
                    <th className="text-left py-2 px-1 text-xs text-[#4a5168] font-semibold w-14">Unit</th>
                    <th className="text-left py-2 px-1 text-xs text-[#4a5168] font-semibold w-24">Price</th>
                    <th className="text-left py-2 px-1 text-xs text-[#4a5168] font-semibold w-12">Tax%</th>
                    <th className="text-right py-2 px-1 text-xs text-[#4a5168] font-semibold w-20">Total</th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-[#f6f6f3]">
                      <td className="py-1.5 px-1">
                        <input value={item.item_name} onChange={e => setItem(i, "item_name", e.target.value)}
                          placeholder="Item name" className="field text-xs mb-1" />
                        <input value={item.description} onChange={e => setItem(i, "description", e.target.value)}
                          placeholder="Description" className="field text-xs" />
                      </td>
                      <td className="py-1.5 px-1">
                        <input type="number" value={item.quantity} onChange={e => setItem(i, "quantity", e.target.value)}
                          className="field text-xs" min={0} />
                      </td>
                      <td className="py-1.5 px-1">
                        <input value={item.unit} onChange={e => setItem(i, "unit", e.target.value)}
                          placeholder="hr" className="field text-xs" />
                      </td>
                      <td className="py-1.5 px-1">
                        <input type="number" value={item.unit_price} onChange={e => setItem(i, "unit_price", e.target.value)}
                          className="field text-xs" min={0} step={0.01} />
                      </td>
                      <td className="py-1.5 px-1">
                        <input type="number" value={item.tax_rate} onChange={e => setItem(i, "tax_rate", e.target.value)}
                          className="field text-xs" min={0} max={100} />
                      </td>
                      <td className="py-1.5 px-1 text-right font-semibold text-brand-navy text-xs whitespace-nowrap">
                        {fmt(item.total)}
                      </td>
                      <td className="py-1.5 pl-1">
                        <button onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                          className="text-[#d8d6cf] hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="form-section">
            <h2 className="section-title">Notes & Terms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Notes</label>
                <textarea value={form.notes} onChange={set("notes")} rows={3}
                  className="field resize-none" placeholder="Thank you for your business!" />
              </div>
              <div>
                <label className="label">Terms & Conditions</label>
                <textarea value={form.terms} onChange={set("terms")} rows={3}
                  className="field resize-none" placeholder="Payment due within 30 days…" />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-6">
            <h2 className="section-title">Summary</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-[#4a5168]">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#4a5168]">
                <span>Tax</span><span>{fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-[#e7e6e1] pt-3 mt-1">
                <span>Total</span><span className="text-brand-navy">{fmt(total)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button onClick={() => save("draft")} disabled={saving}
                className="btn btn-ghost border border-[#e7e6e1] w-full">
                {saving ? "Saving…" : "Save as Draft"}
              </button>
              <button onClick={() => save("sent")} disabled={saving}
                className="btn btn-primary w-full">
                {saving ? "Saving…" : "Save & Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return <Suspense><InvoiceForm /></Suspense>;
}
