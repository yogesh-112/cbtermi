"use client";
/**
 * ContactSelect — a <select> with an "+ Add Contact" option that opens
 * a quick-create modal. Drop-in replacement for bare <select> wherever
 * a contact is chosen.
 *
 * Usage:
 *   <ContactSelect
 *     contacts={contacts}
 *     value={form.contact_id}
 *     onChange={id => setForm(f => ({ ...f, contact_id: id }))}
 *     onContactCreated={newContact => setContacts(cs => [newContact, ...cs])}
 *   />
 */
import { useState } from "react";
import { Modal } from "@/components/ui";
import { toast } from "@/components/ui";
import { UserPlus } from "lucide-react";

interface Contact { id: string; full_name: string; email?: string; phone?: string }

interface Props {
  contacts: Contact[];
  value: string;
  onChange: (id: string) => void;
  onContactCreated?: (c: Contact) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function ContactSelect({
  contacts, value, onChange, onContactCreated,
  placeholder = "Select contact", className = "field", required,
}: Props) {
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "__add__") { setModal(true); }
    else onChange(e.target.value);
  };

  const create = async () => {
    if (!form.full_name.trim()) { toast("Name is required", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/contacts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, contact_type: "lead", lead_status: "Opportunity" }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      const c: Contact = data.contact;
      onContactCreated?.(c);
      onChange(c.id);
      setModal(false);
      setForm({ full_name: "", email: "", phone: "" });
      toast("Contact added", "success");
    } else {
      toast(data.message || "Failed to create contact", "error");
    }
  };

  return (
    <>
      <select value={value} onChange={handleChange} className={className} required={required}>
        <option value="">{placeholder}</option>
        {contacts.map(c => (
          <option key={c.id} value={c.id}>{c.full_name}{c.email ? ` (${c.email})` : ""}</option>
        ))}
        <option value="__add__">+ Add New Contact</option>
      </select>

      <Modal open={modal} onClose={() => setModal(false)} title="Add New Contact" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="field" placeholder="Dana Whitfield" autoFocus />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="field" placeholder="dana@example.com" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/[^0-9+\-() ]/g, "") }))}
              className="field" placeholder="+1 (555) 000-0000" />
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t border-[#e7e6e1]">
            <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button type="button" className="btn btn-primary gap-1.5" onClick={create} disabled={saving}>
              <UserPlus size={14} /> {saving ? "Adding…" : "Add Contact"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
