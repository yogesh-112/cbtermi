"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft, CreditCard, Landmark, FileCheck, Banknote, Bell, FileText } from "lucide-react";
import { toast } from "@/components/ui";
import ContactSelect from "@/components/ui/ContactSelect";
import { fmt } from "@/lib/utils";

const EMPTY_ITEM = { item_name: "", description: "", quantity: 1, unit: "", unit_price: 0, tax_rate: 0, discount: 0, total: 0 };

function calcItem(i: any) {
  const t = i.quantity * i.unit_price * (1 - i.discount / 100);
  return { ...i, total: Math.round(t * 100) / 100 };
}

const PAYMENT_OPTS = [
  { key: "card",  icon: CreditCard,  label: "Card",        sub: "Visa · Mastercard · Amex" },
  { key: "ach",   icon: Landmark,    label: "Bank · ACH",  sub: "No fee" },
  { key: "check", icon: FileCheck,   label: "Check",       sub: "" },
];

function InvoiceForm() {
  const router       = useRouter();
  const params       = useSearchParams();
  const prefillContact = params.get("contactId") ?? "";

  const [contacts, setContacts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [form, setForm] = useState({
    contact_id: prefillContact,
    project_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    payment_terms: "Net 30",
    notes: "",
    terms: "",
  });
  const [items, setItems]         = useState([{ ...EMPTY_ITEM }]);
  const [saving, setSaving]       = useState(false);
  /* right-sidebar state */
  const [payOpts, setPayOpts]     = useState({ card: true, ach: true, check: false });
  const [reminderBefore, setReminderBefore] = useState(true);
  const [reminderOverdue, setReminderOverdue] = useState(true);
  const [internalNote, setInternalNote] = useState("");
  const [tags, setTags]           = useState("");

  useEffect(() => {
    fetch("/api/contacts").then(r => r.json()).then(d => setContacts(d.contacts ?? []));
    fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects ?? []));
  }, []);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const setItem = (i: number, k: string, v: any) => {
    const arr = [...items];
    arr[i] = calcItem({ ...arr[i], [k]: ["quantity","unit_price","tax_rate","discount"].includes(k) ? Math.max(0, parseFloat(v) || 0) : v });
    setItems(arr);
  };

  const subtotal  = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = items.reduce((s, i) => s + i.total * (i.tax_rate / 100), 0);
  const total     = subtotal + taxAmount;

  const validate = (action: "draft" | "review" | "send") => {
    if (!form.contact_id) { toast("Please select a contact", "error"); return false; }
    const validItems = items.filter(i => (i.item_name || i.description) && i.quantity > 0);
    if (!validItems.length) { toast("Add at least one line item with a quantity > 0", "error"); return false; }
    const badRate = validItems.find(i => i.unit_price <= 0);
    if (badRate) { toast("All line items must have a rate greater than 0", "error"); return false; }
    if (action === "send" && !form.due_date) { toast("Due date is required when sending an invoice", "error"); return false; }
    if (form.issue_date && form.due_date && form.due_date < form.issue_date) {
      toast("Due date must be on or after the issue date", "error"); return false;
    }
    return true;
  };

  const save = async (action: "draft" | "review" | "send") => {
    if (action !== "draft" && !validate(action)) return;
    if (action === "draft" && !form.contact_id) { toast("Please select a contact first", "error"); return; }
    setSaving(true);
    const status = action === "draft" ? "draft" : "sent";
    const res = await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status, items }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setSaving(false); toast(d.message || "Failed to save", "error"); return; }
    const invoiceId = d.invoice.id;
    if (action === "send") {
      const sr = await fetch(`/api/invoices/${invoiceId}/send`, { method: "POST" });
      const sd = await sr.json().catch(() => ({}));
      if (!sr.ok) toast(sd.message || "Invoice saved but email failed to send", "error");
      else toast("Invoice sent to contact", "success");
    } else {
      toast(action === "draft" ? "Draft saved" : "Invoice ready for review", "success");
    }
    setSaving(false);
    router.push(`/invoices/${invoiceId}`);
  };

  const selectedContact = contacts.find(c => c.id === form.contact_id);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link href="/invoices" className="btn btn-ghost btn-sm p-2"><ArrowLeft size={14} /></Link>
        <div className="flex-1">
          <h1 className="page-title">New invoice</h1>
          <p className="text-[12px] text-[#8a8fa3]">Draft · auto-saves every 10 seconds</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => save("draft")} disabled={saving} className="btn btn-outline btn-sm">
            Save as Draft
          </button>
          <button onClick={() => save("review")} disabled={saving} className="btn btn-soft btn-sm">
            Save and Review
          </button>
          <button onClick={() => save("send")} disabled={saving} className="btn btn-primary btn-sm gap-1.5">
            <FileText size={13} /> {saving ? "Saving…" : "Save and Send"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: form ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Customer + Project + Dates */}
          <div className="card p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Customer <span className="text-red-500">*</span></label>
                <ContactSelect contacts={contacts} value={form.contact_id}
                  onChange={id => setForm(f => ({ ...f, contact_id: id }))}
                  onContactCreated={c => setContacts(cs => [c, ...cs])}
                  placeholder="Select contact…" />
                {selectedContact && (
                  <p className="text-[11px] text-[#8a8fa3] mt-1">{selectedContact.email}</p>
                )}
              </div>
              <div>
                <label className="label">Project</label>
                <select value={form.project_id} onChange={set("project_id")} className="field">
                  <option value="">Auto-create project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Issue date</label>
                <input type="date" value={form.issue_date} onChange={set("issue_date")} className="field" />
              </div>
              <div>
                <label className="label">Due date</label>
                <input type="date" value={form.due_date} onChange={set("due_date")} className="field" />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title mb-0">Line items</h2>
            </div>

            <div className="overflow-x-auto -mx-5 px-5">
              {/* Header row */}
              <div className="grid text-[11px] text-[#8a8fa3] uppercase tracking-wide font-semibold mb-2 px-1 min-w-[400px]"
                style={{ gridTemplateColumns: "1fr 60px 60px 80px 70px 24px" }}>
                <span>Item · description</span>
                <span className="text-right">Unit</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Amount</span>
                <span />
              </div>

              <div className="space-y-2 min-w-[400px]">
                {items.map((item, i) => (
                  <div key={i} className="grid gap-1.5 items-start"
                    style={{ gridTemplateColumns: "1fr 60px 60px 80px 70px 24px" }}>
                    <div>
                      <input value={item.item_name} onChange={e => setItem(i, "item_name", e.target.value)}
                        placeholder="Item name" className="field text-[13px] mb-1" />
                      <input value={item.description} onChange={e => setItem(i, "description", e.target.value)}
                        placeholder="Description (optional)" className="field text-[12px] text-[#8a8fa3]" />
                    </div>
                    <input value={item.unit} onChange={e => setItem(i, "unit", e.target.value)}
                      placeholder="SF" className="field text-[12px] text-right" />
                    <input type="number" value={item.quantity} onChange={e => setItem(i, "quantity", e.target.value)}
                      className="field text-[12px] text-right" min={0} />
                    <input type="number" value={item.unit_price} onChange={e => setItem(i, "unit_price", e.target.value)}
                      className="field text-[12px] text-right" min={0} step={0.01} />
                    <p className="text-right font-semibold text-[13px] text-[#0c1226] pt-2">{fmt(item.total)}</p>
                    <button onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                      aria-label="Remove item"
                      className="text-[#d8d6cf] hover:text-red-500 transition-colors pt-2">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#f0efea]">
              <button onClick={() => setItems([...items, { ...EMPTY_ITEM }])}
                className="flex items-center gap-1.5 text-[13px] text-brand-navy font-medium hover:underline">
                <Plus size={13} /> Add line
              </button>
              <button className="flex items-center gap-1.5 text-[13px] text-[#8a8fa3] hover:text-brand-navy transition-colors">
                <FileText size={13} /> Import from quote
              </button>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-5 pt-4 border-t border-[#e7e6e1]">
              <div className="w-52 space-y-2 text-[13px]">
                <div className="flex justify-between text-[#8a8fa3]">
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#8a8fa3]">
                  <span>Tax</span><span>{fmt(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-[17px] border-t border-[#e7e6e1] pt-2 mt-1">
                  <span>Balance due</span><span className="text-[#0c1226]">{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note to customer */}
          <div className="card p-5">
            <label className="label">Note to customer</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3}
              className="field resize-none" placeholder="Thank you for your business! Payment is due by the date above." />
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">
          {/* Payment options */}
          <div className="card p-5">
            <h3 className="section-title mb-3">Payment options</h3>
            <div className="space-y-2">
              {PAYMENT_OPTS.map(opt => (
                <button key={opt.key} onClick={() => setPayOpts(p => ({ ...p, [opt.key]: !p[opt.key as keyof typeof p] }))}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                    payOpts[opt.key as keyof typeof payOpts]
                      ? "border-brand-navy bg-[#eef2ff]"
                      : "border-[#e7e6e1] hover:border-[#d8d6cf]"
                  }`}>
                  <div className="flex items-center gap-2.5">
                    <opt.icon size={14} className={payOpts[opt.key as keyof typeof payOpts] ? "text-brand-navy" : "text-[#8a8fa3]"} />
                    <div className="text-left">
                      <p className={`text-[13px] font-medium ${payOpts[opt.key as keyof typeof payOpts] ? "text-brand-navy" : "text-[#0c1226]"}`}>
                        {opt.label}
                      </p>
                      {opt.sub && <p className="text-[11px] text-[#8a8fa3]">{opt.sub}</p>}
                    </div>
                  </div>
                  <div className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 ${payOpts[opt.key as keyof typeof payOpts] ? "bg-brand-navy" : "bg-[#e7e6e1]"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${payOpts[opt.key as keyof typeof payOpts] ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Schedule / reminders */}
          <div className="card p-5">
            <h3 className="section-title mb-3 flex items-center gap-1.5"><Bell size={13} /> Schedule</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={reminderBefore} onChange={e => setReminderBefore(e.target.checked)}
                  className="mt-0.5 accent-brand-navy" />
                <span className="text-[13px] text-[#4a5168]">Send reminder 3 days before due</span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={reminderOverdue} onChange={e => setReminderOverdue(e.target.checked)}
                  className="mt-0.5 accent-brand-navy" />
                <span className="text-[13px] text-[#4a5168]">Auto-reminder if overdue</span>
              </label>
            </div>
          </div>

          {/* Internal */}
          <div className="card p-5">
            <h3 className="section-title mb-3">Internal</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Tags</label>
                <input value={tags} onChange={e => setTags(e.target.value)}
                  placeholder="Deck · Milestone 1" className="field text-[13px]" />
              </div>
              <div>
                <label className="label">Internal note</label>
                <textarea value={internalNote} onChange={e => setInternalNote(e.target.value)}
                  rows={2} className="field resize-none text-[13px]"
                  placeholder="Why your team sees this…" />
              </div>
            </div>
          </div>

          {/* Save actions */}
          <div className="space-y-2">
            <button onClick={() => save("send")} disabled={saving} className="btn btn-primary w-full">
              {saving ? "Saving…" : "Save and Send"}
            </button>
            <button onClick={() => save("review")} disabled={saving} className="btn btn-soft w-full">
              Save and Review
            </button>
            <button onClick={() => save("draft")} disabled={saving} className="btn btn-outline w-full">
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return <Suspense><InvoiceForm /></Suspense>;
}
