"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft, ChevronDown, X, Mail, MessageCircle, Phone } from "lucide-react";
import { toast } from "@/components/ui";
import { fmt } from "@/lib/utils";

const EMPTY_ITEM = {
  category: "", item_name: "", description: "", quantity: 1,
  unit: "", unit_price: 0, tax_rate: 0, discount: 0, total: 0, optional: false,
};

const PROJECT_TYPES = [
  "Residential Remodel", "Commercial Build", "New Construction",
  "Roofing", "Flooring", "Painting", "Electrical", "Plumbing",
  "Landscaping", "Other",
];

function calcItem(i: any) {
  const base = i.quantity * i.unit_price;
  const disc = base * (i.discount / 100);
  const taxed = (base - disc) * (1 + i.tax_rate / 100);
  return { ...i, total: Math.round(taxed * 100) / 100 };
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 ${checked ? "bg-brand-navy" : "bg-[#e7e6e1]"}`}>
      <div className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-[3px]"}`} />
    </button>
  );
}

function QuoteForm() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactOpen, setContactOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    contact_id: "",
    contact_name: "",
    contact_email: "",
    title: "",
    issue_date: new Date().toISOString().split("T")[0],
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    project_type: "",
    project_address: "",
    notes: "",
    terms: "Payment is due within 30 days of the approved quote date.",
  });

  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [sendSms, setSendSms] = useState(false);

  useEffect(() => {
    fetch("/api/contacts").then(r => r.json()).then(d => setContacts(d.contacts ?? []));
  }, []);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const filteredContacts = contactSearch
    ? contacts.filter(c =>
        c.full_name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.email?.toLowerCase().includes(contactSearch.toLowerCase())
      )
    : contacts;

  const selectContact = (c: any) => {
    set("contact_id", c.id);
    set("contact_name", c.full_name ?? "");
    set("contact_email", c.email ?? "");
    setContactSearch("");
    setContactOpen(false);
  };

  const clearContact = () => {
    set("contact_id", "");
    set("contact_name", "");
    set("contact_email", "");
  };

  const setItem = (i: number, k: string, v: any) => {
    const arr = [...items];
    const numFields = ["quantity", "unit_price", "tax_rate", "discount"];
    arr[i] = calcItem({ ...arr[i], [k]: numFields.includes(k) ? Math.max(0, parseFloat(v) || 0) : v });
    setItems(arr);
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const discountTotal = items.reduce((s, i) => s + i.quantity * i.unit_price * (i.discount / 100), 0);
  const taxAmount = items.reduce((s, i) => s + (i.quantity * i.unit_price - i.quantity * i.unit_price * (i.discount / 100)) * (i.tax_rate / 100), 0);
  const total = subtotal - discountTotal + taxAmount;

  const save = async (status = "draft") => {
    if (!form.contact_id) { toast("Please select a contact", "error"); return; }
    if (form.valid_until && new Date(form.valid_until) < new Date()) {
      toast("Valid until date must be in the future", "error"); return;
    }
    setSaving(true);
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status, items }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      toast("Quote saved");
      router.push(`/quotes/${d.quote.id}`);
    } else {
      toast(d.message || "Failed to save quote", "error");
    }
  };

  const initials = form.contact_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/quotes" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4a5168] hover:bg-[#f6f6f3] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <label htmlFor="quote-title" className="sr-only">Quote title</label>
          <input
            id="quote-title"
            value={form.title}
            onChange={e => set("title", e.target.value)}
            placeholder="Quote title (e.g. Hartwell Kitchen Remodel)"
            className="text-[22px] font-bold text-[#0c1226] bg-transparent border-none outline-none w-full placeholder:text-[#c8c6bf]"
          />
          <p className="text-[12px] text-[#8a8fa3] mt-0.5">New quote · Draft</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-5">
        {/* Main content */}
        <div className="space-y-4">

          {/* Metadata row: Customer | Job site | Valid through */}
          <div className="card p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:divide-x md:divide-[#f0efea]">
              {/* Customer */}
              <div className="md:pr-4">
                <p className="text-[10px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-2">Customer</p>
                {form.contact_id ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-brand-navy rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[10px] font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#0c1226] truncate">{form.contact_name}</p>
                      <p className="text-[11px] text-[#8a8fa3] truncate">{form.contact_email}</p>
                    </div>
                    <button type="button" onClick={clearContact} className="text-[#8a8fa3] hover:text-[#4a5168]">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      value={contactSearch}
                      onChange={e => { setContactSearch(e.target.value); setContactOpen(true); }}
                      onFocus={() => setContactOpen(true)}
                      placeholder="Search or add…"
                      className="field text-[13px]"
                    />
                    {contactOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setContactOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e7e6e1] rounded-xl shadow-dropdown z-20 max-h-48 overflow-y-auto">
                          {filteredContacts.length === 0 ? (
                            <div className="px-3 py-2 text-[12px] text-[#8a8fa3]">No contacts found</div>
                          ) : filteredContacts.slice(0, 8).map(c => (
                            <button key={c.id} type="button" onClick={() => selectContact(c)}
                              className="w-full text-left px-3 py-2 text-[13px] text-[#0c1226] hover:bg-[#f6f6f3] transition-colors">
                              {c.full_name}
                              {c.email && <span className="text-[11px] text-[#8a8fa3] ml-2">{c.email}</span>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Job site */}
              <div className="md:px-4">
                <p className="text-[10px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-2">Job site</p>
                <input
                  value={form.project_address}
                  onChange={e => set("project_address", e.target.value)}
                  placeholder="Address…"
                  className="field text-[13px]"
                />
              </div>

              {/* Valid through */}
              <div className="md:pl-4">
                <p className="text-[10px] font-semibold text-[#8a8fa3] uppercase tracking-wider mb-2">Valid through</p>
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={e => set("valid_until", e.target.value)}
                  className="field text-[13px]"
                />
                {form.valid_until && (
                  <p className="text-[11px] text-[#8a8fa3] mt-1">
                    {Math.max(0, Math.ceil((new Date(form.valid_until).getTime() - Date.now()) / 86400000))} days left
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#f0efea] bg-[#f6f6f3]">
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wide">Item</th>
                    <th className="text-left py-2.5 px-2 text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wide w-14">Unit</th>
                    <th className="text-left py-2.5 px-2 text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wide w-14">QTY</th>
                    <th className="text-left py-2.5 px-2 text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wide w-24">Rate</th>
                    <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-[#8a8fa3] uppercase tracking-wide w-24">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-[#f6f6f3] hover:bg-[#fafaf8] transition-colors group">
                      <td className="py-2 px-4">
                        <input value={item.item_name} onChange={e => setItem(i, "item_name", e.target.value)}
                          placeholder="Item name" className="field text-[13px] mb-1 font-medium" />
                        <input value={item.description} onChange={e => setItem(i, "description", e.target.value)}
                          placeholder="Description (optional)" className="field text-[12px] text-[#8a8fa3]" />
                      </td>
                      <td className="py-2 px-2">
                        <input value={item.unit} onChange={e => setItem(i, "unit", e.target.value)}
                          placeholder="hr" className="field text-[13px]" />
                      </td>
                      <td className="py-2 px-2">
                        <input type="number" value={item.quantity} onChange={e => setItem(i, "quantity", e.target.value)}
                          className="field text-[13px]" min={0} />
                      </td>
                      <td className="py-2 px-2">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a8fa3] text-[12px]">$</span>
                          <input type="number" value={item.unit_price} onChange={e => setItem(i, "unit_price", e.target.value)}
                            className="field text-[13px] pl-5" min={0} step={0.01} />
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right font-semibold text-[13px] text-brand-navy whitespace-nowrap">
                        {fmt(item.total)}
                      </td>
                      <td className="py-2 pr-3">
                        <button onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                          className="text-[#d8d6cf] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add buttons */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-[#f0efea]">
              <button onClick={() => setItems([...items, { ...EMPTY_ITEM }])}
                className="flex items-center gap-1.5 text-[12px] font-medium text-brand-navy hover:text-brand-navy/70 transition-colors">
                <Plus size={13} /> Add line item
              </button>
              <span className="text-[#d8d6cf]">·</span>
              <button className="flex items-center gap-1.5 text-[12px] font-medium text-[#4a5168] hover:text-[#0c1226] transition-colors">
                <Plus size={13} /> Add section
              </button>
            </div>

            {/* Totals */}
            <div className="flex justify-end px-4 py-4 border-t border-[#f0efea]">
              <div className="w-64 space-y-1.5 text-[13px]">
                <div className="flex justify-between text-[#4a5168]">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-brand-green">
                    <span>Discount</span>
                    <span>− {fmt(discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#4a5168]">
                  <span>Tax</span>
                  <span>{fmt(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-[16px] border-t border-[#e7e6e1] pt-2 mt-1">
                  <span>Total</span>
                  <span className="text-brand-navy">{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card p-4">
            <label className="label mb-2">Note to customer</label>
            <textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              rows={3}
              placeholder="Add any notes visible to the customer…"
              className="field resize-none"
            />
          </div>

          {/* Issue date + project type (secondary info) */}
          <div className="card p-4">
            <h3 className="section-title mb-3">Quote details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Issue date</label>
                <input type="date" value={form.issue_date} onChange={e => set("issue_date", e.target.value)} className="field" />
              </div>
              <div>
                <label className="label">Project type</label>
                <select value={form.project_type} onChange={e => set("project_type", e.target.value)} className="field">
                  <option value="">Select type…</option>
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Actions (mobile) */}
          <div className="lg:hidden flex gap-3 justify-end pb-6">
            <Link href="/quotes" className="btn btn-outline">Cancel</Link>
            <button onClick={() => save("draft")} disabled={saving} className="btn btn-ghost border border-[#e7e6e1]">
              Save draft
            </button>
            <button onClick={() => save("sent")} disabled={saving} className="btn btn-primary">
              {saving ? "Saving…" : "Send to customer"}
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Send options */}
          <div className="card p-4">
            <p className="text-[13px] font-semibold text-[#0c1226] mb-3">Send</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[13px] text-[#0c1226]">
                  <Mail size={14} className="text-[#4a5168]" /> Email
                </div>
                <Toggle checked={sendEmail} onChange={() => setSendEmail(!sendEmail)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[13px] text-[#0c1226]">
                  <MessageCircle size={14} className="text-[#4a5168]" /> WhatsApp
                </div>
                <Toggle checked={sendWhatsapp} onChange={() => setSendWhatsapp(!sendWhatsapp)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[13px] text-[#0c1226]">
                  <Phone size={14} className="text-[#4a5168]" /> SMS
                </div>
                <Toggle checked={sendSms} onChange={() => setSendSms(!sendSms)} />
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="card p-4">
            <p className="text-[13px] font-semibold text-[#0c1226] mb-3">Activity</p>
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 bg-[#f0efea] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] text-[#8a8fa3]">✦</span>
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#0c1226]">Quote created</p>
                <p className="text-[11px] text-[#8a8fa3]">Now · draft</p>
              </div>
            </div>
          </div>

          {/* Save / Send actions (desktop) */}
          <div className="hidden lg:block card p-4 space-y-2.5">
            <button onClick={() => save("draft")} disabled={saving}
              className="btn btn-ghost border border-[#e7e6e1] w-full text-[13px]">
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button onClick={() => save("sent")} disabled={saving}
              className="btn btn-primary w-full text-[13px]">
              {saving ? "Saving…" : "Send to customer"}
            </button>
            <Link href="/quotes" className="btn btn-outline w-full text-[13px] text-center block">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewQuotePage() {
  return <Suspense><QuoteForm /></Suspense>;
}
