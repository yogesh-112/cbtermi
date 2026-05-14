"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Phone, Mail, MessageCircle } from "lucide-react";
import { Modal, StatusBadge, EmptyState, toast } from "@/components/ui";
import { Users } from "lucide-react";

const EMPTY_FORM = { full_name: "", business_name: "", email: "", phone: "", whatsapp: "", address: "", city: "", state: "", zip: "", contact_type: "lead", source: "", notes: "" };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const q = typeFilter ? `?type=${typeFilter}` : "";
    fetch(`/api/contacts${q}`).then((r) => r.json()).then((d) => setContacts(d.contacts ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [typeFilter]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    if (!form.full_name.trim()) { toast("Full name required", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { toast("Contact added"); setModal(false); setForm(EMPTY_FORM); load(); }
    else toast("Failed to add contact", "error");
  };

  const filtered = contacts.filter((c) =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Contacts</h1>
        <button className="btn-green btn" onClick={() => setModal(true)}><Plus size={16} /> Add Contact</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts…" className="field pl-9" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="field w-auto">
          <option value="">All types</option>
          <option value="lead">Leads</option>
          <option value="customer">Customers</option>
          <option value="direct_contact">Direct Contacts</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table-base">
          <thead><tr>
            <th>Name</th><th className="hidden sm:table-cell">Email</th>
            <th className="hidden md:table-cell">Phone</th><th>Type</th>
            <th className="hidden lg:table-cell">Source</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}><EmptyState icon={<Users size={40} />} title="No contacts yet" description="Add your first contact to get started." /></td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/contacts/${c.id}`} className="font-medium text-brand-navy hover:underline">{c.full_name}</Link>
                  {c.business_name && <p className="text-xs text-slate-400">{c.business_name}</p>}
                </td>
                <td className="hidden sm:table-cell text-slate-500">{c.email || "—"}</td>
                <td className="hidden md:table-cell text-slate-500">{c.phone || "—"}</td>
                <td><StatusBadge status={c.contact_type} /></td>
                <td className="hidden lg:table-cell text-slate-500 text-xs">{c.source || "—"}</td>
                <td>
                  <div className="flex items-center gap-1">
                    {c.phone && <a href={`tel:${c.phone}`} className="btn-ghost btn btn-sm p-1.5" title="Call"><Phone size={13} /></a>}
                    {c.email && <a href={`mailto:${c.email}`} className="btn-ghost btn btn-sm p-1.5" title="Email"><Mail size={13} /></a>}
                    {c.whatsapp && <a href={`https://wa.me/${c.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="btn-ghost btn btn-sm p-1.5" title="WhatsApp"><MessageCircle size={13} /></a>}
                    <Link href={`/contacts/${c.id}`} className="btn-outline btn btn-sm">View</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Contact Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Contact" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Full name *</label><input value={form.full_name} onChange={set("full_name")} placeholder="John Doe" className="field" /></div>
          <div><label className="label">Business name</label><input value={form.business_name} onChange={set("business_name")} placeholder="Company Inc." className="field" /></div>
          <div><label className="label">Email</label><input type="email" value={form.email} onChange={set("email")} placeholder="john@example.com" className="field" /></div>
          <div><label className="label">Phone</label><input value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" className="field" /></div>
          <div><label className="label">WhatsApp</label><input value={form.whatsapp} onChange={set("whatsapp")} placeholder="+1 (555) 000-0000" className="field" /></div>
          <div><label className="label">Contact type</label>
            <select value={form.contact_type} onChange={set("contact_type")} className="field">
              <option value="lead">Lead</option><option value="customer">Customer</option><option value="direct_contact">Direct Contact</option>
            </select>
          </div>
          <div><label className="label">Source</label><input value={form.source} onChange={set("source")} placeholder="Referral, Google, etc." className="field" /></div>
          <div><label className="label">City</label><input value={form.city} onChange={set("city")} placeholder="Dallas" className="field" /></div>
          <div className="md:col-span-2"><label className="label">Notes</label><textarea value={form.notes} onChange={set("notes")} rows={2} className="field resize-none" /></div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button className="btn-ghost btn" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-green btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Add Contact"}</button>
        </div>
      </Modal>
    </div>
  );
}
