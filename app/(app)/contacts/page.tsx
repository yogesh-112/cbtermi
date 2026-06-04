"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Plus, Search, Phone, Mail, MessageCircle, MessageSquare,
  Eye, Pencil, UserCheck, Trash2, Users, ChevronDown,
} from "lucide-react";
import { Modal, StatusBadge, EmptyState, toast, ConfirmDialog, ActionMenu, Tabs } from "@/components/ui";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { useT } from "@/lib/i18n";

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
  const t = useT();
  const PAGE_SIZE = 50;
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [aggCounts, setAggCounts] = useState({ all: 0, leads: 0, customers: 0 });
  const [modal, setModal] = useState(false);
  const [editContact, setEditContact] = useState<any | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusPopup, setStatusPopup] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const load = (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(p * PAGE_SIZE) });
    if (tab !== "all") params.set("type", tab);
    fetch(`/api/contacts?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setContacts(d.contacts ?? []);
        setTotal(d.total ?? 0);
        if (d.counts) setAggCounts({ all: d.counts.all, leads: d.counts.leads, customers: d.counts.customers });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(0); load(0); }, [tab]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setStatusPopup(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const set = (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      let val = e.target.value;
      // Phone/WhatsApp: strip everything except digits, spaces, +, -, (, )
      if (k === "phone" || k === "whatsapp") val = val.replace(/[^0-9+\-() ]/g, "");
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
    if (!form.full_name.trim()) { toast(t.contacts.required, "error"); return; }
    if (!form.email.trim()) { toast(t.contacts.required, "error"); return; }
    if (!form.phone.trim()) { toast(t.contacts.required, "error"); return; }
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
    if (res.ok) { toast(editContact ? t.contacts.contactUpdated : t.contacts.contactAdded); setModal(false); load(); }
    else toast(t.contacts.failedToSave, "error");
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
    if (res.ok) { toast(t.contacts.converted); load(); }
    else toast(t.contacts.failedConvert, "error");
  };

  const deleteContact = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/contacts/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast(t.contacts.deleted); load(); }
    else toast(t.contacts.failedDelete, "error");
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

  // leads/customers counts now come from aggCounts (server-side, accurate across all pages)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.contacts.title}</h1>
          <p className="page-desc">{total} {t.contacts.totalContacts}</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/contacts?format=csv" download className="btn btn-outline btn-sm">
            ↓ CSV
          </a>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> {t.contacts.addContact}
          </button>
        </div>
      </div>

      {/* Mini stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="mini-stat mini-stat-navy">
          <span className="mini-stat-label">{t.contacts.totalLabel}</span>
          <span className="mini-stat-value">{aggCounts.all}</span>
        </div>
        <div className="mini-stat mini-stat-blue">
          <span className="mini-stat-label">{t.contacts.leadsLabel}</span>
          <span className="mini-stat-value">{aggCounts.leads}</span>
        </div>
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">{t.contacts.customersLabel}</span>
          <span className="mini-stat-value">{aggCounts.customers}</span>
        </div>
      </div>

      {/* Tabs + Search */}
      <Tabs tabs={[t.contacts.tabAll, t.contacts.tabLeads, t.contacts.tabCustomers]}
        active={tab === "all" ? t.contacts.tabAll : tab === "lead" ? t.contacts.tabLeads : t.contacts.tabCustomers}
        onChange={(v) => setTab(v === t.contacts.tabAll ? "all" : v === t.contacts.tabLeads ? "lead" : "customer")} />

      <div className="input-group mb-5 max-w-sm">
        <Search size={14} className="input-icon" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t.contacts.searchPlaceholder} className="field" />
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
          <EmptyState icon={<Users size={36} />} title={t.contacts.noContacts}
            description={t.contacts.noContactsDesc}
            action={<button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> {t.contacts.addContact}</button>} />
        ) : filtered.map((c) => (
          <div key={c.id} className="mobile-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${avatarColor(c.full_name)} rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-xs font-bold">{getInitials(c.full_name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/contacts/${c.id}`} className="font-semibold text-[#0c1226] hover:text-brand-navy truncate block">
                  {c.full_name}
                </Link>
                {c.business_name && <p className="text-xs text-[#8a8fa3] truncate">{c.business_name}</p>}
              </div>
              <StatusBadge status={c.contact_type} />
            </div>
            {/* Quick status update */}
            <div className="relative mt-2">
              <select value={c.lead_status || "New Lead"}
                onChange={e => updateStatus(c.id, e.target.value)}
                className="text-[12px] font-medium text-[#4a5168] bg-[#f0efea] border-0 rounded-full px-3 py-1 pr-7 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-navy/20 w-full">
                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a8fa3]" />
            </div>
            {/* Quick action buttons */}
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#f0efea] flex-wrap">
              {c.phone && <a href={`tel:${c.phone}`} title="Call" className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium text-[#4a5168] bg-[#f6f6f3] hover:bg-[#eef2ff] hover:text-brand-navy transition-colors"><Phone size={12} />Call</a>}
              {c.phone && <a href={`sms:${c.phone}`} title="SMS" className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium text-[#4a5168] bg-[#f6f6f3] hover:bg-[#eef2ff] hover:text-brand-navy transition-colors"><MessageSquare size={12} />SMS</a>}
              {(c.whatsapp || c.phone) && <a href={`https://wa.me/${(c.whatsapp||c.phone).replace(/\D/g,"")}`} target="_blank" rel="noreferrer" title="WhatsApp" className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium text-[#4a5168] bg-[#f6f6f3] hover:bg-[#dcfce7] hover:text-green-700 transition-colors"><MessageCircle size={12} />WhatsApp</a>}
              {c.email && <a href={`mailto:${c.email}`} title="Email" className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium text-[#4a5168] bg-[#f6f6f3] hover:bg-[#eef2ff] hover:text-brand-navy transition-colors"><Mail size={12} />Email</a>}
              <Link href={`/contacts/${c.id}`} title="View" className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium text-[#4a5168] bg-[#f6f6f3] hover:bg-[#eef2ff] hover:text-brand-navy transition-colors"><Eye size={12} />View</Link>
              {c.contact_type !== "customer" && <button onClick={() => convertToCustomer(c.id)} title="Convert to Customer" className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium text-[#4a5168] bg-[#f6f6f3] hover:bg-[#dcfce7] hover:text-green-700 transition-colors"><UserCheck size={12} />Convert</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t.contacts.nameCol}</th>
              <th>{t.contacts.typeCol}</th>
              <th>{t.contacts.locationCol}</th>
              <th>{t.contacts.projectsCol}</th>
              <th>{t.contacts.lifetimeValueCol}</th>
              <th>{t.contacts.lastContactCol}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-[#8a8fa3]">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon={<Users size={40} />} title={t.contacts.noContacts}
                    description={t.contacts.noContactsDesc}
                    action={<button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> {t.contacts.addContact}</button>} />
                </td>
              </tr>
            ) : filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 ${avatarColor(c.full_name)} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-[11px] font-bold">{getInitials(c.full_name)}</span>
                    </div>
                    <div>
                      <Link href={`/contacts/${c.id}`} className="font-semibold text-[13px] text-[#0c1226] hover:text-brand-navy">
                        {c.full_name}
                      </Link>
                      <p className="text-[11px] text-[#8a8fa3]">{c.email || c.business_name || "—"}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={c.contact_type} />
                    {/* Quick inline status dropdown */}
                    <div className="relative">
                      <select value={c.lead_status || "New Lead"}
                        onChange={e => updateStatus(c.id, e.target.value)}
                        className="text-[11px] font-medium text-[#4a5168] bg-[#f0efea] border-0 rounded-full pl-2.5 pr-5 py-0.5 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-navy/20 max-w-[140px]">
                        {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a8fa3]" />
                    </div>
                  </div>
                </td>
                <td className="text-[13px] text-[#4a5168]">
                  {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="text-[13px] text-[#4a5168]">—</td>
                <td className="text-[13px] font-medium text-[#0c1226]">$0</td>
                <td className="text-[12px] text-[#8a8fa3]">—</td>
                <td>
                  <div className="flex items-center gap-0.5">
                    {c.phone && <a href={`tel:${c.phone}`} title="Call" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8a8fa3] hover:text-brand-navy hover:bg-[#f6f6f3] transition-colors"><Phone size={13} /></a>}
                    {c.phone && <a href={`sms:${c.phone}`} title="SMS" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8a8fa3] hover:text-brand-navy hover:bg-[#f6f6f3] transition-colors"><MessageSquare size={13} /></a>}
                    {(c.whatsapp || c.phone) && <a href={`https://wa.me/${(c.whatsapp||c.phone).replace(/\D/g,"")}`} target="_blank" rel="noreferrer" title="WhatsApp" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8a8fa3] hover:text-green-600 hover:bg-[#f6f6f3] transition-colors"><MessageCircle size={13} /></a>}
                    {c.email && <a href={`mailto:${c.email}`} title="Email" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8a8fa3] hover:text-brand-navy hover:bg-[#f6f6f3] transition-colors"><Mail size={13} /></a>}
                    <Link href={`/contacts/${c.id}`} title="View" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8a8fa3] hover:text-brand-navy hover:bg-[#f6f6f3] transition-colors"><Eye size={13} /></Link>
                    {c.contact_type !== "customer" && <button onClick={() => convertToCustomer(c.id)} title="Convert to Customer" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8a8fa3] hover:text-green-600 hover:bg-[#f6f6f3] transition-colors"><UserCheck size={13} /></button>}
                    <ActionMenu items={[
                      { label: t.contacts.editAction, icon: <Pencil size={14} />, onClick: () => openEdit(c) },
                      { label: t.common.delete, icon: <Trash2 size={14} />, onClick: () => setDeleteId(c.id), danger: true },
                    ]} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editContact ? t.contacts.editContact : t.contacts.addContactModal} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t.contacts.fullName} <span className="text-red-500">*</span></label>
            <input value={form.full_name} onChange={set("full_name")} placeholder="John Doe" className="field" />
          </div>
          <div>
            <label className="label">{t.contacts.businessName}</label>
            <input value={form.business_name} onChange={set("business_name")} placeholder="Company Inc." className="field" />
          </div>
          <div>
            <label className="label">{t.auth.email} <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="john@example.com" className="field" />
          </div>
          <div>
            <label className="label">{t.contacts.leadSource}</label>
            <select value={form.lead_source} onChange={set("lead_source")} className="field">
              <option value="">{t.contacts.selectSource}</option>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.contacts.phoneNumber} <span className="text-red-500">*</span></label>
            <input value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" className="field" />
          </div>
          <div>
            <label className="label">
              {t.contacts.whatsappNumber}
              <label className="inline-flex items-center gap-1.5 ml-3 cursor-pointer">
                <input type="checkbox" checked={form.whatsapp_same} onChange={toggleWhatsappSame} className="rounded" />
                <span className="text-xs text-[#4a5168] font-normal">{t.contacts.sameAsPhone}</span>
              </label>
            </label>
            <input
              value={form.whatsapp_same ? form.phone : form.whatsapp}
              onChange={set("whatsapp")} placeholder="+1 (555) 000-0000"
              readOnly={form.whatsapp_same}
              className={`field ${form.whatsapp_same ? "bg-surface opacity-70" : ""}`} />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t.contacts.addressLabel}</label>
            <AddressAutocomplete
              value={form.address}
              onChange={v => setForm(f => ({ ...f, address: v }))}
              onSelect={fill => setForm(f => ({ ...f, address: fill.address, city: fill.city, state: fill.state, zip: fill.zip }))}
              placeholder="123 Main St"
            />
          </div>
          <div>
            <label className="label">{t.contacts.cityLabel}</label>
            <input value={form.city} onChange={set("city")} placeholder="Dallas" className="field" />
          </div>
          <div>
            <label className="label">{t.contacts.stateLabel}</label>
            <input value={form.state} onChange={set("state")} placeholder="TX" className="field" />
          </div>
          <div>
            <label className="label">{t.contacts.zipcodeLabel}</label>
            <input value={form.zip} onChange={set("zip")} placeholder="75001" className="field" />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t.common.notes}</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3} className="field resize-none" placeholder="Additional notes…" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-[#e7e6e1]">
          <button className="btn btn-outline" onClick={() => setModal(false)}>{t.common.cancel}</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? t.contacts.saving : editContact ? t.contacts.updating : t.contacts.adding}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={deleteContact}
        title={t.contacts.deleteTitle} message={t.contacts.deleteMessage} danger />

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f0efea]">
          <span className="text-[13px] text-[#8a8fa3]">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button onClick={() => { setPage(p => p - 1); load(page - 1); }} disabled={page === 0}
              className="btn btn-outline btn-sm disabled:opacity-40">Previous</button>
            <button onClick={() => { setPage(p => p + 1); load(page + 1); }} disabled={(page + 1) * PAGE_SIZE >= total}
              className="btn btn-outline btn-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
