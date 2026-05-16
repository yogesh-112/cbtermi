"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Plus, Search, Phone, Mail, MessageCircle, Eye, Pencil,
  UserCheck, Bell, Trash2, ChevronDown, Users, MoreHorizontal,
} from "lucide-react";
import { Modal, StatusBadge, EmptyState, toast, ConfirmDialog, ActionMenu, Tabs } from "@/components/ui";

const LEAD_STATUSES = [
  "New Lead", "In Conversation", "Meeting Scheduled", "Site Visit",
  "Proposal Sent", "Negotiation", "Won", "Lost",
];

const LEAD_SOURCES = [
  "Referral", "Google", "Facebook", "Instagram", "LinkedIn",
  "Walk-in", "Cold Call", "Website", "Other",
];

const EMPTY_FORM = {
  full_name: "", business_name: "", email: "", lead_source: "",
  phone: "", whatsapp: "", whatsapp_same: false,
  address: "", city: "", state: "", zip: "", notes: "",
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
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setStatusPopup(null);
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
    setForm((f) => ({ ...f, whatsapp_same: !f.whatsapp_same, whatsapp: !f.whatsapp_same ? f.phone : f.whatsapp }));
  };

  const openAdd = () => { setEditContact(null); setForm({ ...EMPTY_FORM }); setModal(true); };
  const openEdit = (c: any) => {
    setEditContact(c);
    setForm({
      full_name: c.full_name ?? "", business_name: c.business_name ?? "",
      email: c.email ?? "", lead_source: c.source ?? "",
      phone: c.phone ?? "", whatsapp: c.whatsapp ?? "", whatsapp_same: false,
      address: c.address ?? "", city: c.city ?? "", state: c.state ?? "",
      zip: c.zip ?? "", notes: c.notes ?? "",
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.full_name.trim()) { toast("Full name is required", "error"); return; }
    if (!form.email.trim()) { toast("Email is required", "error"); return; }
    if (!form.phone.trim()) { toast("Phone number is required", "error"); return; }
    setSaving(true);
    const payload = {
      full_name: form.full_name, business_name: form.business_name,
      email: form.email, source: form.lead_source,
      phone: form.phone, whatsapp: form.whatsapp_same ? form.phone : form.whatsapp,
      address: form.address, city: form.city, state: form.state, zip: form.zip, notes: form.notes,
      contact_type: editContact ? editContact.contact_type : "lead",
      lead_status: editContact ? editContact.lead_status : "New Lead",
    };
    const url = editContact ? `/api/contacts/${editContact.id}` : "/api/contacts";
    const res = await fetch(url, {
      method: editContact ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) { toast(editContact ? "Contact updated" : "Contact added"); setModal(false); load(); }
    else toast("Failed to save contact", "error");
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_status: status }),
    });
    setStatusPopup(null);
    setContacts((cs) => cs.map((c) => c.id === id ? { ...c, lead_status: status } : c));
  };

  const convertToCustomer = async (id: string) => {
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
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

  const getInitials = (name: string) => name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const AVATAR_COLORS = ["bg-brand-navy", "bg-brand-green", "bg-[#7C3AED]", "bg-[#D97706]", "bg-[#0D9488]", "bg-[#2563EB]"];
  const avatarColor = (name: string) => AVATAR_COLORS[name?.charCodeAt(0) % AVATAR_COLORS.length] ?? "bg-brand-navy";

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-desc">{contacts.length} total contacts</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add Contact
        </button>
      </div>

      {/* Tabs + Search */}
      <Tabs tabs={["All", "Leads", "Customers"]}
        active={tab === "all" ? "All" : tab === "lead" ? "Leads" : "Customers"}
        onChange={(t) => setTab(t === "All" ? "all" : t === "Leads" ? "lead" : "customer")} />

      <div className="input-group mb-5 max-w-sm">
        <Search size={14} className="input-icon" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone…" className="field" />
      </div>

      {/* Mobile card list */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="mobile-card animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 skeleton rounded" />
                    <div className="h-3 w-24 skeleton rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users size={36} />} title="No contacts yet"
            description="Add your first contact to get started."
            action={<button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> Add Contact</button>} />
        ) : filtered.map((c) => (
          <div key={c.id} className="mobile-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${avatarColor(c.full_name)} rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-xs font-bold">{getInitials(c.full_name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/contacts/${c.id}`} className="font-semibold text-[#111827] hover:text-brand-navy truncate block">
                  {c.full_name}
                </Link>
                {c.business_name && <p className="text-xs text-[#9CA3AF] truncate">{c.business_name}</p>}
              </div>
              <ActionMenu items={[
                { label: "View", icon: <Eye size={14} />, onClick: () => window.location.href = `/contacts/${c.id}` },
                { label: "Edit", icon: <Pencil size={14} />, onClick: () => openEdit(c) },
                ...(c.contact_type !== "customer" ? [{ label: "Convert", icon: <UserCheck size={14} />, onClick: () => convertToCustomer(c.id) }] : []),
                { label: "Delete", icon: <Trash2 size={14} />, onClick: () => setDeleteId(c.id), danger: true },
              ]} />
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <StatusBadge status={c.contact_type} />
              <span className="badge bg-[#F3F4F6] text-[#6B7280]">{c.lead_status || "New Lead"}</span>
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F3F4F6]">
              {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs text-[#6B7280]"><Phone size={12} /> {c.phone}</a>}
              {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-[#6B7280] truncate"><Mail size={12} /> {c.email}</a>}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
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
                  <EmptyState icon={<Users size={40} />} title="No contacts yet"
                    description="Add your first contact to get started."
                    action={<button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> Add Contact</button>} />
                </td>
              </tr>
            ) : filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 ${avatarColor(c.full_name)} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-[10px] font-bold">{getInitials(c.full_name)}</span>
                    </div>
                    <div>
                      <Link href={`/contacts/${c.id}`} className="font-medium text-brand-navy hover:underline">
                        {c.full_name}
                      </Link>
                      {c.business_name && <p className="text-xs text-[#9CA3AF]">{c.business_name}</p>}
                    </div>
                  </div>
                </td>
                <td className="text-[#6B7280]">{c.email || "—"}</td>
                <td className="text-[#6B7280]">{c.phone || "—"}</td>
                <td>
                  <div className="relative" ref={statusPopup === c.id ? popupRef : undefined}>
                    <button onClick={() => setStatusPopup(statusPopup === c.id ? null : c.id)}
                      className="flex items-center gap-1 text-xs font-medium text-[#374151] hover:text-brand-navy border border-[#E5E7EB] rounded-lg px-2.5 py-1 bg-white hover:bg-[#F9FAFB] transition-colors">
                      {c.lead_status || "New Lead"} <ChevronDown size={10} />
                    </button>
                    {statusPopup === c.id && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-dropdown z-20 min-w-[160px] overflow-hidden animate-scale-in">
                        {LEAD_STATUSES.map((s) => (
                          <button key={s} onClick={() => updateStatus(c.id, s)}
                            className={`w-full text-left px-3.5 py-2 text-xs hover:bg-[#F9FAFB] transition-colors ${c.lead_status === s ? "text-brand-navy font-semibold bg-brand-navy-light" : "text-[#374151]"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td><StatusBadge status={c.contact_type} /></td>
                <td>
                  <ActionMenu items={[
                    { label: "View", icon: <Eye size={14} />, onClick: () => window.location.href = `/contacts/${c.id}` },
                    { label: "Edit", icon: <Pencil size={14} />, onClick: () => openEdit(c) },
                    { label: "Call", icon: <Phone size={14} />, onClick: () => window.open(`tel:${c.phone}`) },
                    { label: "Email", icon: <Mail size={14} />, onClick: () => window.open(`mailto:${c.email}`) },
                    ...(c.whatsapp ? [{ label: "WhatsApp", icon: <MessageCircle size={14} />, onClick: () => window.open(`https://wa.me/${c.whatsapp.replace(/\D/g,"")}`, "_blank") }] : []),
                    ...(c.contact_type !== "customer" ? [{ label: "Convert to Customer", icon: <UserCheck size={14} />, onClick: () => convertToCustomer(c.id) }] : []),
                    { label: "Delete", icon: <Trash2 size={14} />, onClick: () => setDeleteId(c.id), danger: true },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
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
              onChange={set("whatsapp")} placeholder="+1 (555) 000-0000"
              readOnly={form.whatsapp_same}
              className={`field ${form.whatsapp_same ? "bg-surface opacity-70" : ""}`} />
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
          <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : editContact ? "Update Contact" : "Add Contact"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={deleteContact}
        title="Delete Contact" message="Are you sure you want to delete this contact? This cannot be undone." danger />
    </div>
  );
}
