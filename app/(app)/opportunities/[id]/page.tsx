"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Target, User, DollarSign, Calendar, Tag,
  FileText, Plus, Edit2, Trash2, CheckCircle,
} from "lucide-react";
import { ConfirmDialog, toast, Modal } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const STATUS_STYLE: Record<string, string> = {
  open:      "bg-blue-50 text-blue-700 border-blue-200",
  qualified: "bg-amber-50 text-amber-700 border-amber-200",
  quoted:    "bg-purple-50 text-purple-700 border-purple-200",
  won:       "bg-green-50 text-brand-green border-green-200",
  lost:      "bg-red-50 text-red-600 border-red-200",
};

const PRIORITY_STYLE: Record<string, string> = {
  low:    "bg-gray-100 text-[#6b7280]",
  medium: "bg-blue-50 text-blue-700",
  high:   "bg-red-50 text-red-600",
};

const QUOTE_STATUS_STYLE: Record<string, string> = {
  draft:    "bg-[#f3f4f6] text-[#6b7280]",
  sent:     "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-brand-green",
  rejected: "bg-red-50 text-red-600",
  expired:  "bg-amber-50 text-amber-700",
};

export default function OpportunityDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [opp, setOpp]         = useState<any>(null);
  const [quotes, setQuotes]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState<any>({});

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/opportunities/${id}`);
    if (!res.ok) { router.replace("/opportunities"); return; }
    const d = await res.json();
    setOpp(d.opportunity);
    setQuotes(d.quotes ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const openEdit = () => {
    setForm({
      status: opp.status, priority: opp.priority, notes: opp.notes ?? "",
      estimated_value: opp.estimated_value != null ? String(opp.estimated_value) : "",
      expected_start_date: opp.expected_start_date ?? "",
    });
    setEditing(true);
  };

  const saveQuick = async () => {
    setSaving(true);
    const res = await fetch(`/api/opportunities/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status,
        priority: form.priority,
        notes: form.notes,
        estimated_value: form.estimated_value || null,
        expected_start_date: form.expected_start_date || null,
      }),
    });
    setSaving(false);
    if (res.ok) { toast(t.opportunities.updated); setEditing(false); load(); }
    else { const d = await res.json(); toast(d.message ?? "Failed", "error"); }
  };

  const del = async () => {
    await fetch(`/api/opportunities/${id}`, { method: "DELETE" });
    toast(t.opportunities.deleted);
    router.replace("/opportunities");
  };

  const markStatus = async (status: string) => {
    await fetch(`/api/opportunities/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast(`Marked as ${status}`);
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!opp) return null;

  const contact = opp.contacts;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <div className="mb-4">
        <Link href="/opportunities" className="flex items-center gap-1.5 text-[13px] text-[#8a8fa3] hover:text-brand-navy transition-colors">
          <ArrowLeft size={14} /> {t.opportunities.title}
        </Link>
      </div>

      {/* Header card */}
      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-brand-navy/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target size={18} className="text-brand-navy" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-[#0c1226]">{opp.name}</h1>
              {opp.project_type && (
                <p className="text-[13px] text-[#8a8fa3] mt-0.5">{opp.project_type}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`badge border text-[12px] ${STATUS_STYLE[opp.status]}`}>
              {opp.status.charAt(0).toUpperCase() + opp.status.slice(1)}
            </span>
            <span className={`badge text-[11px] ${PRIORITY_STYLE[opp.priority]}`}>{opp.priority}</span>
          </div>
        </div>

        {/* Quick facts grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-[11px] text-[#8a8fa3] font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
              <User size={10} /> {t.opportunities.contactLabel}
            </p>
            {contact
              ? <Link href={`/contacts/${opp.contact_id}`} className="text-[13px] text-brand-navy hover:underline font-medium">{contact.full_name}</Link>
              : <span className="text-[13px] text-[#8a8fa3]">—</span>}
          </div>
          <div>
            <p className="text-[11px] text-[#8a8fa3] font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
              <DollarSign size={10} /> {t.opportunities.valueLabel}
            </p>
            <span className="text-[13px] font-semibold text-brand-green">
              {opp.estimated_value != null ? fmt(opp.estimated_value) : "—"}
            </span>
          </div>
          <div>
            <p className="text-[11px] text-[#8a8fa3] font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
              <Calendar size={10} /> {t.opportunities.startDateLabel}
            </p>
            <span className="text-[13px] text-[#4a5168]">
              {opp.expected_start_date ? fmtDate(opp.expected_start_date) : "—"}
            </span>
          </div>
          <div>
            <p className="text-[11px] text-[#8a8fa3] font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
              <Tag size={10} /> {t.opportunities.createdLabel}
            </p>
            <span className="text-[13px] text-[#4a5168]">{fmtDate(opp.created_at)}</span>
          </div>
        </div>

        {opp.property_address && (
          <p className="text-[13px] text-[#4a5168] mb-3">📍 {opp.property_address}</p>
        )}

        {opp.notes && (
          <div className="bg-[#f9fafb] rounded-xl p-3 text-[13px] text-[#374151] leading-relaxed mb-4">
            {opp.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-[#f0efea]">
          {opp.status !== "won" && (
            <button onClick={() => markStatus("won")}
              className="btn btn-primary btn-sm">
              <CheckCircle size={13} /> {t.opportunities.markWon}
            </button>
          )}
          {opp.status !== "lost" && opp.status !== "won" && (
            <button onClick={() => markStatus("lost")}
              className="btn btn-outline btn-sm text-red-600 border-red-200 hover:bg-red-50">
              {t.opportunities.markLost}
            </button>
          )}
          <Link href={`/quotes/new?opportunity_id=${opp.id}&contact_id=${opp.contact_id ?? ""}`}
            className="btn btn-outline btn-sm">
            <FileText size={13} /> {t.opportunities.createQuote}
          </Link>
          <button onClick={openEdit} className="btn btn-outline btn-sm">
            <Edit2 size={13} /> {t.common.edit}
          </button>
          <button onClick={() => setConfirmDel(true)}
            className="btn btn-outline btn-sm text-red-600 border-red-200 hover:bg-red-50 ml-auto">
            <Trash2 size={13} /> {t.common.delete}
          </button>
        </div>
      </div>

      {/* Linked quotes */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">
            <FileText size={14} className="inline mr-1.5 text-brand-navy" />
            {t.opportunities.linkedQuotes} ({quotes.length})
          </h2>
          <Link href={`/quotes/new?opportunity_id=${opp.id}&contact_id=${opp.contact_id ?? ""}`}
            className="btn btn-outline btn-sm">
            <Plus size={13} /> {t.opportunities.newQuoteBtn}
          </Link>
        </div>
        {quotes.length === 0 ? (
          <p className="text-[13px] text-[#8a8fa3] text-center py-4">{t.opportunities.noQuotesLinked}</p>
        ) : (
          <div className="space-y-2">
            {quotes.map(q => (
              <Link key={q.id} href={`/quotes/${q.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-[#f0efea] hover:border-brand-navy/20 hover:bg-[#f9fafb] transition-colors">
                <span className="text-[13px] font-semibold text-brand-navy">{q.quote_number}</span>
                <div className="flex items-center gap-2">
                  <span className={`badge text-[11px] ${QUOTE_STATUS_STYLE[q.status] ?? ""}`}>{q.status}</span>
                  <span className="text-[11px] text-[#8a8fa3]">{fmtDate(q.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title={t.opportunities.editOpportunity} size="sm">
        <div className="space-y-4">
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
          <div>
            <label className="label">{t.opportunities.valueLabel}</label>
            <input type="number" step="100" value={form.estimated_value}
              onChange={e => setForm({ ...form, estimated_value: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">{t.opportunities.startDateLabel}</label>
            <input type="date" value={form.expected_start_date}
              onChange={e => setForm({ ...form, expected_start_date: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">{t.opportunities.notesLabel}</label>
            <textarea rows={3} value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} className="field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-[#e7e6e1]">
          <button className="btn btn-outline" onClick={() => setEditing(false)}>{t.common.cancel}</button>
          <button className="btn btn-primary" onClick={saveQuick} disabled={saving}>
            {saving ? t.common.saving : t.common.save}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={del}
        title={t.opportunities.deleteTitle}
        message={`${t.opportunities.deleteMessage} "${opp.name}"?`}
        danger
      />
    </div>
  );
}
