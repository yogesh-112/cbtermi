"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft, UserPlus, Users } from "lucide-react";
import { toast } from "@/components/ui";
import { fmt } from "@/lib/utils";

const EMPTY_ITEM = {
  category: "", item_name: "", description: "", quantity: 1,
  unit: "", unit_price: 0, tax_rate: 0, discount: 0, total: 0, optional: false,
};

const EMPTY_MILESTONE = { label: "", percent: 0, amount: 0, due_date: "" };

const PROJECT_TYPES = [
  "Residential Remodel", "Commercial Build", "New Construction",
  "Roofing", "Flooring", "Painting", "Electrical", "Plumbing",
  "Landscaping", "Other",
];

const LEAD_SOURCES = [
  "Referral", "Google", "Facebook", "Instagram", "LinkedIn",
  "Walk-in", "Cold Call", "Website", "Other",
];

function calcItem(i: any) {
  const t = i.quantity * i.unit_price * (1 - i.discount / 100);
  return { ...i, total: Math.round(t * 100) / 100 };
}

function QuoteForm() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactMode, setContactMode] = useState<"existing" | "new">("existing");
  const [form, setForm] = useState({
    contact_id: "",
    title: "",
    issue_date: new Date().toISOString().split("T")[0],
    valid_until: "",
    project_type: "",
    project_address: "",
    notes: "",
    terms: "Payment is due within 30 days of the approved quote date. Late payments may be subject to a 1.5% monthly interest charge.",
  });
  const [newContact, setNewContact] = useState({
    full_name: "", business_name: "", email: "", phone: "", lead_source: "",
    address: "", city: "", state: "", zip: "",
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [milestones, setMilestones] = useState<typeof EMPTY_MILESTONE[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/contacts").then(r => r.json()).then(d => setContacts(d.contacts ?? []));
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

  const setMilestone = (i: number, k: keyof typeof EMPTY_MILESTONE, v: string) => {
    const arr = [...milestones];
    arr[i] = { ...arr[i], [k]: k === "percent" || k === "amount" ? parseFloat(v) || 0 : v };
    setItems(items); // re-render
    setMilestones(arr);
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const discountTotal = items.reduce((s, i) => s + (i.quantity * i.unit_price * (i.discount / 100)), 0);
  const taxAmount = items.reduce((s, i) => s + i.total * (i.tax_rate / 100), 0);
  const total = subtotal + taxAmount;

  const save = async (status = "draft") => {
    let contact_id = form.contact_id;

    if (contactMode === "new") {
      if (!newContact.full_name.trim() || !newContact.email.trim() || !newContact.phone.trim()) {
        toast("Full name, email, and phone are required for new contact", "error");
        return;
      }
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newContact, contact_type: "lead", lead_status: "New Lead" }),
      });
      if (!res.ok) { toast("Failed to create contact", "error"); return; }
      const d = await res.json();
      contact_id = d.contact.id;
    } else if (!contact_id) {
      toast("Please select a contact", "error");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        contact_id,
        status,
        items,
        milestones: milestones.length > 0 ? milestones : undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      toast("Quote saved");
      router.push(`/quotes/${d.quote.id}`);
    } else {
      toast("Failed to save quote", "error");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/quotes" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /></Link>
        <h1 className="page-title">New Quote</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          {/* Contact Selection */}
          <div className="form-section">
            <h2 className="section-title">Customer / Contact</h2>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setContactMode("existing")}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border transition-colors ${contactMode === "existing" ? "bg-brand-navy text-white border-brand-navy" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F5F7FA]"}`}>
                <Users size={14} /> Select Existing
              </button>
              <button onClick={() => setContactMode("new")}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border transition-colors ${contactMode === "new" ? "bg-brand-navy text-white border-brand-navy" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F5F7FA]"}`}>
                <UserPlus size={14} /> Add New Contact
              </button>
            </div>

            {contactMode === "existing" ? (
              <div>
                <label className="label">Select Contact <span className="text-red-500">*</span></label>
                <select value={form.contact_id} onChange={set("contact_id")} className="field max-w-sm">
                  <option value="">Choose a contact…</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}{c.business_name ? ` — ${c.business_name}` : ""}</option>)}
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
                  <label className="label">Lead Source</label>
                  <select value={newContact.lead_source} onChange={setNC("lead_source")} className="field">
                    <option value="">Select source</option>
                    {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">City</label>
                  <input value={newContact.city} onChange={setNC("city")} placeholder="Dallas" className="field" />
                </div>
              </div>
            )}
          </div>

          {/* Quote Details */}
          <div className="form-section">
            <h2 className="section-title">Quote Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Quote Title</label>
                <input value={form.title} onChange={set("title")} placeholder="e.g. Kitchen Remodel — Phase 1" className="field" />
              </div>
              <div>
                <label className="label">Issue Date</label>
                <input type="date" value={form.issue_date} onChange={set("issue_date")} className="field" />
              </div>
              <div>
                <label className="label">Valid Until</label>
                <input type="date" value={form.valid_until} onChange={set("valid_until")} className="field" />
              </div>
              <div>
                <label className="label">Project Type</label>
                <select value={form.project_type} onChange={set("project_type")} className="field">
                  <option value="">Select type…</option>
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Project Address</label>
                <input value={form.project_address} onChange={set("project_address")} placeholder="123 Main St, Dallas TX" className="field" />
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
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-2 px-1 text-xs text-[#6B7280] font-semibold w-28">Category</th>
                    <th className="text-left py-2 px-1 text-xs text-[#6B7280] font-semibold">Item / Description</th>
                    <th className="text-left py-2 px-1 text-xs text-[#6B7280] font-semibold w-12">Qty</th>
                    <th className="text-left py-2 px-1 text-xs text-[#6B7280] font-semibold w-14">Unit</th>
                    <th className="text-left py-2 px-1 text-xs text-[#6B7280] font-semibold w-24">Unit Price</th>
                    <th className="text-left py-2 px-1 text-xs text-[#6B7280] font-semibold w-12">Tax%</th>
                    <th className="text-left py-2 px-1 text-xs text-[#6B7280] font-semibold w-14">Disc%</th>
                    <th className="text-right py-2 px-1 text-xs text-[#6B7280] font-semibold w-20">Total</th>
                    <th className="w-14 text-center py-2 px-1 text-xs text-[#6B7280] font-semibold">Opt?</th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-[#F5F7FA]">
                      <td className="py-1.5 px-1">
                        <input value={item.category} onChange={e => setItem(i, "category", e.target.value)}
                          placeholder="Category" className="field text-xs" />
                      </td>
                      <td className="py-1.5 px-1">
                        <input value={item.item_name} onChange={e => setItem(i, "item_name", e.target.value)}
                          placeholder="Item name" className="field text-xs mb-1" />
                        <input value={item.description} onChange={e => setItem(i, "description", e.target.value)}
                          placeholder="Description (optional)" className="field text-xs" />
                      </td>
                      <td className="py-1.5 px-1">
                        <input type="number" value={item.quantity} onChange={e => setItem(i, "quantity", e.target.value)}
                          className="field text-xs" min={0} />
                      </td>
                      <td className="py-1.5 px-1">
                        <input value={item.unit} onChange={e => setItem(i, "unit", e.target.value)}
                          placeholder="hr/sqft" className="field text-xs" />
                      </td>
                      <td className="py-1.5 px-1">
                        <input type="number" value={item.unit_price} onChange={e => setItem(i, "unit_price", e.target.value)}
                          className="field text-xs" min={0} step={0.01} />
                      </td>
                      <td className="py-1.5 px-1">
                        <input type="number" value={item.tax_rate} onChange={e => setItem(i, "tax_rate", e.target.value)}
                          className="field text-xs" min={0} max={100} />
                      </td>
                      <td className="py-1.5 px-1">
                        <input type="number" value={item.discount} onChange={e => setItem(i, "discount", e.target.value)}
                          className="field text-xs" min={0} max={100} />
                      </td>
                      <td className="py-1.5 px-1 text-right font-semibold text-brand-navy text-xs whitespace-nowrap">
                        {fmt(item.total)}
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        <input type="checkbox" checked={item.optional}
                          onChange={e => setItem(i, "optional", e.target.checked)}
                          className="rounded" title="Optional item" />
                      </td>
                      <td className="py-1.5 pl-1">
                        <button onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                          className="text-[#D1D5DB] hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Milestones */}
          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title mb-0">Payment Milestones</h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Optional — break the total into scheduled payments</p>
              </div>
              <button onClick={() => setMilestones([...milestones, { ...EMPTY_MILESTONE }])}
                className="btn btn-outline btn-sm"><Plus size={13} /> Add Milestone</button>
            </div>
            {milestones.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-3">No milestones added. Click &quot;Add Milestone&quot; to create a payment schedule.</p>
            ) : (
              <div className="space-y-3">
                {milestones.map((m, i) => (
                  <div key={i} className="grid grid-cols-4 gap-3 items-end">
                    <div className="col-span-2">
                      <label className="label text-xs">Milestone Label</label>
                      <input value={m.label} onChange={e => setMilestone(i, "label", e.target.value)}
                        placeholder="e.g. Deposit, Mid-project, Final" className="field text-xs" />
                    </div>
                    <div>
                      <label className="label text-xs">% of Total</label>
                      <input type="number" value={m.percent} onChange={e => setMilestone(i, "percent", e.target.value)}
                        className="field text-xs" min={0} max={100} />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="label text-xs">Due Date</label>
                        <input type="date" value={m.due_date} onChange={e => setMilestone(i, "due_date", e.target.value)}
                          className="field text-xs" />
                      </div>
                      <button onClick={() => setMilestones(milestones.filter((_, idx) => idx !== i))}
                        className="text-[#D1D5DB] hover:text-red-500 pb-2">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes & Terms */}
          <div className="form-section">
            <h2 className="section-title">Notes & Terms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Notes</label>
                <textarea value={form.notes} onChange={set("notes")} rows={4}
                  className="field resize-none" placeholder="Additional notes for the customer…" />
              </div>
              <div>
                <label className="label">Terms & Conditions</label>
                <textarea value={form.terms} onChange={set("terms")} rows={4}
                  className="field resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-6">
            <h2 className="section-title">Summary</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-[#6B7280]">
                <span>Subtotal</span><span>{fmt(subtotal + discountTotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-brand-green">
                  <span>Discount</span><span>- {fmt(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6B7280]">
                <span>Tax</span><span>{fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-[#E5E7EB] pt-3 mt-1">
                <span>Grand Total</span>
                <span className="text-brand-navy">{fmt(total)}</span>
              </div>
            </div>

            {milestones.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Milestones</p>
                {milestones.map((m, i) => (
                  <div key={i} className="flex justify-between text-xs text-[#6B7280] mb-1">
                    <span>{m.label || `Milestone ${i + 1}`}</span>
                    <span className="font-medium">{fmt(total * (m.percent / 100))}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 space-y-2">
              <button onClick={() => save("draft")} disabled={saving}
                className="btn btn-ghost border border-[#E5E7EB] w-full">
                {saving ? "Saving…" : "Save as Draft"}
              </button>
              <button onClick={() => save("sent")} disabled={saving}
                className="btn btn-primary w-full">
                {saving ? "Saving…" : "Save & Mark Sent"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewQuotePage() {
  return <Suspense><QuoteForm /></Suspense>;
}
