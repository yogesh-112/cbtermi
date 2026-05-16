"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Plus, Search, Phone, Mail, MessageCircle, Eye, Pencil,
  UserCheck, Bell, Trash2, ChevronDown, Users,
} from "lucide-react";
import { Modal, StatusBadge, EmptyState, toast, ConfirmDialog } from "@/components/ui";

const LEAD_STATUSES = [
  "New Lead",
  "In Conversation",
  "Meeting Scheduled",
  "Site Visit",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
];

const LEAD_SOURCES = [
  "Referral", "Google", "Facebook", "Instagram", "LinkedIn",
  "Walk-in", "Cold Call", "Website", "Other",
];

const EMPTY_FORM = {
  full_name: "", business_name: "", email: "", lead_source: "",
  phone: "", whatsapp: "", whatsapp_same: false,
  address: "", city: "", state: "", zip: "",
  notes: "",
};

type Tab = "all" | "lead" | "customer";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [modal, setModal] = useState(false);
  const [editContact, setEditContact] = useState<any | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusPopup, setStatusPopup] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoading(true);
    const q = tab !== "all" ? `?type=${tab}` : "";
    fetch(`/api/contacts${q}`)
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setStatusPopup(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const set = (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (k === "phone" && (form as any).whatsapp_same) {
        setForm((f) => ({ ...f, phone: val, whatsapp: val }));
      } else {
        setForm((f) => ({ ...f, [k]: val }));
      }
    };

  const toggleWhatsappSame = () => {
    setForm((f) => ({
      ...f,
      whatsapp_same: !f.whatsapp_same,
      whatsapp: !f.whatsapp_same ? f.phone : f.whatsapp,
    }));
  };

  const openAdd = () => {
    setEditContact(null);
    setForm({ ...EMPTY_FORM });
    setModal(true);
  };

  const openEdit = (c: any) => {
    setEditContact(c);
    setForm({
      full_name: c.full_name ?? "",
      business_name: c.business_name ?? "",
      email: c.email ?? "",
      lead_source: c.lead_source ?? c.source ?? "",
      phone: c.phone ?? "",
      whatsapp: c.whatsapp ?? "",
      whatsapp_same: false,
      address: c.address ?? "",
      city: c.city ?? "",
      state: c.state ?? "",
      zip: c.zip ?? "",
      notes: c.notes ?? "",
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.full_name.trim()) { toast("Full name is required", "error"); return; }
    if (!form.email.trim()) { toast("Email is required", "error"); return; }
    if (!form.phone.trim()) { toast("Phone number is required", "error"); return; }
    setSaving(true);
    const payload = {
      full_name: form.full_name,
      business_name: form.business_name,
      email: form.email,
      source: form.lead_source,
      lead_source: form.lead_source,
      phone: form.phone,
      whatsapp: form.whatsapp_same ? form.phone : form.whatsapp,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      notes: form.notes,
      contact_type: editContact ? editContact.contact_type : "lead",
      lead_status: editContact ? editContact.lead_status : "New Lead",
    };
    const url = editContact ? `/api/contacts/${editContact.id}` : "/api/contacts";
    const method = editContact ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      toast(editContact ? "Contact updated" : "Contact added");
      setModal(false);
      load();
    } else {
      toast("Failed to save contact", "error");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_status: status }),
    });
    setStatusPopup(null);
    setContacts((cs) => cs.map((c) => c.id === id ? { ...c, lead_status: status } : c));
  };

  const convertToCustomer = async (id: string) => {
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_type: "customer" }),
    });
    if (res.ok) { toast("Converted to customer"); load(); }
    else toast("Failed to convert", "error");
  };

  const deleteContact = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/contacts/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast("Contact deleted"); load(); }
    else toast("Failed to delete", "error");
    setDeleteId(null);
  };

  const filtered = contacts.filter((c) =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All Contacts" },
    { key: "lead", label: "Leads" },
    { key: "customer", label: "Customers" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Contacts</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add Contact
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E5E7EB] mb-5">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-brand-navy text-brand-navy"
                : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="field pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th className="hidden sm:table-cell">Email</th>
              <th className="hidden md:table-cell">Phone</th>
              <th>Status</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-[#9CA3AF]">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<Users size={40} />}
                    title="No contacts yet"
                    description="Add your first contact to get started."
                    action={<button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> Add Contact</button>}
                  />
                </td>
              </tr>
            ) : filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/contacts/${c.id}`} className="font-medium text-brand-navy hover:underline">
                    {c.full_name}
                  </Link>
                  {c.business_name && <p className="text-xs text-[#9CA3AF]">{c.business_name}</p>}
                </td>
                <td className="hidden sm:table-cell text-[#6B7280]">{c.email || "—"}</td>
                <td className="hidden md:table-cell text-[#6B7280]">{c.phone || "—"}</td>
                <td>
                  <div className="relative" ref={statusPopup === c.id ? popupRef : undefined}>
                    <button
                      onClick={() => setStatusPopup(statusPopup === c.id ? null : c.id)}
                      className="flex items-center gap-1 text-xs font-medium text-[#6B7280] hover:text-brand-navy border border-[#E5E7EB] rounded px-2 py-1 bg-white hover:bg-[#F5F7FA] transition-colors">
                      <span>{c.lead_status || "New Lead"}</span>
                      <ChevronDown size={11} />
                    </button>
                    {statusPopup === c.id && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5E7EB] rounded shadow-lg z-20 min-w-[180px]">
                        {LEAD_STATUSES.map((s) => (
                          <button key={s} onClick={() => updateStatus(c.id, s)}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F5F7FA] transition-colors ${c.lead_status === s ? "text-brand-navy font-semibold" : "text-[#374151]"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td><StatusBadge status={c.contact_type} /></td>
                <td>
                  <div className="flex items-center gap-1 flex-wrap">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="btn btn-ghost btn-sm p-1.5" title="Call">
                        <Phone size={13} />
                      </a>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="btn btn-ghost btn-sm p-1.5" title="Email">
                        <Mail size={13} />
                      </a>
                    )}
                    {c.whatsapp && (
                      <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                        className="btn btn-ghost btn-sm p-1.5" title="WhatsApp">
                        <MessageCircle size={13} />
                      </a>
                    )}
                    <Link href={`/contacts/${c.id}`} className="btn btn-ghost btn-sm p-1.5" title="View">
                      <Eye size={13} />
                    </Link>
                    <button onClick={() => openEdit(c)} className="btn btn-ghost btn-sm p-1.5" title="Edit">
                      <Pencil size={13} />
                    </button>
                    {c.contact_type !== "customer" && (
                      <button onClick={() => convertToCustomer(c.id)} className="btn btn-ghost btn-sm p-1.5 text-brand-green" title="Convert to Customer">
                        <UserCheck size={13} />
                      </button>
                    )}
                    <Link href={`/notifications?contactId=${c.id}`} className="btn btn-ghost btn-sm p-1.5" title="Send Notification">
                      <Bell size={13} />
                    </Link>
                    <button onClick={() => setDeleteId(c.id)} className="btn btn-ghost btn-sm p-1.5 text-red-500" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Contact Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editContact ? "Edit Contact" : "Add Contact"} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name <span className="text-red-500">*</span></label>
            <input value={form.full_name} onChange={set("full_name")} placeholder="John Doe" className="field" />
          </div>
          <div>
            <label className="label">Business Name</label>
            <input value={form.business_name} onChange={set("business_name")} placeholder="Company Inc." className="field" />
          </div>
          <div>
            <label className="label">Email <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="john@example.com" className="field" />
          </div>
          <div>
            <label className="label">Lead Source</label>
            <select value={form.lead_source} onChange={set("lead_source")} className="field">
              <option value="">Select source</option>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Phone Number <span className="text-red-500">*</span></label>
            <input value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" className="field" />
          </div>
          <div>
            <label className="label">
              WhatsApp Number
              <label className="inline-flex items-center gap-1.5 ml-3 cursor-pointer">
                <input type="checkbox" checked={form.whatsapp_same} onChange={toggleWhatsappSame} className="rounded" />
                <span className="text-xs text-[#6B7280] font-normal">Same as phone</span>
              </label>
            </label>
            <input
              value={form.whatsapp_same ? form.phone : form.whatsapp}
              onChange={set("whatsapp")}
              placeholder="+1 (555) 000-0000"
              readOnly={form.whatsapp_same}
              className={`field ${form.whatsapp_same ? "bg-[#F5F7FA] text-[#9CA3AF]" : ""}`}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Address</label>
            <input value={form.address} onChange={set("address")} placeholder="123 Main St" className="field" />
          </div>
          <div>
            <label className="label">City</label>
            <input value={form.city} onChange={set("city")} placeholder="Dallas" className="field" />
          </div>
          <div>
            <label className="label">State</label>
            <input value={form.state} onChange={set("state")} placeholder="TX" className="field" />
          </div>
          <div>
            <label className="label">Zipcode</label>
            <input value={form.zip} onChange={set("zip")} placeholder="75001" className="field" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3} className="field resize-none" placeholder="Additional notes…" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-[#E5E7EB]">
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : editContact ? "Update Contact" : "Add Contact"}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={deleteContact}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        danger
      />
    </div>
  );
}
