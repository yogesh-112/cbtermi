"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Target, TrendingUp, Search, ChevronRight } from "lucide-react";
import { Modal, ConfirmDialog, EmptyState, toast } from "@/components/ui";
import ContactSelect from "@/components/ui/ContactSelect";
import { fmt, fmtDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const STATUS_TABS = [
  { key: "all",       label: "All" },
  { key: "open",      label: "Open" },
  { key: "qualified", label: "Qualified" },
  { key: "quoted",    label: "Quoted" },
  { key: "won",       label: "Won" },
  { key: "lost",      label: "Lost" },
];

const STATUS_STYLE: Record<string, string> = {
  open:      "bg-blue-50 text-blue-700",
  qualified: "bg-amber-50 text-amber-700",
  quoted:    "bg-purple-50 text-purple-700",
  won:       "bg-green-50 text-brand-green",
  lost:      "bg-red-50 text-red-600",
};

const PRIORITY_STYLE: Record<string, string> = {
  low:    "bg-gray-100 text-[#6b7280]",
  medium: "bg-blue-50 text-blue-700",
  high:   "bg-red-50 text-red-600",
};

const PROJECT_TYPES = ["Kitchen", "Bath", "Basement", "Addition", "Whole Home", "Exterior", "Other"];

const BLANK = {
  name: "", contact_id: "", project_type: "", property_address: "",
  estimated_value: "", expected_start_date: "", status: "open",
  priority: "medium", notes: "",
};

export default function OpportunitiesPage() {
  const t = useT();
  const [opps, setOpps]       = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [tab, setTab]         = useState("all");
  const [search, setSearch]   = useState("");
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDel, setConfirmDel] = useState<any>(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ ...BLANK });

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (tab !== "all") params.set("status", tab);
    fetch(`/api/opportunities?${params}`).then(r => r.json()).then(d => {
      setOpps(d.opportunities ?? []);
      setTotal(d.total ?? 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch("/api/contacts?limit=200").then(r => r.json()).then(d => setContacts(d.contacts ?? []));
  }, [tab]);

  const openCreate = () => { setEditing(null); setForm({ ...BLANK }); setModal(true); };
  const openEdit   = (o: any) => {
    setEditing(o);
    setForm({
      name:                o.name,
      contact_id:          o.contact_id ?? "",
      project_type:        o.project_type ?? "",
      property_address:    o.property_address ?? "",
      estimated_value:     o.estimated_value != null ? String(o.estimated_value) : "",
      expected_start_date: o.expected_start_date ?? "",
      status:              o.status,
      priority:            o.priority,
      notes:               o.notes ?? "",
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast(t.common.required, "error"); return; }
    if (form.estimated_value !== "" && parseFloat(form.estimated_value) < 0) {
      toast("Estimated value cannot be negative", "error"); return;
    }
    setSaving(true);
    const body = { ...form, estimated_value: form.estimated_value || null, contact_id: form.contact_id || null };
    const [url, method] = editing
      ? [`/api/opportunities/${editing.id}`, "PATCH"]
      : ["/api/opportunities", "POST"];
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      toast(editing ? t.opportunities.updated : t.opportunities.created);
      setModal(false);
      load();
    } else {
      const d = await res.json();
      toast(d.message ?? "Failed to save", "error");
    }
  };

  const del = async (o: any) => {
    await fetch(`/api/opportunities/${o.id}`, { method: "DELETE" });
    setConfirmDel(null);
    toast(t.opportunities.deleted);
    load();
  };

  const filtered = opps.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return o.name?.toLowerCase().includes(s) ||
      o.contacts?.full_name?.toLowerCase().includes(s) ||
      o.project_type?.toLowerCase().includes(s);
  });

  // Stats
  const open  = opps.filter(o => !["won","lost"].includes(o.status));
  const won   = opps.filter(o => o.status === "won");
  const pipeline = open.reduce((s, o) => s + (o.estimated_value ?? 0), 0);
  const wonValue = won.reduce((s, o) => s + (o.estimated_value ?? 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.opportunities.title}</h1>
          <p className="page-desc">
            {open.length} {t.opportunities.openLabel} · {fmt(pipeline)} {t.opportunities.pipelineValue}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> {t.opportunities.newOpportunity}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="mini-stat mini-stat-blue">
          <span className="mini-stat-label">{t.opportunities.openLabel}</span>
          <span className="mini-stat-value">{open.length}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">{t.opportunities.active}</span>
        </div>
        <div className="mini-stat mini-stat-navy">
          <span className="mini-stat-label">{t.opportunities.pipelineLabel}</span>
          <span className="mini-stat-value text-[20px]">{fmt(pipeline)}</span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">{t.opportunities.estimated}</span>
        </div>
        <div className="mini-stat mini-stat-green">
          <span className="mini-stat-label">{t.opportunities.wonLabel}</span>
          <span className="mini-stat-value">{won.length}</span>
          <span className="text-[11px] text-brand-green mt-0.5 flex items-center gap-1">
            <TrendingUp size={10} /> {fmt(wonValue)}
          </span>
        </div>
        <div className="mini-stat mini-stat-amber">
          <span className="mini-stat-label">{t.opportunities.conversionRate}</span>
          <span className="mini-stat-value text-[22px]">
            {total > 0 ? Math.round((won.length / total) * 100) : 0}%
          </span>
          <span className="text-[11px] text-[#8a8fa3] mt-0.5">{t.opportunities.winRate}</span>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="tabs-bar mb-0 flex-1 overflow-x-auto">
          {STATUS_TABS.map(s => (
            <button key={s.key} onClick={() => setTab(s.key)}
              className={`tab-btn whitespace-nowrap ${tab === s.key ? "active" : ""}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="input-group w-52 flex-shrink-0">
          <Search size={13} className="input-icon" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t.opportunities.searchPlaceholder} className="field" />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="mobile-card animate-pulse h-20 skeleton" />)
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Target size={36} />} title={t.opportunities.noOpportunities}
            description={t.opportunities.noOpportunitiesDesc}
            action={<button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> {t.opportunities.newOpportunity}</button>} />
        ) : filtered.map(o => (
          <Link key={o.id} href={`/opportunities/${o.id}`} className="mobile-card block">
            <div className="mobile-card-row">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#0c1226] text-[14px] truncate">{o.name}</p>
                <p className="text-[12px] text-[#8a8fa3] mt-0.5">
                  {o.contacts?.full_name ?? "—"}{o.project_type ? ` · ${o.project_type}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`badge text-[11px] ${STATUS_STYLE[o.status]}`}>{o.status}</span>
                {o.estimated_value != null && (
                  <span className="text-[12px] font-semibold text-brand-green">{fmt(o.estimated_value)}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t.opportunities.nameCol}</th>
              <th>{t.opportunities.contactCol}</th>
              <th>{t.opportunities.typeCol}</th>
              <th>{t.opportunities.valueCol}</th>
              <th>{t.opportunities.startCol}</th>
              <th>{t.opportunities.priorityCol}</th>
              <th>{t.opportunities.statusCol}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-[#8a8fa3]">{t.common.loading}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}>
                <EmptyState icon={<Target size={40} />} title={t.opportunities.noOpportunities}
                  description={t.opportunities.noOpportunitiesDesc}
                  action={<button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> {t.opportunities.newOpportunity}</button>} />
              </td></tr>
            ) : filtered.map(o => (
              <tr key={o.id}>
                <td>
                  <Link href={`/opportunities/${o.id}`}
                    className="font-semibold text-brand-navy hover:underline text-[13px]">
                    {o.name}
                  </Link>
                </td>
                <td className="text-[13px] text-[#4a5168]">
                  {o.contacts?.full_name
                    ? <Link href={`/contacts/${o.contact_id}`} className="hover:underline">{o.contacts.full_name}</Link>
                    : <span className="text-[#8a8fa3]">—</span>}
                </td>
                <td className="text-[13px] text-[#4a5168]">{o.project_type || "—"}</td>
                <td className="font-semibold text-brand-green text-[13px]">
                  {o.estimated_value != null ? fmt(o.estimated_value) : <span className="text-[#8a8fa3]">—</span>}
                </td>
                <td className="text-[12px] text-[#8a8fa3]">
                  {o.expected_start_date ? fmtDate(o.expected_start_date) : "—"}
                </td>
                <td>
                  <span className={`badge text-[11px] ${PRIORITY_STYLE[o.priority]}`}>{o.priority}</span>
                </td>
                <td>
                  <span className={`badge text-[11px] ${STATUS_STYLE[o.status]}`}>{o.status}</span>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link href={`/opportunities/${o.id}`}
                      className="p-1.5 rounded hover:bg-[#f3f4f6] text-[#8a8fa3] hover:text-brand-navy transition-colors">
                      <ChevronRight size={13} />
                    </Link>
                    <button onClick={() => openEdit(o)}
                      className="text-[11px] text-[#8a8fa3] hover:text-brand-navy px-2 py-1 rounded hover:bg-[#f3f4f6]">
                      {t.common.edit}
                    </button>
                    <button onClick={() => setConfirmDel(o)}
                      className="text-[11px] text-[#8a8fa3] hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">
                      {t.common.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? t.opportunities.editOpportunity : t.opportunities.newOpportunity} size="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">{t.opportunities.nameRequired}</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder={t.opportunities.namePlaceholder} className="field" />
          </div>
          <div>
            <label className="label">{t.opportunities.contactLabel}</label>
            <ContactSelect
              contacts={contacts}
              value={form.contact_id}
              onChange={id => setForm(f => ({ ...f, contact_id: id }))}
              onContactCreated={c => setContacts(cs => [c, ...cs])}
              placeholder={t.opportunities.noContact}
            />
          </div>
          <div>
            <label className="label">{t.opportunities.projectTypeLabel}</label>
            <select value={form.project_type} onChange={e => setForm({ ...form, project_type: e.target.value })} className="field">
              <option value="">— Select type —</option>
              {PROJECT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t.opportunities.valueLabel}</label>
            <input type="number" step="100" min="0" value={form.estimated_value}
              onChange={e => setForm({ ...form, estimated_value: e.target.value })}
              placeholder="0" className="field" />
          </div>
          <div>
            <label className="label">{t.opportunities.startDateLabel}</label>
            <input type="date" value={form.expected_start_date}
              onChange={e => setForm({ ...form, expected_start_date: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">{t.opportunities.statusLabel}</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="field">
              <option value="open">Open</option>
              <option value="qualified">Qualified</option>
              <option value="quoted">Quoted</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div>
            <label className="label">{t.opportunities.priorityLabel}</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="field">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">{t.opportunities.addressLabel}</label>
            <input value={form.property_address}
              onChange={e => setForm({ ...form, property_address: e.target.value })}
              placeholder={t.opportunities.addressPlaceholder} className="field" />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t.opportunities.notesLabel}</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3} className="field resize-none" placeholder={t.opportunities.notesPlaceholder} />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-[#e7e6e1]">
          <button className="btn btn-outline" onClick={() => setModal(false)}>{t.common.cancel}</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? t.common.saving : editing ? t.common.save : t.opportunities.newOpportunity}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => confirmDel && del(confirmDel)}
        title={t.opportunities.deleteTitle}
        message={`${t.opportunities.deleteMessage} "${confirmDel?.name}"?`}
        danger
      />
    </div>
  );
}
